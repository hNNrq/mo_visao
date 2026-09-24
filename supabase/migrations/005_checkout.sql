-- Mo Visão — checkout (fase 4)
--
-- O que muda aqui:
--   1. o pedido nasce numa função só, dentro do Postgres: preço lido do banco,
--      estoque reservado e pedido gravado na mesma transação
--   2. o cliente acompanha o pedido por um link com token, sem precisar de conta
--   3. as funções de estoque deixam de ser chamáveis pela chave pública
--   4. pagamento que chega depois da reserva vencer não baixa estoque pela metade
--   5. a expiração de reserva roda sozinha no pg_cron do Supabase

-- ============================================================
-- pedidos: token de acesso do cliente, link de pagamento, alerta pro dono
-- ============================================================

-- Dois uuid v4 colados: 244 bits aleatórios. Sai de gen_random_uuid() e não de
-- gen_random_bytes() porque o pgcrypto não existe no PGlite dos testes.
alter table public.pedidos
  add column token text not null
    default replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
  add column mp_init_point text,
  -- Preenchido quando o dono precisa agir fora do fluxo normal — hoje, só o
  -- caso "pagou depois que a reserva venceu e a peça já tinha saído".
  add column alerta text;

-- O desconto no Pix saiu junto com a escolha do Checkout Pro (set/2026): lá o
-- cliente escolhe a forma de pagamento dentro do Mercado Pago, depois que o
-- preço já foi fechado.
delete from public.config where chave = 'desconto_pix_pct';

-- ============================================================
-- criar_pedido
--
-- p_cliente:  {"nome": "...", "email": "...", "telefone": "..."}
-- p_itens:    [{"produto_id": "...", "quantidade": 1}, ...]
-- p_entrega:  {"endereco": "...", "observacao": "..."}
--
-- O navegador manda só QUAL produto e QUANTOS. Preço, nome e frete saem daqui:
-- o carrinho mora no localStorage do visitante, e qualquer número que venha de
-- lá pode ter sido editado.
--
-- Estoura SEM_ESTOQUE:<id> (vindo de reservar_estoque) e a transação inteira
-- volta — não sobra pedido sem reserva nem reserva sem pedido.
-- ============================================================

create or replace function public.criar_pedido(
  p_cliente      jsonb,
  p_entrega_tipo public.entrega_tipo,
  p_entrega      jsonb,
  p_itens        jsonb
)
returns table (id uuid, numero text, token text, total_centavos integer, expira_em timestamptz)
language plpgsql security definer
set search_path = public, pg_temp
as $$
#variable_conflict use_column
declare
  v_itens       jsonb;
  v_subtotal    integer := 0;
  v_frete       integer := 0;
  v_frete_local integer;
  v_gratis      integer;
  v_minutos     integer;
  v_pedido      public.pedidos%rowtype;
  v_qtd_itens   integer;
begin
  if p_entrega_tipo not in ('retirada', 'local') then
    -- envio pelos Correios é fase posterior (PRODUCT.md)
    raise exception 'ENTREGA_INDISPONIVEL:%', p_entrega_tipo;
  end if;

  -- o mesmo produto duas vezes no carrinho vira uma linha só
  select jsonb_agg(jsonb_build_object('produto_id', produto_id, 'quantidade', qtd)), count(*)
    into v_itens, v_qtd_itens
    from (
      select (i->>'produto_id')::uuid as produto_id, sum((i->>'quantidade')::integer) as qtd
        from jsonb_array_elements(p_itens) i
       group by 1
    ) agrupado;

  if v_qtd_itens is null or v_qtd_itens = 0 then
    raise exception 'CARRINHO_VAZIO';
  end if;

  -- sem cron configurado, a reserva vencida ainda é devolvida aqui, antes de
  -- alguém esbarrar num "esgotado" que não é verdade
  perform public.liberar_reservas_expiradas();

  perform public.reservar_estoque(v_itens);

  select coalesce(sum(p.preco_centavos * (i->>'quantidade')::integer), 0)::integer
    into v_subtotal
    from jsonb_array_elements(v_itens) i
    join public.produtos p on p.id = (i->>'produto_id')::uuid;

  if p_entrega_tipo = 'local' then
    select coalesce((valor #>> '{}')::integer, 0) into v_frete_local
      from public.config where chave = 'frete_local_centavos';
    select coalesce((valor #>> '{}')::integer, 0) into v_gratis
      from public.config where chave = 'frete_gratis_acima_centavos';

    v_frete := coalesce(v_frete_local, 0);
    if coalesce(v_gratis, 0) > 0 and v_subtotal >= v_gratis then
      v_frete := 0;
    end if;
  end if;

  select coalesce((valor #>> '{}')::integer, 30) into v_minutos
    from public.config where chave = 'reserva_minutos';

  insert into public.pedidos (
    cliente_nome, cliente_email, cliente_telefone,
    entrega_tipo, entrega,
    subtotal_centavos, frete_centavos, total_centavos,
    expira_em
  ) values (
    p_cliente->>'nome', lower(p_cliente->>'email'), p_cliente->>'telefone',
    p_entrega_tipo, coalesce(p_entrega, '{}'::jsonb),
    v_subtotal, v_frete, v_subtotal + v_frete,
    now() + make_interval(mins => coalesce(v_minutos, 30))
  )
  returning * into v_pedido;

  insert into public.pedido_itens (pedido_id, produto_id, nome_snapshot, preco_snapshot_centavos, quantidade)
  select v_pedido.id, p.id, p.nome, p.preco_centavos, (i->>'quantidade')::integer
    from jsonb_array_elements(v_itens) i
    join public.produtos p on p.id = (i->>'produto_id')::uuid;

  return query select v_pedido.id, v_pedido.numero, v_pedido.token,
                      v_pedido.total_centavos, v_pedido.expira_em;
end;
$$;

-- ============================================================
-- confirmar_pedido — reescrita
--
-- A versão do 002 tinha um furo no caminho do pedido expirado com mais de um
-- item: baixava o estoque do primeiro, não achava peça do segundo e devolvia
-- 'sem_estoque' — com a baixa do primeiro já gravada e o pedido ainda não pago.
-- Agora a baixa roda num bloco com EXCEPTION, que o Postgres desfaz inteiro
-- quando qualquer item falta. E o alerta pro dono fica gravado no pedido.
-- ============================================================

create or replace function public.confirmar_pedido(
  p_pedido_id  uuid,
  p_payment_id text,
  p_metodo     text
)
returns text
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_status    public.pedido_status;
  item        record;
begin
  select status into v_status
    from public.pedidos
   where id = p_pedido_id
     for update;   -- trava o pedido: duas notificações simultâneas viram fila

  if not found then
    raise exception 'PEDIDO_NAO_ENCONTRADO:%', p_pedido_id;
  end if;

  if v_status not in ('pendente', 'expirado') then
    return 'ja_processado';
  end if;

  if v_status = 'expirado' then
    begin
      for item in
        select produto_id, quantidade
          from public.pedido_itens
         where pedido_id = p_pedido_id
           and produto_id is not null
      loop
        -- a reserva já foi devolvida; só dá pra confirmar se ainda sobrou peça
        update public.produtos
           set estoque = estoque - item.quantidade
         where id = item.produto_id
           and estoque - reservado >= item.quantidade;

        if not found then
          raise exception 'SEM_ESTOQUE:%', item.produto_id;
        end if;
      end loop;
    exception when raise_exception then
      -- tudo o que o loop baixou volta aqui
      update public.pedidos
         set alerta           = 'Pagou depois que a reserva venceu e a peça já tinha saído. Estornar no Mercado Pago.',
             mp_payment_id    = coalesce(p_payment_id, mp_payment_id),
             metodo_pagamento = coalesce(p_metodo, metodo_pagamento)
       where id = p_pedido_id;
      return 'sem_estoque';
    end;
  else
    for item in
      select produto_id, quantidade
        from public.pedido_itens
       where pedido_id = p_pedido_id
         and produto_id is not null
    loop
      update public.produtos
         set estoque   = estoque - item.quantidade,
             reservado = greatest(reservado - item.quantidade, 0)
       where id = item.produto_id;
    end loop;
  end if;

  update public.pedidos
     set status           = 'pago',
         mp_payment_id    = coalesce(p_payment_id, mp_payment_id),
         metodo_pagamento = coalesce(p_metodo, metodo_pagamento),
         pago_em          = now(),
         alerta           = null
   where id = p_pedido_id;

  return 'confirmado';
end;
$$;

-- ============================================================
-- quem pode chamar o quê
--
-- 🔴 Função criada no schema public nasce executável por PUBLIC, e o Supabase
-- ainda concede EXECUTE explícito pra anon e authenticated. Ou seja: com a
-- chave pública — que está no navegador de qualquer visitante — dava pra
-- chamar reservar_estoque() em loop e travar o estoque inteiro da loja com
-- reservas que nenhum pedido libera, ou chamar confirmar_pedido() direto.
-- Essas funções são do servidor (service_role) e de mais ninguém.
-- ============================================================

revoke execute on function public.reservar_estoque(jsonb)                               from public, anon, authenticated;
revoke execute on function public.confirmar_pedido(uuid, text, text)                    from public, anon, authenticated;
revoke execute on function public.liberar_reservas_expiradas()                          from public, anon, authenticated;
revoke execute on function public.criar_pedido(jsonb, public.entrega_tipo, jsonb, jsonb) from public, anon, authenticated;

grant execute on function public.reservar_estoque(jsonb)                               to service_role;
grant execute on function public.confirmar_pedido(uuid, text, text)                    to service_role;
grant execute on function public.liberar_reservas_expiradas()                          to service_role;
grant execute on function public.criar_pedido(jsonb, public.entrega_tipo, jsonb, jsonb) to service_role;

-- cancelar_pedido continua aberta pra authenticated: ela mesma confere is_admin().

-- ============================================================
-- expiração de reserva no pg_cron do Supabase
--
-- Roda dentro do banco, então não depende de cron da hospedagem nem de
-- ninguém lembrar de configurar nada. Onde o pg_cron não existe (PGlite dos
-- testes), o bloco não faz nada — e o criar_pedido libera o vencido sozinho.
-- ============================================================

do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron with schema pg_catalog;
    -- agendar com o mesmo nome de novo só atualiza o job, não duplica
    perform cron.schedule(
      'liberar-reservas-expiradas',
      '*/5 * * * *',
      'select public.liberar_reservas_expiradas()'
    );
  end if;
end;
$$;

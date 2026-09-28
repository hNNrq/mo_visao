-- Mó Visão — checkout
--
-- Três coisas nesta migration:
--   1. fecha a execução das funções de estoque (estavam abertas pra qualquer um)
--   2. conserta a confirmação de pedido expirado com mais de um item
--   3. cria criar_pedido(): pedido, itens, frete, desconto e reserva numa
--      transação só, com preço lido do banco — nunca do navegador

-- ============================================================
-- 1. quem pode chamar o quê
--
-- 🔴 Função nova no Postgres nasce com EXECUTE liberado pra PUBLIC, e o
-- Supabase expõe toda função do schema public em /rest/v1/rpc. Com as funções
-- abaixo sendo `security definer` (rodam como dono, ignorando RLS), qualquer
-- visitante com a chave anon — que é pública, vai no navegador — podia chamar
-- confirmar_pedido() e marcar um pedido como pago sem pagar, ou reservar o
-- estoque inteiro da loja. Só o servidor (service_role) chama estas.
-- ============================================================

revoke execute on function public.reservar_estoque(jsonb)                 from public, anon, authenticated;
revoke execute on function public.confirmar_pedido(uuid, text, text)      from public, anon, authenticated;
revoke execute on function public.liberar_reservas_expiradas()            from public, anon, authenticated;
grant  execute on function public.reservar_estoque(jsonb)                 to service_role;
grant  execute on function public.confirmar_pedido(uuid, text, text)      to service_role;
grant  execute on function public.liberar_reservas_expiradas()            to service_role;

-- cancelar_pedido checa is_admin() por dentro, e o painel chama com a sessão
-- do dono. Só não precisa estar aberta pra visitante anônimo.
revoke execute on function public.cancelar_pedido(uuid) from public, anon;
grant  execute on function public.cancelar_pedido(uuid) to authenticated, service_role;

-- ============================================================
-- colunas novas do pedido
-- ============================================================

alter table public.pedidos
  -- o que a pessoa escolheu no carrinho; decide desconto e o que o Mercado
  -- Pago oferece na tela dele
  add column if not exists pagamento_escolhido text
    check (pagamento_escolhido in ('pix', 'cartao')),
  -- link de pagamento, pra quem fechou a aba voltar e pagar dentro do prazo
  add column if not exists mp_checkout_url text,
  -- pagou depois de a reserva vencer e a peça já tinha ido: o dono estorna
  add column if not exists precisa_estorno boolean not null default false;

-- ============================================================
-- 2. confirmar_pedido — conserto do pedido expirado com vários itens
--
-- A versão do 002 baixava o estoque item a item e, se o SEGUNDO item não
-- tivesse mais peça, devolvia 'sem_estoque' com o primeiro já baixado. RETURN
-- em plpgsql não desfaz nada: o estoque ficava errado e o pedido, sem pagar.
-- Agora confere tudo antes (travando as linhas) e só depois mexe.
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
  v_expirado  boolean;
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

  v_expirado := (v_status = 'expirado');

  if v_expirado then
    -- a reserva já foi devolvida: só confirma se TODOS os itens ainda têm peça
    for item in
      select i.produto_id, sum(i.quantidade)::integer as quantidade
        from public.pedido_itens i
       where i.pedido_id = p_pedido_id and i.produto_id is not null
       group by i.produto_id
    loop
      perform 1 from public.produtos
        where id = item.produto_id
          and estoque - reservado >= item.quantidade
        for update;
      if not found then
        update public.pedidos
           set precisa_estorno  = true,
               mp_payment_id    = coalesce(p_payment_id, mp_payment_id),
               metodo_pagamento = coalesce(p_metodo, metodo_pagamento)
         where id = p_pedido_id;
        return 'sem_estoque';
      end if;
    end loop;
  end if;

  for item in
    select produto_id, quantidade
      from public.pedido_itens
     where pedido_id = p_pedido_id
       and produto_id is not null
  loop
    if v_expirado then
      update public.produtos
         set estoque = estoque - item.quantidade
       where id = item.produto_id;
    else
      update public.produtos
         set estoque   = estoque - item.quantidade,
             reservado = greatest(reservado - item.quantidade, 0)
       where id = item.produto_id;
    end if;
  end loop;

  update public.pedidos
     set status           = 'pago',
         mp_payment_id    = coalesce(p_payment_id, mp_payment_id),
         metodo_pagamento = coalesce(p_metodo, metodo_pagamento),
         pago_em          = now()
   where id = p_pedido_id;

  return 'confirmado';
end;
$$;

revoke execute on function public.confirmar_pedido(uuid, text, text) from public, anon, authenticated;
grant  execute on function public.confirmar_pedido(uuid, text, text) to service_role;

-- ============================================================
-- 3. criar_pedido
--
-- p_cliente:  {"nome": "...", "email": "...", "telefone": "..."}
-- p_entrega:  {"endereco": "...", "observacao": "..."}
-- p_itens:    [{"produto_id": "...", "quantidade": 1}, ...]
-- p_pagamento: 'pix' | 'cartao'
--
-- Preço, frete e desconto saem daqui, do banco. O carrinho do navegador só diz
-- QUAIS peças e QUANTAS — o valor que ele mostra é informativo. Qualquer
-- falha (peça esgotada no meio do caminho, produto desativado) estoura e a
-- transação inteira volta: não sobra pedido pela metade nem reserva órfã.
-- ============================================================

create or replace function public.criar_pedido(
  p_cliente      jsonb,
  p_entrega_tipo public.entrega_tipo,
  p_entrega      jsonb,
  p_itens        jsonb,
  p_pagamento    text
)
returns table (id uuid, numero text, total_centavos integer, expira_em timestamptz)
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_itens        jsonb;
  v_qtd_itens    integer;
  v_pedido_id    uuid;
  v_subtotal     integer;
  v_frete        integer := 0;
  v_desconto     integer := 0;
  v_pct          numeric;
  v_frete_local  integer;
  v_gratis_acima integer;
  v_minutos      integer;
begin
  -- reserva vencida de quem não pagou não pode barrar quem está comprando agora
  perform public.liberar_reservas_expiradas();

  if p_pagamento not in ('pix', 'cartao') then
    raise exception 'PAGAMENTO_INVALIDO';
  end if;
  if p_entrega_tipo = 'correios' then
    raise exception 'ENTREGA_INDISPONIVEL';
  end if;

  -- junta linhas repetidas do mesmo produto
  select jsonb_agg(jsonb_build_object('produto_id', produto_id, 'quantidade', qtd)),
         count(*)
    into v_itens, v_qtd_itens
    from (
      select (e->>'produto_id')::uuid as produto_id,
             sum((e->>'quantidade')::integer) as qtd
        from jsonb_array_elements(coalesce(p_itens, '[]'::jsonb)) e
       group by 1
    ) agrupado;

  if v_qtd_itens is null or v_qtd_itens = 0 then
    raise exception 'CARRINHO_VAZIO';
  end if;
  if v_qtd_itens > 20 or exists (
    select 1 from jsonb_array_elements(v_itens) e
     where (e->>'quantidade')::integer not between 1 and 5
  ) then
    raise exception 'QUANTIDADE_INVALIDA';
  end if;

  select coalesce((select (valor #>> '{}')::numeric from config where chave = 'desconto_pix_pct'), 0),
         coalesce((select (valor #>> '{}')::integer from config where chave = 'frete_local_centavos'), 0),
         coalesce((select (valor #>> '{}')::integer from config where chave = 'frete_gratis_acima_centavos'), 0),
         coalesce((select (valor #>> '{}')::integer from config where chave = 'reserva_minutos'), 30)
    into v_pct, v_frete_local, v_gratis_acima, v_minutos;

  insert into public.pedidos (
    cliente_nome, cliente_email, cliente_telefone,
    entrega_tipo, entrega, pagamento_escolhido,
    subtotal_centavos, total_centavos, expira_em
  ) values (
    trim(p_cliente->>'nome'), lower(trim(p_cliente->>'email')), trim(p_cliente->>'telefone'),
    p_entrega_tipo, coalesce(p_entrega, '{}'::jsonb), p_pagamento,
    0, 0, now() + make_interval(mins => greatest(v_minutos, 5))
  )
  returning pedidos.id into v_pedido_id;

  insert into public.pedido_itens (pedido_id, produto_id, nome_snapshot,
                                   preco_snapshot_centavos, quantidade)
  select v_pedido_id, p.id, p.nome, p.preco_centavos, (e->>'quantidade')::integer
    from jsonb_array_elements(v_itens) e
    join public.produtos p on p.id = (e->>'produto_id')::uuid and p.ativo;

  if (select count(*) from public.pedido_itens where pedido_id = v_pedido_id) <> v_qtd_itens then
    raise exception 'PRODUTO_INDISPONIVEL';
  end if;

  -- estoura SEM_ESTOQUE:<id> e desfaz tudo acima
  perform public.reservar_estoque(v_itens);

  select sum(preco_snapshot_centavos * quantidade)::integer
    into v_subtotal
    from public.pedido_itens where pedido_id = v_pedido_id;

  if p_entrega_tipo = 'local' and not (v_gratis_acima > 0 and v_subtotal >= v_gratis_acima) then
    v_frete := greatest(v_frete_local, 0);
  end if;

  -- o desconto do Pix vale sobre as peças, não sobre o frete
  if p_pagamento = 'pix' and v_pct > 0 then
    v_desconto := round(v_subtotal * least(v_pct, 50) / 100)::integer;
  end if;

  update public.pedidos
     set subtotal_centavos = v_subtotal,
         frete_centavos    = v_frete,
         desconto_centavos = v_desconto,
         total_centavos    = v_subtotal + v_frete - v_desconto
   where pedidos.id = v_pedido_id;

  return query
    select p.id, p.numero, p.total_centavos, p.expira_em
      from public.pedidos p where p.id = v_pedido_id;
end;
$$;

revoke execute on function public.criar_pedido(jsonb, public.entrega_tipo, jsonb, jsonb, text)
  from public, anon, authenticated;
grant  execute on function public.criar_pedido(jsonb, public.entrega_tipo, jsonb, jsonb, text)
  to service_role;

-- ============================================================
-- config nova
-- ============================================================

insert into public.config (chave, valor) values
  -- quantas parcelas SEM juros a loja banca; acima disso o juro é do comprador
  ('parcelas_sem_juros', '3'::jsonb)
on conflict (chave) do nothing;

-- Mo Visão — envio pelos Correios pro Brasil todo (out/2026)
--
-- O dono decidiu mandar pro Brasil inteiro, com frete pela distância. O preço
-- do frete vem de fora (Melhor Envio, que cota PAC e SEDEX sem contrato com os
-- Correios), e o Postgres não fala HTTP. Então quem cota é o SERVIDOR, e o
-- valor entra aqui como parâmetro.
--
-- Isso não abre a porta do "preço vem do navegador": criar_pedido só é
-- executável por service_role (005), e o servidor recota o frete na hora de
-- fechar em vez de aceitar o número que a tela mostrou.

-- assinatura nova: sem o drop, o create criaria uma sobrecarga, e chamada com
-- 4 argumentos ficaria ambígua entre as duas
drop function if exists public.criar_pedido(jsonb, public.entrega_tipo, jsonb, jsonb);

create or replace function public.criar_pedido(
  p_cliente        jsonb,
  p_entrega_tipo   public.entrega_tipo,
  p_entrega        jsonb,
  p_itens          jsonb,
  p_frete_centavos integer default null
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
  -- frete dos Correios é obrigatório e vem do servidor; nos outros tipos o
  -- parâmetro é ignorado
  if p_entrega_tipo = 'correios'
     and (p_frete_centavos is null or p_frete_centavos < 0) then
    raise exception 'FRETE_OBRIGATORIO';
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
    v_frete := coalesce(v_frete_local, 0);
  elsif p_entrega_tipo = 'correios' then
    v_frete := p_frete_centavos;
  end if;

  -- "frete grátis a partir de" vale pra qualquer entrega paga
  select coalesce((valor #>> '{}')::integer, 0) into v_gratis
    from public.config where chave = 'frete_gratis_acima_centavos';
  if coalesce(v_gratis, 0) > 0 and v_subtotal >= v_gratis then
    v_frete := 0;
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

-- 🔴 função nova nasce executável por PUBLIC (ver 005)
revoke execute on function public.criar_pedido(jsonb, public.entrega_tipo, jsonb, jsonb, integer) from public, anon, authenticated;
grant  execute on function public.criar_pedido(jsonb, public.entrega_tipo, jsonb, jsonb, integer) to service_role;

-- de onde o pacote sai: sem ele não há cotação, e o carrinho avisa
insert into public.config (chave, valor) values
  ('cep_origem', '""'::jsonb)
on conflict (chave) do nothing;

update public.config
   set valor = '"Enviamos pelos Correios pro Brasil todo, ou dá pra combinar a retirada."'::jsonb
 where chave = 'entrega_texto'
   and valor = '"Retirada combinada ou entrega na região."'::jsonb;

update public.config
   set valor = '""'::jsonb
 where chave = 'banner_topo'
   and valor = '"Frete grátis na região"'::jsonb;

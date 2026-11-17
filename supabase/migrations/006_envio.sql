-- Mó Visão — envio pelos Correios pro Brasil todo (nov/2026)
--
-- O dono manda pro Brasil inteiro, com frete pela distância. Quem cota PAC e
-- SEDEX é o Melhor Envio (lib/frete.ts), e o Postgres não fala HTTP: o SERVIDOR
-- cota e o valor entra aqui como parâmetro.
--
-- Isso não abre a porta do "preço vem do navegador": criar_pedido só é
-- executável por service_role, e o servidor recota o frete na hora de fechar
-- em vez de aceitar o número que a tela mostrou.
--
-- Em cima do 005 que está no ar: desconto do Pix continua só sobre as peças.

-- ============================================================
-- colunas novas do pedido
-- ============================================================

alter table public.pedidos
  -- o Melhor Envio pede o CPF do destinatário pra etiqueta sem nota fiscal.
  -- pedidos não é legível pela chave pública (003), e a página do pedido não
  -- seleciona esta coluna
  add column if not exists cliente_cpf text,
  -- código dos Correios, preenchido pelo dono no painel depois de postar
  add column if not exists rastreio text;

-- ============================================================
-- criar_pedido com frete cotado
--
-- p_entrega (correios): {"cep", "rua", "numero", "complemento", "bairro",
--   "cidade", "uf", "servico", "servico_nome", "prazo_dias", "observacao"}
-- p_frete_centavos: obrigatório nos Correios, ignorado no resto
-- ============================================================

-- assinatura nova: sem o drop, o create viraria uma sobrecarga
drop function if exists public.criar_pedido(jsonb, public.entrega_tipo, jsonb, jsonb, text);

create or replace function public.criar_pedido(
  p_cliente        jsonb,
  p_entrega_tipo   public.entrega_tipo,
  p_entrega        jsonb,
  p_itens          jsonb,
  p_pagamento      text,
  p_frete_centavos integer default null
)
returns table (id uuid, numero text, total_centavos integer, expira_em timestamptz)
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_itens          jsonb;
  v_qtd_itens      integer;
  v_pedido_id      uuid;
  v_subtotal       integer;
  v_frete          integer := 0;
  v_desconto       integer := 0;
  v_pct            numeric;
  v_frete_local    integer;
  v_gratis_acima   integer;
  v_gratis_correio boolean;
  v_minutos        integer;
begin
  -- reserva vencida de quem não pagou não pode barrar quem está comprando agora
  perform public.liberar_reservas_expiradas();

  if p_pagamento not in ('pix', 'cartao') then
    raise exception 'PAGAMENTO_INVALIDO';
  end if;
  if p_entrega_tipo = 'correios'
     and (p_frete_centavos is null or p_frete_centavos <= 0) then
    raise exception 'FRETE_OBRIGATORIO';
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
         coalesce((select (valor #>> '{}')::boolean from config where chave = 'frete_gratis_correios'), false),
         coalesce((select (valor #>> '{}')::integer from config where chave = 'reserva_minutos'), 30)
    into v_pct, v_frete_local, v_gratis_acima, v_gratis_correio, v_minutos;

  insert into public.pedidos (
    cliente_nome, cliente_email, cliente_telefone, cliente_cpf,
    entrega_tipo, entrega, pagamento_escolhido,
    subtotal_centavos, total_centavos, expira_em
  ) values (
    trim(p_cliente->>'nome'), lower(trim(p_cliente->>'email')), trim(p_cliente->>'telefone'),
    nullif(regexp_replace(coalesce(p_cliente->>'cpf', ''), '\D', '', 'g'), ''),
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

  if p_entrega_tipo = 'local' then
    v_frete := greatest(v_frete_local, 0);
  elsif p_entrega_tipo = 'correios' then
    v_frete := p_frete_centavos;
  end if;

  -- "frete grátis acima de": na região sempre valeu; nos Correios só se o
  -- dono ligar no painel (frete_gratis_correios), porque ali o frete é dinheiro
  -- que ele paga de verdade na etiqueta
  if v_gratis_acima > 0 and v_subtotal >= v_gratis_acima
     and (p_entrega_tipo = 'local' or (p_entrega_tipo = 'correios' and v_gratis_correio)) then
    v_frete := 0;
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

-- 🔴 função nova nasce executável por PUBLIC (ver 005)
revoke execute on function public.criar_pedido(jsonb, public.entrega_tipo, jsonb, jsonb, text, integer)
  from public, anon, authenticated;
grant  execute on function public.criar_pedido(jsonb, public.entrega_tipo, jsonb, jsonb, text, integer)
  to service_role;

-- ============================================================
-- config
-- ============================================================

insert into public.config (chave, valor) values
  -- desligado: o dono decide se banca o frete dos Correios acima do valor
  ('frete_gratis_correios', 'false'::jsonb)
on conflict (chave) do nothing;

-- os textos padrão falavam de "região", que saiu da tela. Só troca se ainda
-- for o texto de fábrica — o que o dono escreveu fica
update public.config
   set valor = '"Enviamos pelos Correios pro Brasil todo, ou dá pra combinar a retirada."'::jsonb
 where chave = 'entrega_texto'
   and valor = '"Retirada combinada ou entrega na região."'::jsonb;

update public.config
   set valor = '""'::jsonb
 where chave = 'banner_topo'
   and valor = '"Frete grátis na região"'::jsonb;

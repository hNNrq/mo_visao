-- Mo Visão — schema base
-- Regras que valem pra tudo aqui:
--   * dinheiro sempre em centavos (integer), nunca float
--   * "disponível" = estoque - reservado, e é coluna gerada pra não desencontrar
--   * item de pedido guarda snapshot de nome e preço: mudar o preço depois
--     não pode reescrever o que o cliente pagou

create extension if not exists "pgcrypto";

-- ============================================================
-- produtos
-- ============================================================

create table public.produtos (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique,
  nome              text not null,
  marca             text,
  modelo            text,
  descricao         text,
  preco_centavos    integer not null check (preco_centavos > 0),
  estoque           integer not null default 0 check (estoque >= 0),
  reservado         integer not null default 0 check (reservado >= 0),
  disponivel        integer generated always as (estoque - reservado) stored,
  categoria         text not null default 'rua' check (categoria in ('corrida', 'rua')),
  destaque          boolean not null default false,
  ordem             integer not null default 0,
  ativo             boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  -- não dá pra reservar mais do que existe
  constraint reserva_cabe_no_estoque check (reservado <= estoque)
);

create index produtos_vitrine_idx  on public.produtos (ordem)      where ativo;
create index produtos_destaque_idx on public.produtos (ordem)      where ativo and destaque;
create index produtos_categoria_idx on public.produtos (categoria) where ativo;

-- ============================================================
-- fotos do produto
-- ============================================================

create table public.produto_fotos (
  id           uuid primary key default gen_random_uuid(),
  produto_id   uuid not null references public.produtos(id) on delete cascade,
  storage_path text not null,
  alt          text,
  ordem        integer not null default 0,
  created_at   timestamptz not null default now()
);

create index produto_fotos_ordem_idx on public.produto_fotos (produto_id, ordem);

-- ============================================================
-- pedidos
-- ============================================================

create type public.pedido_status as enum (
  'pendente',   -- criado, estoque reservado, aguardando pagamento
  'pago',       -- confirmado pelo webhook, estoque baixado
  'separado',   -- dono separou pra entrega
  'entregue',
  'expirado',   -- não pagou dentro do prazo, reserva liberada
  'cancelado'
);

create type public.entrega_tipo as enum ('retirada', 'local', 'correios');

create sequence public.pedido_numero_seq start 1;

create table public.pedidos (
  id                 uuid primary key default gen_random_uuid(),
  numero             text not null unique
                       default 'MV-' || lpad(nextval('public.pedido_numero_seq')::text, 5, '0'),
  status             public.pedido_status not null default 'pendente',

  cliente_nome       text not null,
  cliente_email      text not null,
  cliente_telefone   text not null,

  entrega_tipo       public.entrega_tipo not null default 'local',
  entrega            jsonb not null default '{}'::jsonb,  -- endereço, ponto de retirada, observação

  subtotal_centavos  integer not null check (subtotal_centavos >= 0),
  frete_centavos     integer not null default 0 check (frete_centavos >= 0),
  desconto_centavos  integer not null default 0 check (desconto_centavos >= 0),
  total_centavos     integer not null check (total_centavos >= 0),

  mp_preference_id   text,
  mp_payment_id      text unique,
  metodo_pagamento   text,   -- pix | credit_card | debit_card

  pago_em            timestamptz,
  expira_em          timestamptz not null default now() + interval '30 minutes',
  created_at         timestamptz not null default now()
);

create index pedidos_status_idx     on public.pedidos (status, created_at desc);
create index pedidos_expiracao_idx  on public.pedidos (expira_em) where status = 'pendente';

create table public.pedido_itens (
  id                      uuid primary key default gen_random_uuid(),
  pedido_id               uuid not null references public.pedidos(id) on delete cascade,
  produto_id              uuid references public.produtos(id) on delete set null,
  nome_snapshot           text not null,
  preco_snapshot_centavos integer not null check (preco_snapshot_centavos > 0),
  quantidade              integer not null check (quantidade > 0),
  created_at              timestamptz not null default now()
);

create index pedido_itens_pedido_idx on public.pedido_itens (pedido_id);

-- ============================================================
-- eventos do Mercado Pago — garante idempotência do webhook
-- O MP reenvia a mesma notificação. Sem isso, o estoque baixa duas vezes.
-- ============================================================

create table public.mp_eventos (
  id            text primary key,   -- id da notificação do MP
  payment_id    text,
  tipo          text,
  payload       jsonb,
  processado_em timestamptz not null default now()
);

-- ============================================================
-- configuração editável pelo dono
-- ============================================================

create table public.config (
  chave      text primary key,
  valor      jsonb not null,
  updated_at timestamptz not null default now()
);

-- ============================================================
-- quem pode entrar no painel
-- ============================================================

create table public.admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  nome       text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- updated_at automático
-- ============================================================

create or replace function public.tocar_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger produtos_updated_at before update on public.produtos
  for each row execute function public.tocar_updated_at();

create trigger config_updated_at before update on public.config
  for each row execute function public.tocar_updated_at();

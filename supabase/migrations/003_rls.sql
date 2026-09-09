-- Mo Visão — Row Level Security
--
-- A chave pública (anon) do Supabase vai no navegador de qualquer visitante.
-- Sem as regras abaixo, essa chave lê a tabela de pedidos inteira — nome,
-- telefone e endereço de todo mundo que comprou. RLS não é opcional aqui.
--
-- A chave service_role (só no servidor, nunca no browser) ignora RLS.
-- É ela que o checkout e o webhook usam.

alter table public.produtos      enable row level security;
alter table public.produto_fotos enable row level security;
alter table public.pedidos       enable row level security;
alter table public.pedido_itens  enable row level security;
alter table public.mp_eventos    enable row level security;
alter table public.config        enable row level security;
alter table public.admins        enable row level security;

-- ============================================================
-- produtos — vitrine é pública, edição é do dono
-- ============================================================

create policy "produto ativo é público"
  on public.produtos for select
  using (ativo = true);

create policy "dono gerencia produtos"
  on public.produtos for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================
-- fotos — visíveis só se o produto estiver no ar
-- ============================================================

create policy "foto de produto ativo é pública"
  on public.produto_fotos for select
  using (exists (
    select 1 from public.produtos p
     where p.id = produto_fotos.produto_id and p.ativo
  ));

create policy "dono gerencia fotos"
  on public.produto_fotos for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================
-- pedidos — nada de público. Só o dono lê.
-- O cliente acompanha o pedido dele por /pedido/[numero], servido pelo
-- servidor com service_role, não pela chave anon.
-- ============================================================

create policy "dono lê pedidos"
  on public.pedidos for select
  to authenticated
  using (public.is_admin());

create policy "dono atualiza pedidos"
  on public.pedidos for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "dono lê itens do pedido"
  on public.pedido_itens for select
  to authenticated
  using (public.is_admin());

-- ============================================================
-- eventos do Mercado Pago — só leitura pelo dono, escrita só no servidor
-- ============================================================

create policy "dono lê eventos"
  on public.mp_eventos for select
  to authenticated
  using (public.is_admin());

-- ============================================================
-- config — o site precisa ler (WhatsApp, textos), só o dono escreve
-- ============================================================

create policy "config é pública"
  on public.config for select
  using (true);

create policy "dono edita config"
  on public.config for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================
-- admins — só admin enxerga admin
-- ============================================================

create policy "admin vê admins"
  on public.admins for select
  to authenticated
  using (public.is_admin());

-- ============================================================
-- Storage: bucket das fotos de produto
-- Leitura pública (é vitrine), escrita só do dono.
-- ============================================================

insert into storage.buckets (id, name, public)
values ('produtos', 'produtos', true)
on conflict (id) do nothing;

create policy "foto de produto é pública"
  on storage.objects for select
  using (bucket_id = 'produtos');

create policy "dono sobe foto"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'produtos' and public.is_admin());

create policy "dono troca foto"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'produtos' and public.is_admin());

create policy "dono apaga foto"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'produtos' and public.is_admin());

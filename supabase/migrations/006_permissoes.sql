-- Mo Visão — permissões explícitas das roles da API
--
-- 🔴 Por que existe (set/2026): o Supabase mudou o padrão. Projeto antigo
-- concedia SELECT/INSERT/UPDATE/DELETE em toda tabela nova do `public` pra
-- anon, authenticated e service_role, e EXECUTE em toda função. Projeto novo
-- (e o Supabase local da CLI atual) não concede nada: a vitrine sobe vazia,
-- o painel recusa o dono e o checkout falha com "permission denied", sem
-- nenhuma migration ter mudado.
--
-- O banco de demonstração nasceu no padrão antigo e funcionava por sorte. O
-- banco do dono, que vai ser criado do zero na conta dele, nasceria quebrado.
-- Aqui o acesso passa a ser escrito, e fica igual nos dois mundos.
--
-- Regra: GRANT diz quem pode TENTAR; o RLS (003) diz o que cada um alcança.
-- Por isso authenticated recebe escrita em produtos: é o RLS que restringe ao
-- dono (is_admin()).

grant usage on schema public to anon, authenticated, service_role;

-- zera o que o padrão antigo deixou, pra os dois mundos partirem do mesmo ponto
revoke all on all tables in schema public from anon, authenticated;

-- ============================================================
-- vitrine: leitura pública; escrita só do dono (via RLS)
-- ============================================================

grant select on public.produtos, public.produto_fotos, public.config to anon, authenticated;
grant insert, update, delete on public.produtos, public.produto_fotos, public.config to authenticated;

-- ============================================================
-- pedidos: nada pra anon. O dono lê e muda status (via RLS).
-- O cliente vê o pedido dele pelo servidor, com service_role e token.
-- ============================================================

grant select, update on public.pedidos to authenticated;
grant select on public.pedido_itens, public.mp_eventos, public.admins to authenticated;

-- ============================================================
-- servidor (checkout, webhook, scripts): tudo. Ignora RLS de qualquer jeito.
-- ============================================================

grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

-- ============================================================
-- funções
--
-- is_admin() é chamada DENTRO das políticas de RLS, com a role de quem
-- consulta — sem EXECUTE pra authenticated, toda política do dono estoura.
-- As de estoque continuam só do servidor (005).
-- ============================================================

grant execute on function public.is_admin() to authenticated, service_role;
grant execute on function public.cancelar_pedido(uuid) to authenticated;

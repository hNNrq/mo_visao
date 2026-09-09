-- Mo Visão — configuração inicial
-- Os textos abaixo são editáveis pelo dono em /admin/config.

insert into public.config (chave, valor) values
  ('whatsapp',            '"5500000000000"'::jsonb),
  ('instagram',           '"mo_visao2k26"'::jsonb),
  ('email_contato',       '""'::jsonb),
  ('banner_topo',         '"Frete grátis na região"'::jsonb),
  ('desconto_pix_pct',    '5'::jsonb),
  ('frete_local_centavos','0'::jsonb),
  ('frete_gratis_acima_centavos', '0'::jsonb),
  ('entrega_texto',       '"Retirada combinada ou entrega na região."'::jsonb),
  ('reserva_minutos',     '30'::jsonb)
on conflict (chave) do nothing;

-- ============================================================
-- Depois de criar o login do dono no painel do Supabase (Auth > Users),
-- rodar isto trocando o e-mail, pra dar acesso de admin a ele:
--
--   insert into public.admins (user_id, nome)
--   select id, 'Mo Visão' from auth.users where email = 'EMAIL_DO_DONO';
-- ============================================================

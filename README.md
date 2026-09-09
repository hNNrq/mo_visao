# Site Mó Visão

Loja de óculos com catálogo, checkout (Pix / crédito / débito) e painel pro dono
gerenciar produtos, fotos e estoque sozinho.

Cliente da [Norman.dgt](https://github.com). Contexto e briefing na pasta acima.

## Stack

| Camada | Escolha | Por quê |
|---|---|---|
| Front | Next.js 16 (App Router) + TypeScript + Tailwind v4 | SSR pro SEO, `next/image` pra foto de produto |
| Banco / fotos / login | Supabase | Postgres + Storage + Auth num lugar só |
| Pagamento | Mercado Pago Checkout Pro | Pix, crédito e débito. O site nunca toca em dado de cartão |
| Hospedagem | Netlify | Plano grátis permite uso comercial (Vercel Hobby **não** permite) |

## Rodar local

```bash
npm install
cp .env.example .env.local   # e preencher
npm run dev
```

## Preparar o Supabase

1. Criar projeto em [supabase.com](https://supabase.com) — **na conta do dono**
2. No SQL Editor, rodar em ordem:
   - `supabase/migrations/001_schema.sql`
   - `supabase/migrations/002_funcoes.sql`
   - `supabase/migrations/003_rls.sql`
   - `supabase/migrations/004_seed.sql`
3. Auth > Users > criar o login do dono
4. Rodar, trocando o e-mail:
   ```sql
   insert into public.admins (user_id, nome)
   select id, 'Mó Visão' from auth.users where email = 'EMAIL_DO_DONO';
   ```
5. Settings > API — copiar as chaves pro `.env.local`

## Regras que não se quebram

- **`SUPABASE_SERVICE_ROLE_KEY` nunca vai pro navegador.** Ela ignora todo o RLS.
  Só em rota de API e server action. Nunca com prefixo `NEXT_PUBLIC_`.
- **Dinheiro é integer em centavos.** Nunca float. Converter só na hora de exibir
  (`lib/format.ts`).
- **Estoque só muda dentro do Postgres**, pelas funções de `002_funcoes.sql`.
  Ler-e-depois-escrever no Node perde a corrida quando dois clientes compram o
  mesmo óculos de 1 unidade.
- **Webhook do Mercado Pago é idempotente.** O MP reenvia a mesma notificação;
  a tabela `mp_eventos` é o que impede o estoque de baixar duas vezes.
- **As contas são todas do dono** (domínio, Netlify, Supabase, Mercado Pago).
  A Norman.dgt entra como colaboradora. É o que permite entregar e sair.

## Ambiente local completo

```bash
npx supabase start      # sobe Postgres, Auth e Storage em Docker
npm run local:semear    # cria o login do dono e marca como admin
npm run demo            # popula com óculos e fotos, pra ver com conteúdo
npm run dev
```

Login de teste: `dono@movisao.teste` / `movisao123`.
Studio do Supabase: http://127.0.0.1:54323 · `npx supabase stop` derruba tudo.

> O `analytics` fica desligado no `config.toml`: o container é pesado, sobe
> unhealthy com frequência e derruba o stack inteiro junto. Nada aqui usa.

## Testes

```bash
npm run testar               # estoque, sem Docker (PGlite, Postgres em processo)
npm run testar:concorrencia  # duas conexões reais disputando a mesma unidade
npm run testar:painel        # fluxo do dono no navegador, ponta a ponta
```

| Script | O que cobre | Precisa de |
|---|---|---|
| `testar` | reserva, idempotência do webhook, expiração, travas do schema | nada |
| `testar:concorrencia` | dois e dez clientes simultâneos no mesmo produto | Supabase local |
| `testar:painel` | entrar, cadastrar, subir foto, mudar preço, ocultar, e o bloqueio de ação sem sessão | Supabase local + `npm run dev` |

## Estrutura

```
app/(loja)/          o que o cliente vê — Header e Footer moram no layout daqui
app/admin/           painel do dono (fora do layout da loja, de propósito)
app/admin/acoes.ts   Server Actions; cada uma checa permissão por conta própria
componentes/admin/   telas do painel (mobile-first)
lib/admin.ts         exigirAdmin() — porteiro de toda Server Action
lib/format.ts        preço, parcelamento, slug
lib/types.ts         espelho do schema do banco
lib/supabase/
  client.ts          navegador — chave anon, protegido por RLS
  server.ts          servidor com sessão do usuário — respeita RLS
  admin.ts           service_role — IGNORA RLS, só no servidor
proxy.ts             renova sessão e barra /admin de quem não logou
supabase/migrations/ schema, funções de estoque, RLS, seed
```

## Estado

- [x] Fase 1 — fundação (projeto, tokens da marca, schema, RLS, funções de estoque)
- [x] Fase 2 — vitrine (hero, catálogo com filtro, página de produto, 404)
- [x] Fase 3 — painel do dono (login, produtos, fotos, pedidos, ajustes)
- [ ] Fase 4 — carrinho, checkout, webhook
- [ ] Fase 5 — páginas legais, SEO, analytics
- [ ] Fase 6 — treinamento e entrega

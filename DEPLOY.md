# Subir o site — Supabase + Vercel

Passo a passo do primeiro deploy. A ordem importa: o Supabase vem antes,
porque a Vercel precisa das chaves dele pra buildar.

Repositório: https://github.com/hNNrq/mo_visao

---

## Antes de começar

**As contas nascem no nome do dono** (Supabase, Vercel, domínio), com o
Henrique como colaborador. É o que permite entregar a loja e sair sem
sequestrar nada. Se pra essa demo for mais rápido criar na conta da
Norman.dgt, tudo bem — mas anota que vai ter que migrar, e migrar projeto do
Supabase significa recriar o banco e reconfigurar as chaves.

---

## 1. Supabase

### 1.1 Criar o projeto

Em [supabase.com/dashboard](https://supabase.com/dashboard) > **New project**.

- **Region:** casar com a região das funções da Vercel, que por padrão rodam em
  Washington (`iad1` / us-east-1). Quem faz consulta ao banco é o servidor da
  Vercel, não o navegador do visitante — então Supabase em São Paulo com Vercel
  em Washington é o pior dos dois mundos: cada consulta atravessa o continente.
  O projeto atual está em `us-east-1`, colado na Vercel, e é o certo pra esse
  arranjo. Só valeria São Paulo se as funções também fossem movidas pra `gru1`.
  A latência que o visitante sente é o salto até a Vercel, e o conteúdo estático
  sai do CDN de qualquer jeito.
- **Database password:** gera uma forte e guarda. Não é a senha do painel do
  site; é a do banco, e o Supabase não mostra de novo.

### 1.2 Rodar as migrations

**SQL Editor** > **New query**. Rodar os quatro arquivos de
`supabase/migrations/`, **na ordem**, um de cada vez:

| Arquivo | O que cria |
|---|---|
| `001_schema.sql` | tabelas: produtos, fotos, pedidos, admins, config |
| `002_funcoes.sql` | `is_admin()` e as funções de reserva de estoque |
| `003_rls.sql` | as regras de segurança **e o bucket `produtos`** |
| `004_seed.sql` | os textos editáveis do site |

Rodar fora de ordem quebra: o `003` depende das tabelas do `001` e da
`is_admin()` do `002`.

> O bucket das fotos é criado pelo `003_rls.sql`, já marcado como público.
> **Não crie o bucket na mão pelo painel antes disso.** O insert é
> `on conflict (id) do nothing`, então ele não falha — ele simplesmente não
> mexe no bucket que já existe. Se você tiver criado um privado, ele continua
> privado, e a vitrine fica com as fotos quebradas sem nenhum erro aparecer.

### 1.3 Criar o login do dono

**Authentication** > **Users** > **Add user** > *Create new user*.

- email e senha do dono
- marcar **Auto Confirm User**, senão ele precisa clicar num email de
  confirmação que provavelmente não vai chegar

Criar o usuário **não dá acesso ao painel**. O porteiro é a tabela `admins`
(ver `lib/admin.ts`). No SQL Editor, trocando o email:

```sql
insert into public.admins (user_id, nome)
select id, 'Mó Visão' from auth.users where email = 'EMAIL_DO_DONO';
```

Sem essa linha o login funciona e o painel responde "Você não tem acesso a
essa área".

> ⚠️ **Nunca apague um usuário do Auth pra "resetar a senha".** A coluna
> `admins.user_id` referencia `auth.users(id)` com `on delete cascade`: apagar o
> usuário apaga a linha de `admins` junto, sem aviso. O usuário recriado vem com
> um UUID novo, então o login passa e o painel recusa. Pra trocar senha, edite o
> usuário existente em **Authentication > Users**. Se já aconteceu, rode o
> `insert` acima de novo — ele repara.

### 1.4 Pegar as chaves

**Project Settings** > **API**:

| Onde está | Vira a variável |
|---|---|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| Project API keys > `anon` `public` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Project API keys > `service_role` | `SUPABASE_SERVICE_ROLE_KEY` |

⚠️ A `service_role` **ignora todo o RLS**. Ela nunca leva o prefixo
`NEXT_PUBLIC_`, nunca vai pro navegador e nunca entra num arquivo commitado.

---

## 2. Vercel

### 2.1 Importar

[vercel.com/new](https://vercel.com/new) > importar `hNNrq/mo_visao`.

O repositório **é** a raiz do projeto Next — não mexer em *Root Directory*.
Framework, build e output a Vercel detecta sozinha.

### 2.2 Variáveis de ambiente

Antes de clicar em Deploy, em **Environment Variables**, as três (e só as
três — o código não lê mais nada hoje):

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

Marcar as três pra **Production, Preview e Development**.

> `NEXT_PUBLIC_SITE_URL`, `MERCADOPAGO_*`, `RESEND_*` e `CRON_SECRET` estão no
> `.env.example` mas **ainda não são lidos por nenhum arquivo**. Entram quando
> o checkout for construído. Não perca tempo com elas agora.

### 2.3 Uma pegadinha do build

O `next.config.ts` monta a lista de hosts autorizados do `next/image` a partir
da `NEXT_PUBLIC_SUPABASE_URL` — **em tempo de build**. Consequência: se você
trocar a URL do Supabase depois, tem que **redeployar**, não basta salvar a
variável. Sem isso as fotos de produto param de carregar sem erro visível.

---

## Estado do projeto (09/09/2026)

Já feito, não precisa refazer:

- projeto `mo_visao` criado (ref `etrgjradkasgpximbpre`, us-east-1)
- as quatro migrations aplicadas por `supabase db push`
- bucket `produtos` criado e **público**
- `config` semeada com as 9 chaves editáveis
- `henriquenorman@gmail.com` criado no Auth e inserido em `admins`
- RLS conferido na chave pública: lê produto, não lê `admins`, não escreve
- **três óculos de demonstração no ar**, com foto, semeados por
  `npm run demo -- --confirmar` (ver seção 3). São de exemplo: o dono apaga ou
  edita pelo painel quando cadastrar o estoque de verdade

Falta: **o login do dono**. Hoje o único admin é o do Henrique. Antes de
entregar, criar o usuário dele em Authentication e inserir na tabela `admins`
do mesmo jeito.

---

## 3. Depois que subir

1. Abrir `/admin/entrar` e logar com o usuário do passo 1.3
2. Cadastrar 2 ou 3 óculos com foto — a vitrine sobe vazia, e loja vazia não
   apresenta bem
3. Conferir se a foto aparece no catálogo (se não aparecer, é a pegadinha do
   2.3)

### Atalho: popular a vitrine pra uma demo

Pra mostrar a loja com conteúdo antes de o dono cadastrar o estoque dele:

```bash
npm run demo -- --confirmar    # sem a flag ele só roda contra o Supabase local
```

Sobe três óculos com foto, preço e estoque, a partir das imagens de
`clientes/mo-visao/produtos/`. Casa por slug e só manda foto pra produto que
ainda não tem nenhuma — rodar de novo não duplica nada. Pra limpar depois, é
pelo painel, produto por produto.

> As fotos precisam ser **PNG recortado**. O card da vitrine é `object-contain`
> sobre o creme da marca, então foto com fundo branco chapado vira um quadrado
> branco dentro do card.

---

## O que ainda NÃO está no ar

- **Checkout.** Carrinho, conta e pedidos são páginas de "em breve". O cliente
  vê o caminho da compra, mas não compra.
- **Mercado Pago.** Nada configurado. A conta é do dono, sem exceção.
- **A fonte da marca.** O site sobe com a Anton. A Hard Zone só entra depois da
  licença comercial + webfont comprada — o arquivo de avaliação está fora do
  git e o `@font-face` cai na Anton sozinho quando ele não existe
  (`app/globals.css`). O `.vercelignore` é a segunda tranca, pro caso de
  deploy pela CLI.

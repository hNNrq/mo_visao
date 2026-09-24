# Subir o site — Supabase + Netlify + Mercado Pago

Passo a passo do deploy. A ordem importa: o Supabase vem antes, porque a
Netlify precisa das chaves dele pra buildar.

Repositório: https://github.com/hNNrq/mo_visao

> **Por que Netlify e não Vercel (set/2026):** o plano Hobby da Vercel proíbe
> uso comercial, e a loja vende. O plano grátis da Netlify permite. O primeiro
> deploy de demonstração foi na Vercel; a loja que vende sobe na Netlify.

---

## Antes de começar

**As contas nascem no nome do dono** (Supabase, Netlify, Mercado Pago, Resend,
domínio), com o Henrique como colaborador. É o que permite entregar a loja e
sair sem sequestrar nada. Se pra uma demo for mais rápido criar na conta da
Norman.dgt, tudo bem — mas anota que vai ter que migrar, e migrar projeto do
Supabase significa recriar o banco e reconfigurar as chaves. **O Mercado Pago
não tem exceção:** o dinheiro nunca passa pela conta da Norman.dgt.

---

## 1. Supabase

### 1.1 Criar o projeto

Em [supabase.com/dashboard](https://supabase.com/dashboard) > **New project**.

- **Region:** `us-east-1`. Quem consulta o banco é o servidor (as funções da
  Netlify rodam por padrão em `us-east-2`, Ohio), não o navegador do
  visitante — então o banco fica colado nas funções, não no cliente. Supabase
  em São Paulo com funções nos EUA é o pior dos dois mundos: cada consulta
  atravessa o continente. O projeto atual já está em `us-east-1`.
- **Database password:** gera uma forte e guarda. Não é a senha do painel do
  site; é a do banco, e o Supabase não mostra de novo.

### 1.2 Rodar as migrations

`npx supabase db push`, ou pelo **SQL Editor** > **New query**, rodando os
seis arquivos de `supabase/migrations/` **na ordem**, um de cada vez:

| Arquivo | O que cria |
|---|---|
| `001_schema.sql` | tabelas: produtos, fotos, pedidos, admins, config |
| `002_funcoes.sql` | `is_admin()` e as funções de reserva de estoque |
| `003_rls.sql` | as regras de segurança **e o bucket `produtos`** |
| `004_seed.sql` | os textos editáveis do site |
| `005_checkout.sql` | `criar_pedido()`, token do pedido, travas de permissão e o job que expira reserva |
| `006_permissoes.sql` | o acesso de cada role da API escrito à mão (ver abaixo) |

Rodar fora de ordem quebra: o `003` depende das tabelas do `001` e da
`is_admin()` do `002`, e o `005` reescreve funções do `002`.

> 🔴 **O `005` fecha um furo que existe em todo banco que só tem até o `004`.**
> Até ele, as funções de estoque eram chamáveis com a chave pública: qualquer
> visitante conseguia reservar o estoque inteiro da loja pelo console do
> navegador, ou marcar pedido como pago. Se o banco já está no ar sem o `005`,
> aplicar é a primeira coisa a fazer.

> 🔴 **Sem o `006`, banco criado hoje nasce quebrado.** O Supabase parou de
> conceder acesso automático às tabelas do `public` em projeto novo: vitrine
> vazia, painel recusando o dono e checkout com "permission denied". O banco
> da demo nasceu no padrão antigo; o do dono, criado do zero, não.

> **O `005` liga o pg_cron** pra devolver ao estoque, a cada 5 minutos, as
> reservas de quem não pagou. Conferir em **Database > Extensions** que
> `pg_cron` ficou ativa, e em **Integrations > Cron** que o job
> `liberar-reservas-expiradas` aparece. Se o cron não subir, a loja continua
> certa — todo pedido novo libera as reservas vencidas antes de reservar —, só
> demora mais pra peça reaparecer na vitrine.

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

## 2. Mercado Pago (conta do dono)

### 2.1 Criar a aplicação

[mercadopago.com.br/developers/panel/app](https://www.mercadopago.com.br/developers/panel/app)
> **Criar aplicação** > *Pagamentos online* > **Checkout Pro**.

### 2.2 Credenciais

Na aplicação, **Credenciais de produção** > **Access Token** →
`MERCADOPAGO_ACCESS_TOKEN`.

Pra testar antes de valer: **Credenciais de teste** e as contas de teste do
próprio painel (uma vendedora, uma compradora). Com o token de teste, o
Checkout Pro aceita os
[cartões de teste](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/additional-content/your-integrations/test/cards)
e nenhum dinheiro de verdade se move.

### 2.3 Webhook

Na aplicação, **Webhooks > Configurar notificações**:

- **URL de produção:** `https://DOMINIO/api/mercadopago/webhook`
- **Eventos:** só **Pagamentos**
- Salvar e copiar a **assinatura secreta** → `MERCADOPAGO_WEBHOOK_SECRET`

Cada preferência de pagamento já leva essa URL, então o webhook chega mesmo sem
esse passo. O painel serve pra ter a assinatura secreta, que é o que prova que
a notificação veio mesmo do MP. Sem ela o site continua funcionando (o
pagamento é sempre relido na API do MP antes de qualquer coisa mudar), mas
avisa no log.

### 2.4 Parcelamento sem juros

O site mostra "ou 6x de R$ X". Quem decide se é sem juros é a **conta do
dono**, não o código: no app do Mercado Pago, **Seu negócio > Custos >
Parcelamento sem acréscimo**, até 6x. Sem isso, o cliente vê 6x no site e 6x
**com juros** no checkout — a promessa quebra na última tela.

### 2.5 O que o checkout não oferece, de propósito

- **Boleto**, excluído: leva até 3 dias pra compensar, e a peça fica reservada
  por 30 minutos.
- **Desconto no Pix**: no Checkout Pro o cliente escolhe a forma de pagamento
  dentro do Mercado Pago, depois que o preço já fechou. Saiu do painel em
  set/2026.

---

## 3. Resend (email de confirmação)

Manda a confirmação pro cliente e o aviso de "pedido pago" pro dono. O plano
grátis cobre 3 mil emails por mês.

1. [resend.com](https://resend.com) > conta no email do dono
2. **Domains > Add domain** com o domínio da loja, e colar os registros DNS
   que ele mostra no painel do domínio (Registro.br ou onde estiver)
3. **API Keys > Create** → `RESEND_API_KEY`
4. `EMAIL_REMETENTE` = `Mó Visão <pedidos@DOMINIO>` (do domínio verificado)
5. `EMAIL_DONO` = pra onde vai o aviso de venda. Opcional: sem ela, vale o
   email que o dono preencher em **Ajustes** no painel

**Sem domínio verificado, nada quebra:** o site não manda email e segue
vendendo. O cliente vê a confirmação na tela, e o dono vê o pedido no painel.

---

## 4. Netlify

### 4.1 Importar

[app.netlify.com](https://app.netlify.com) > **Add new site > Import an
existing project** > GitHub > `hNNrq/mo_visao`.

O repositório **é** a raiz do projeto Next. Build e publish estão no
`netlify.toml`, e a Netlify detecta o Next e instala o adaptador sozinha.

### 4.2 Variáveis de ambiente

**Site configuration > Environment variables**, antes do primeiro deploy:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_SITE_URL            https://DOMINIO  (sem barra no fim)
MERCADOPAGO_ACCESS_TOKEN
MERCADOPAGO_WEBHOOK_SECRET
RESEND_API_KEY                  opcional
EMAIL_REMETENTE                 opcional
EMAIL_DONO                      opcional
```

`NEXT_PUBLIC_SITE_URL` precisa ser o endereço **https** de verdade: é pra onde
o Mercado Pago devolve o cliente e manda o webhook. Com `http://` o MP recusa
o retorno automático, e o site cai no modo de desenvolvimento (seção 6).

`CRON_SECRET` e `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` estão no `.env.example`,
mas nenhum arquivo lê: o cron mora no Supabase (1.2), e o Checkout Pro não
precisa da chave pública.

### 4.3 Domínio

**Domain management > Add a domain**. Depois de apontar, trocar
`NEXT_PUBLIC_SITE_URL` e a URL do webhook no MP (2.3) pro domínio final, e
**redeployar**.

### 4.4 Uma pegadinha do build

O `next.config.ts` monta a lista de hosts autorizados do `next/image` a partir
da `NEXT_PUBLIC_SUPABASE_URL` — **em tempo de build**. Consequência: se você
trocar a URL do Supabase depois, tem que **redeployar**, não basta salvar a
variável. Sem isso as fotos de produto param de carregar sem erro visível.
Vale o mesmo pra `NEXT_PUBLIC_SITE_URL`.

---

## Estado do projeto (24/09/2026)

Já feito, não precisa refazer:

- projeto `mo_visao` criado (ref `etrgjradkasgpximbpre`, us-east-1)
- migrations `001` a `004` aplicadas por `supabase db push` — **o `005` ainda
  não**
- bucket `produtos` criado e **público**
- `config` semeada com as 9 chaves editáveis
- `henriquenorman@gmail.com` criado no Auth e inserido em `admins`
- RLS conferido na chave pública: lê produto, não lê `admins`, não escreve
- **três óculos de demonstração no ar**, com foto, semeados por
  `npm run demo -- --confirmar` (ver seção 5). São de exemplo: o dono apaga ou
  edita pelo painel quando cadastrar o estoque de verdade
- demo publicada na Vercel

Falta, nessa ordem:

1. aplicar o `005_checkout.sql` no banco do ar
2. conta do Mercado Pago do dono (seção 2) e domínio (Resend e Netlify
   dependem dele)
3. subir na Netlify (seção 4) e tirar a demo da Vercel
4. **o login do dono**. Hoje o único admin é o do Henrique. Antes de entregar,
   criar o usuário dele em Authentication e inserir na tabela `admins` do mesmo
   jeito

---

## 5. Depois que subir

1. Abrir `/admin/entrar` e logar com o usuário do passo 1.3
2. Cadastrar 2 ou 3 óculos com foto — a vitrine sobe vazia, e loja vazia não
   apresenta bem
3. Conferir se a foto aparece no catálogo (se não aparecer, é a pegadinha do
   4.4)
4. Em **Ajustes**, preencher WhatsApp, email que recebe os pedidos e taxa de
   entrega
5. **Fazer uma compra de verdade** de valor baixo — um produto de teste a
   R$ 1,00, ocultado depois — no Pix: tem que voltar pra tela "Pagamento
   confirmado", o pedido aparecer em **Pedidos** no painel e o email chegar.
   Depois estornar pelo app do MP e cancelar o pedido no painel

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

## 6. Testar o checkout na máquina

Com o Supabase local no ar (ver README) e o **token de teste** do MP no
`.env.local`:

- O Mercado Pago não alcança `localhost`, então **não chega webhook** e o
  retorno automático fica desligado. Depois de pagar, clicar em "Voltar ao
  site" no próprio checkout: a página do pedido recebe o `payment_id` na URL,
  relê o pagamento no MP e confirma sozinha.
- Pra testar o webhook de verdade na máquina, expor o `localhost:3000` com um
  túnel (`npx cloudflared tunnel --url http://localhost:3000`) e pôr a URL
  https do túnel em `NEXT_PUBLIC_SITE_URL`.

---

## O que ainda NÃO está no ar

- **Envio pelos Correios.** Só retirada e entrega na região. O banco já tem o
  tipo `correios`; o `criar_pedido()` recusa até a fase de frete nacional.
- **A fonte da marca.** O site sobe com a Anton. A Hard Zone só entra depois da
  licença comercial + webfont comprada — o arquivo de avaliação está fora do
  git e o `@font-face` cai na Anton sozinho quando ele não existe
  (`app/globals.css`).

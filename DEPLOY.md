# Subir o site — Supabase + Netlify

Passo a passo do primeiro deploy. A ordem importa: o Supabase vem antes,
porque a Netlify precisa das chaves dele pra buildar.

Repositório: https://github.com/hNNrq/mo_visao

---

## Antes de começar

**As contas nascem no nome do dono** (Supabase, Netlify, domínio), com o
Henrique como colaborador. É o que permite entregar a loja e sair sem
sequestrar nada. Se pra essa demo for mais rápido criar na conta da
Norman.dgt, tudo bem — mas anota que vai ter que migrar, e migrar projeto do
Supabase significa recriar o banco e reconfigurar as chaves.

---

## 1. Supabase

### 1.1 Criar o projeto

Em [supabase.com/dashboard](https://supabase.com/dashboard) > **New project**.

- **Region:** casar com a região das funções do site. Quem consulta o banco é o
  servidor, não o navegador do visitante — banco longe do servidor faz cada
  consulta atravessar o continente. O projeto atual está em `us-east-1`
  (Virgínia), e as funções da Netlify rodam por padrão em `us-east-2` (Ohio):
  vizinhas, está certo assim. Supabase em São Paulo seria o pior arranjo aqui.
  A latência que o visitante sente é o salto até a Netlify, e o conteúdo
  estático sai do CDN de qualquer jeito.
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

## 2. Netlify

> **Por que Netlify e não Vercel:** o plano Hobby (grátis) da Vercel proíbe uso
> comercial, e isto é uma loja. O plano grátis da Netlify permite.

### 2.1 Importar

[app.netlify.com](https://app.netlify.com) > **Add new project** > **Import an
existing project** > GitHub > `hNNrq/mo_visao`.

O repositório **é** a raiz do projeto Next — não mexer em *Base directory*.
Build, publish e versão do Node vêm do `netlify.toml`, e o adaptador de Next a
Netlify instala sozinha ao detectar o framework.

### 2.2 Variáveis de ambiente

Antes do primeiro deploy, em **Project configuration** > **Environment
variables**:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_SITE_URL          # https://<site>.netlify.app, sem barra no fim
MERCADOPAGO_ACCESS_TOKEN      # ver seção 4
MERCADOPAGO_WEBHOOK_SECRET    # ver seção 4
```

Escopo **All scopes**, mesmo valor em todos os contextos (Production, Deploy
Previews, Branch deploys).

Sem `MERCADOPAGO_ACCESS_TOKEN` o site sobe normal e o botão de pagar fica
desligado, com o recado de chamar no Instagram. É o jeito seguro de subir antes
de a conta do dono estar pronta.

> `NEXT_PUBLIC_SITE_URL` tem que ser o endereço **https** público. É com ele que
> o site diz ao Mercado Pago pra onde devolver o cliente e onde avisar do
> pagamento. Com endereço local o Mercado Pago recusa o aviso automático, e só
> a volta do cliente pelo link confirma o pedido.

### 2.3 Uma pegadinha do build

O `next.config.ts` monta a lista de hosts autorizados do `next/image` a partir
da `NEXT_PUBLIC_SUPABASE_URL` — **em tempo de build**. Consequência: se você
trocar a URL do Supabase depois, tem que **redeployar** (Deploys > Trigger
deploy > *Clear cache and deploy*), não basta salvar a variável. Sem isso as
fotos de produto param de carregar sem erro visível.

### 2.4 Conta no nome do dono

O ideal é o projeto nascer no time da Netlify do dono. Se for mais rápido
construir no time da Norman.dgt, na entrega o projeto é **transferido** pro time
dele (Project configuration > General > *Transfer project*) — transferir
mantém o site, as variáveis e o domínio. Não tem banco pra recriar, como no
Supabase.

---

## Estado do projeto (09/09/2026)

Já feito, não precisa refazer:

- projeto `mo_visao` criado (ref `etrgjradkasgpximbpre`, us-east-1)
- as quatro migrations aplicadas por `supabase db push`
- bucket `produtos` criado e **público**
- `config` semeada com as 9 chaves editáveis
- `henriquenorman@gmail.com` criado no Auth e inserido em `admins`
- RLS conferido na chave pública: lê produto, não lê `admins`, não escreve
- **`005_checkout.sql` aplicada em 28/09/2026.** Fechou uma brecha real: as
  funções de estoque eram executáveis pela chave pública, e dava pra chamar
  `confirmar_pedido` direto pela API (conferido antes e depois — hoje responde
  "permission denied")
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

## 4. Mercado Pago

A conta é **do dono**, sem exceção — o dinheiro cai direto nela. O Henrique entra
como desenvolvedor pra pegar as credenciais.

### 4.1 Credenciais

Em [mercadopago.com.br/developers](https://www.mercadopago.com.br/developers) >
**Suas integrações** > **Criar aplicação** (pagamentos online, Checkout Pro).
Dentro da aplicação:

- **Credenciais de teste** > *Access Token* → `MERCADOPAGO_ACCESS_TOKEN` enquanto
  testa. Pra comprar em teste, crie **usuários de teste** (vendedor e comprador)
  e pague com os cartões de teste da documentação.
- **Credenciais de produção** > *Access Token* → troca na Netlify quando for
  vender de verdade, e redeploya.

### 4.2 Webhook (o aviso de pagamento)

Na aplicação > **Webhooks** > **Configurar notificações**:

- URL de produção: `https://<site>/api/mercadopago/webhook`
- Evento: **Pagamentos**
- Salvar e copiar a **assinatura secreta** → `MERCADOPAGO_WEBHOOK_SECRET`

Notificação sem assinatura válida volta 401 e é ignorada. O botão **Simular** da
mesma tela manda um aviso de teste — um 401 no log de funções da Netlify quer
dizer chave errada.

### 4.3 Parcelamento e juros

É configurado **na conta do dono**, não no código (Mercado Pago > Seu negócio >
Custos > Parcelamento). O número escolhido lá como "sem juros" tem que ser o
mesmo do campo **Parcelas sem juros** em /admin/config — a vitrine promete esse
número ao lado de cada preço.

### 4.4 Como o pedido anda

1. Cliente fecha o carrinho → `criar_pedido` cria o pedido e **reserva a peça**
   por `reserva_minutos` (config, 30 por padrão). Preço, frete e desconto do Pix
   saem do banco, nunca do navegador.
2. O site abre a tela do Mercado Pago. Escolheu Pix, só aparece Pix (senão dava
   pra levar o desconto e pagar no cartão). Boleto nunca aparece.
3. Pagou → o webhook relê o pagamento na API e chama `confirmar_pedido`: baixa
   o estoque, e o pedido aparece em /admin/pedidos como **Pago — separar**.
4. Não pagou no prazo → a função agendada `netlify/functions/liberar-reservas.mts`
   (de 10 em 10 minutos) devolve a peça pra vitrine.
5. Pagou DEPOIS do prazo e a peça já foi vendida → o pedido aparece no painel
   como **Pagou sem peça — estornar**. O estorno é feito pelo Mercado Pago.

---

## O que ainda NÃO está no ar

- **Chaves do Mercado Pago.** O checkout está construído e testado até a porta do
  Mercado Pago; falta a conta do dono (seção 4). Até lá o botão de pagar fica
  desligado.
- **Email de pedido novo pro dono.** Hoje ele vê o pedido no painel e recebe o
  aviso de venda do próprio app do Mercado Pago.
- **Domínio.** O site sobe no endereço `*.netlify.app`. O domínio é registrado
  no Registro.br **no CPF do dono** e apontado depois, em Domain management.

As fontes estão todas auto-hospedadas em `app/fontes/` e liberadas pra uso
comercial — ver o `LEIA-ME.md` de lá. A `hard-zone-demo.ttf` saiu de `public/`
(ia pro ar pela CLI de deploy) e está em `clientes/mo-visao/referencias/`, fora
do repo do site.

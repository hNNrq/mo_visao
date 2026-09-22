# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Quem compra — molecada de quebrada, 16 a 25 anos.** Chega pelo Instagram
(@mo_visao2k26) ou por busca no Google pelo nome do modelo ("óculos juliet").
Navega **pelo celular**, quase nunca no desktop. Valoriza o modelo que aparece no
rolê: quer ver como o óculos é, quanto custa e em quantas vezes dá pra pagar.
Preço importa, e parcelamento importa mais ainda.

**Quem administra — o dono, barbeiro.** Mexe no painel pelo celular, entre um
corte e outro. Não é técnico e não tem quem dê manutenção pra ele: cadastra
produto, sobe foto, muda preço e baixa estoque sozinho. Se uma tarefa do painel
for chata no celular, ela não está pronta.

## Product Purpose

Loja online onde o cliente compra sozinho, do começo ao fim — tirando o dono da
rotina de responder preço no direct um por um.

Sucesso é o dono operar a loja sem precisar do desenvolvedor, e a venda acontecer
sem ele estar online.

## Positioning

Loja de **óculos de rolê**, não de óculos de esporte. O recorte são os ícones de
rua da Oakley — **Juliet, Romeo, Penny** — e não a linha de performance. Foi uma
virada deliberada de posicionamento em setembro de 2026: a loja nasceu vendendo
corrida e rua, e passou a puxar pra rua.

## Operating Context

- O comprador quase sempre chega do Instagram, no celular, vindo de um post ou
  story — não de uma busca com intenção de compra madura.
- O dono atende hoje pelo direct. O site existe pra substituir essa conversa,
  não pra complementá-la.
- Entrega assumida como **retirada combinada ou entrega na região**. Envio pro
  Brasil todo é fase posterior.
- Custo fixo da operação é ~R$ 40/ano de domínio mais a taxa por venda. Não há
  orçamento de manutenção.

## Capabilities and Constraints

- **Vitrine:** catálogo, filtro por categoria (`corrida`/`rua`) e por `modelo`,
  página de produto com JSON-LD de preço e disponibilidade.
- **Painel do dono:** produtos, fotos, estoque, pedidos, configurações. Mobile-first.
- **Checkout é fase 4 e ainda não existe.** Decisão do Henrique (set/2026): a loja
  é construída **como se já vendesse** — carrinho, preço e botão de comprar no
  lugar — pra que ligar o checkout não mexa no design.
- **Dinheiro nunca passa pela Norman.dgt.** Gateway no CPF/CNPJ do dono, e todas
  as contas (domínio, hospedagem, Supabase, Mercado Pago) no nome dele.
- **Nunca afirmar procedência do produto.** A marca Oakley aparece como marca do
  produto, sem "original", "autêntico" ou "importado". Protege o dono e a
  Norman.dgt.
- **"Prizm" só quando o modelo for Prizm de fato.** Caso contrário, "lente de
  alto contraste".
- **Sem recorrência.** Nada no site pode depender de manutenção contínua.
- Estoque costuma ser de poucas unidades por modelo, então o carrinho reserva a
  peça enquanto o pagamento acontece.

## Brand Commitments

- **O nome é "Mó Visão", com acento agudo no Ó.** Vale pro site e pra qualquer
  material. O @ do Instagram segue sem acento (@mo_visao2k26) — é handle, não nome.
- **Preto e dourado**, pedido do dono da loja. Constraint dada, não derivada.
- **Nenhuma logo da Oakley no site** (decisão do Henrique, set/2026). A marca
  aparece só escrita, como marca do produto. A logo estilizada em
  `referencias/fontes-graffiti/` não entra.
- **Voz:** português do Brasil, comum e leve, concreta. Sem linguagem de guru de
  internet (promessa fácil, "escala", "mindset", urgência artificial) e sem
  jargão corporativo vazio. Dizer o que a pessoa leva, não adjetivo sobre a loja.
- **Assinatura da marca:** skew de -12° em título, botão e faixa — nunca em corpo
  de texto ou card de produto.

## Evidence on Hand

- **Fotos da hero:** três retratos de banco de imagem (Pexels) em
  `imagens-fonte/` — pessoas de preto usando óculos de armação metálica e lente
  espelhada, já fotografadas sobre fundo preto. Viram `public/trio-esq.jpg`,
  `trio-meio.jpg` e `trio-dir.jpg` por `npm run preparar-trio`.
  - ⚠️ **Licença de Pexels cobre o direito da FOTO, não o da PESSOA.** Os três
    rostos são identificáveis e não há model release. O Henrique foi avisado em
    set/2026 e escolheu seguir — fica registrado como risco aceito, não como
    ponto resolvido. Substituir por foto de cliente real com autorização escrita
    é o caminho que fecha isso e ainda vira prova social.
- **Foto de produto solta:** `public/hero-juliet-original.png` → recorte com alfa
  em `public/hero-juliet.png` (`npm run preparar-juliet`). Era a hero até
  set/2026; hoje **nenhum componente usa**.
- **Peças de Instagram já publicadas:** `../conteudo/` (carrosséis e legendas).
- **Referência visual dada pelo Henrique:** thugnine.com.br (streetwear BR), mais
  imagens de brand kit da Oakley em `../referencias/`.
- **Não existe ainda, e não pode ser inventado:** foto real de produto (as atuais
  são de referência da internet), depoimento de cliente, número de vendas,
  avaliação, tempo de mercado. A loja abriu em setembro de 2026.

## Product Principles

1. **O celular é a tela principal, não a adaptação.** Comprador e dono usam o
   site no telefone; o desktop é o caso secundário dos dois.
2. **Autonomia do dono acima de sofisticação.** Qualquer coisa que exija o
   desenvolvedor pra mudar é dívida, não recurso.
3. **O modelo é a unidade de desejo.** A pessoa não procura "óculos", procura
   "Juliet". Navegação, busca e conteúdo se organizam por modelo.
4. **Nunca afirmar o que não se pode provar.** Sem procedência, sem prova social
   inventada, sem número que ninguém mediu.
5. **Construir como se já vendesse.** O que falta é o gateway, não o desenho.

## Accessibility & Inclusion

- Público jovem em aparelho Android de entrada e rede móvel: peso de página e
  tempo até a primeira pintura são requisito de acesso, não otimização.
- Todo o conteúdo em português do Brasil.

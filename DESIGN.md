---
name: Mó Visão
description: A Prancha — catálogo de peças em negativo: o nome da loja com a peça recortada pousada por cima dele, chamada numerada a fio de ouro sobre o preto, cota e cartucho.
colors:
  ink: "#000000"
  paper: "#F2EDE3"
  gold: "#D3A62C"
  gold-deep: "#A47D16"
  smoke: "#8C8577"
  fio: "rgb(211 166 44 / 0.9)"
  fio-fraco: "rgb(211 166 44 / 0.58)"
  regua: "rgb(242 237 227 / 0.16)"
  sob: "#5C5749"
  steel: "#14161A"
typography:
  display:
    fontFamily: "Archivo Variable, Arial Narrow, system-ui, sans-serif"
    fontSize: "clamp(2.75rem, 10vw, 7rem)"
    fontWeight: 900
    lineHeight: 0.82
    letterSpacing: "-0.02em"
  display-cartucho:
    fontFamily: "Archivo Variable, Arial Narrow, system-ui, sans-serif"
    fontSize: "clamp(2.5rem, 12vw, 9rem)"
    fontWeight: 900
    lineHeight: 0.8
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Archivo Variable, Arial Narrow, system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Archivo Variable, Arial Narrow, system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 5vw, 3.25rem)"
    fontWeight: 900
    lineHeight: 0.92
    letterSpacing: "-0.015em"
  title-peca:
    fontFamily: "Archivo Variable, Arial Narrow, system-ui, sans-serif"
    fontSize: "clamp(1.25rem, 2vw, 1.75rem)"
    fontWeight: 900
    lineHeight: 0.95
    letterSpacing: "-0.015em"
  title-legenda:
    fontFamily: "Archivo Variable, Arial Narrow, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Barlow Condensed, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.375
    letterSpacing: "normal"
  body-largo:
    fontFamily: "Barlow Condensed, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 400
    lineHeight: 1.375
  body-miudo:
    fontFamily: "Barlow Condensed, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.375
  label:
    fontFamily: "Barlow Condensed, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "0.2em"
  label-nav:
    fontFamily: "Barlow Condensed, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.18em"
  dado:
    fontFamily: "Azeret Mono Variable, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1
    fontFeature: "tabular-nums"
    letterSpacing: "0"
  dado-grande:
    fontFamily: "Azeret Mono Variable, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1
    fontFeature: "tabular-nums"
  dado-medio:
    fontFamily: "Azeret Mono Variable, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1
    fontFeature: "tabular-nums"
  dado-miudo:
    fontFamily: "Azeret Mono Variable, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.2
    fontFeature: "tabular-nums"
  dado-parcela:
    fontFamily: "Azeret Mono Variable, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1
    fontFeature: "tabular-nums"
  chamada:
    fontFamily: "Azeret Mono Variable, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "13px"
    fontWeight: 700
    lineHeight: 1
    fontFeature: "tabular-nums"
  esticada:
    fontFamily: "Archivo Variable, Arial Narrow, system-ui, sans-serif"
    fontSize: "clamp(3.25rem, 18.5vw, 13rem)"
    fontWeight: 900
    lineHeight: 0.82
    letterSpacing: "calculado por Esticar, entre -0.04em e 0.16em"
    fontVariation: "'wght' 900, 'wdth' 62-125"
  painel-titulo:
    fontFamily: "Archivo Variable, Arial Narrow, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "-0.015em"
  painel-nome:
    fontFamily: "Archivo Variable, Arial Narrow, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 900
    lineHeight: 1.25
    letterSpacing: "-0.015em"
  painel-carimbo:
    fontFamily: "Archivo Variable, Arial Narrow, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "-0.015em"
rounded:
  none: "0px"
  chamada: "9999px"
spacing:
  margem-folha: "20px"
  margem-folha-larga: "40px"
  linha-legenda: "16px"
  linha-indice: "24px"
  linha-indice-larga: "32px"
  campo-cartucho: "20px"
  bloco: "40px"
  entre-celulas: "48px"
  secao: "64px"
  secao-larga: "96px"
  secao-maxima: "128px"
  linha-painel: "12px"
  bloco-painel: "28px"
components:
  botao-primario:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.ink}"
    typography: "{typography.body-largo}"
    rounded: "{rounded.none}"
    padding: "16px 32px"
  botao-primario-hover:
    backgroundColor: "{colors.gold-deep}"
    textColor: "{colors.ink}"
  chamada:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.gold}"
    typography: "{typography.chamada}"
    rounded: "{rounded.chamada}"
    size: "26px"
  chamada-ativa:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.ink}"
    rounded: "{rounded.chamada}"
  cota:
    backgroundColor: "transparent"
    textColor: "{colors.gold}"
    typography: "{typography.dado}"
    rounded: "{rounded.none}"
    padding: "0 0 0 16px"
  celula-moldura:
    backgroundColor: "transparent"
    textColor: "{colors.paper}"
    rounded: "{rounded.none}"
    padding: "20px"
  carimbo-esgotado:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.smoke}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "4px 8px"
  linha-indice:
    backgroundColor: "transparent"
    textColor: "{colors.paper}"
    rounded: "{rounded.none}"
    padding: "24px 0"
  linha-indice-hover:
    backgroundColor: "transparent"
    textColor: "{colors.gold}"
  campo-cartucho:
    backgroundColor: "transparent"
    textColor: "{colors.smoke}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "20px"
  header-link:
    backgroundColor: "transparent"
    textColor: "rgb(242 237 227 / 0.70)"
    typography: "{typography.label-nav}"
    rounded: "{rounded.none}"
    height: "44px"
  header-link-hover:
    textColor: "{colors.gold}"
  folha:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "16px"
  carimbo-preco:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "6px 12px"
  botao-na-folha:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.none}"
    padding: "8px 16px"
  botao-na-folha-hover:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.ink}"
  filtro-ativo:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "8px 16px"
  filtro-parado:
    backgroundColor: "rgb(242 237 227 / 0.10)"
    textColor: "{colors.paper}"
    rounded: "{rounded.none}"
    padding: "8px 16px"
  painel-campo:
    backgroundColor: "{colors.steel}"
    textColor: "{colors.paper}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "16px"
  painel-rotulo:
    backgroundColor: "transparent"
    textColor: "{colors.smoke}"
    typography: "{typography.label-nav}"
  painel-botao-primario:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.ink}"
    typography: "{typography.painel-carimbo}"
    rounded: "{rounded.none}"
    padding: "20px 32px"
  painel-botao-primario-hover:
    backgroundColor: "{colors.gold-deep}"
    textColor: "{colors.ink}"
  painel-botao-neutro:
    backgroundColor: "rgb(242 237 227 / 0.10)"
    textColor: "{colors.paper}"
    typography: "{typography.painel-carimbo}"
    rounded: "{rounded.none}"
    padding: "14px 24px"
  interruptor-ligado:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.painel-carimbo}"
    rounded: "{rounded.none}"
    padding: "6px 12px"
  interruptor-parado:
    backgroundColor: "rgb(242 237 227 / 0.08)"
    textColor: "rgb(242 237 227 / 0.55)"
    typography: "{typography.painel-carimbo}"
    rounded: "{rounded.none}"
    padding: "6px 12px"
  carimbo-ok:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "10px 16px"
---

# Design System: Mó Visão

## Overview

**Creative North Star: "A Prancha — o catálogo de peças da Juliet"**

A vitrine não é loja: é uma **folha de desenho técnico** em negativo. Fundo
preto, a peça desenhada a fio de ouro, chamadas numeradas ligadas por um fio até
a legenda, cota medindo o que o cliente quer medir (o preço) e um cartucho de
título fechando a folha no pé. A unidade de composição não é o card — é a
**linha numerada**. O que desenha aqui é a LINHA; preenchimento, sombra e
degradê não existem.

A razão do mundo é o objeto: a Juliet é uma peça **usinada**, falada por quem a
conhece em vocabulário de peça — armação, haste, borracha, ícone, parafuso.
Catálogo de peças não é fantasia técnica em cima do óculos; é o jeito como esse
objeto já é entendido. Por isso a página abre numa CHAPA com chamada numerada
em vez de um hero de campanha, e por isso a home se chama PRANCHA 01.

🔴 **A assinatura é a CHAMADA, não o desenho.** A primeira versão desta direção
abria com uma vista explodida desenhada à mão em SVG, e ela saiu em set/2026: o
traço não era reconhecível como Juliet — quem procura Juliet reconhece a peça
pela proporção da armação e pelo ícone da haste, e isso não sobrevive a um path
aproximado —, e era o único pedaço do site que exigia mão de designer pra mudar,
numa loja sem orçamento de manutenção. O que a direção pedia era o fio saindo da
peça até um número, e isso nunca dependeu de desenho: chamada numerada sobre
FOTO é o que catálogo de peça faz há um século, e é o que a própria Oakley faz
hoje na campanha de retorno da X-Metal, que é macro do objeto e vocabulário de
peça, sem foto de lifestyle. O desenho morreu; a chamada aponta pra uma peça
fotografada.

A forma é técnica, **a palavra é rua**. Essa tensão é a personalidade e é o
antídoto do risco desta direção (sair fria): as legendas falam como o dono fala
("Sai e entra. Troca a lente, troca o óculos."), nunca em prosa de engenharia.
O público é molecada de 16 a 25 anos, em Android de entrada e rede móvel — e
isso é material, não contexto: a prancha inteira são poucos KB de SVG em vez de
uma foto de centenas, e a interação de assinatura funciona no polegar e no
teclado porque é link, não hover.

🔴 **O sistema documenta TRÊS superfícies, e elas não se misturam.**
1. **A vitrine** (home + Header + Footer + célula de catálogo): mundo da PRANCHA.
2. **As páginas internas da loja** (`/produtos`, `/produtos/[slug]`, 404,
   `EmBreve`, `Galeria`, `Esticar`, `Muro`): ainda no mundo anterior
   (lambe-lambe). **Transitório** — é a próxima conversão.
3. **O painel do dono** (`app/admin/**`): mundo lambe-lambe em registro de
   trabalho, com contrato próprio. Fica como está.

**Key Characteristics:**
- Fio de ouro sobre preto: o que desenha é a linha, não o preenchimento
- O nome da loja empilhado com o recorte da peça pousado no meio dele como
  primeira imagem da loja, com uma chamada só
- Chamada numerada em balão redondo, e o número é link
- Duas faces de texto que nunca se misturam com a terceira: monoespaçada só para DADO
- Régua de 1px como única divisão — sem caixa, sem fundo próprio, sem canto arredondado
- Ângulo reto e diagonal de 45°: nada torto, nada colado, zero skew (com uma exceção pinada)
- Preço como COTA em coluna tabular, comparável descendo a página
- Estoque como GRAU, com rótulo e forma além da cor

## Colors

Uma tinta só sobre o preto, em três forças de fio mais o bloco. O papel deixou
de ser superfície e virou tinta de texto.

### Primary
- **Ouro de Desenho** (`{colors.gold}`): a tinta com que a peça é desenhada. Na
  vitrine ele aparece em **letra** — preço, parcela, número da chamada, nome em
  hover — porque está sempre sobre o muro preto (8.8:1). Em **bloco preenchido**
  aparece em dois lugares e só neles: a ação primária e a chamada ativa.
- **Ouro de Fundo** (`{colors.gold-deep}`): o hover da ação primária e a cor da
  barra de rolagem.
- **Fio** (`{colors.fio}`): o ouro a 90% — o traço da peça, a borda do balão de
  chamada e os tiques de canto da moldura de detalhe.
- **Fio Fraco** (`{colors.fio-fraco}`): o ouro a 58% — detalhe interno da peça,
  eixo de montagem tracejado, fio de chamada e a linha de cota.

### Neutral
- **Muro** (`{colors.ink}`): preto puro. Fundo de tudo na vitrine, letra sobre
  ouro, e o miolo opaco do balão de chamada (ele tapa o traço que passa atrás).
- **Papel** (`{colors.paper}`): agora é **letra**, não superfície. Título,
  manchete e nome de peça. Em opacidade 80/70/25% vira texto de apoio e
  separador miúdo.
- **Tinta Gasta** (`{colors.smoke}`): rótulo de campo, nota de legenda, meta do
  cartucho, "Catálogo completo →". É quente, puxada do papel: cinza azulado
  sobre preto leria como interface, não como impressão.
- **Régua** (`{colors.regua}`): papel a 16%. É a única divisão do sistema, e é
  **mais fraca que o fio de peça de propósito** — régua com a força do traço faz
  a grade competir com o desenho e o olho para de saber o que é estrutura e o
  que é peça.

### Neutral — mundos anteriores (não usar na vitrine)
- **Folha de Ontem** (`{colors.sob}`): o deslocamento sólido embaixo da `folha`.
  Vive nas páginas internas e no gerenciador de fotos do painel.
- **Aço** (`{colors.steel}`): superfície tocável do painel do dono — campo, barra
  de abas, vaga de foto. Nenhuma tela de loja abre superfície cinza.

### Named Rules
**A Regra da Linha.** O que desenha é a LINHA. Na vitrine não existe
preenchimento de peça, sombra, degradê, brilho nem vidro. Ouro em bloco tem dois
usos e são os dois que o build tem: ação primária e chamada ativa. Qualquer
terceiro bloco de ouro na vitrine é suspeito de ser badge de loja.

**A Regra da Régua mais Fraca.** `regua` (16%) nunca sobe pra força de `fio`
(90%). A estrutura é mais apagada que a peça; quem inverte isso transforma a
grade no assunto da folha.

**A Regra do Ouro em Bloco.** Sobre papel, ouro é bloco preenchido com letra
preta, nunca letra (`#D3A62C` sobre `#F2EDE3` dá 2.1:1). Sobre o muro preto vale
o inverso, e é o caso da vitrine inteira: ouro em letra tem ~8.8:1 e pode.

**A Regra do Texto sobre Ouro.** Texto sobre ouro é sempre `ink`, nunca branco —
branco sobre `#D3A62C` dá 2.3:1.

## Typography

**Display Font:** Archivo variável (`wght` 100–900 + `wdth` 62–125, SIL OFL),
com "Arial Narrow" e `system-ui` de reserva
**Body Font:** Barlow Condensed (400 e 500 — e só), com `system-ui` de reserva
**Data Font:** Azeret Mono variável (400–700 num arquivo só, 26 KB), com
`ui-monospace` de reserva
**Brand Font:** Clash Display 700 (ITF Free Font License, 14 KB) — **só o nome
da loja na abertura** (`--font-marca`), com a Archivo de reserva

🔴 **As quatro faces são AUTO-HOSPEDADAS** (`next/font/local`, `.woff2` em
`app/fontes/`), e isso não é preferência. Com `next/font/google` o build busca a
fonte na rede, e quando essa busca falha o Next **não estoura**: emite um
`@font-face` só de fallback (`src: local(Arial)`) e segue. Aconteceu em
set/2026 — os chunks saíram com zero `url()`, o site inteiro renderizou em Arial
peso 400, a `Esticar` mexeu num eixo que não existia e a manchete virou letra
espalhada. Nenhum erro, nenhum aviso, nenhum teste quebrado. Com o `.woff2` no
repositório o build não tem rede pra falhar.

⚠️ **A regra vale igual pra `<link>` de CDN.** A Clash Display chegou como um
`<link>` da Fontshare e foi baixada antes de entrar. Fonte nova segue sempre o
mesmo caminho: baixar o `.woff2`, salvar em `app/fontes/`, registrar com
`localFont` e anotar a licença em `app/fontes/LEIA-ME.md`.

**Duas fontes de manchete, e a exceção é nominal.** A regra da casa é que uma
gráfica de esquina não tem duas faces de manchete, e manchete de seção continua
toda na Archivo. A Clash entra num lugar só: **o nome da loja**. Ali não é
manchete, é marca — uma palavra, um lugar, e é o único texto do site que precisa
ler como logotipo. Ela também é o que devolveu o nome pra uma linha de texto
comum: tem Ó e Ã desenhados, e por isso acabou com o par Archivo + Vandalust, com
o til pousado por CSS e com o par `aria-hidden`/`sr-only` que consertava o nome
pro leitor de tela.

🔴 **A Vandalust (`--font-graffiti`) está ÓRFÃ e é de licença proibida.** "Free
for personal use", sem uso comercial sem licença paga. Enquanto montava o "VISÃO"
do nome, era o lugar mais exposto possível pra uma face com essa restrição. Ver
`app/fontes/LEIA-ME.md` antes de reintroduzir em qualquer lugar que venda.

**Character:** Archivo 900 em caixa alta é letreiro de folha: bloco sólido,
altura de maiúscula constante. Barlow Condensed é a nota de margem — lisa,
estreita, legível em corpo pequeno num aparelho de entrada. Azeret Mono é a
caneta do desenhista: quadrada, tabular, feita pra número ficar em coluna. Clash
Display 700 é o letreiro pintado da fachada — larga, de canto seco, feita pra ser
lida de longe e em caixa alta.

### Hierarchy
- **Display / Título da prancha** (Archivo 900, `clamp(2.75rem, 10vw, 7rem)`,
  entrelinha 0.82, `-0.02em`, caixa alta): o nome da loja no cartucho de topo da
  home. No cartucho do rodapé sobe pra `clamp(2.5rem, 12vw, 9rem)` com
  entrelinha 0.8.
- **Headline / Seção** (Archivo 900, `clamp(1.75rem, 3.5vw, 2.75rem)`, entrelinha
  1, caixa alta): "Índice de modelos", "Peças em estoque".
- **Title / Nome de modelo** (Archivo 900, `clamp(1.75rem, 5vw, 3.25rem)`,
  entrelinha 0.92, caixa alta): a linha do índice. Vai a ouro no hover da linha
  inteira.
- **Title / Nome de peça** (Archivo 900, `clamp(1.25rem, 2vw, 1.75rem)`,
  entrelinha 0.95, `text-balance`, caixa alta): o nome do produto na célula.
- **Legenda** (Archivo 900, `1.125rem`, entrelinha 1, caixa alta): o nome da peça
  na tabela de legenda da prancha.
- **Body** (Barlow Condensed 400, `1.125rem`, subindo a `1.25rem` a partir de
  640px, `leading-snug`): frase de abertura e nota de campo. Medida curta e
  declarada: 42ch na abertura, 46ch em texto de apoio, 30ch no cartucho.
- **Body miúdo** (Barlow Condensed 400, `1rem`): nota de legenda e texto de linha
  do índice.
- **Label** (Barlow Condensed, `0.75rem`, entreletra `0.18em`–`0.22em`, caixa
  alta): rótulo de campo do cartucho, "a partir de", "Legenda", "Esgotado",
  "sem foto" (`0.2em`), aviso de últimas peças.
- **Label de navegação** (Barlow Condensed 500, `0.875rem`, subindo a `1rem` a
  partir de 640px, entreletra `0.18em`, caixa alta): os links do header, a meta
  do cartucho de topo, "Catálogo completo →". Abaixo de 375px a entreletra cai
  pra `0.1em`.
- **Dado** (Azeret Mono 700, `tabular-nums`, entreletra 0): preço na cota
  (`1.125rem`, subindo a `1.25rem`/`1.5rem` conforme o lugar), parcela
  (`0.75rem`, peso 400) e os valores do cartucho (`0.875rem`, peso 400).
- **Chamada** (Azeret Mono 700, `13px` em unidade de usuário do SVG, tabular): o
  número dentro do balão. É medida de geometria do desenho, não degrau de CSS —
  `13px` de `viewBox` num balão de raio 13 escala junto com a folha.

A escala de rótulo foi **consolidada em dois degraus** nesta virada: `0.75rem`
para etiqueta e `0.875rem` para navegação. O mundo anterior tinha rótulo em
`0.875rem` e `1rem` com quatro entreletras diferentes; numa folha de desenho
existe letra miúda de rótulo e letra miúda de nota, e não seis.

### Named Rules
**A Regra da Monoespaçada só pra Dado.** Azeret Mono é **número**: chamada, cota,
preço, parcela, quantidade e valor de cartucho. Nunca navegação, nunca rótulo de
seção, nunca frase. Ela já esteve na nav e nos rótulos e a página lia como
datasheet — monoespaçada como fantasia de "técnico" é violação de piso de
acabamento, não estilo. Se aparecer um parágrafo nesta face, o motivo dela
deixou de existir.

**A Regra dos Dois Registros.** Archivo 900 caixa alta para **nome** (loja,
seção, modelo, peça, produto); Barlow Condensed para **frase e rótulo**; Azeret
Mono para **número**. Os três registros não se invadem.

**A Regra da Coluna Tabular.** Todo número que o olho compara descendo a página
leva `numeros` (`tabular-nums`, entreletra 0). Com largura proporcional as
colunas dançam de linha em linha e a coluna deixa de ser coluna — e o índice
existe exatamente pra responder "quanto custa cada um" sem caçar.

**A Regra da Face e do Corpo** (páginas internas). `Esticar` é dono da face, o
ponto de uso é dono do tamanho: toda chamada traz o seu `text-[...]` explícito.
O componente emite `font-weight` **junto** de `font-variation-settings`, de
propósito: `font-variation-settings` só fala com face variável, e se a fonte
cair, o peso ainda chega pela propriedade normal. Uma queda de fonte custa o
eixo de largura, não o peso.

**A Regra Sem Rótulo Acima do Título.** Nenhum título leva etiqueta pendurada em
cima ("ÍCONES DA RUA", "EM ESTOQUE"). O título aguenta sozinho.

## Layout

Uma medida só, de 390px a 1600px: o conteúdo mora dentro de `max-w-[1600px]`
centrado, com margem lateral de 20px que abre pra 40px a partir de 640px. Não há
segunda largura de contêiner na vitrine.

O ritmo vertical da folha: a prancha entra com 40px de topo (64px a partir de
640px) e fecha com 64px (96px); as seções seguintes abrem com 64px/96px e fecham
com 96px/128px. Linha de índice respira 24px (32px a partir de 640px), linha de
legenda 16px, campo de cartucho 20px, célula de catálogo 48px de vão vertical.
O `main` reserva 56px de topo para a faixa de utilidade fixa.

**A chapa NÃO sangra, e a hero é uma grade só.** A versão anterior da hero
sangrava porque era um desenho largo e baixo que, contido, virava uma faixa no
meio de muito preto. A chapa é alta: contida, ela já é o maior objeto da tela e
lê como folha colada numa prancha, que tem margem dos dois lados. Um negativo
lateral aqui custaria barra de rolagem horizontal a partir de 1600px.

A hero é **uma grade de quatro blocos**, e não duas composições duplicadas com
`hidden`/`lg:flex`: duplicar o par preço + botão duplicaria o preço. A ordem do
DOM é a ordem do CELULAR — nome, chapa, frase, ação — porque a pessoa chega de
um story e o que prende é a foto, não o parágrafo. No desktop cada bloco é
colocado por linha e coluna explícitas, em `auto 1fr auto`: o `1fr` vazio fica
no MEIO, o cartucho ancora em cima e frase + ação descem juntas pro pé, na mesma
linha do rodapé da chapa. Duas massas presas nas pontas com ar entre elas — que
é o que separa respiro de buraco.

**A grade é tabela, não calha de cards.** O índice é uma lista de linhas
separadas por régua, com a coluna de preço à direita. As peças em estoque saem
em **duas colunas** a partir de 640px, não três: a peça precisa de tamanho pra
ser lida como desenho, e o catálogo desta loja tem poucas linhas. A legenda da
prancha é uma tabela de 1 / 2 / 3 colunas (390 / 640 / 1024px) com régua entre
as células.

No **celular** a chapa fica logo abaixo do nome, e frase e ação caem depois
dela: a foto é o que prende quem chegou de um story. A legenda da chapa entra
junto, na dobra, e é ela — não o balão — que carrega o link.

Pontos de virada em uso: `374px` (aperto do header), `640px` (sm) e `1024px`
(lg, onde a folha deitada substitui a folha em pé).

O **painel do dono roda em outra medida**: `max-w-[900px]`, margem de 20px que
abre pra 32px, formulário parando em 640px (produto), 560px (ajustes) e 480px
(entrar e erro). Ritmo mais apertado: tela 28px/40px, linha de produto 12px
(16px a partir de 640px), bloco de pedido 24px. No celular o conteúdo reserva
`5rem + safe-area` embaixo pra barra de abas fixa.

**A Regra da Medida Única (vitrine).** Uma unidade de célula de 390px a 1600px.
Nenhum componente da loja ganha largura de contêiner própria.

**A Regra da Medida de Trabalho (painel).** O painel roda em 900px e o
formulário para em 560–640px. É a única regra que contraria a medida única, e
existe porque a vitrine é pra olhar e o painel é pra trabalhar.

## Elevation & Depth

Na vitrine **não existe elevação e não existe empilhamento**: existe **plano de
desenho**. Zero sombra, zero desfoque, zero deslocamento sólido. A profundidade
vem de três coisas, todas de desenho técnico:

- **Força de traço:** `traco` (1.25, ouro a 90%) é a peça; `traco-fraco` (1,
  ouro a 58%) é o detalhe interno, o eixo de montagem e o fio de chamada. Duas
  penas, não um degradê.
- **Opacidade de foco:** quando uma peça está ativa, as outras caem pra 35% (e a
  linha de legenda pra 40%) em 200ms. É o único "afastamento" do sistema.
- **Ordem de leitura no fio:** o balão de chamada é preenchido de `ink` pra tapar
  o traço que passa atrás dele. Nada mais se cobre.

### Shadow Vocabulary — mundos anteriores (não usar na vitrine)
- **Folha de baixo** (`box-shadow: 7px 8px 0 0 var(--color-sob)`): o cartaz de
  antes que sobrou por baixo. Páginas internas e fotos do painel.
- **Erro de registro** (`box-shadow: -2px 2px 0 0 var(--color-gold-deep)`): a
  segunda chapa fora de alinhamento, em bloco. Painel e páginas internas.
- **Erro de registro na manchete** (`text-shadow: -0.024em 0.024em 0
  var(--color-gold)`): o mesmo, em letra, medido em `em` pra desalinhar
  proporcional ao corpo. Só sobre o muro.

### Named Rules
**A Regra da Pena.** Todo traço de SVG carrega `vector-effect:
non-scaling-stroke`. Uma prancha que escala de 390px a 1600px engrossaria o fio
junto, e o que era hairline no celular viraria contorno gordo no desktop.
Espessura de pena não muda porque a folha é maior.

**A Regra do Desenho sem Sombra.** Na vitrine nenhuma superfície tem sombra,
desfoque, brilho ou degradê. Onde a versão anterior usaria `folha`, esta usa
régua e respiro.

## Shapes

Canto vivo em tudo, com **uma exceção deliberada**: o balão de chamada é
redondo (`border-radius: 9999px`, `aspect-ratio: 1`). O mundo anterior proibia
canto arredondado, e é exatamente por isso que o círculo marca a virada — balão
de chamada é redondo em toda prancha técnica que já existiu, e quadrado ele lê
como badge de loja, que é o que esta direção recusa.

O que separa um elemento do outro é **um fio de 1px** (`regua`) e o respiro:
nunca caixa com fundo próprio, nunca sombra, nunca canto. A moldura de detalhe
da célula de catálogo é a única borda fechada do sistema — e mesmo ela é marcada
por **tiques de canto** de 12px (traço 1.5) em vez de contorno grosso.

Os ângulos são retos e as diagonais são de **45°**: a hachura de peça esgotada
(padrão de linha de 9px girado 45°) é a mesma marca que um desenho usa pra
indicar seção. Nada torto, nada girado, nenhum `--giro`.

**A Regra do Chão da Chamada.** Tudo que a chamada desenha sobre a chapa fica
sobre a parte **escura** da foto. Não é composição, é contraste: ouro sobre o
papel da chapa dá 2.1:1 e some, e tinta preta sobre a silhueta dá preto no
preto. O fio e o balão vivem inteiros dentro da máscara escura do rosto, onde
ouro tem 8.8:1. Mexer nas coordenadas sem conferir isso apaga a assinatura da
direção sem quebrar teste nenhum.

**A Regra do Esquadro.** Na vitrine nada sai do esquadro: sem rotação, sem
`--giro`, sem folha torta. Diagonal só a 45°, e só como hachura.

## Components

### Buttons
- **Shape:** canto vivo (0px).
- **Primária (o bloco de ouro):** bloco `gold` com letra `ink`, Archivo 900 caixa
  alta `1.125rem` (`1.25rem` a partir de 640px), padding 32px/16px que abre pra
  40px/20px. Hover troca o fundo pra `gold-deep`. **É o único elemento inclinado
  da vitrine** (ver "O skew pinado").
- **Foco:** anel de 3px de ouro com 2px de afastamento, global. Na célula de
  catálogo o afastamento sobe pra 4px.

### Cards / Containers
Não existe card nesta vitrine — existe **célula de prancha**. A célula de
catálogo é: moldura de detalhe `4:3` fechada por régua de 1px com tiques de
canto em `fio`, a foto em `object-contain` com 20px de padding, e embaixo um fio
de régua separando o nome (à esquerda) da cota (à direita). Hover acende a
moldura em `gold` (300ms) e amplia a foto 3% (500ms). Sem fundo próprio, sem
sombra, sem canto.
- **A moldura existe por seguro:** as fotos que o dono sobe hoje são recorte com
  canal alfa (conferido no banco), e recorte flutua bem sobre o preto. Nada
  garante que a próxima venha recortada, e foto de marketplace com fundo branco
  solta no preto vira um retângulo aceso no meio da prancha. Dentro da moldura
  ela lê como inset nos dois casos.
- **Cota de preço:** à direita, alinhada à direita, fio de `fio-fraco` à esquerda
  (`cota`) e 16px de recuo, Azeret Mono 700 em `gold`, com a parcela em
  `0.75rem` `smoke` embaixo. O preço **não grita: ele se deixa comparar** — é o
  oposto do badge de desconto da categoria.
- **Estoque:** é **grau**. Até 3 peças, "últimas N" / "última peça" em rótulo de
  ouro. Zero peça: foto a 30%, hachura de 45° por cima e a etiqueta "Esgotado"
  em bloco `ink` com borda de régua no canto inferior.

### Navigation
Faixa de utilidade fixa no topo, **opaca e sempre visível**, fechada por um fio
de régua embaixo. Numa prancha a borda da folha não some quando você olha o
desenho: ela é a folha. Dois links à esquerda (Início / Catálogo), três da área
do cliente à direita (Carrinho / Pedidos / Conta) com ícone SVG inline + rótulo
que some abaixo de 640px. Rótulos em Barlow Condensed 500, caixa alta,
entreletra `0.18em`, `paper/70`, indo a ouro no hover. Alvo de toque mínimo de
44px em todos. Sem logo, sem barra de promoção, sem faixa de frete.

Os ícones são SVG inline de 18px, traço `1.5` que herda `currentColor` — nunca
fonte de ícone, nunca biblioteca, nunca glifo de texto.

Nem o nome da loja nem os modelos entram no header: o nome vive no cartucho, os
modelos são o ÍNDICE.

### A Abertura (componente de assinatura)
A hero: **três retratos lado a lado, sangrando de borda a borda**, e o nome da
loja pequeno na faixa preta embaixo deles. Virou em set/2026 e substituiu a
composição do nome empilhado com a Juliet recortada por cima.

**Por que gente, e não o produto.** A dúvida que trava quem compra óculos pela
internet é uma só: *como isso fica na minha cara*. Foto de produto solto não
responde, por melhor que seja o recorte — e sem referência de tamanho o objeto lê
como ícone, não como peça. Três rostos respondem antes de a pergunta ser feita e
ainda dão escala ao produto de graça. É também o padrão da categoria: marca de
rua abre com gente usando a peça, e quando abre com o objeto (Corteiz, Stüssy) é
porque quem chega já conhece a marca. Esta loja ainda não tem esse luxo.

As peças são `public/trio-esq.jpg`, `trio-meio.jpg` e `trio-dir.jpg`, saídas de
`npm run preparar-trio` a partir de `imagens-fonte/`.

- 🔴 **O alinhamento é do ARQUIVO, nunca do CSS.** O preparador nivela a linha
  dos olhos das três em 34% da altura e normaliza o óculos em 40% da largura. São
  as duas medidas que fazem uma fileira de retratos ler como uma peça só: cabeça
  fora do eixo denuncia a montagem antes de qualquer tratamento de cor, e o mesmo
  óculos aparecendo em tamanhos diferentes faz parecer três lojas. Por isso as
  três entram com a mesma classe, o mesmo `sizes` e o mesmo `object-position` — e
  por isso **trocar foto é mexer no script, não no componente**.
- 🔴 **Não existe véu, scrim nem degradê de CSS por cima da foto.** O que abre o
  lugar do nome é a QUEIMA que o preparador já imprimiu em cada arquivo: de 42%
  pra baixo a foto apaga, e de 70% pra baixo é `#000000` chapado. Escurecer foto
  com camada semitransparente por cima é iluminação — aqui quem escurece a foto é
  a própria foto, na chapa, antes de chegar no navegador.
- **A queima também apaga marca de terceiro.** A peça da direita tem logo HUGO
  BOSS no peito e a do meio tem letra na moletom. `QUEIMA_INICIO` é medido pra
  engolir os dois: mexer nele é reabrir os dois logos.
- **O nome é UMA LINHA de texto comum, em Clash Display 700, caixa alta.** Foi
  empilhado em duas até set/2026, porque as duas palavras estavam em faces
  diferentes (a Vandalust não tem Ó) e os glifos de graffiti pintam fora da caixa
  de avanço, derrubando a haste da V sobre o acento do Ó. A Clash tem os dois
  acentos desenhados e acabou com a divisão, com o til pousado por CSS e com o
  par `aria-hidden`/`sr-only`.
  - 🔴 **Esse par não pode voltar por hábito.** Ele existia pra consertar o nome
    pro leitor de tela, que recebia "VISAO" da montagem à mão. Agora o texto no
    DOM é "Mó Visão" e chega certo — um `aria-hidden` no `h1` hoje esconderia o
    nome da loja de quem ouve a página.
  - **A caixa alta é do `uppercase`, não do texto.** Conteúdo em caixa mista é o
    que leitor de tela e busca leem bem.
- **O nome não é mais a manchete — é assinatura.** Quem puxa o olho é o trio.
  Continua sendo o `<h1>` da home (é o nome da loja na página raiz, que é o que a
  busca espera ali), e corpo pequeno não muda o que o documento declara.
- ⚠️ **A margem negativa que sobe o nome mora no `h1`, não na `div`.** `em` é
  sempre o corpo do elemento que a declara: na `div` ela valeria 16px fixos e a
  subida descolaria do nome assim que o `clamp` mexesse no corpo.
- 🔴 **O que vem DEPOIS da Abertura precisa de `relative z-10`.** A margem
  negativa do nome arrasta frase e carimbo pra dentro da caixa do trio. Lá dentro
  o envelope do trio é `relative`, e elemento posicionado pinta por cima de
  elemento estático mesmo vindo antes no documento — sem o `z-10` o texto fica no
  DOM, com caixa, cor e tamanho certos, e simplesmente não aparece na tela.
- **No celular só entra a do meio.** Três colunas em 390px dão 130px por foto, e
  retrato vertical cortado a 130px vira tira de ombro: some o rosto, que é a única
  coisa que a peça tem pra dizer. O trio é composição de tela larga.
- **O corte de altura come por BAIXO** (`object-top`). Embaixo é queima, que é
  preto chapado e não custa nada perder; no meio estão os rostos.
- 🔴 **A abertura não tem link.** A ação primária do primeiro quadro é o carimbo
  "Ver o catálogo", e ele não divide o quadro com ninguém. A chamada numerada
  continua viva no Índice, numerando os modelos.

**A composição anterior** (nome empilhado, Juliet recortada pousada entre as duas
linhas, mordida assimétrica pra não comer o til do Ã) saiu inteira. O recorte
`public/hero-juliet.png` e o `npm run preparar-juliet` seguem no repo, mas
**nenhum componente os usa**.

### O Índice (componente de assinatura)
Titulado **"Os mais falados"** na página — a estrutura é de índice, a etiqueta é
de conversa. Os modelos como linhas numeradas: chamada (`01`, `02`, `03`), nome em Archivo
900, frase de apoio em Barlow, e a **cota de preço à direita**. Fio de régua
entre as linhas, nada mais. Hover acende a chamada em bloco de ouro e o nome em
ouro.

**Modelo sem peça não vira link morto.** Quando não há preço, a linha não some e
não ganha número inventado: mostra "sem peça agora" e aponta pro Instagram, que
é onde a loja de fato avisa quando entra. Nove links levando a catálogo vazio foi
o defeito mais caro da versão anterior.

### O Cartucho (componente de assinatura)
O rodapé é o **bloco de título** da folha: o nome da loja em corpo de cartaz e,
abaixo, campos regrados — cada um com rótulo miúdo em cima e valor embaixo
(Como comprar, Modelos, A loja, Contato). A última fileira é uma linha só, em
face de dado: **Feito por Norman.dgt · ano**.

O bloco de identificação do desenho (Folha · Escala · Data · Desenho) saiu em
set/2026, a pedido do Henrique. Eram quatro campos que ninguém lê numa loja, e
três não diziam nada sobre ela. O campo **Como comprar** tomou o lugar do antigo
campo *Título*, que descrevia a loja pra quem já estava dentro dela — enquanto o
checkout não abre, o que falta ali é o caminho, não o resumo.

**Só o que é verdade entra.** Sem selo de compra segura, sem bandeira de cartão,
sem "desde 19xx", sem contador de clientes. Num cartucho cada campo é uma
declaração.

### Superfícies do navegador
Seleção (fundo ouro, letra preta), cursor de texto (ouro), anel de foco (3px de
ouro, 2px de afastamento) e barra de rolagem (`gold-deep` sobre `ink`, fina) são
tematizados. O que o navegador desenha sozinho também é a folha.

### O skew pinado (tensão aberta)
O `PRODUCT.md` registra o skew de -12° como assinatura da marca ("título, botão
e faixa"). **Este mundo é ortogonal e o compromisso contradiz sua gramática.** Na
virada ele sobreviveu **pinado num lugar só**: o bloco de ação primária da home,
onde lê como carimbo aplicado por cima da folha. Isso é uma **tensão em aberto**,
não uma decisão fechada: ou o `PRODUCT.md` reescreve a assinatura para a
gramática nova, ou o skew sai. Enquanto não se decide, **não espalhar**: nenhum
segundo elemento da vitrine ganha skew.

### Páginas internas da loja (transitório — mundo anterior)
`/produtos`, `/produtos/[slug]`, 404, `EmBreve`, `Galeria`, `Esticar` e `Muro`
continuam no mundo lambe-lambe: folha de papel torta com `--giro`, carimbo de
ouro com erro de registro, manchete esticada até a margem, muro de nomes
repetidos ao fundo. **Documentado como estado de transição, não como sistema a
estender.** É a próxima conversão. Tela nova da vitrine não nasce nesse
vocabulário.

### Painel do dono (mundo anterior, contrato próprio)
O painel é o mesmo cartaz em registro de trabalho: o **quadro de preços do
balcão** — lista de linhas separadas por fio de `paper/10`, nome de um lado e a
coluna de ouro dos preços do outro, editável na própria linha. Ele recusa o
arranjo padrão da categoria (cartão por registro, tabela que rola pro lado, faixa
de métricas, modal por edição) pelo mesmo motivo que a loja recusa o card.

- **Ouro escasso.** Em bloco: preço, ação primária da tela, aba ligada, pedido
  `pago`, carimbo de "salvo" e capa da foto — e nada além. Apagar, cancelar e
  voltar são bloco de papel a 10% ou letra miúda gasta. Em letra, ouro é dado uma
  vez só: o **total do pedido**.
- **Ligado é papel.** Interruptor ligado e opção escolhida são bloco de papel com
  letra `ink`; parado é papel a 8% com letra `paper/55` (20% no hover). Estado em
  `role="switch"` + `aria-checked`, não só na cor. Dois carimbos de ouro por linha
  enchiam o quadro de dourado e enterravam a coluna de preço, que é a tese da
  tela.
- **Aço onde a mão toca.** `steel` vale em três lugares: campo de formulário,
  barra de abas e vaga de subir foto. Nunca fundo de leitura.
- **Escala fixa em `rem`**, sem `Esticar` e sem `clamp()`; rótulo e meta em Barlow
  Condensed, nunca na face de manchete.
- **Sem caixa:** o que separa registro de registro é um fio só. Raio 0 em campo,
  interruptor, aba, carimbo e miniatura. Tela vazia sem moldura tracejada.
- **Erro tem marca, não só cor:** letra de papel com um risco inclinado de ouro
  (6px×16px) na frente, `aria-hidden`, com o texto em `role="alert"` no ponto de
  uso. Acerto é carimbo de ouro ("Salvo", "Ajustes salvos").
- **Destrutivo mora na tela do produto**, confirma no lugar do botão, sem modal, e
  **não é carimbo de ouro**.
- **O muro só onde não há mais nada:** hero do mundo antigo e tela de entrar.
  Nunca atrás de lista de dados — são 30 nós de texto que o Android de entrada do
  público não devolve.
- **O painel não acrescentou nenhuma regra nova ao `globals.css`**, e esse é o
  teste mais barato de que ele é o mesmo mundo e não um tema paralelo.

## Do's and Don'ts

### Do:
- **Do** desenhar com a LINHA: `traco` (1.25, `fio`) para a peça, `traco-fraco`
  (1, `fio-fraco`) para detalhe, eixo e fio de chamada.
- **Do** pôr `vector-effect: non-scaling-stroke` em todo traço de SVG.
- **Do** definir toda peça nova em torno da origem (0,0) e posicionar com
  `translate`; espelhar com `scale(-1 1)`.
- **Do** usar uma escala só para todas as peças de uma mesma composição.
- **Do** fazer da chamada um link focável, com alvo de toque maior que o balão.
- **Do** separar com um fio de `regua` de 1px e respiro — nunca com caixa.
- **Do** usar `numeros` (`tabular-nums`) em todo preço, parcela e contagem, na
  face de dado.
- **Do** tratar estoque como grau: "últimas N" antes de "esgotado", sempre com
  rótulo escrito e forma própria (hachura de 45°) além da cor.
- **Do** manter a moldura de detalhe em volta da foto de produto, mesmo com
  recorte alfa, porque a próxima foto pode vir de fundo branco.
- **Do** recompor o celular como segunda folha autoral, não como desktop
  refluído.
- **Do** manter uma medida só na vitrine (`max-w-[1600px]`, margem 20/40px) e a
  medida de trabalho no painel (900px, formulário em 560–640px).
- **Do** manter as três faces auto-hospedadas por `next/font/local`.
- **Do** desenhar ícone como SVG inline que herda `currentColor`.

### Don't:
- **Don't** usar `folha`, `carimbo`, `registro`, `muro` ou `colada` na vitrine —
  são primitivas do mundo anterior, vivas só para o painel e as páginas internas.
  Folha torta dentro de prancha técnica entrega que a página foi remendada.
- **Don't** usar sombra, desfoque, degradê, brilho ou vidro em nenhuma superfície
  da vitrine.
- **Don't** girar nada na vitrine (`--giro`, rotação livre): ângulo reto e
  diagonal de 45°, e só.
- **Don't** espalhar o skew de -12° além do bloco de ação primária enquanto a
  tensão com o `PRODUCT.md` estiver aberta.
- **Don't** usar a face monoespaçada em navegação, rótulo de seção ou frase: ela
  é DADO.
- **Don't** escrever texto em ouro sobre papel (2.1:1) nem texto branco sobre
  ouro (2.3:1).
- **Don't** dar a `regua` a mesma força do `fio` — estrutura não compete com
  peça.
- **Don't** trazer de volta o vocabulário da categoria: carrossel de banner,
  barra de frete com emoji, badge de "-25%", preço riscado, selo de compra
  segura, grade de cards iguais, hero de campanha.
- **Don't** pôr rótulo/etiqueta acima de um título.
- **Don't** fechar a célula de catálogo em caixa com fundo próprio ou canto
  arredondado; o único raio do sistema é o balão de chamada.
- **Don't** afirmar procedência em nome de peça, e não pôr no cartucho nada que
  não seja verdade.
- **Don't** apontar linha de índice sem preço para uma página de catálogo vazia.
- **Don't** carimbar de ouro, no painel, o que não é preço, ação primária, aba
  ligada, pedido `pago`, confirmação de salvo ou capa da foto — em especial nunca
  o botão que apaga.
- **Don't** estender as páginas internas no vocabulário lambe-lambe: elas estão
  em transição, não em manutenção.

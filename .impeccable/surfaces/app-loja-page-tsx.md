---
version: 1
slug: "app-loja-page-tsx"
primary_target: "app/(loja)/page.tsx"
related_targets: ["componentes/Chapa.tsx","componentes/Indice.tsx","componentes/Header.tsx","componentes/Footer.tsx","componentes/CardProduto.tsx","app/globals.css"]
---

## Direction contract

THESIS: A Juliet é uma peça USINADA, e a loja é o catálogo de peças dela. A página
é uma prancha técnica: vista explodida, chamada numerada, cota e legenda. Recusa
o arranjo que a categoria inteira entrega pronto — barra de frete grátis com
emoji, carrossel de banner, badge de "-25%", preço riscado, selo de compra segura,
grade de cards iguais — e recusa também o hero de campanha. A unidade não é o card:
é a LINHA NUMERADA da prancha.

OWN-WORLD: Prancha em negativo — fundo `#000000`, traço e chamada em ouro
`#D3A62C`, régua e cota em hairline de 1px. Sem preenchimento, sem sombra, sem
degradê: o que desenha é a LINHA. Tipo em dois registros que nunca se misturam —
Archivo 900 caixa alta para nome de peça e título de prancha, e uma face
monoespaçada tabular para tudo que é número (chamada, cota, preço, estoque),
alinhada em coluna. Ângulos retos e diagonais de 45° apenas: nada torto, nada
colado, zero skew. A foto do produto (recorte com alfa, confirmado no banco) flutua
na prancha sem caixa; quando o recorte falhar, a moldura de detalhe regrada a
segura como inset de manual. A assinatura é a LINHA DE CHAMADA: um fio de ouro
saindo da peça até um número, e o número é link.

STORY: A pessoa entende em um viewport que isso é uma loja de Juliet/Romeo/Penny,
lê o preço de cada uma numa coluna alinhada sem caçar card, e entra no catálogo —
sem pedir no direct.

FIRST VIEWPORT: Faixa de utilidade regrada no topo com a navegação em corpo
pequeno. Abaixo, a PRANCHA 01 sangrando: uma Juliet desenhada em hairline de ouro
sobre o preto, explodida no eixo horizontal — haste, lente, armação, ícone,
parafuso — com chamadas numeradas 01–06 e fios de chamada correndo até a margem
direita. À direita, o bloco de legenda da prancha: as peças listadas em linha
regrada, e embaixo dele a ação primária em bloco de ouro. No pé da prancha, o
cartucho de título (nome da loja, número da prancha, data) como um desenho técnico
assina. Ação primária no canto inferior direito da prancha.

FORM: Catálogo de peças / vista explodida. Candidato 1 da minha lista ordenada por
ressonância — entrou como IMPECCABLE'S PICK e o usuário o escolheu contra a direção
sorteada (índice 6, "O Print"). Seed `e2962436`. Build code-led.

RAISES herdadas dos challengers recusados, que valem nesta direção: estoque como
GRAU e não carimbo binário, "última peça" legível antes de virar esgotado
(Six-Pack); todo estado carrega rótulo e forma, nunca só cor (Cyclorama); o celular
é uma segunda composição autoral e não o desktop refluído (Ikebana); coluna
numérica tabular alinhada descendo a página (Datamatics); chapa numerada com
legenda regrada no pé (Plate Book).

RISCO ASSUMIDO: sair FRIA. Catálogo técnico é a leitura mais óbvia de um produto
usinado, e o público é molecada de 16 a 25 que chega de um story — não engenheiro.
O antídoto não é amaciar o sistema: é escala de cartaz na vista explodida, ouro
como tinta e não como detalhe, e a voz do dono nas legendas. A FORMA é técnica, a
PALAVRA é rua; essa tensão é a personalidade. Se as legendas saírem em prosa de
engenharia, a direção falhou.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Emenda — set/2026: a vista explodida saiu, a chamada ficou

Pedido do Henrique, depois de ver a direção construída. O contrato acima NÃO foi
reaberto: THESIS, OWN-WORLD e STORY continuam valendo palavra por palavra. O que
mudou foi o FIRST VIEWPORT, e por duas razões que o contrato não tinha como
prever antes do build:

1. **O desenho não lia como Juliet.** Quem procura Juliet reconhece a peça pela
   proporção da armação e pelo ícone da haste; um path aproximado devolve
   "um óculos qualquer". A prancha prometia catálogo de peças e entregava
   ilustração genérica — o RISCO ASSUMIDO (sair fria) se realizou pelo desenho,
   não pelo sistema.
2. **Era o único pedaço do site que exigia mão de designer pra mudar.** 450
   linhas de geometria à mão numa loja sem orçamento de manutenção
   (`PRODUCT.md`), que é dívida contra o princípio de autonomia do dono.

A assinatura da direção — "um fio de ouro saindo da peça até um número" —
nunca dependeu de desenho. O FIRST VIEWPORT hoje é a CHAPA: a foto do rei de
coroa de arame em retícula de meio-tom a 45°, com UMA chamada ligando a Juliet à
linha de legenda, que é quem carrega o link. Chamada numerada sobre foto é o que
catálogo de peça faz há um século, e é o que a própria Oakley faz na campanha de
retorno da X-Metal: macro do objeto e vocabulário de peça, sem lifestyle.

O antídoto do risco também sobreviveu, e ficou mais forte: "escala de cartaz"
agora é uma foto que ocupa a coluna inteira, e o ouro continua sendo tinta — a
lente e o dente da foto saem na MESMA tinta `#D3A62C` da chamada e do preço,
porque o script gira o matiz do dourado da foto pro dourado da marca.

Sistema completo no `DESIGN.md` ("A Chapa"). Componente em
`componentes/Chapa.tsx`; `componentes/Prancha.tsx` foi apagado.

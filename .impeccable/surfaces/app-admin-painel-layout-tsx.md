---
version: 1
slug: "app-admin-painel-layout-tsx"
primary_target: "app/admin/(painel)/layout.tsx"
related_targets: ["app/admin/(painel)/produtos/page.tsx","app/admin/(painel)/pedidos/page.tsx","app/admin/(painel)/config/page.tsx","app/admin/entrar/page.tsx","componentes/admin/ListaProdutos.tsx","componentes/admin/ListaPedidos.tsx","componentes/admin/FormProduto.tsx","componentes/admin/FormConfig.tsx","componentes/admin/GerenciadorFotos.tsx","componentes/admin/FormLogin.tsx","componentes/admin/SemAcesso.tsx","componentes/admin/Aviso.tsx","componentes/admin/campos.ts"]
---

## Direction contract

THESIS: O painel do dono é o QUADRO DE PREÇOS do balcão, não um dashboard. Uma
coluna de nomes de um lado, a coluna de ouro dos preços do outro, e o que muda
toda semana — preço e quantidade — se edita na própria linha. Recusa o arranjo
padrão da categoria: cartão por registro, tabela de colunas que rola pro lado,
faixa de métricas no topo e modal pra cada edição.

OWN-WORLD: O mesmo sistema da vitrine, em registro de trabalho. Muro `#000000`
como fundo da lista, `steel` `#14161A` só onde uma superfície precisa se separar
do fundo pra ser tocável, ouro `#D3A62C` como BLOCO carimbado, nunca como
letra sobre papel. O ouro é escasso de propósito: em bloco ele é preço, ação
primária, aba ligada e pedido que pede providência — e mais nada. Em LETRA ele
aparece uma única vez no painel, no total do pedido, sobre o muro preto, onde
tem 8.8:1; é a exceção que o DESIGN.md já permite, e não vale em mais lugar
nenhum. Interruptor ligado e opção
escolhida são bloco de PAPEL com letra preta, porque numa loja em ordem quase
todo produto está na loja e vários estão em destaque, e dois carimbos de ouro
por linha enterravam a coluna de preço. Zero canto arredondado, zero borda de
caixa, zero sombra difusa; linha separada de linha por um fio de `paper/10`.
Archivo 900 fica em nome, número e ação; Barlow Condensed carrega rótulo e
corpo. O skew de -12° só em carimbo e botão. A folha de papel de verdade —
torta, com a folha de ontem deslocada por baixo — aparece uma vez no painel, nas
fotos da tela do produto; na lista a foto é papel chapado de 40px, porque giro e
sombra sólida repetidos quebram o ritmo da coluna. O muro entra só na tela de
entrar, que não tem lista: são 30 nós de texto que um catálogo não devolve.

STORY: Entre um corte e outro, o dono abre o painel no celular, vê em uma tela
quanto cada óculos custa e quantos restam, corrige um preço ou baixa um estoque
com dois toques, e fecha. Se entrou pedido, ele descobre no mesmo gesto.

FIRST VIEWPORT (390px): barra de identidade fina no topo (Mó Visão, ver a loja,
sair), com alvo de polegar em cada item e "sair" mais apagado que os outros.
Abaixo, o título da tela e a contagem viva em letra miúda, com a ação primária
"+ novo" carimbada à direita — que abaixo de ~420px cai pra linha própria, e
tudo bem: ali ela vira alvo largo em vez de alvo apertado. Daí pra baixo, a
lista: linha de duas fileiras com miniatura de 40px sobre papel; em cima, nome
em caixa alta (até duas linhas, nunca reticências) e estado em letra miúda
gasta, com o preço carimbado alinhado à direita — a coluna de ouro que desce a
tela; embaixo, quantidade em números tabulares e os dois interruptores. Duas
fileiras e não uma, e ~92px de linha e não 56px: com preço, quantidade e dois
interruptores editáveis no lugar, uma fileira só não cabe em 350px de largura
útil sem virar ícone que o dono não lê. Navegação fixa no pé, na altura do
polegar, com respiro pra faixa de gesto do aparelho.

MEDIDA: o painel roda em 900px, não nos 1600px da vitrine, e formulário para em
560–640px. Lista de cinco elementos esticada até 1600px é olho indo e voltando,
e campo de telefone com 900px de largura é campo mentindo sobre o que cabe nele.
É a única regra do painel que contraria o "uma medida só" do DESIGN.md, e existe
porque a vitrine é pra olhar e o painel é pra trabalhar.

FORM: Quadro de preços — candidato 4 da minha lista ordenada por ressonância,
tirado pelo dado junto da pilha de fichas (6, líder) e da folha do produto (3),
e escolhido pelo Henrique. Seed `4fbc3b7a`, escopo surface, modo operate,
build code-led.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

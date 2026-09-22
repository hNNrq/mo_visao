# As fontes do Mó Visão

Todas as faces deste site são **auto-hospedadas**: o arquivo mora aqui e entra no
repositório, e o carregamento é sempre `next/font/local`.

🔴 **Nunca trocar isso por `next/font/google`, por `<link>` de CDN ou por
`@import` de fonte.** Fonte buscada na rede já quebrou este site em silêncio uma
vez (set/2026): a busca do `next/font/google` falhou no build, o Next não
estourou, emitiu um `@font-face` só de fallback (`src: local(Arial)`) e seguiu. O
site inteiro renderizou em Arial peso 400, a manchete virou letra espalhada, e
não houve erro, aviso nem teste quebrado. Os chunks do compile anterior no
`.next` ainda tinham a fonte certa, então o bug parecia intermitente.

A mesma regra pegou a Hard Zone, a face de graffiti anterior: o `.ttf` dela ficava
no `.gitignore`, então o localhost mostrava uma fonte que o deploy nunca mostraria.

Quando chegar uma fonte nova — inclusive quando alguém passar um `<link>` pronto
de CDN — o caminho é: baixar o `.woff2`, salvar aqui, registrar em
`app/layout.tsx` com `localFont`, e anotar a licença nesta tabela.

## O que tem aqui

| Arquivo | Face | Onde entra | Licença | Uso comercial |
|---|---|---|---|---|
| `archivo-latin-var.woff2` | Archivo (variável, eixo `wdth`) | manchete de seção, `--font-display` | SIL OFL 1.1 | ✅ livre |
| `barlow-condensed-400-latin.woff2`<br>`barlow-condensed-500-latin.woff2` | Barlow Condensed | corpo e letra miúda, `--font-sans` | SIL OFL 1.1 | ✅ livre |
| `azeret-mono-latin-var.woff2` | Azeret Mono (variável 400–700) | dado: chamada, cota, preço, `--font-mono` | SIL OFL 1.1 | ✅ livre |
| `clash-display-700.woff2` | Clash Display 700 | **o nome da loja na abertura**, `--font-marca` | ITF Free Font License | ✅ livre |
| `vandalust.ttf` | Vandalust Graffiti | **nada, hoje** — `--font-graffiti` está órfã | Cikareotype Studio | 🔴 **PROIBIDO** |

## 🔴 A Vandalust

Vandalust Graffiti, do Cikareotype Studio, é **free for personal use**. O autor
proíbe uso comercial sem licença paga (cikareotype.com/license).

Ela montava o "VISÃO" do nome da loja até set/2026 — que era o lugar mais exposto
possível pra uma fonte com essa restrição. **A Clash Display tomou o lugar dela e
a abertura saiu de baixo do problema.** Hoje `--font-graffiti` não é usada por
nenhum componente.

O arquivo continua aqui de propósito, porque a face pode voltar em peça de
Instagram ou em página interna. Se voltar **pra qualquer coisa que venda**, a
licença tem que ser comprada ANTES.

## Por que a Clash Display é a exceção à "uma fonte de manchete só"

O `DESIGN.md` diz que uma gráfica de esquina não tem duas fontes de manchete, e
manchete de seção continua toda na Archivo. A Clash entra num lugar só: **o nome
da loja**. Ali não é manchete, é marca — uma palavra, um lugar, e é o único texto
do site que precisa ler como logotipo.

Ela também resolveu dois defeitos de uma vez:

- **Tem os acentos.** Ó, Ã, Á, À, Â, Ç, É, Ê, Í, Õ, Ú desenhados. A Vandalust não
  tem glifo acentuado nenhum, e por isso o til do Ã precisava ser pousado por CSS
  (a utilitária `til`, no `globals.css`) e o "Mó" precisava sair em Archivo.
- **Cabe numa linha.** O nome era empilhado em duas porque as duas palavras
  estavam em faces diferentes e os glifos de graffiti pintam fora da caixa de
  avanço, derrubando a haste da V sobre o acento do Ó.

Com ela, o `<h1>` da home voltou a ser uma linha de texto comum — sem montagem,
sem `aria-hidden`, sem `sr-only`. ⚠️ **E é por isso que esse par não pode voltar
por hábito:** com o texto correto no DOM, um `aria-hidden` no `h1` esconderia o
nome da loja de quem ouve a página.

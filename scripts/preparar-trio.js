/**
 * Prepara o TRIO da abertura — três retratos que entram lado a lado no muro.
 *
 * Irmão do `preparar-recorte.js`, e resolve o problema oposto. Lá a foto já vinha
 * com alfa e o trabalho era não encostar no fundo. Aqui as três fotos vêm de
 * banco de imagem, com fundo preto FOTOGRÁFICO — que é preto de câmera, com
 * degradê e ruído, e não o `#000000` do muro. Coladas cruas uma ao lado da outra,
 * cada uma aparece como um retângulo cinza-escuro ligeiramente diferente do
 * vizinho, e a hero inteira lê como três fotos coladas. Que é o que ela é, e
 * justamente o que não pode aparecer.
 *
 * ## As três coisas que fazem o trio ler como UMA peça
 *
 * 1. **A LINHA DOS OLHOS é a mesma nas três.** É a única medida que importa
 *    numa fileira de retratos: o olho varre a horizontal e qualquer cabeça fora
 *    do eixo denuncia a montagem antes de qualquer tratamento de cor. Por isso o
 *    enquadramento não é escrito em coordenada de corte — é derivado da posição
 *    do óculos em cada foto (`PECAS[].oculos`), e o corte sai daí.
 *
 * 2. **O ÓCULOS tem o mesmo tamanho nas três.** É o produto, e é o mesmo objeto
 *    nas três fotos: se ele aparece grande numa e pequeno na outra, o trio lê
 *    como três fotos de três lojas. A escala de cada foto sai de `ALVO_LARGURA`,
 *    e não de um `object-fit` no CSS — normalizar no arquivo é o que permite as
 *    três entrarem com a mesma classe e o mesmo `sizes`.
 *
 *    ⚠️ É por isso que a peça mais AFASTADA manda no enquadramento das outras.
 *    A `meio` já tem o óculos ocupando 40% da largura dela; puxar as três pra
 *    mais perto do que isso exigiria inventar pixel que a foto não tem.
 *
 * 3. **O PRETO é estourado até `#000000` de verdade.** `LIMIAR` é o ponto abaixo
 *    do qual tudo vira muro. Sem isso não existe emenda invisível: o degradê de
 *    estúdio de cada foto continua visível e desenha a costura entre elas.
 *
 * ## O que o corte fora da borda faz — e por que ele é de graça
 *
 * A caixa de corte ideal quase nunca cabe dentro da foto (a `meio` pede 20px à
 * esquerda que não existem, a `dir` pede 50px embaixo). Em foto comum isso
 * obrigaria a ceder no enquadramento. Aqui não: o que falta é preenchido com
 * `#000000`, e como o fundo JÁ vai virar `#000000` no passo do limiar, a
 * extensão é invisível. O alinhamento vence a borda, sempre.
 *
 * ## A queima de baixo, que não é só estética
 *
 * O terço de baixo apaga num degradê até o preto. Ela faz três serviços de uma
 * vez, e o terceiro é o que a torna obrigatória:
 *
 * - **Costura o trio ao muro.** Sem ela as três fotos terminam numa linha reta
 *   atravessando a página, e a hero vira um banner com borda inferior.
 * - **Abre o lugar do nome.** O `Nome` pousa nessa faixa, sobre preto chapado —
 *   sem véu, sem scrim, sem degradê aplicado por CSS por cima da foto. O que
 *   escurece a foto é a própria foto.
 * - 🔴 **Apaga marca de terceiro.** A peça da direita tem um logo HUGO BOSS no
 *   peito e a do meio tem letra na moletom. Marca de outra empresa num site
 *   comercial é problema do mesmo naipe do que a regra do projeto já trata em
 *   "nunca afirmar procedência": aqui a loja vende óculos, e vestir o modelo com
 *   a marca de outro é dar palco que não é dela. `QUEIMA_INICIO` é medido pra
 *   engolir os dois — mexer nele é reabrir os dois logos.
 *
 * uso: node scripts/preparar-trio.js
 */
const sharp = require("sharp");
const path = require("path");

/** A saída, em pixels. 2:3, que é o formato nativo das três. */
const LARGURA = 1200;
const ALTURA = 1800;

/** O óculos ocupa esta fração da largura da saída, nas três. */
const ALVO_LARGURA = 0.4;

/** A linha dos olhos pousa nesta fração da altura, nas três. */
const ALVO_OLHO = 0.34;

/** Abaixo disto o pixel é muro. É o que mata o preto de estúdio. */
const LIMIAR = 42;

/** Onde a queima de baixo começa e onde ela fecha, em fração da altura. */
const QUEIMA_INICIO = 0.42;
const QUEIMA_FIM = 0.7;

/**
 * A caixa do ÓCULOS em cada foto, em pixels da foto original.
 *
 * ⚠️ Medida à mão contra estas três fotos. Foto nova exige remedir — é a única
 * entrada do script, e tudo (escala, corte, alinhamento) é derivado dela.
 */
const PECAS = [
  { nome: "esq", arquivo: "esq-original.jpg", oculos: { cx: 2340, cy: 1770, largura: 1110 } },
  { nome: "meio", arquivo: "meio-original.jpg", oculos: { cx: 1637, cy: 1645, largura: 1354 } },
  { nome: "dir", arquivo: "dir-original.jpg", oculos: { cx: 1847, cy: 2037, largura: 1492 } },
];

/** O degradê da queima, como SVG — sharp não tem gradiente próprio. */
function queima() {
  const i = (QUEIMA_INICIO * 100).toFixed(0);
  const f = (QUEIMA_FIM * 100).toFixed(0);
  // O meio da rampa carrega MAIS tinta do que um degradê reto carregaria.
  // Degradê linear deixa o ponto médio em 50% de preto, e 50% de preto sobre
  // jaqueta branca ainda é cinza claro — foi assim que o logo de terceiro
  // sobreviveu à primeira queima. A curva pesa o miolo pra fechar antes.
  const m = (((QUEIMA_INICIO + QUEIMA_FIM) / 2) * 100).toFixed(0);
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${LARGURA}" height="${ALTURA}">
       <defs>
         <linearGradient id="q" x1="0" y1="0" x2="0" y2="1">
           <stop offset="${i}%" stop-color="#000" stop-opacity="0"/>
           <stop offset="${m}%" stop-color="#000" stop-opacity="0.72"/>
           <stop offset="${f}%" stop-color="#000" stop-opacity="1"/>
           <stop offset="100%" stop-color="#000" stop-opacity="1"/>
         </linearGradient>
       </defs>
       <rect width="${LARGURA}" height="${ALTURA}" fill="url(#q)"/>
     </svg>`,
  );
}

async function preparar(peca) {
  const entrada = path.join(__dirname, "..", "imagens-fonte", peca.arquivo);
  const saida = path.join(__dirname, "..", "public", `trio-${peca.nome}.jpg`);

  const meta = await sharp(entrada).metadata();

  // 1. Normaliza a escala pelo ÓCULOS, não pela moldura da foto.
  const escala = (ALVO_LARGURA * LARGURA) / peca.oculos.largura;
  const larguraEsc = Math.round(meta.width * escala);
  const alturaEsc = Math.round(meta.height * escala);

  // 2. Onde o corte teria que começar pra pousar o olho no eixo do trio.
  const esquerda = Math.round(peca.oculos.cx * escala - LARGURA / 2);
  const topo = Math.round(peca.oculos.cy * escala - ALVO_OLHO * ALTURA);

  // 3. O corte quase sempre sai da foto. Em vez de ceder no alinhamento,
  //    estende o papel com muro — que é a cor que o fundo vai ter de todo jeito.
  //
  //    ⚠️ A sobra é medida LADO A LADO, e não por um respiro único nos quatro.
  //    Um valor só precisaria ser o maior dos quatro, e aí ele desloca as duas
  //    bordas do eixo em que não faltava nada — o corte sai do lugar e o `extract`
  //    estoura a foto pelo lado oposto.
  const sobra = {
    left: Math.max(0, -esquerda),
    top: Math.max(0, -topo),
    right: Math.max(0, esquerda + LARGURA - larguraEsc),
    bottom: Math.max(0, topo + ALTURA - alturaEsc),
  };
  const estende = sobra.left || sobra.top || sobra.right || sobra.bottom;

  // 🔴 Estender e cortar são DUAS PASSADAS, e não uma cadeia só. O sharp não
  //    executa na ordem em que os métodos são chamados: ele tem ordem interna
  //    fixa e roda o `extract` ANTES do `extend`. Numa cadeia única o corte
  //    acontece na foto ainda sem o muro em volta, pede pixel que não existe e
  //    estoura com "bad extract area" — que foi exatamente o que aconteceu aqui.
  const base = sharp(entrada).resize(larguraEsc, alturaEsc);
  const comMuro = estende
    ? await base.extend({ ...sobra, background: { r: 0, g: 0, b: 0 } }).toBuffer()
    : await base.toBuffer();

  const buffer = await sharp(comMuro)
    .extract({
      left: esquerda + sobra.left,
      top: topo + sobra.top,
      width: LARGURA,
      height: ALTURA,
    })
    .toBuffer();

  // 4. Cinza, preto estourado e uma pitada de calor de papel. As três fotos vêm
  //    com temperatura muito diferente entre si (a `dir` é francamente laranja);
  //    o cinza é o que faz as três virarem a mesma peça, e o `tint` devolve a
  //    tinta quente do resto do site sem trazer a cor de pele de volta.
  await sharp(buffer)
    .greyscale()
    .linear(255 / (255 - LIMIAR), (-LIMIAR * 255) / (255 - LIMIAR))
    .tint({ r: 255, g: 246, b: 232 })
    .composite([{ input: queima(), blend: "over" }])
    .jpeg({ quality: 86, chromaSubsampling: "4:4:4" })
    .toFile(saida);

  const kb = (require("fs").statSync(saida).size / 1024).toFixed(0);
  console.log(
    `${peca.nome.padEnd(5)} escala ${escala.toFixed(3)}  corte ${esquerda},${topo}` +
      `${estende ? `  (muro +${sobra.left}/${sobra.top}/${sobra.right}/${sobra.bottom})` : ""}  → ${path.basename(saida)} ${kb}kB`,
  );
}

(async () => {
  for (const peca of PECAS) await preparar(peca);
})();

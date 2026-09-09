/**
 * Prepara a foto da hero. Dois passos, a partir do arquivo original:
 *
 * 1. RECOLORIR o visor de laranja pro vermelho da marca (#E01B12).
 *    Não dá pra só girar o matiz da imagem toda: a silhueta preta tem tom
 *    levemente azulado e, em pixels muito escuros, a saturação em HSL dispara
 *    (o denominador 1-|2L-1| tende a zero). Filtrar só por saturação pegaria a
 *    pele inteira. Por isso o alvo é cercado por matiz + saturação + luminosidade.
 *    A luminosidade de cada pixel é preservada, então brilho e degradê do visor
 *    continuam idênticos — muda só a cor.
 *
 * 2. APARAR a faixa preta do rodapé. A imagem gerada traz uma sombra sólida nos
 *    últimos ~7% que atravessa toda a largura. Como a foto é exibida com
 *    `contain` (mais estreita que a tela), essa faixa termina no limite da
 *    imagem e desenha duas bordas verticais visíveis. Aparada, os ombros
 *    terminam limpos e o degradê da Hero dissolve o resto.
 *
 * uso: node scripts/preparar-hero.js <entrada> <saida>
 */
const sharp = require("sharp");

const ALVO_H = 2.6;   // matiz do #E01B12
const ALVO_S = 0.85;  // saturação do #E01B12

const H_MIN = 0, H_MAX = 45;          // faixa do laranja/vermelho
const S_PISO = 0.30, S_CHEIO = 0.45;  // fade entre esses dois
const L_MIN = 0.14, L_MAX = 0.97;     // fora do quase-preto e do estourado

const LIMIAR_CLARO = 200;  // acima disso o pixel conta como fundo
const MARGEM_APARO = 8;    // px extras, pra não deixar resto da sombra

function rgbParaHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2, d = max - min;
  if (d === 0) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  let h;
  if (max === r) h = 60 * (((g - b) / d) % 6);
  else if (max === g) h = 60 * ((b - r) / d + 2);
  else h = 60 * ((r - g) / d + 4);
  if (h < 0) h += 360;
  return [h, s, l];
}

function hslParaRgb(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r, g, b;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

(async () => {
  const [entrada, saida] = process.argv.slice(2);
  if (!entrada || !saida) {
    console.error("uso: node scripts/preparar-hero.js <entrada> <saida>");
    process.exit(1);
  }

  const { width, height } = await sharp(entrada).metadata();
  const { data } = await sharp(entrada).raw().toBuffer({ resolveWithObject: true });

  // ---- passo 1: recolorir o visor ----
  let tocados = 0;
  for (let i = 0; i < data.length; i += 3) {
    const [h, s, l] = rgbParaHsl(data[i], data[i + 1], data[i + 2]);
    const naFaixa = (h >= H_MIN && h <= H_MAX) || h >= 340;
    if (!naFaixa || s < S_PISO || l < L_MIN || l > L_MAX) continue;

    const peso = Math.min(1, (s - S_PISO) / (S_CHEIO - S_PISO));
    const [nr, ng, nb] = hslParaRgb(ALVO_H, Math.min(1, (s + ALVO_S) / 2), l);

    data[i]     = Math.round(data[i]     * (1 - peso) + nr * peso);
    data[i + 1] = Math.round(data[i + 1] * (1 - peso) + ng * peso);
    data[i + 2] = Math.round(data[i + 2] * (1 - peso) + nb * peso);
    tocados++;
  }
  console.log(`visor recolorido: ${tocados.toLocaleString()} px (${((tocados / (width * height)) * 100).toFixed(2)}%)`);

  // ---- passo 2: achar onde começa a faixa preta do rodapé ----
  // varre uma coluna de cada borda, longe da figura, de baixo pra cima
  const lum = (x, y) => {
    const i = (y * width + x) * 3;
    return (data[i] + data[i + 1] + data[i + 2]) / 3;
  };
  const colunas = [8, Math.round(width * 0.03), width - 9];
  let inicioFaixa = height;
  for (const x of colunas) {
    for (let y = height - 1; y >= 0; y--) {
      if (lum(x, y) > LIMIAR_CLARO) { inicioFaixa = Math.min(inicioFaixa, y + 1); break; }
    }
  }

  let alturaFinal = height;
  if (inicioFaixa < height) {
    alturaFinal = Math.max(1, inicioFaixa - MARGEM_APARO);
    console.log(`faixa preta detectada a partir de y=${inicioFaixa} — aparando ${height - alturaFinal}px (${(((height - alturaFinal) / height) * 100).toFixed(1)}%)`);
  } else {
    console.log("nenhuma faixa preta no rodapé — nada a aparar");
  }

  await sharp(data, { raw: { width, height, channels: 3 } })
    .extract({ left: 0, top: 0, width, height: alturaFinal })
    .jpeg({ quality: 92, mozjpeg: true })
    .toFile(saida);

  console.log(`salvo: ${saida} (${width}x${alturaFinal})`);
})();

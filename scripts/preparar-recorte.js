/**
 * Prepara um RECORTE (PNG com alfa) pra entrar na página como objeto solto.
 *
 * Ele recebe foto que JÁ VEM RECORTADA, com canal alfa, e o trabalho é não
 * encostar no fundo, porque não existe fundo. O objeto flutua direto no muro
 * preto, sem folha, sem moldura e sem emenda — que é o que o contrato de direção
 * pedia desde o começo ("a foto do produto flutua na prancha sem caixa").
 *
 * É o único preparador de imagem do projeto. O anterior (`preparar-hero.js`)
 * imprimia foto de fundo cheio como folha de cartaz em duas tintas, e saiu junto
 * com a foto que ele servia.
 *
 * 🔴 **Recorte NÃO leva retícula.** Reticular passa a imagem por uma malha de
 * pontos sobre papel, e papel é exatamente o que um recorte não tem: o resultado
 * seria um retângulo claro de volta, que é o defeito que o recorte resolve. A
 * lente espelhada também morre na retícula — ela é brilho especular contínuo, e
 * posterizar em três níveis chapados apaga o que faz a peça acender.
 *
 * ## O que ele faz, então
 *
 * 1. **Apara pelo ALFA**, não por coordenada escrita à mão. A caixa de corte sai
 *    da varredura do canal alfa, então trocar a foto não exige remedir nada — e
 *    uma margem em porcentagem do conteúdo devolve o respiro.
 *
 * 2. **Gira o matiz do dourado** pro dourado da marca, preservando luminosidade
 *    e alfa pixel a pixel. Existe porque na página o objeto fica a centímetros do bloco de ouro do
 *    CTA (`#D3A62C`, matiz 44°), e dois dourados quase iguais lado a lado leem
 *    como erro de cor, não como variação. A lente desta foto entra em 35°.
 *
 *    ⚠️ A correção é PARCIAL (`FORCA`), de propósito. Levar tudo pra 44° chapa a
 *    lente num amarelo só e mata a variação de temperatura que faz um espelho
 *    parecer espelho. O alvo é encostar, não igualar.
 *
 * 3. **Não toca no preto da armação.** O filtro exige saturação mínima, e
 *    armação preta não tem saturação nenhuma.
 *
 * uso: node scripts/preparar-recorte.js <entrada.png> <saida.png> [--margem 0.04] [--largura N]
 */
const sharp = require("sharp");

/** Matiz alvo e quanto do matiz original sobrevive. */
const ALVO_H = 43;
const FORCA = 0.7;

/** A faixa que conta como "dourado" nesta foto, e o piso de saturação. */
const H_MIN = 15;
const H_MAX = 70;
const S_PISO = 0.2;
const S_CHEIO = 0.4;

/** Alfa acima do qual o pixel conta como conteúdo, pra achar a caixa de corte. */
const ALFA_CONTEUDO = 10;

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

function lerOpcao(nome, padrao) {
  const i = process.argv.indexOf(nome);
  return i === -1 ? padrao : process.argv[i + 1];
}

(async () => {
  const [entrada, saida] = process.argv.slice(2);
  if (!entrada || !saida || entrada.startsWith("--")) {
    console.error(
      "uso: node scripts/preparar-recorte.js <entrada.png> <saida.png> " +
        "[--margem 0.04] [--largura N]",
    );
    process.exit(1);
  }

  const margem = Number(lerOpcao("--margem", "0.04"));
  const largura = lerOpcao("--largura", null);

  const fonte = sharp(entrada).ensureAlpha();
  const { width: W0, height: H0 } = await fonte.metadata();
  const { data: bruto, info } = await fonte
    .raw()
    .toBuffer({ resolveWithObject: true });

  // ---- 1: a caixa de corte sai do ALFA ----
  let x0 = W0, y0 = H0, x1 = -1, y1 = -1;
  for (let y = 0; y < H0; y++) {
    for (let x = 0; x < W0; x++) {
      if (bruto[(y * W0 + x) * info.channels + 3] > ALFA_CONTEUDO) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) {
    console.error("imagem sem nenhum pixel opaco — é recorte mesmo?");
    process.exit(1);
  }

  const cw = x1 - x0 + 1, ch = y1 - y0 + 1;
  const folga = Math.round(Math.max(cw, ch) * margem);
  const left = Math.max(0, x0 - folga);
  const top = Math.max(0, y0 - folga);
  const width = Math.min(W0 - left, cw + folga * 2);
  const height = Math.min(H0 - top, ch + folga * 2);

  let cortada = sharp(entrada).ensureAlpha().extract({ left, top, width, height });
  if (largura) cortada = cortada.resize({ width: Number(largura) });

  const preparada = await cortada.png().toBuffer();
  const { width: W, height: H } = await sharp(preparada).metadata();
  const { data } = await sharp(preparada)
    .raw()
    .toBuffer({ resolveWithObject: true });

  // ---- 2: girar o dourado, preservando alfa e luminosidade ----
  let girados = 0;
  for (let p = 0; p < W * H; p++) {
    const i = p * 4;
    if (data[i + 3] === 0) continue; // transparente não tem cor pra girar

    const [h, s, l] = rgbParaHsl(data[i], data[i + 1], data[i + 2]);
    if (h < H_MIN || h > H_MAX || s < S_PISO) continue;

    const peso = Math.min(1, (s - S_PISO) / (S_CHEIO - S_PISO)) * FORCA;
    const novoH = h + (ALVO_H - h) * peso;
    const [r, g, b] = hslParaRgb(novoH, s, l);
    data[i] = Math.round(r);
    data[i + 1] = Math.round(g);
    data[i + 2] = Math.round(b);
    girados++;
  }

  await sharp(data, { raw: { width: W, height: H, channels: 4 } })
    .png({ compressionLevel: 9, palette: false })
    .toFile(saida);

  const kb = (require("fs").statSync(saida).size / 1024).toFixed(0);
  console.log(`conteúdo: ${cw}x${ch} em ${x0},${y0}`);
  console.log(`corte:    ${width}x${height} (margem ${(margem * 100).toFixed(0)}%)`);
  console.log(`dourado:  ${girados.toLocaleString("pt-BR")} px girados pra ~${ALVO_H}°`);
  console.log(`salvo:    ${saida} (${W}x${H}, ${kb} KB)`);
})();

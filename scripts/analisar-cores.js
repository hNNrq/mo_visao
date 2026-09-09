/** Mapeia a distribuição de saturação e matiz da imagem, pra escolher o
 *  limiar certo antes de recolorir qualquer coisa. */
const sharp = require("sharp");

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

(async () => {
  const { data } = await sharp(process.argv[2]).raw().toBuffer({ resolveWithObject: true });
  const total = data.length / 3;

  const faixasS = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7];
  const contagem = new Map(faixasS.map((f) => [f, 0]));
  const matizPorFaixa = new Map(faixasS.map((f) => [f, []]));

  for (let i = 0; i < data.length; i += 3) {
    const [h, s] = rgbParaHsl(data[i], data[i + 1], data[i + 2]);
    for (const f of faixasS) {
      if (s >= f) { contagem.set(f, contagem.get(f) + 1); matizPorFaixa.get(f).push(h); }
    }
  }

  console.log(`total de pixels: ${total.toLocaleString()}\n`);
  console.log("saturação  | pixels acima      | % da imagem | matiz médio");
  console.log("-----------|-------------------|-------------|------------");
  for (const f of faixasS) {
    const n = contagem.get(f);
    const hs = matizPorFaixa.get(f);
    const media = hs.length ? (hs.reduce((a, b) => a + b, 0) / hs.length).toFixed(1) : "-";
    console.log(
      `S >= ${f.toFixed(2)}  | ${n.toLocaleString().padStart(17)} | ${((n / total) * 100).toFixed(2).padStart(10)}% | ${media}°`
    );
  }

  // histograma de matiz só entre os pixels bem saturados
  const fortes = [];
  for (let i = 0; i < data.length; i += 3) {
    const [h, s] = rgbParaHsl(data[i], data[i + 1], data[i + 2]);
    if (s >= 0.5) fortes.push(h);
  }
  const baldes = new Map();
  for (const h of fortes) {
    const b = Math.floor(h / 30) * 30;
    baldes.set(b, (baldes.get(b) ?? 0) + 1);
  }
  console.log("\nmatiz dos pixels com S >= 0.50:");
  [...baldes.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).forEach(([b, n]) =>
    console.log(`  ${String(b).padStart(3)}°-${String(b + 30).padStart(3)}°: ${n.toLocaleString()} px`)
  );
})();

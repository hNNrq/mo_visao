/**
 * O campo de FAGULHAS das margens da hero.
 *
 * Pontos de retícula soltos, em ouro, boiando devagar nas duas laterais. É a
 * tradução do fogo da campanha de retorno da X-Metal da Oakley pro mundo desta
 * loja — o porquê está no bloco "A FAGULHA" do `globals.css`, junto com a razão
 * de o último quadro da animação ser igual ao primeiro.
 *
 * ## Por que as posições são uma lista escrita à mão
 *
 * 🔴 **`Math.random()` aqui quebraria a página, não só o desenho.** Este é um
 * Server Component: o HTML sai pronto do servidor e o React confere no
 * navegador. Posição sorteada dá um valor no servidor e outro no cliente, e a
 * divergência vira erro de hidratação — a árvore inteira remonta no cliente,
 * bem no primeiro carregamento, no aparelho mais fraco do público.
 *
 * Uma lista fixa resolve isso e ainda é melhor de trabalhar: dá pra afinar um
 * ponto que ficou feio sem rerrolar o campo inteiro, e dois deploys seguidos
 * mostram a mesma hero pra mesma pessoa.
 *
 * ## O que a lista respeita
 *
 * - **Os pontos vivem nas MARGENS** (até 20% de cada lado), porque o miolo é do
 *   nome e do óculos. Preencher o centro é o oposto do que a peça pede: na
 *   referência o fogo queima nas bordas justamente pra deixar o meio preto.
 * - **Tamanho, brilho, tempo e atraso são todos diferentes.** Ponto de chapa
 *   tem calibre variado; uma grade de bolinhas iguais lê como padrão de
 *   fundo de site, não como retícula.
 * - **O campo adensou de 26 pra 46 pontos em set/2026, a pedido do Henrique.**
 *   Os 20 que entraram são todos de calibre 2–3px e brilho ≤ 0.52: adensar com
 *   ponto grosso teria virado confete, e o que se queria era retícula mais
 *   fechada. Custo de render é zero — a animação é só `transform`/`opacity`, que
 *   roda no compositor. O teto prático continua sendo o desenho, não o
 *   desempenho: passando disso a margem começa a disputar com o miolo.
 * - **Nenhum ponto passa de `0.65` de opacidade.** Acima disso a margem começa
 *   a competir com a lente dourada do óculos, que é onde o olho tem que cair.
 *
 * ## O calibre encolhe no celular
 *
 * ⚠️ O diâmetro de cada ponto está em PX, e px não encolhe junto com a tela. Em
 * 320px os pontos de 6px liam como bolinhas grandes por cima do nome, porque ali
 * não existe margem lateral pra eles ocuparem — a coluna de texto vai de borda a
 * borda. `--escala` resolve isso reduzindo só o CALIBRE, nunca a posição: os
 * pontos continuam distribuídos no mesmo lugar, só que finos como uma retícula de
 * verdade seria numa impressão pequena.
 *
 * O elemento é `aria-hidden` e `pointer-events-none`: não é conteúdo, não é
 * controle, e leitor de tela não tem nada a ganhar anunciando 46 pontos.
 */

type Ponto = {
  /** posição em % da caixa */
  x: number;
  y: number;
  /** diâmetro em px */
  d: number;
  /** opacidade de repouso */
  b: number;
  /** duração do ciclo, em segundos */
  t: number;
  /** atraso de entrada, em segundos */
  a: number;
};

const PONTOS: Ponto[] = [
  // margem esquerda
  { x: 2, y: 12, d: 3, b: 0.55, t: 13, a: 0 },
  { x: 7, y: 28, d: 5, b: 0.4, t: 16, a: 2.5 },
  { x: 13, y: 8, d: 2, b: 0.65, t: 11, a: 1.2 },
  { x: 4, y: 46, d: 6, b: 0.3, t: 18, a: 4 },
  { x: 16, y: 38, d: 3, b: 0.5, t: 14, a: 0.8 },
  { x: 9, y: 62, d: 4, b: 0.45, t: 12, a: 3.4 },
  { x: 1, y: 72, d: 2, b: 0.6, t: 15, a: 1.9 },
  { x: 14, y: 78, d: 5, b: 0.28, t: 17, a: 5.2 },
  { x: 6, y: 90, d: 3, b: 0.42, t: 13, a: 2.2 },
  { x: 18, y: 58, d: 2, b: 0.38, t: 19, a: 6 },
  { x: 11, y: 96, d: 4, b: 0.32, t: 15, a: 3.8 },
  { x: 3, y: 34, d: 2, b: 0.48, t: 12, a: 5.6 },
  { x: 17, y: 18, d: 4, b: 0.35, t: 16, a: 4.4 },
  // margem direita
  { x: 97, y: 16, d: 4, b: 0.52, t: 14, a: 1.1 },
  { x: 91, y: 30, d: 2, b: 0.62, t: 12, a: 3.1 },
  { x: 85, y: 10, d: 5, b: 0.34, t: 17, a: 0.4 },
  { x: 98, y: 44, d: 3, b: 0.45, t: 15, a: 4.8 },
  { x: 83, y: 52, d: 2, b: 0.55, t: 11, a: 2.7 },
  { x: 94, y: 66, d: 6, b: 0.28, t: 19, a: 1.6 },
  { x: 88, y: 80, d: 3, b: 0.48, t: 13, a: 5.4 },
  { x: 99, y: 74, d: 2, b: 0.4, t: 16, a: 3.3 },
  { x: 81, y: 88, d: 4, b: 0.33, t: 18, a: 0.9 },
  { x: 92, y: 94, d: 3, b: 0.5, t: 12, a: 4.1 },
  { x: 96, y: 58, d: 2, b: 0.36, t: 14, a: 6.2 },
  { x: 86, y: 36, d: 3, b: 0.44, t: 15, a: 2.1 },
  { x: 89, y: 22, d: 2, b: 0.58, t: 13, a: 5.9 },
  // o adensamento de set/2026: calibre fino e brilho baixo, só pra fechar os
  // buracos do campo sem trazer peso pro lado do nome
  { x: 10, y: 20, d: 2, b: 0.5, t: 14, a: 7.1 },
  { x: 19, y: 48, d: 2, b: 0.34, t: 16, a: 2.9 },
  { x: 5, y: 56, d: 3, b: 0.4, t: 12, a: 6.6 },
  { x: 12, y: 44, d: 2, b: 0.46, t: 17, a: 1.5 },
  { x: 8, y: 4, d: 2, b: 0.52, t: 13, a: 4.9 },
  { x: 15, y: 68, d: 3, b: 0.3, t: 18, a: 0.6 },
  { x: 2, y: 84, d: 2, b: 0.44, t: 15, a: 7.4 },
  { x: 19, y: 88, d: 2, b: 0.36, t: 12, a: 3.6 },
  { x: 10, y: 74, d: 3, b: 0.33, t: 16, a: 5.1 },
  { x: 6, y: 38, d: 2, b: 0.5, t: 11, a: 8.2 },
  { x: 84, y: 26, d: 2, b: 0.5, t: 13, a: 7.6 },
  { x: 95, y: 38, d: 2, b: 0.42, t: 17, a: 0.7 },
  { x: 90, y: 50, d: 3, b: 0.32, t: 15, a: 4.5 },
  { x: 80, y: 64, d: 2, b: 0.47, t: 12, a: 2.4 },
  { x: 87, y: 70, d: 2, b: 0.36, t: 18, a: 6.8 },
  { x: 99, y: 86, d: 3, b: 0.3, t: 14, a: 1.4 },
  { x: 93, y: 12, d: 2, b: 0.54, t: 16, a: 5.7 },
  { x: 82, y: 42, d: 2, b: 0.38, t: 13, a: 3.9 },
  { x: 97, y: 28, d: 3, b: 0.31, t: 19, a: 7.9 },
  { x: 86, y: 96, d: 2, b: 0.43, t: 15, a: 0.3 },
];

export function Fagulhas() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden [--escala:0.5] sm:[--escala:0.75] lg:[--escala:1]"
    >
      {PONTOS.map((p, i) => (
        <span
          key={i}
          className="fagulha"
          style={
            {
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `calc(${p.d}px * var(--escala))`,
              height: `calc(${p.d}px * var(--escala))`,
              "--brilho": p.b,
              "--tempo": `${p.t}s`,
              "--atraso": `${p.a}s`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

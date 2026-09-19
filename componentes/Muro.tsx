/**
 * O muro atrás das folhas.
 *
 * Um poste nunca tem um cartaz só: tem o de hoje colado por cima do de semana
 * passada. As linhas repetidas são esse resto — material do mundo, não textura
 * decorativa, e por isso escritas com o próprio nome da loja em vez de ruído.
 *
 * Fica atrás de tudo num elemento à parte, e não num filtro por cima, que
 * sujaria a folha colada na frente. O corpo é pequeno de propósito: em corpo
 * grande o muro vira uma segunda manchete e briga com a primeira, que é a única
 * coisa na página com direito a gritar.
 *
 * ⚠️ São 30 linhas de texto de verdade no DOM. Vale na hero e na tela de
 * entrar, que não têm mais nada; **não vale atrás de lista de dados** — no
 * Android de entrada do público, 400 nós atrás de um catálogo é peso que a
 * tela não devolve. O pai precisa ser `relative` e recortar o que passa.
 */

/**
 * Repetições bastantes pra a linha atravessar a tela mais larga com folga. Com
 * poucas, a linha termina no meio do muro e a mancha de texto vira um bloco
 * cinza torto de um lado só — que lê como defeito, não como muro.
 */
const REPETICAO = Array.from({ length: 14 }, () => "Mó Visão").join(" · ");

export function Muro({ linhas: quantas = 30 }: { linhas?: number }) {
  const linhas = Array.from({ length: quantas });

  return (
    <div
      aria-hidden
      className="muro pointer-events-none absolute inset-0 flex flex-col justify-between overflow-hidden py-2"
    >
      {linhas.map((_, i) => (
        <span
          key={i}
          className="block font-display text-[max(11px,1.35vw)] leading-none font-black tracking-[0.04em] whitespace-nowrap uppercase"
          style={{ transform: `translateX(${i % 2 ? "-11%" : "-3%"})` }}
        >
          {REPETICAO}
        </span>
      ))}
    </div>
  );
}

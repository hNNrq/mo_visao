import Link from "next/link";

/**
 * O cabeçalho de toda tela do painel: o que é, quantos são, e a ação da tela.
 *
 * A contagem fica em letra miúda ao lado do título, e não em faixa de métrica
 * no topo — o número que importa no painel é o de cada linha da lista, não um
 * total em corpo grande. Sem rótulo pendurado acima do título.
 *
 * `contagem` é dado (letra miúda espacejada); `descricao` é frase (corpo de
 * texto). Uma frase inteira em caixa alta espacejada vira grito.
 */
export function Cabecalho({
  titulo,
  contagem,
  descricao,
  acao,
}: {
  titulo: string;
  contagem?: string;
  descricao?: string;
  acao?: { href: string; texto: string };
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div className="min-w-0">
        <h1 className="font-display text-3xl leading-none font-black tracking-tight uppercase text-paper sm:text-4xl">
          {titulo}
        </h1>

        {contagem && (
          <p className="numeros mt-2.5 font-sans text-base tracking-[0.16em] uppercase text-smoke">
            {contagem}
          </p>
        )}

        {descricao && (
          <p className="mt-2 max-w-[46ch] font-sans text-lg leading-snug text-smoke">
            {descricao}
          </p>
        )}
      </div>

      {acao && (
        <Link
          href={acao.href}
          className="carimbo skew-brand bg-gold px-6 py-3.5 font-display text-lg font-black tracking-tight uppercase text-ink transition-colors hover:bg-gold-deep"
        >
          <span className="unskew">{acao.texto}</span>
        </Link>
      )}
    </div>
  );
}

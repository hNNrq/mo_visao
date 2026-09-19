import Link from "next/link";

/**
 * Tela vazia do painel.
 *
 * Sem moldura tracejada em volta: o vazio já é o vazio, e uma caixa pontilhada
 * só desenha uma borda onde o sistema não tem nenhuma. Ela ensina o que fazer
 * em seguida, em vez de dizer "nada aqui".
 */
export function Vazio({
  titulo,
  texto,
  acao,
}: {
  titulo: string;
  texto: string;
  acao?: { href: string; texto: string };
}) {
  return (
    <div className="py-10">
      <p className="font-display text-2xl leading-tight font-black tracking-tight uppercase text-paper">
        {titulo}
      </p>
      <p className="mt-3 max-w-[42ch] font-sans text-lg leading-snug text-smoke">
        {texto}
      </p>

      {acao && (
        <Link
          href={acao.href}
          className="carimbo skew-brand mt-7 inline-block bg-gold px-7 py-4 font-display text-lg font-black tracking-tight uppercase text-ink transition-colors hover:bg-gold-deep"
        >
          <span className="unskew">{acao.texto}</span>
        </Link>
      )}
    </div>
  );
}

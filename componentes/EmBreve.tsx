import Link from "next/link";

/**
 * Página da área do cliente que ainda não existe.
 *
 * Carrinho, conta e pedidos já estão no menu, mas o checkout é fase seguinte.
 * Sem isso os três links caem no 404 — que lê como site quebrado, e não como
 * funcionalidade que ainda vem.
 */
export function EmBreve({
  etiqueta,
  titulo,
  texto,
}: {
  etiqueta: string;
  titulo: string;
  texto: string;
}) {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-3xl flex-col justify-center px-6 pt-28 pb-20 sm:px-10">
      <p className="skew-brand inline-block self-start border-l-[6px] border-hot pl-4 font-display text-sm font-extrabold tracking-[0.16em] uppercase text-hot">
        {etiqueta}
      </p>
      <h1 className="skew-brand mt-6 font-display text-[clamp(2.5rem,9vw,5rem)] leading-none font-black uppercase">
        {titulo}
      </h1>
      <p className="mt-6 max-w-[42ch] font-sans text-lg text-white/70">{texto}</p>
      <Link
        href="/produtos"
        className="skew-brand mt-10 inline-block self-start bg-hot px-8 py-4 font-display text-xl font-black uppercase text-white transition-colors hover:bg-hot-dark"
      >
        <span className="unskew">Ver os óculos</span>
      </Link>
    </main>
  );
}

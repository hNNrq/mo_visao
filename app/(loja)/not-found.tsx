import Link from "next/link";

export default function NaoEncontrado() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-3xl flex-col justify-center px-6 pt-28 pb-20 sm:px-10">
      <p className="skew-brand inline-block self-start border-l-[6px] border-hot pl-4 font-display text-sm font-extrabold tracking-[0.16em] uppercase text-hot">
        Erro 404
      </p>
      <h1 className="skew-brand mt-6 font-display text-[clamp(2.5rem,9vw,5rem)] leading-none font-black uppercase">
        Essa página não existe
      </h1>
      <p className="mt-6 max-w-[42ch] font-sans text-lg text-white/70">
        O link pode ter mudado, ou o óculos que você procura saiu do catálogo.
      </p>
      <Link
        href="/produtos"
        className="skew-brand mt-10 inline-block self-start bg-hot px-8 py-4 font-display text-xl font-black uppercase text-white transition-colors hover:bg-hot-dark"
      >
        <span className="unskew">Ver o que tem</span>
      </Link>
    </main>
  );
}

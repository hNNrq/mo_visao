import Link from "next/link";

/**
 * 🔴 Título de frase não estica — mesma regra do `EmBreve`: a `Esticar` mede com
 * `whitespace-nowrap`, e frase numa linha só vaza a margem no celular. Esta tela
 * escapava por pouco só porque o corpo dela era menor que o das outras.
 */
export default function NaoEncontrado() {
  return (
    <main className="flex min-h-[70svh] flex-col justify-center bg-ink px-5 pt-28 pb-20 sm:px-10">
      <div className="mx-auto w-full max-w-[1100px]">
        <h1 className="max-w-[16ch] font-display text-[clamp(1.9rem,5.5vw,4rem)] leading-[0.9] font-black tracking-tight text-balance uppercase text-paper">
          Essa página não existe
        </h1>

        <p className="mt-8 max-w-[46ch] font-sans text-xl leading-snug text-smoke">
          O link pode ter mudado, ou o óculos que você procura saiu do catálogo.
        </p>

        <Link
          href="/produtos"
          className="carimbo skew-brand mt-10 inline-block bg-gold px-8 py-4 font-display text-xl font-black tracking-tight uppercase text-ink transition-colors hover:bg-gold-deep"
        >
          <span className="unskew">Ver o que tem</span>
        </Link>
      </div>
    </main>
  );
}

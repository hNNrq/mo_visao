import Link from "next/link";
import { CardProduto } from "@/componentes/CardProduto";
import { Hero } from "@/componentes/Hero";
import { listarDestaques } from "@/lib/produtos";

// Os destaques mostram estoque; cache aqui exibiria peça que já saiu.
export const dynamic = "force-dynamic";

export default async function Home() {
  const destaques = await listarDestaques();

  return (
    <main>
      <Hero />

      <section className="mx-auto max-w-7xl px-6 py-24 sm:px-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h2 className="skew-brand font-display text-[clamp(2rem,7vw,4rem)] leading-none font-black uppercase">
            Mais vendidos
          </h2>
          <Link
            href="/produtos"
            className="font-sans text-sm tracking-[0.16em] uppercase text-white/60 transition-colors hover:text-hot sm:text-base"
          >
            Ver todos →
          </Link>
        </div>

        {destaques.length === 0 ? (
          <p className="mt-12 max-w-[46ch] font-sans text-lg text-smoke">
            Nenhum produto marcado como destaque ainda. No painel, marque um
            óculos como destaque pra ele aparecer aqui.
          </p>
        ) : (
          <div className="mt-14 grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {destaques.map((produto) => (
              <CardProduto key={produto.id} produto={produto} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

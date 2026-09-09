import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Galeria } from "@/componentes/Galeria";
import { parcelamento, precoBRL } from "@/lib/format";
import { buscarProduto } from "@/lib/produtos";
import { urlFoto } from "@/lib/supabase/publico";

// Estoque precisa estar certo na hora: essa é a página onde a pessoa decide comprar.
export const dynamic = "force-dynamic";

// No Next 16 params é uma Promise
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const produto = await buscarProduto(slug);

  if (!produto) return { title: "Produto não encontrado" };

  const foto = produto.fotos[0];

  return {
    title: produto.nome,
    description:
      produto.descricao ??
      `${produto.nome} na Mó Visão. ${precoBRL(produto.preco_centavos)}.`,
    openGraph: {
      title: produto.nome,
      description: produto.descricao ?? undefined,
      images: foto ? [{ url: urlFoto(foto.storage_path) }] : undefined,
    },
  };
}

export default async function PaginaProduto({ params }: Props) {
  const { slug } = await params;
  const produto = await buscarProduto(slug);

  if (!produto) notFound();

  const disponivel = produto.disponivel > 0;
  const parcelas = parcelamento(produto.preco_centavos);
  const ultimas = disponivel && produto.disponivel <= 2;

  /**
   * JSON-LD: é o que faz o Google mostrar preço e disponibilidade direto
   * no resultado da busca. Numa loja nova, isso vale mais que qualquer texto.
   */
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: produto.nome,
    description: produto.descricao ?? undefined,
    brand: produto.marca ? { "@type": "Brand", name: produto.marca } : undefined,
    image: produto.fotos.map((f) => urlFoto(f.storage_path)),
    offers: {
      "@type": "Offer",
      price: (produto.preco_centavos / 100).toFixed(2),
      priceCurrency: "BRL",
      availability: disponivel
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };

  return (
    <main className="mx-auto max-w-7xl px-6 pt-28 pb-16 sm:px-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
        <Galeria fotos={produto.fotos} nome={produto.nome} />

        <div>
          <p className="font-sans text-sm tracking-[0.2em] uppercase text-smoke">
            {produto.marca ?? "Óculos"}
            {produto.categoria === "corrida" ? " · Corrida" : " · Rua"}
          </p>

          <h1 className="skew-brand mt-3 font-display text-[clamp(2.25rem,6vw,3.75rem)] leading-none font-black uppercase">
            {produto.nome}
          </h1>

          {produto.modelo && (
            <p className="mt-3 font-sans text-lg text-white/60">{produto.modelo}</p>
          )}

          <div className="mt-8">
            <p className="font-display text-4xl font-black text-hot sm:text-5xl">
              {precoBRL(produto.preco_centavos)}
            </p>
            {parcelas && (
              <p className="mt-2 font-sans text-white/60">
                ou {parcelas.parcelas}x de {parcelas.valor}
              </p>
            )}
          </div>

          {produto.descricao && (
            <p className="mt-8 max-w-[46ch] font-sans text-lg leading-relaxed text-white/75">
              {produto.descricao}
            </p>
          )}

          <div className="mt-10">
            {disponivel ? (
              <>
                {ultimas && (
                  <p className="mb-3 font-sans text-sm tracking-[0.16em] uppercase text-hot">
                    {produto.disponivel === 1
                      ? "Última unidade"
                      : `Últimas ${produto.disponivel} unidades`}
                  </p>
                )}
                {/* vira botão de carrinho de verdade na fase 4 */}
                <button
                  type="button"
                  disabled
                  className="skew-brand w-full bg-hot px-10 py-5 font-display text-2xl font-black uppercase text-white disabled:opacity-60 sm:w-auto"
                >
                  <span className="unskew">Comprar</span>
                </button>
                <p className="mt-3 font-sans text-sm text-smoke">
                  Checkout entra na próxima fase.
                </p>
              </>
            ) : (
              <p className="skew-brand inline-block border border-white/25 px-8 py-4 font-display text-xl font-black uppercase text-white/60">
                <span className="unskew">Esgotado</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

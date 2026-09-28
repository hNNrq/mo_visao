import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BotaoComprar } from "@/componentes/BotaoComprar";
import { Galeria } from "@/componentes/Galeria";
import { descontoPix, parcelamento, precoBRL } from "@/lib/format";
import { buscarProduto, lerConfig } from "@/lib/produtos";
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
  const [produto, config] = await Promise.all([buscarProduto(slug), lerConfig()]);

  if (!produto) notFound();

  const disponivel = produto.disponivel > 0;
  const maxParcelas = Number(config.parcelas_sem_juros) || 3;
  const parcelas = parcelamento(produto.preco_centavos, maxParcelas);
  const pctPix = Number(config.desconto_pix_pct) || 0;
  const foto = produto.fotos[0];
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
    <main className="bg-ink px-5 pt-28 pb-24 sm:px-10 sm:pt-32 sm:pb-32">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto grid max-w-[1600px] gap-12 lg:grid-cols-[minmax(0,46%)_1fr] lg:gap-20">
        <Galeria fotos={produto.fotos} nome={produto.nome} />

        <div>
          <p className="font-sans text-sm tracking-[0.18em] uppercase text-smoke">
            {produto.marca ?? "Óculos"}
          </p>

          <h1 className="mt-4 font-display text-[clamp(2.25rem,5vw,4.5rem)] leading-[0.9] font-black tracking-tight text-balance uppercase text-paper">
            {produto.nome}
          </h1>

          {produto.modelo && (
            <p className="mt-4 font-sans text-xl text-smoke">{produto.modelo}</p>
          )}

          <div className="mt-9">
            <p>
              <span className="numeros carimbo skew-brand inline-block bg-gold px-5 py-2.5 font-display text-4xl font-black tracking-tight text-ink sm:text-5xl">
                <span className="unskew">{precoBRL(produto.preco_centavos)}</span>
              </span>
            </p>
            {pctPix > 0 && (
              <p className="numeros mt-4 font-sans text-lg text-paper">
                {precoBRL(descontoPix(produto.preco_centavos, pctPix))} no Pix
              </p>
            )}
            {parcelas && (
              <p className="numeros mt-1 font-sans text-lg text-smoke">
                ou {parcelas.parcelas}x de {parcelas.valor} sem juros
              </p>
            )}
          </div>

          {produto.descricao && (
            <p className="mt-9 max-w-[46ch] font-sans text-xl leading-snug text-paper/80">
              {produto.descricao}
            </p>
          )}

          <div className="mt-10">
            {disponivel ? (
              <>
                {ultimas && (
                  <p className="numeros mb-4 font-sans text-base tracking-[0.16em] uppercase text-gold">
                    {produto.disponivel === 1
                      ? "Última unidade"
                      : `Últimas ${produto.disponivel} unidades`}
                  </p>
                )}
                <BotaoComprar
                  disponivel={produto.disponivel}
                  item={{
                    produto_id: produto.id,
                    slug: produto.slug,
                    nome: produto.nome,
                    preco_centavos: produto.preco_centavos,
                    foto: foto ? urlFoto(foto.storage_path) : null,
                  }}
                />
                {typeof config.entrega_texto === "string" && config.entrega_texto && (
                  <p className="mt-4 max-w-[46ch] font-sans text-base text-smoke">
                    {config.entrega_texto}
                  </p>
                )}
              </>
            ) : (
              <p className="skew-brand inline-block bg-paper/10 px-8 py-4 font-display text-xl font-black tracking-tight uppercase text-smoke">
                <span className="unskew">Esgotado</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

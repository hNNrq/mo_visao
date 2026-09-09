import Image from "next/image";
import Link from "next/link";
import { precoBRL } from "@/lib/format";
import { urlFoto } from "@/lib/supabase/publico";
import type { ProdutoComFotos } from "@/lib/types";

/**
 * Card da vitrine.
 *
 * O card NÃO leva skew: o -12° é assinatura de título e botão. Em foto de
 * produto ele distorce a peça, que é justamente o que o cliente quer avaliar.
 */
export function CardProduto({ produto }: { produto: ProdutoComFotos }) {
  const foto = produto.fotos[0];
  const esgotado = produto.disponivel <= 0;

  return (
    <Link
      href={`/produtos/${produto.slug}`}
      className="group block focus:outline-none"
    >
      <div className="relative aspect-square overflow-hidden bg-paper">
        {foto ? (
          <Image
            src={urlFoto(foto.storage_path)}
            alt={foto.alt ?? produto.nome}
            fill
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
            className="object-contain p-6 transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm tracking-widest uppercase text-ink/30">
            sem foto
          </div>
        )}

        {esgotado && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink/70">
            <span className="skew-brand bg-ink px-5 py-2 font-display text-lg font-black tracking-wide uppercase text-white">
              <span className="unskew">Esgotado</span>
            </span>
          </div>
        )}
      </div>

      <div className="mt-4">
        <p className="font-sans text-xs tracking-[0.2em] uppercase text-smoke">
          {produto.marca ?? "Óculos"}
          {produto.categoria === "corrida" ? " · Corrida" : " · Rua"}
        </p>
        <h3 className="mt-1 font-display text-2xl leading-tight font-bold uppercase transition-colors group-hover:text-hot">
          {produto.nome}
        </h3>
        <p className="mt-1 font-display text-xl font-black text-hot">
          {precoBRL(produto.preco_centavos)}
        </p>
      </div>
    </Link>
  );
}

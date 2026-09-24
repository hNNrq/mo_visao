"use client";

import { useRouter } from "next/navigation";
import { adicionar, useCarrinho } from "@/lib/carrinho";

/**
 * O "Comprar" da página do produto.
 *
 * Põe no carrinho e já leva pra lá: quem chega do story quer fechar, não
 * continuar navegando. Se a peça já está no carrinho, não soma de novo — só
 * leva. Com estoque de uma ou duas unidades, clique duplo virar "2x" é o erro
 * mais provável da tela.
 */
export function BotaoComprar({ produtoId }: { produtoId: string }) {
  const router = useRouter();
  const itens = useCarrinho();
  const jaEsta = itens.some((i) => i.produto_id === produtoId);

  return (
    <button
      type="button"
      onClick={() => {
        if (!jaEsta) adicionar(produtoId);
        router.push("/carrinho");
      }}
      className="carimbo skew-brand w-full bg-gold px-10 py-5 font-display text-2xl font-black tracking-tight uppercase text-ink transition-colors hover:bg-gold-deep sm:w-auto"
    >
      <span className="unskew">{jaEsta ? "Ir pro carrinho" : "Comprar"}</span>
    </button>
  );
}

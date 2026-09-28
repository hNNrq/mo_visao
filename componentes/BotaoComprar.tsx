"use client";

import { useRouter } from "next/navigation";
import { adicionar } from "@/lib/carrinho";
import type { ItemCarrinho } from "@/lib/types";

/**
 * Põe a peça no carrinho e leva pra ele.
 *
 * Vai direto pro carrinho, sem "adicionado! continuar comprando?": numa loja de
 * poucos modelos quem aperta Comprar quase sempre quer UMA peça, e a tela do
 * carrinho já tem o "continuar olhando" pra quem quiser mais.
 */
export function BotaoComprar({
  item,
  disponivel,
}: {
  item: Omit<ItemCarrinho, "quantidade">;
  disponivel: number;
}) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        adicionar(item, disponivel);
        router.push("/carrinho");
      }}
      className="carimbo skew-brand w-full bg-gold px-10 py-5 font-display text-2xl font-black tracking-tight uppercase text-ink transition-colors hover:bg-gold-deep sm:w-auto"
    >
      <span className="unskew">Comprar</span>
    </button>
  );
}

"use client";

import { useCarrinho } from "@/lib/carrinho";

/**
 * Quantas peças estão no carrinho, ao lado do ícone.
 *
 * O Header é componente de servidor; só este pedaço lê o localStorage. Vazio
 * não mostra nada — um "0" na faixa é ruído.
 */
export function ContadorCarrinho() {
  const total = useCarrinho().reduce((s, i) => s + i.quantidade, 0);
  if (total === 0) return null;

  return (
    <span className="numeros font-mono text-xs font-bold tracking-normal text-gold">
      {total}
      <span className="sr-only"> {total === 1 ? "peça" : "peças"} no carrinho</span>
    </span>
  );
}

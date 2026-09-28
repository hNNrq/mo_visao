"use client";

import { useCarrinho } from "@/lib/carrinho";

/**
 * Quantas peças tem no carrinho, em cima do ícone do header.
 *
 * É a única ilha de cliente do header: o resto continua servidor. Sem peça, não
 * aparece nada — zero não é informação.
 */
export function ContadorCarrinho() {
  const n = useCarrinho().reduce((s, i) => s + i.quantidade, 0);
  if (n === 0) return null;
  return (
    <span className="numeros -ml-1 inline-flex h-5 min-w-5 items-center justify-center bg-gold px-1 font-mono text-[0.7rem] leading-none font-bold tracking-normal text-ink">
      {n}
      <span className="sr-only"> {n === 1 ? "peça" : "peças"}</span>
    </span>
  );
}

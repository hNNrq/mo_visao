"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Título que entra saindo do desfoque. Adaptado do `blur-in` do shadcn.
 *
 * ⚠️ Não traz classe de estilo própria, de propósito. O original tem corpo,
 * peso, `font-display` e `drop-shadow` embutidos e depende do `cn` com
 * tailwind-merge pra que a classe de quem usa ganhe o conflito. Aqui quem chama
 * já manda a tipografia inteira, e sombra é iluminação — que esta marca não usa.
 *
 * Com movimento reduzido ligado no sistema, o nome aparece parado.
 *
 * 🔴 O `initial` é SEMPRE o borrado, e o movimento reduzido só zera a duração.
 * No servidor o `useReducedMotion` não sabe a preferência e devolve `null`; se
 * o `initial` dependesse dele, o HTML do servidor sairia borrado e o cliente
 * hidrataria nítido — erro de hidratação.
 */
type BlurInProps = {
  word: string;
  className?: string;
  duration?: number;
};

export function BlurIn({ word, className, duration = 1 }: BlurInProps) {
  const reduzir = useReducedMotion();

  return (
    <motion.h1
      initial={{ filter: "blur(10px)", opacity: 0 }}
      animate={{ filter: "blur(0px)", opacity: 1 }}
      transition={{ duration: reduzir ? 0 : duration }}
      className={className}
    >
      {word}
    </motion.h1>
  );
}

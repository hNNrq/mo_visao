"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Frase que entra letra a letra, cortada em três fatias que passam de lado —
 * o OBTURADOR. Adaptado do `hero-shutter-text`.
 *
 * O que ficou de fora do original, de propósito: a grade de fundo, os cantos, o
 * botão de repetir e as cores índigo/esmeralda. A frase é um trecho da hero, não
 * uma hero inteira, e as fatias passam em ouro e papel, que são as cores da loja.
 *
 * ⚠️ **As letras se agrupam por PALAVRA.** O original quebra a frase em letras
 * soltas num `flex-wrap`, e aí a quebra de linha cai no meio da palavra. Aqui
 * cada palavra é um bloco que não quebra, e a linha só vira entre palavras.
 *
 * 🔴 **Nada aparece antes de `atraso`.** Todas as camadas nascem invisíveis e só
 * contam o tempo a partir dele — é assim que a frase espera o nome terminar.
 * O `initial` é igual no servidor e no cliente; o movimento reduzido só mexe na
 * `transition`, que não vai pro HTML, e por isso não dá erro de hidratação.
 * Pelo mesmo motivo as fatias são SEMPRE renderizadas: tirá-las com movimento
 * reduzido mudaria a árvore entre servidor (`null`) e cliente (`true`).
 *
 * O texto inteiro vai pro leitor de tela num `sr-only`; as letras animadas são
 * `aria-hidden`, senão a frase seria soletrada.
 */
type ObturadorProps = {
  texto: string;
  className?: string;
  /** Segundos de espera antes da primeira fatia passar. */
  atraso?: number;
};

const PASSO = 0.04;

export function Obturador({ texto, className, atraso = 0 }: ObturadorProps) {
  const reduzir = useReducedMotion();
  const palavras = texto.split(" ");

  // Índice corrido da letra na frase inteira, pra cascata não recomeçar a cada palavra.
  let indice = 0;

  return (
    <p className={className}>
      <span className="sr-only">{texto}</span>
      <span aria-hidden className="flex flex-wrap justify-center gap-x-[0.3em]">
        {palavras.map((palavra, p) => (
          <span key={p} className="inline-flex whitespace-nowrap">
            {palavra.split("").map((letra) => {
              const t = atraso + indice++ * PASSO;
              const fatia = (inicio: number, fim: number) => ({
                clipPath: `polygon(0 ${inicio}%, 100% ${inicio}%, 100% ${fim}%, 0 ${fim}%)`,
              });

              return (
                <span key={indice} className="relative inline-block overflow-hidden">
                  <motion.span
                    className="inline-block"
                    initial={{ opacity: 0, filter: "blur(10px)" }}
                    animate={{ opacity: 1, filter: "blur(0px)" }}
                    transition={
                      reduzir ? { duration: 0, delay: atraso } : { delay: t + 0.3, duration: 0.8 }
                    }
                  >
                    {letra}
                  </motion.span>

                  <motion.span
                    className="pointer-events-none absolute inset-0 text-gold"
                    style={fatia(0, 35)}
                    initial={{ x: "-100%", opacity: 0 }}
                    animate={{ x: "100%", opacity: [0, 1, 0] }}
                    transition={{ duration: reduzir ? 0 : 0.7, delay: t, ease: "easeInOut" }}
                  >
                    {letra}
                  </motion.span>
                  <motion.span
                    className="pointer-events-none absolute inset-0 text-paper"
                    style={fatia(35, 65)}
                    initial={{ x: "100%", opacity: 0 }}
                    animate={{ x: "-100%", opacity: [0, 1, 0] }}
                    transition={{ duration: reduzir ? 0 : 0.7, delay: t + 0.1, ease: "easeInOut" }}
                  >
                    {letra}
                  </motion.span>
                  <motion.span
                    className="pointer-events-none absolute inset-0 text-gold"
                    style={fatia(65, 100)}
                    initial={{ x: "-100%", opacity: 0 }}
                    animate={{ x: "100%", opacity: [0, 1, 0] }}
                    transition={{ duration: reduzir ? 0 : 0.7, delay: t + 0.2, ease: "easeInOut" }}
                  >
                    {letra}
                  </motion.span>
                </span>
              );
            })}
          </span>
        ))}
      </span>
    </p>
  );
}

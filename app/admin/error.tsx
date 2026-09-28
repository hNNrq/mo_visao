"use client";

import Link from "next/link";

/**
 * Rede de segurança do painel — para o que NÃO é previsto.
 *
 * Falta de permissão e sessão expirada não chegam aqui: viram <SemAcesso /> e
 * redirect, respectivamente (ver `lib/admin.ts`). O que sobra pra esta tela é
 * banco fora do ar, env faltando, bug.
 *
 * Ela não tenta adivinhar o motivo de propósito: em produção o Next apaga a
 * mensagem do erro de servidor antes de mandar pro cliente, e sobra só o
 * `digest`. Prometer diagnóstico aqui seria mentira — o `digest` é o que
 * localiza a linha nos logs de função da Netlify, então ele fica visível.
 */
export default function ErroDoPainel({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-[480px] px-5 py-16 sm:px-8">
      <h1 className="font-display text-3xl leading-none font-black tracking-tight uppercase text-paper">
        Não deu pra abrir essa tela
      </h1>

      <p className="mt-5 max-w-[42ch] font-sans text-lg leading-snug text-smoke">
        Alguma coisa falhou do lado do servidor. Tente de novo — se continuar, me
        chame.
      </p>

      <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
        <button
          type="button"
          onClick={reset}
          className="carimbo skew-brand bg-gold px-7 py-4 font-display text-lg font-black tracking-tight uppercase text-ink transition-colors hover:bg-gold-deep"
        >
          <span className="unskew">Tentar de novo</span>
        </button>

        <Link
          href="/admin/entrar"
          className="font-sans text-base tracking-[0.16em] uppercase text-smoke transition-colors hover:text-gold"
        >
          Entrar de novo
        </Link>
      </div>

      {error.digest && (
        <p className="numeros mt-12 font-sans text-sm tracking-[0.16em] uppercase text-smoke">
          código do erro: {error.digest}
        </p>
      )}
    </div>
  );
}

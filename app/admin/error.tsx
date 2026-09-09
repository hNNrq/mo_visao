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
 * localiza a linha nos logs da Vercel, então ele fica visível.
 */
export default function ErroDoPainel({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-md px-5 py-16 text-center">
      <h1 className="font-display text-2xl font-black uppercase">
        Não deu pra abrir essa tela
      </h1>

      <p className="mt-4 font-sans text-white/60">
        Alguma coisa falhou do lado do servidor. Tente de novo — se continuar,
        me chame.
      </p>

      <div className="mt-8 flex flex-col items-center gap-4">
        <button
          type="button"
          onClick={reset}
          className="skew-brand bg-hot px-8 py-4 font-display text-lg font-black uppercase text-white transition-colors hover:bg-hot-dark"
        >
          <span className="unskew">Tentar de novo</span>
        </button>

        <Link
          href="/admin/entrar"
          className="font-sans text-white/50 underline underline-offset-4 hover:text-white"
        >
          Entrar de novo
        </Link>
      </div>

      {error.digest && (
        <p className="mt-10 font-mono text-xs text-white/25">
          código do erro: {error.digest}
        </p>
      )}
    </div>
  );
}

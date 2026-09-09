"use client";

import { useActionState } from "react";
import { entrar, type Resultado } from "@/app/admin/acoes";

const inicial: Resultado = { ok: false };

export function FormLogin() {
  const [estado, acao, enviando] = useActionState(entrar, inicial);

  return (
    <form action={acao} className="flex flex-col gap-5">
      <label className="flex flex-col gap-2">
        <span className="font-display text-sm font-bold tracking-wider uppercase text-white/60">
          E-mail
        </span>
        <input
          type="email"
          name="email"
          required
          autoComplete="username"
          inputMode="email"
          className="rounded border border-white/15 bg-ink px-4 py-4 font-sans text-lg text-white outline-none focus:border-hot"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="font-display text-sm font-bold tracking-wider uppercase text-white/60">
          Senha
        </span>
        <input
          type="password"
          name="senha"
          required
          autoComplete="current-password"
          className="rounded border border-white/15 bg-ink px-4 py-4 font-sans text-lg text-white outline-none focus:border-hot"
        />
      </label>

      {estado.erro && (
        <p
          role="alert"
          className="rounded border border-hot/40 bg-hot/10 px-4 py-3 font-sans text-base text-white"
        >
          {estado.erro}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="skew-brand mt-2 bg-hot px-8 py-5 font-display text-xl font-black uppercase text-white transition-colors hover:bg-hot-dark disabled:opacity-60"
      >
        <span className="unskew">{enviando ? "Entrando..." : "Entrar"}</span>
      </button>
    </form>
  );
}

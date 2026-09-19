"use client";

import { useActionState } from "react";
import { entrar, type Resultado } from "@/app/admin/acoes";
import { Aviso } from "@/componentes/admin/Aviso";
import { botao, campo, rotulo } from "@/componentes/admin/campos";

const inicial: Resultado = { ok: false };

export function FormLogin() {
  const [estado, acao, enviando] = useActionState(entrar, inicial);

  return (
    <form action={acao} className="flex flex-col gap-6">
      <label className="flex flex-col gap-2">
        <span className={rotulo}>E-mail</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="username"
          inputMode="email"
          className={campo}
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className={rotulo}>Senha</span>
        <input
          type="password"
          name="senha"
          required
          autoComplete="current-password"
          className={campo}
        />
      </label>

      {estado.erro && (
        <p role="alert">
          <Aviso>{estado.erro}</Aviso>
        </p>
      )}

      <button type="submit" disabled={enviando} className={`${botao} mt-1 self-start`}>
        <span className="unskew">{enviando ? "Entrando..." : "Entrar"}</span>
      </button>
    </form>
  );
}

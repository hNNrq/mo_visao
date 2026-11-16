"use client";

import { useActionState } from "react";
import { alterarSenha, type Resultado } from "@/app/admin/acoes";
import { Aviso } from "@/componentes/admin/Aviso";
import {
  botao,
  campo,
  carimboOk,
  dica,
  rotulo,
} from "@/componentes/admin/campos";

const inicial: Resultado = { ok: false };

export function FormSenha() {
  const [estado, acao, enviando] = useActionState(alterarSenha, inicial);

  return (
    <form action={acao} className="flex max-w-[560px] flex-col gap-7">
      <label className="flex flex-col gap-2">
        <span className={rotulo}>Senha atual</span>
        <input
          type="password"
          name="atual"
          required
          autoComplete="current-password"
          className={campo}
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className={rotulo}>Senha nova</span>
        <input
          type="password"
          name="nova"
          required
          minLength={8}
          autoComplete="new-password"
          className={campo}
        />
        <span className={dica}>Pelo menos 8 caracteres. Só você precisa saber.</span>
      </label>

      <label className="flex flex-col gap-2">
        <span className={rotulo}>Repita a senha nova</span>
        <input
          type="password"
          name="confirmacao"
          required
          minLength={8}
          autoComplete="new-password"
          className={campo}
        />
      </label>

      {estado.ok && !estado.erro && (
        <p role="status">
          <span className={carimboOk}>
            <span className="unskew">Senha alterada</span>
          </span>
        </p>
      )}

      {estado.erro && (
        <p role="alert">
          <Aviso>{estado.erro}</Aviso>
        </p>
      )}

      <button type="submit" disabled={enviando} className={`${botao} self-start`}>
        <span className="unskew">{enviando ? "Alterando..." : "Alterar senha"}</span>
      </button>
    </form>
  );
}

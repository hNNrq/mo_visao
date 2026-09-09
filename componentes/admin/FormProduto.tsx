"use client";

import { useActionState } from "react";
import { salvarProduto, type Resultado } from "@/app/admin/acoes";
import type { Produto } from "@/lib/types";

const inicial: Resultado = { ok: false };

const rotulo =
  "font-display text-sm font-bold tracking-wider uppercase text-white/60";
const campo =
  "rounded border border-white/15 bg-ink px-4 py-4 font-sans text-lg text-white outline-none focus:border-hot";

export function FormProduto({ produto }: { produto?: Produto }) {
  const [estado, acao, enviando] = useActionState(salvarProduto, inicial);

  return (
    <form action={acao} className="flex flex-col gap-5">
      {produto && <input type="hidden" name="id" value={produto.id} />}

      <label className="flex flex-col gap-2">
        <span className={rotulo}>Nome do óculos</span>
        <input
          name="nome"
          required
          defaultValue={produto?.nome ?? ""}
          placeholder="Oakley Radar EV"
          className={campo}
        />
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className={rotulo}>Preço</span>
          <input
            name="preco"
            required
            inputMode="decimal"
            defaultValue={
              produto ? (produto.preco_centavos / 100).toFixed(2).replace(".", ",") : ""
            }
            placeholder="349,90"
            className={campo}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className={rotulo}>Quantidade em estoque</span>
          <input
            name="estoque"
            required
            inputMode="numeric"
            defaultValue={produto?.estoque ?? 1}
            className={campo}
          />
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className={rotulo}>Marca</span>
          <input
            name="marca"
            defaultValue={produto?.marca ?? "Oakley"}
            className={campo}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className={rotulo}>Modelo</span>
          <input
            name="modelo"
            defaultValue={produto?.modelo ?? ""}
            placeholder="Prizm Road"
            className={campo}
          />
        </label>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className={rotulo}>Tipo</legend>
        <div className="mt-1 flex gap-3">
          {(["corrida", "rua"] as const).map((valor) => (
            <label
              key={valor}
              className="flex flex-1 cursor-pointer items-center gap-3 rounded border border-white/15 px-4 py-4 font-sans text-lg has-checked:border-hot has-checked:bg-hot/10"
            >
              <input
                type="radio"
                name="categoria"
                value={valor}
                defaultChecked={(produto?.categoria ?? "rua") === valor}
                className="accent-hot"
              />
              {valor === "corrida" ? "Corrida" : "Rua"}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex flex-col gap-2">
        <span className={rotulo}>Descrição</span>
        <textarea
          name="descricao"
          rows={4}
          defaultValue={produto?.descricao ?? ""}
          placeholder="Pra que serve, quando usar, o que tem de diferente."
          className={campo}
        />
        <span className="font-sans text-sm text-white/40">
          Escreva como você explicaria pro cliente no balcão. Isso também ajuda o
          óculos a aparecer no Google.
        </span>
      </label>

      <label className="flex cursor-pointer items-center gap-3 rounded border border-white/15 px-4 py-4">
        <input
          type="checkbox"
          name="destaque"
          defaultChecked={produto?.destaque ?? false}
          className="h-5 w-5 accent-hot"
        />
        <span className="font-sans text-lg">Mostrar na página inicial</span>
      </label>

      {estado.erro && (
        <p
          role="alert"
          className="rounded border border-hot/40 bg-hot/10 px-4 py-3 font-sans text-white"
        >
          {estado.erro}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="skew-brand mt-2 bg-hot px-8 py-5 font-display text-xl font-black uppercase text-white transition-colors hover:bg-hot-dark disabled:opacity-60"
      >
        <span className="unskew">
          {enviando ? "Salvando..." : produto ? "Salvar alterações" : "Cadastrar óculos"}
        </span>
      </button>
    </form>
  );
}

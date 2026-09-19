"use client";

import { useActionState } from "react";
import { salvarProduto, type Resultado } from "@/app/admin/acoes";
import { Aviso } from "@/componentes/admin/Aviso";
import { botao, campo, dica, rotulo } from "@/componentes/admin/campos";
import type { Produto } from "@/lib/types";

const inicial: Resultado = { ok: false };

export function FormProduto({ produto }: { produto?: Produto }) {
  const [estado, acao, enviando] = useActionState(salvarProduto, inicial);

  return (
    <form action={acao} className="flex max-w-[640px] flex-col gap-6">
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

      <div className="grid gap-6 sm:grid-cols-2">
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
            className={`${campo} numeros`}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className={rotulo}>Quantidade em estoque</span>
          <input
            name="estoque"
            required
            inputMode="numeric"
            defaultValue={produto?.estoque ?? 1}
            className={`${campo} numeros`}
          />
        </label>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
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

      {/* ⚠️ O campo "Tipo" (Rua / Corrida) saiu em set/2026, a pedido do
          Henrique: a loja não separa óculos por tipo. A coluna `categoria`
          continua no banco com o default dela, e o dono não precisa mais
          responder uma pergunta que não muda nada na loja. Não recriar. */}

      <label className="flex flex-col gap-2">
        <span className={rotulo}>Descrição</span>
        <textarea
          name="descricao"
          rows={4}
          defaultValue={produto?.descricao ?? ""}
          placeholder="Pra que serve, quando usar, o que tem de diferente."
          className={campo}
        />
        <span className={dica}>
          Escreva como você explicaria pro cliente no balcão. Isso também ajuda o
          óculos a aparecer no Google.
        </span>
      </label>

      <label className="skew-brand flex cursor-pointer items-center gap-3 self-start bg-paper/8 px-7 py-3 font-display text-base font-black tracking-tight uppercase text-paper/55 transition-colors has-checked:bg-paper has-checked:text-ink has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-gold">
        <input
          type="checkbox"
          name="destaque"
          defaultChecked={produto?.destaque ?? false}
          className="sr-only"
        />
        <span className="unskew">Mostrar na página inicial</span>
      </label>

      {estado.erro && (
        <p role="alert">
          <Aviso>{estado.erro}</Aviso>
        </p>
      )}

      <button type="submit" disabled={enviando} className={`${botao} mt-1 self-start`}>
        <span className="unskew">
          {enviando ? "Salvando..." : produto ? "Salvar alterações" : "Cadastrar óculos"}
        </span>
      </button>
    </form>
  );
}

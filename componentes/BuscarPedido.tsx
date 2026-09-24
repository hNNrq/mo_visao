"use client";

import { startTransition, useActionState } from "react";
import { buscarPedido } from "@/app/(loja)/pedidos/acoes";

const campo =
  "w-full bg-steel px-4 py-4 font-sans text-lg text-paper outline-none placeholder:text-smoke";

/** Número + email do pedido → a página do pedido. */
export function BuscarPedido() {
  const [estado, acao, buscando] = useActionState(buscarPedido, { erro: null as string | null });

  return (
    <section aria-labelledby="buscar">
      <h2 id="buscar" className="font-sans text-sm tracking-[0.16em] text-smoke uppercase">
        Buscar um pedido
      </h2>
      {/* onSubmit, e não `action`: com `action` o React limpa o formulário
          ao terminar, e quem errou o email perdia o número do pedido junto */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const dados = new FormData(e.currentTarget);
          startTransition(() => acao(dados));
        }}
        className="mt-4 flex max-w-[520px] flex-col gap-5"
      >
        <label className="flex flex-col gap-2">
          <span className="font-sans text-base text-paper">Número do pedido</span>
          <input
            name="numero"
            required
            placeholder="MV-00012"
            autoCapitalize="characters"
            className={`${campo} numeros`}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="font-sans text-base text-paper">Email usado na compra</span>
          <input name="email" required type="email" inputMode="email" autoComplete="email" className={campo} />
        </label>

        {estado.erro && (
          <p role="alert" className="flex items-start gap-3 font-sans text-lg leading-snug text-paper">
            <span aria-hidden className="mt-1.5 inline-block h-4 w-1.5 shrink-0 -skew-x-12 bg-gold" />
            {estado.erro}
          </p>
        )}

        <button
          type="submit"
          disabled={buscando}
          className="skew-brand self-start bg-gold px-8 py-4 font-display text-xl font-black tracking-tight uppercase text-ink transition-colors hover:bg-gold-deep disabled:opacity-55"
        >
          <span className="unskew">{buscando ? "Buscando…" : "Buscar"}</span>
        </button>
      </form>
    </section>
  );
}

"use client";

import { useState, useTransition } from "react";
import { mudarStatusPedido } from "@/app/admin/acoes";
import { precoBRL } from "@/lib/format";
import type { PedidoComItens } from "@/app/admin/(painel)/pedidos/page";
import type { PedidoStatus } from "@/lib/types";

/** O que ele pode fazer a partir de cada estado — nada de dropdown com tudo. */
const PROXIMO: Partial<Record<PedidoStatus, { valor: string; texto: string }[]>> = {
  pago: [
    { valor: "separado", texto: "Marcar como separado" },
    { valor: "cancelado", texto: "Cancelar e devolver ao estoque" },
  ],
  separado: [
    { valor: "entregue", texto: "Marcar como entregue" },
    { valor: "cancelado", texto: "Cancelar e devolver ao estoque" },
  ],
  entregue: [],
  cancelado: [],
  expirado: [],
  pendente: [],
};

const CORES: Record<string, string> = {
  pago: "border-hot/60 bg-hot/15 text-white",
  separado: "border-white/30 text-white",
  entregue: "border-white/15 text-white/50",
  cancelado: "border-white/15 text-white/40",
  expirado: "border-white/15 text-white/40",
};

const NOMES: Record<string, string> = {
  pago: "Pago — separar",
  separado: "Separado",
  entregue: "Entregue",
  cancelado: "Cancelado",
  expirado: "Expirado",
};

export function ListaPedidos({ pedidos }: { pedidos: PedidoComItens[] }) {
  return (
    <ul className="flex flex-col gap-4">
      {pedidos.map((p) => (
        <CartaoPedido key={p.id} pedido={p} />
      ))}
    </ul>
  );
}

function CartaoPedido({ pedido }: { pedido: PedidoComItens }) {
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();

  const acoes = PROXIMO[pedido.status] ?? [];
  const entrega = pedido.entrega as Record<string, string>;

  return (
    <li
      className={`rounded border border-white/10 bg-steel p-4 ${
        pendente ? "opacity-60" : ""
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-xl font-bold uppercase">{pedido.numero}</p>
          <p className="font-sans text-sm text-white/45">
            {new Date(pedido.created_at).toLocaleString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })}
            {pedido.metodo_pagamento && ` · ${pedido.metodo_pagamento}`}
          </p>
        </div>

        <span
          className={`rounded border px-3 py-1 font-display text-sm font-bold uppercase ${
            CORES[pedido.status] ?? "border-white/15 text-white/50"
          }`}
        >
          {NOMES[pedido.status] ?? pedido.status}
        </span>
      </div>

      <ul className="mt-4 flex flex-col gap-1 border-t border-white/10 pt-3">
        {pedido.itens?.map((item) => (
          <li key={item.id} className="flex justify-between gap-3 font-sans">
            <span className="text-white/80">
              {item.quantidade}x {item.nome_snapshot}
            </span>
            <span className="shrink-0 text-white/60">
              {precoBRL(item.preco_snapshot_centavos * item.quantidade)}
            </span>
          </li>
        ))}
        <li className="mt-2 flex justify-between gap-3 border-t border-white/10 pt-2 font-display text-lg font-bold">
          <span>Total</span>
          <span className="text-hot">{precoBRL(pedido.total_centavos)}</span>
        </li>
      </ul>

      <div className="mt-4 border-t border-white/10 pt-3 font-sans text-sm text-white/70">
        <p className="text-white">{pedido.cliente_nome}</p>
        <p>
          <a href={`tel:${pedido.cliente_telefone}`} className="underline underline-offset-4">
            {pedido.cliente_telefone}
          </a>
          {" · "}
          <a href={`mailto:${pedido.cliente_email}`} className="underline underline-offset-4">
            {pedido.cliente_email}
          </a>
        </p>
        <p className="mt-1 text-white/50">
          {pedido.entrega_tipo === "retirada"
            ? "Retirada"
            : pedido.entrega_tipo === "correios"
              ? "Envio pelos Correios"
              : "Entrega na região"}
          {entrega?.endereco ? ` · ${entrega.endereco}` : ""}
        </p>
      </div>

      {acoes.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {acoes.map((a) => (
            <button
              key={a.valor}
              type="button"
              onClick={() => {
                setErro(null);
                iniciar(async () => {
                  const r = await mudarStatusPedido(pedido.id, a.valor);
                  if (!r.ok) setErro(r.erro ?? "Não deu certo.");
                });
              }}
              className={`rounded px-4 py-3 font-display text-sm font-bold uppercase transition-colors ${
                a.valor === "cancelado"
                  ? "border border-white/20 text-white/60 hover:text-hot"
                  : "bg-hot text-white hover:bg-hot-dark"
              }`}
            >
              {a.texto}
            </button>
          ))}
        </div>
      )}

      {erro && (
        <p role="alert" className="mt-3 font-sans text-sm text-hot">
          {erro}
        </p>
      )}
    </li>
  );
}

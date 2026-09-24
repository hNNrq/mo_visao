"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { pedidosLembrados, type PedidoLembrado } from "@/lib/carrinho";

const naoAssina = () => () => {};
const NENHUM: PedidoLembrado[] = [];
let cache: { chave: string; lista: PedidoLembrado[] } = { chave: "", lista: NENHUM };

// useSyncExternalStore pede a mesma referência enquanto nada mudou
function ler(): PedidoLembrado[] {
  const lista = pedidosLembrados();
  const chave = lista.map((p) => p.numero).join(",");
  if (chave !== cache.chave) cache = { chave, lista };
  return cache.lista;
}

/** Os pedidos feitos neste aparelho. Vêm do localStorage, não do servidor. */
export function PedidosNoAparelho() {
  const pedidos = useSyncExternalStore(naoAssina, ler, () => NENHUM);

  return (
    <section aria-labelledby="neste-aparelho">
      <h2 id="neste-aparelho" className="font-sans text-sm tracking-[0.16em] text-smoke uppercase">
        Feitos neste aparelho
      </h2>

      {pedidos.length === 0 ? (
        <p className="mt-4 max-w-[40ch] font-sans text-xl leading-snug text-smoke">
          Nenhum pedido por aqui. Se você comprou em outro aparelho, busca pelo
          número e email.
        </p>
      ) : (
        <ul className="mt-4 border-t regua">
          {pedidos.map((p) => (
            <li key={p.numero} className="border-b regua">
              <Link
                href={`/pedido/${p.numero}?k=${p.token}`}
                className="flex min-h-14 items-center justify-between gap-4 py-4 transition-colors hover:text-gold"
              >
                <span className="numeros font-mono text-xl text-paper">{p.numero}</span>
                <span className="numeros font-sans text-base text-smoke">
                  {new Date(p.criado).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

import type { Metadata } from "next";
import { BuscarPedido } from "@/componentes/BuscarPedido";
import { PedidosNoAparelho } from "@/componentes/PedidosNoAparelho";

export const metadata: Metadata = { title: "Meus pedidos", robots: { index: false } };

/**
 * "Meus pedidos" sem conta.
 *
 * Duas portas: os pedidos feitos neste aparelho (lembrados no navegador) e a
 * busca por número + email, pra quem comprou no celular e abriu no computador,
 * ou limpou o navegador.
 */
export default function PaginaPedidos() {
  return (
    <main className="bg-ink px-5 pt-28 pb-24 sm:px-10 sm:pt-32">
      <div className="mx-auto max-w-[1600px]">
        <h1 className="font-display text-[clamp(2.5rem,7vw,5rem)] leading-[0.9] font-black tracking-tight uppercase text-paper">
          Meus pedidos
        </h1>

        <div className="mt-10 grid gap-14 lg:grid-cols-2 lg:gap-20">
          <PedidosNoAparelho />
          <BuscarPedido />
        </div>
      </div>
    </main>
  );
}

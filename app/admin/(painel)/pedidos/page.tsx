import { exigirAdminNaPagina } from "@/lib/admin";
import { SemAcesso } from "@/componentes/admin/SemAcesso";
import { ListaPedidos } from "@/componentes/admin/ListaPedidos";
import type { Pedido, PedidoItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export type PedidoComItens = Pedido & { itens: PedidoItem[] };

export default async function PaginaPedidos() {
  const { supabase, admin, user } = await exigirAdminNaPagina();
  if (!admin) return <SemAcesso email={user.email} />;

  const { data } = await supabase
    .from("pedidos")
    .select(
      `id, numero, status, cliente_nome, cliente_email, cliente_telefone,
       entrega_tipo, entrega, subtotal_centavos, frete_centavos,
       desconto_centavos, total_centavos, mp_preference_id, mp_payment_id,
       metodo_pagamento, pago_em, expira_em, created_at,
       itens:pedido_itens ( id, pedido_id, produto_id, nome_snapshot,
                            preco_snapshot_centavos, quantidade )`
    )
    // pendente é ruído: ou vira pago pelo webhook, ou expira sozinho
    .neq("status", "pendente")
    .order("created_at", { ascending: false })
    .limit(100);

  const pedidos = (data ?? []) as unknown as PedidoComItens[];

  return (
    <div>
      <h1 className="font-display text-3xl font-black uppercase">Pedidos</h1>
      <p className="mt-1 mb-6 font-sans text-white/50">
        {pedidos.length === 0
          ? "Nenhum pedido ainda"
          : `${pedidos.length} ${pedidos.length === 1 ? "pedido" : "pedidos"}`}
      </p>

      {pedidos.length === 0 ? (
        <div className="rounded border border-dashed border-white/20 px-6 py-14 text-center">
          <p className="font-display text-xl font-bold uppercase text-white/70">
            Ainda não entrou pedido
          </p>
          <p className="mx-auto mt-3 max-w-[42ch] font-sans text-white/50">
            Quando alguém comprar e o pagamento for confirmado, o pedido aparece
            aqui com o contato e o endereço.
          </p>
        </div>
      ) : (
        <ListaPedidos pedidos={pedidos} />
      )}
    </div>
  );
}

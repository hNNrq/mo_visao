import { exigirAdminNaPagina } from "@/lib/admin";
import { Cabecalho } from "@/componentes/admin/Cabecalho";
import { SemAcesso } from "@/componentes/admin/SemAcesso";
import { ListaPedidos } from "@/componentes/admin/ListaPedidos";
import { Vazio } from "@/componentes/admin/Vazio";
import { urlDoSite } from "@/lib/mercadopago";
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
       metodo_pagamento, pagamento_escolhido, mp_checkout_url, precisa_estorno,
       pago_em, expira_em, created_at,
       itens:pedido_itens ( id, pedido_id, produto_id, nome_snapshot,
                            preco_snapshot_centavos, quantidade )`
    )
    // pendente é ruído: ou vira pago pelo webhook, ou expira sozinho
    .neq("status", "pendente")
    .order("created_at", { ascending: false })
    .limit(100);

  const pedidos = (data ?? []) as unknown as PedidoComItens[];

  // o número que muda o dia dele é quantos estão esperando ser separados
  const separar = pedidos.filter((p) => p.status === "pago").length;
  const estornar = pedidos.filter((p) => p.precisa_estorno && p.status === "expirado").length;

  const contagem = [
    `${pedidos.length} ${pedidos.length === 1 ? "pedido" : "pedidos"}`,
    separar > 0 ? `${separar} pra separar` : null,
    estornar > 0 ? `${estornar} pra estornar` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div>
      <Cabecalho
        titulo="Pedidos"
        contagem={pedidos.length === 0 ? undefined : contagem}
      />

      {pedidos.length === 0 ? (
        <Vazio
          titulo="Ainda não entrou pedido"
          texto="Quando alguém comprar e o pagamento for confirmado, o pedido aparece aqui com o contato e o endereço."
        />
      ) : (
        <ListaPedidos pedidos={pedidos} site={urlDoSite()} />
      )}
    </div>
  );
}

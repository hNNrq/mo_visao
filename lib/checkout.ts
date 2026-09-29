import "server-only";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { buscarPagamento } from "@/lib/mercadopago";
import type { EntregaTipo, PedidoStatus, ResultadoConfirmacao } from "@/lib/types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function ehUuid(valor: string): boolean {
  return UUID.test(valor);
}

/**
 * O que o CLIENTE vê do pedido dele.
 *
 * O link do pedido é o id (UUID), e não o número "MV-00012": número sequencial
 * se adivinha, e o pedido carrega nome, telefone e endereço. Mesmo assim, o
 * que sai daqui é o mínimo pra pessoa acompanhar — sem email nem telefone.
 */
export type PedidoPublico = {
  id: string;
  numero: string;
  status: PedidoStatus;
  cliente_nome: string;
  entrega_tipo: EntregaTipo;
  pagamento_escolhido: "pix" | "cartao" | null;
  subtotal_centavos: number;
  frete_centavos: number;
  desconto_centavos: number;
  total_centavos: number;
  mp_checkout_url: string | null;
  precisa_estorno: boolean;
  pago_em: string | null;
  expira_em: string;
  created_at: string;
  itens: { nome_snapshot: string; preco_snapshot_centavos: number; quantidade: number }[];
};

const SELECT_PUBLICO = `id, numero, status, cliente_nome, entrega_tipo, pagamento_escolhido,
  subtotal_centavos, frete_centavos, desconto_centavos, total_centavos,
  mp_checkout_url, precisa_estorno, pago_em, expira_em, created_at,
  itens:pedido_itens ( nome_snapshot, preco_snapshot_centavos, quantidade )`;

export async function lerPedidoPublico(id: string): Promise<PedidoPublico | null> {
  if (!ehUuid(id)) return null;
  const { data } = await criarClienteAdmin()
    .from("pedidos")
    .select(SELECT_PUBLICO)
    .eq("id", id)
    .maybeSingle();
  return (data as unknown as PedidoPublico) ?? null;
}

export async function lerPedidosPublicos(ids: string[]): Promise<PedidoPublico[]> {
  const validos = ids.filter(ehUuid).slice(0, 30);
  if (validos.length === 0) return [];
  const { data } = await criarClienteAdmin()
    .from("pedidos")
    .select(SELECT_PUBLICO)
    .in("id", validos)
    .order("created_at", { ascending: false });
  return (data as unknown as PedidoPublico[]) ?? [];
}

/**
 * Relê o pagamento na API do Mercado Pago e, se aprovado, confirma o pedido.
 *
 * Chamado de dois lugares, de propósito:
 *   - pelo webhook, que é o caminho normal
 *   - pela página do pedido, quando o cliente volta do Mercado Pago com o
 *     `payment_id` na URL — cobre o webhook atrasado ou mal configurado, que
 *     deixaria a pessoa olhando "aguardando pagamento" depois de pagar
 *
 * Os dois podem chegar juntos. Não tem problema: `confirmar_pedido` trava a
 * linha do pedido e a segunda chamada volta 'ja_processado'.
 *
 * Nada aqui confia no que veio na requisição. O status, o valor e o pedido
 * saem da resposta da API do Mercado Pago, lida com o token do servidor.
 */
export async function sincronizarPagamento(
  paymentId: string,
): Promise<ResultadoConfirmacao | "ignorado"> {
  if (!/^\d+$/.test(paymentId)) return "ignorado";

  const pagamento = await buscarPagamento(paymentId);
  const pedidoId = pagamento.external_reference ?? "";
  if (!ehUuid(pedidoId)) return "ignorado";

  const supabase = criarClienteAdmin();

  // registro de auditoria; a idempotência de verdade é do confirmar_pedido
  await supabase.from("mp_eventos").upsert(
    {
      id: `${paymentId}:${pagamento.status}`,
      payment_id: paymentId,
      tipo: pagamento.status,
      payload: {
        status: pagamento.status,
        status_detail: pagamento.status_detail,
        valor: pagamento.transaction_amount,
        metodo: pagamento.payment_method_id,
        pedido: pedidoId,
      },
    },
    { onConflict: "id", ignoreDuplicates: true },
  );

  if (pagamento.status !== "approved") return "ignorado";

  const { data: pedido } = await supabase
    .from("pedidos")
    .select("total_centavos")
    .eq("id", pedidoId)
    .maybeSingle();
  if (!pedido) return "ignorado";

  // pagou menos que o pedido: não confirma, e o dono vê o evento no banco
  const pagoCentavos = Math.round((pagamento.transaction_amount ?? 0) * 100);
  if (pagoCentavos < pedido.total_centavos) {
    console.error(
      `[checkout] pagamento ${paymentId} de ${pagoCentavos} centavos não cobre o pedido ${pedidoId} (${pedido.total_centavos})`,
    );
    return "ignorado";
  }

  const { data, error } = await supabase.rpc("confirmar_pedido", {
    p_pedido_id: pedidoId,
    p_payment_id: paymentId,
    p_metodo: pagamento.payment_type_id ?? pagamento.payment_method_id ?? null,
  });
  if (error) throw error;

  const resultado = data as ResultadoConfirmacao;
  if (resultado === "sem_estoque") {
    console.error(
      `[checkout] pedido ${pedidoId} pago depois de expirar e sem peça — precisa estorno`,
    );
  }
  return resultado;
}

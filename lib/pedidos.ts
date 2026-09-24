import "server-only";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { buscarPagamento } from "@/lib/mercadopago";
import { emailEstornar, emailPedidoPagoCliente, emailPedidoPagoDono } from "@/lib/email";
import type { Pedido, PedidoItem, ResultadoConfirmacao } from "@/lib/types";

export type PedidoComItens = Pedido & { itens: PedidoItem[] };

const SELECT_PEDIDO = `
  id, numero, status, cliente_nome, cliente_email, cliente_telefone,
  entrega_tipo, entrega, subtotal_centavos, frete_centavos, desconto_centavos,
  total_centavos, mp_preference_id, mp_payment_id, mp_init_point,
  metodo_pagamento, alerta, pago_em, expira_em, created_at, token,
  itens:pedido_itens ( id, pedido_id, produto_id, nome_snapshot,
                       preco_snapshot_centavos, quantidade )
`;

/**
 * O pedido que o cliente vê em /pedido/[numero]?k=token.
 *
 * Lido com service_role porque pedido não é público no RLS (tem nome, telefone
 * e endereço). Quem abre a porta é o token: sem ele, o número sozinho não mostra
 * nada — número é sequencial e se adivinha.
 */
export async function buscarPedidoPorToken(
  numero: string,
  token: string,
): Promise<PedidoComItens | null> {
  if (!/^MV-\d+$/.test(numero) || !/^[a-f0-9]{64}$/.test(token)) return null;

  const { data } = await criarClienteAdmin()
    .from("pedidos")
    .select(SELECT_PEDIDO)
    .eq("numero", numero)
    .eq("token", token)
    .maybeSingle();

  return (data as unknown as PedidoComItens) ?? null;
}

async function buscarPedidoPorId(id: string): Promise<PedidoComItens | null> {
  const { data } = await criarClienteAdmin()
    .from("pedidos")
    .select(SELECT_PEDIDO)
    .eq("id", id)
    .maybeSingle();
  return (data as unknown as PedidoComItens) ?? null;
}

async function emailDoDono(): Promise<string | null> {
  if (process.env.EMAIL_DONO) return process.env.EMAIL_DONO;
  const { data } = await criarClienteAdmin()
    .from("config")
    .select("valor")
    .eq("chave", "email_contato")
    .maybeSingle();
  const v = typeof data?.valor === "string" ? data.valor.trim() : "";
  return v.includes("@") ? v : null;
}

export type ResultadoPagamento =
  | ResultadoConfirmacao
  | "nao_aprovado"
  | "pedido_desconhecido"
  | "valor_divergente";

/**
 * Relê o pagamento no Mercado Pago e, se aprovado, confirma o pedido.
 *
 * Chamado por dois caminhos, e os dois podem acontecer pro mesmo pagamento:
 *   - o webhook (o caminho oficial, que chega mesmo se o cliente fechar a aba)
 *   - a página do pedido, quando o cliente volta do MP com `payment_id` na URL
 *     (chega antes do webhook, às vezes, e em localhost é o único caminho)
 *
 * Quem impede a baixa dupla é o `confirmar_pedido()` no banco, que trava a
 * linha do pedido e devolve 'ja_processado' pro segundo. O email só sai pra
 * quem recebeu 'confirmado' — por isso também não duplica.
 *
 * `pedidoEsperado`: quando quem chama já sabe de qual pedido é (a página do
 * pedido), um payment_id colado na URL de outro pedido não confirma nada.
 */
export async function processarPagamento(
  paymentId: string,
  pedidoEsperado?: string,
): Promise<ResultadoPagamento> {
  const pagamento = await buscarPagamento(paymentId);

  const pedidoId = pagamento.external_reference;
  if (!pedidoId || (pedidoEsperado && pedidoId !== pedidoEsperado)) return "pedido_desconhecido";
  if (pagamento.status !== "approved") return "nao_aprovado";

  const pedido = await buscarPedidoPorId(pedidoId);
  if (!pedido) return "pedido_desconhecido";

  // O pagamento nasceu da preferência que a loja montou, com o preço do banco.
  // Conferir de novo custa uma linha e fecha a porta pra qualquer surpresa.
  const pagoCentavos = Math.round((pagamento.transaction_amount ?? 0) * 100);
  if (pagoCentavos < pedido.total_centavos) {
    console.error(
      `[pagamento] ${pedido.numero}: pago ${pagoCentavos}, esperado ${pedido.total_centavos}`,
    );
    return "valor_divergente";
  }

  const metodo =
    pagamento.payment_method_id === "pix" ? "pix" : (pagamento.payment_type_id ?? null);

  const { data, error } = await criarClienteAdmin().rpc("confirmar_pedido", {
    p_pedido_id: pedidoId,
    p_payment_id: String(pagamento.id),
    p_metodo: metodo,
  });
  if (error) throw error;

  const resultado = data as ResultadoConfirmacao;

  if (resultado === "confirmado" || resultado === "sem_estoque") {
    const atualizado = (await buscarPedidoPorId(pedidoId)) ?? pedido;
    const dono = await emailDoDono();

    if (resultado === "confirmado") {
      await Promise.all([
        emailPedidoPagoCliente(atualizado, dono ?? undefined),
        dono ? emailPedidoPagoDono(atualizado, dono) : null,
      ]);
    } else if (dono && !pedido.alerta) {
      // 'sem_estoque' se repete a cada reenvio do MP; o alerta já gravado é o
      // sinal de que o dono já foi avisado
      await emailEstornar(atualizado, dono);
    }
  }

  return resultado;
}

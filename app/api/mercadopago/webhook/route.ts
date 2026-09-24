import type { NextRequest } from "next/server";
import { assinaturaValida } from "@/lib/mercadopago";
import { processarPagamento } from "@/lib/pedidos";
import { criarClienteAdmin } from "@/lib/supabase/admin";

/**
 * Notificação do Mercado Pago.
 *
 * Regras do jogo:
 *  - O corpo da notificação não é confiável. Ele só diz "olha o pagamento X";
 *    o que o pagamento É sai da API do MP, relida com o token da loja.
 *  - O MP reenvia a mesma notificação várias vezes. O banco é idempotente
 *    (`confirmar_pedido` devolve 'ja_processado'), então reenviar não baixa
 *    estoque de novo nem manda email de novo.
 *  - Resposta 200 = "recebi, pode parar". Erro nosso (banco fora, API do MP
 *    fora) devolve 500 de propósito, pra ele tentar de novo mais tarde.
 */
export async function POST(request: NextRequest) {
  const url = request.nextUrl;
  let corpo: Record<string, unknown> = {};
  try {
    corpo = await request.json();
  } catch {
    // o formato antigo (IPN) às vezes vem sem corpo, só com query string
  }

  const tipo = String(corpo.type ?? url.searchParams.get("type") ?? url.searchParams.get("topic") ?? "");
  const dados = (corpo.data ?? {}) as { id?: string | number };
  const dataId = String(dados.id ?? url.searchParams.get("data.id") ?? url.searchParams.get("id") ?? "");

  // merchant_order, chargebacks e afins: nada a fazer com eles por enquanto
  if (tipo !== "payment" || !dataId) return new Response(null, { status: 200 });

  const assinatura = assinaturaValida(
    request.headers.get("x-signature"),
    request.headers.get("x-request-id"),
    dataId,
  );
  if (assinatura === false) {
    console.warn(`[webhook] assinatura inválida para o pagamento ${dataId}`);
    return new Response(null, { status: 401 });
  }
  if (assinatura === "sem_segredo") {
    console.warn("[webhook] MERCADOPAGO_WEBHOOK_SECRET não configurado — assinatura não conferida");
  }

  try {
    const resultado = await processarPagamento(dataId);

    // registro pra auditoria; a idempotência de verdade é o status do pedido
    await criarClienteAdmin()
      .from("mp_eventos")
      .upsert(
        {
          id: String(corpo.id ?? `${tipo}:${dataId}:${corpo.action ?? ""}`),
          payment_id: dataId,
          tipo: `${tipo}:${resultado}`,
          payload: corpo,
        },
        { onConflict: "id", ignoreDuplicates: true },
      );

    return Response.json({ ok: true, resultado });
  } catch (e) {
    // pagamento que não existe (o "simular notificação" do painel do MP manda
    // um id de mentira): tentar de novo não vai fazer ele existir
    if ((e as { status?: number })?.status === 404) {
      return Response.json({ ok: true, resultado: "pagamento_inexistente" });
    }
    console.error(`[webhook] falha ao processar o pagamento ${dataId}:`, e);
    return new Response(null, { status: 500 });
  }
}

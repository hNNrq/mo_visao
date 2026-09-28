import { NextResponse, type NextRequest } from "next/server";
import { sincronizarPagamento } from "@/lib/checkout";
import { assinaturaValida } from "@/lib/mercadopago";

/**
 * Notificação de pagamento do Mercado Pago.
 *
 * O corpo da notificação NÃO é confiável e não é usado pra nada além de saber
 * qual pagamento reler: `sincronizarPagamento` busca status e valor na API do
 * Mercado Pago com o token do servidor. A assinatura (`x-signature`) barra
 * quem só quer fazer o servidor gastar chamada.
 *
 * Códigos de resposta importam: o Mercado Pago reenvia enquanto não receber
 * 200/201. Erro nosso (banco fora, API lenta) devolve 500 de propósito, pra
 * ele tentar de novo. Notificação que não nos interessa devolve 200, senão ele
 * insiste pra sempre.
 */
export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  let corpo: { type?: string; action?: string; data?: { id?: string | number } } = {};
  try {
    corpo = await req.json();
  } catch {
    // alguns avisos vêm só na query string
  }

  const tipo = corpo.type ?? url.searchParams.get("type") ?? url.searchParams.get("topic");
  const dataId = String(corpo.data?.id ?? url.searchParams.get("data.id") ?? url.searchParams.get("id") ?? "");

  if (tipo !== "payment" || !dataId) {
    return NextResponse.json({ ok: true, ignorado: true });
  }

  const valida = assinaturaValida({
    assinatura: req.headers.get("x-signature"),
    requestId: req.headers.get("x-request-id"),
    dataId: url.searchParams.get("data.id") ?? dataId,
  });
  if (!valida) {
    console.warn("[webhook] assinatura inválida ou ausente para", dataId);
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  try {
    const resultado = await sincronizarPagamento(dataId);
    return NextResponse.json({ ok: true, resultado });
  } catch (e) {
    console.error("[webhook] falha ao processar", dataId, e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

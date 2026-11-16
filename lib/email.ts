import "server-only";
import { precoBRL } from "@/lib/format";
import { urlDoSite } from "@/lib/mercadopago";
import type { Pedido, PedidoItem } from "@/lib/types";

/**
 * Email transacional pelo Resend, pela API HTTP. É uma chamada `fetch`, e
 * não vale uma dependência.
 *
 * Sem `RESEND_API_KEY` (ou sem domínio verificado), nada é enviado e nada
 * quebra: o pedido já está no banco, o dono já vê no painel e o cliente já viu
 * a confirmação na tela. Email é aviso, não é registro.
 */

type Email = { para: string; assunto: string; html: string; responderPara?: string };

async function enviar({ para, assunto, html, responderPara }: Email): Promise<void> {
  const chave = process.env.RESEND_API_KEY;
  const de = process.env.EMAIL_REMETENTE;
  if (!chave || !de) return;

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${chave}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: de,
        to: [para],
        subject: assunto,
        html,
        ...(responderPara ? { reply_to: responderPara } : {}),
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) console.error(`[email] Resend respondeu ${r.status}:`, await r.text());
  } catch (e) {
    console.error("[email] falha ao enviar:", e);
  }
}

type PedidoComItens = Pedido & { itens: PedidoItem[] };

const esc = (t: string) =>
  t.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function tabelaItens(p: PedidoComItens): string {
  const linhas = p.itens
    .map(
      (i) =>
        `<tr><td style="padding:6px 0">${i.quantidade}x ${esc(i.nome_snapshot)}</td>` +
        `<td style="padding:6px 0;text-align:right">${precoBRL(i.preco_snapshot_centavos * i.quantidade)}</td></tr>`,
    )
    .join("");
  const frete =
    p.frete_centavos > 0
      ? `<tr><td style="padding:6px 0">Entrega</td><td style="padding:6px 0;text-align:right">${precoBRL(p.frete_centavos)}</td></tr>`
      : "";
  return (
    `<table style="width:100%;border-collapse:collapse;font-size:16px">${linhas}${frete}` +
    `<tr><td style="padding:10px 0;border-top:1px solid #ccc"><b>Total</b></td>` +
    `<td style="padding:10px 0;border-top:1px solid #ccc;text-align:right"><b>${precoBRL(p.total_centavos)}</b></td></tr></table>`
  );
}

function entregaTexto(p: PedidoComItens): string {
  const e = p.entrega as Record<string, string>;
  if (p.entrega_tipo === "retirada") return "Retirada combinada";
  if (p.entrega_tipo === "correios") {
    return `Correios${e?.servico ? ` ${esc(e.servico)}` : ""}${e?.endereco ? ` — ${esc(e.endereco)}` : ""}`;
  }
  return `Entrega na região${e?.endereco ? ` — ${esc(e.endereco)}` : ""}`;
}

const moldura = (corpo: string) =>
  `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#111;line-height:1.5">${corpo}` +
  `<p style="margin-top:32px;color:#777;font-size:13px">Mó Visão</p></div>`;

/** Pro cliente: confirmação com o link do pedido. */
export async function emailPedidoPagoCliente(p: PedidoComItens, emailDono?: string) {
  const link = `${urlDoSite()}/pedido/${p.numero}?k=${p.token}`;
  await enviar({
    para: p.cliente_email,
    assunto: `Pedido ${p.numero} confirmado`,
    responderPara: emailDono,
    html: moldura(
      `<h1 style="font-size:22px">Pagamento confirmado, ${esc(p.cliente_nome.split(" ")[0])}.</h1>` +
        `<p>Seu pedido <b>${p.numero}</b> está garantido. ${
          p.entrega_tipo === "correios"
            ? "Quando postar, o código de rastreio chega no seu WhatsApp."
            : "A gente chama no WhatsApp pra combinar a entrega."
        }</p>` +
        tabelaItens(p) +
        `<p><b>Como recebe:</b> ${entregaTexto(p)}</p>` +
        `<p><a href="${link}" style="color:#111">Acompanhar o pedido</a></p>`,
    ),
  });
}

/** Pro dono: tem pedido pra separar, com o contato do cliente. */
export async function emailPedidoPagoDono(p: PedidoComItens, emailDono: string) {
  await enviar({
    para: emailDono,
    assunto: `Pedido pago ${p.numero} — ${precoBRL(p.total_centavos)}`,
    responderPara: p.cliente_email,
    html: moldura(
      `<h1 style="font-size:22px">Pedido ${p.numero} pago. É separar.</h1>` +
        tabelaItens(p) +
        `<p><b>${esc(p.cliente_nome)}</b><br>WhatsApp: ${esc(p.cliente_telefone)}<br>Email: ${esc(p.cliente_email)}</p>` +
        `<p><b>Como recebe:</b> ${entregaTexto(p)}</p>` +
        `<p><a href="${urlDoSite()}/admin/pedidos" style="color:#111">Abrir no painel</a></p>`,
    ),
  });
}

/** Pro dono: pagamento chegou tarde e a peça já saiu. Precisa estornar. */
export async function emailEstornar(p: PedidoComItens, emailDono: string) {
  await enviar({
    para: emailDono,
    assunto: `Estornar ${p.numero} — pagou depois da reserva vencer`,
    html: moldura(
      `<h1 style="font-size:22px">${p.numero}: pagamento chegou sem peça pra entregar.</h1>` +
        `<p>${esc(p.cliente_nome)} pagou ${precoBRL(p.total_centavos)} depois que a reserva venceu, ` +
        `e o óculos já tinha sido vendido. O estoque não foi mexido.</p>` +
        `<p>Estorne pelo app do Mercado Pago (pagamento ${esc(p.mp_payment_id ?? "")}) e avise o cliente: ` +
        `${esc(p.cliente_telefone)}.</p>` +
        tabelaItens(p),
    ),
  });
}

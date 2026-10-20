import "server-only";
import nodemailer from "nodemailer";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { linkWhatsApp } from "@/lib/aviso-cliente";
import { precoBRL } from "@/lib/format";
import type { Pedido, PedidoItem, ResultadoConfirmacao } from "@/lib/types";

/**
 * Email pro dono quando entra venda paga.
 *
 * Sai de `sincronizarPagamento`, logo depois de `confirmar_pedido` responder
 * 'confirmado' ou 'sem_estoque'. A trava de linha do banco garante que só UMA
 * chamada recebe esse retorno (a outra volta 'ja_processado'), então o email
 * sai uma vez só, venha a confirmação do webhook ou da volta do cliente.
 *
 * SMTP genérico, de propósito: hoje funciona com um Gmail e senha de app, e
 * quando o domínio existir troca pra Resend (smtp.resend.com) só mexendo nas
 * variáveis. Sem as variáveis, não manda nada — igual ao botão de pagar sem o
 * token do Mercado Pago.
 *
 * O destinatário mora em variável de ambiente, NÃO na tabela `config`: a
 * `config` é legível pela chave pública, e email de dono numa API aberta é
 * lista de spam.
 *
 * Falhar aqui nunca derruba a confirmação do pedido. O pedido já está pago e
 * no painel; o email é recado.
 */

function configurado() {
  const e = process.env;
  return Boolean(e.SMTP_HOST && e.SMTP_USER && e.SMTP_PASS && e.AVISO_EMAIL_PARA);
}

type PedidoComItens = Pedido & { itens: PedidoItem[] };

export async function avisarDonoDeVenda(
  pedidoId: string,
  resultado: ResultadoConfirmacao,
): Promise<void> {
  if (resultado === "ja_processado") return;
  if (!configurado()) {
    console.warn("[aviso-dono] SMTP não configurado — email de venda não enviado");
    return;
  }

  try {
    const { data } = await criarClienteAdmin()
      .from("pedidos")
      .select("*, itens:pedido_itens (*)")
      .eq("id", pedidoId)
      .maybeSingle();
    if (!data) return;

    const pedido = data as unknown as PedidoComItens;
    const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
    const { assunto, texto } = montarEmail(pedido, resultado, site);

    const porta = Number(process.env.SMTP_PORT || 465);
    const transporte = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: porta,
      secure: porta === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      // a função do webhook tem prazo curto; SMTP travado não pode segurá-la
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 8000,
    });

    await transporte.sendMail({
      from: `Mó Visão <${process.env.EMAIL_DE || process.env.SMTP_USER}>`,
      to: process.env.AVISO_EMAIL_PARA,
      subject: assunto,
      text: texto,
    });
  } catch (e) {
    console.error("[aviso-dono] falha ao mandar email do pedido", pedidoId, e);
  }
}

const ENTREGA: Record<string, string> = {
  retirada: "Retirada",
  local: "Entrega na região",
  correios: "Correios",
};

/** Texto puro: abre igual em qualquer app de email do celular. */
export function montarEmail(
  pedido: PedidoComItens,
  resultado: ResultadoConfirmacao,
  site: string,
): { assunto: string; texto: string } {
  const entrega = (pedido.entrega ?? {}) as Record<string, string>;
  const itens = pedido.itens
    .map(
      (i) =>
        `${i.quantidade}x ${i.nome_snapshot} — ${precoBRL(i.preco_snapshot_centavos * i.quantidade)}`,
    )
    .join("\n");

  const linhaEntrega = [
    ENTREGA[pedido.entrega_tipo] ?? pedido.entrega_tipo,
    entrega.endereco,
  ]
    .filter(Boolean)
    .join(" · ");

  const semPeca = resultado === "sem_estoque";
  // no "sem peça" a mensagem pronta já é o pedido de desculpa com o estorno
  const whats = linkWhatsApp(pedido, site);

  const assunto = semPeca
    ? `Pagou sem peça — estornar ${pedido.numero}`
    : `Venda nova: ${pedido.numero} · ${precoBRL(pedido.total_centavos)}`;

  const abertura = semPeca
    ? `O pagamento do ${pedido.numero} entrou depois de a reserva vencer, e a peça já tinha saído. Precisa estornar pelo Mercado Pago e avisar o cliente.`
    : `Entrou pagamento do ${pedido.numero}. É separar a peça e combinar a entrega.`;

  const texto = [
    abertura,
    "",
    itens,
    `Total: ${precoBRL(pedido.total_centavos)}`,
    "",
    `Cliente: ${pedido.cliente_nome}`,
    `Telefone: ${pedido.cliente_telefone}`,
    `Entrega: ${linhaEntrega}`,
    entrega.observacao ? `Observação: “${entrega.observacao}”` : null,
    "",
    whats ? `Mandar mensagem pro cliente no WhatsApp:\n${whats}\n` : null,
    `Ver no painel: ${site}/admin/pedidos`,
  ]
    .filter((l) => l !== null)
    .join("\n");

  return { assunto, texto };
}

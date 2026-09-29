import type { EntregaTipo, PedidoStatus } from "@/lib/types";

/**
 * A mensagem que o dono manda pro cliente no WhatsApp, pronta, por estado do
 * pedido.
 *
 * Existe porque a loja não tem cadastro nem email: o link do pedido só chega
 * no bolso do cliente se alguém mandar. Mandando pelo WhatsApp da loja, o link
 * fica guardado na conversa — que é onde a pessoa vai procurar quando quiser
 * saber do óculos.
 *
 * Tom da marca: comum, curto, concreto. Sem "Olá, prezado cliente".
 */

type Pedido = {
  id: string;
  numero: string;
  status: PedidoStatus;
  cliente_nome: string;
  cliente_telefone: string;
  entrega_tipo: EntregaTipo;
  precisa_estorno: boolean;
};

/** Telefone salvo só com dígitos, sem DDI. O WhatsApp quer 55 + DDD + número. */
export function telefoneWhatsApp(telefone: string): string | null {
  const d = telefone.replace(/\D/g, "");
  if (d.length === 10 || d.length === 11) return `55${d}`;
  if ((d.length === 12 || d.length === 13) && d.startsWith("55")) return d;
  return null;
}

export function mensagemPraCliente(pedido: Pedido, site: string): string | null {
  const nome = pedido.cliente_nome.trim().split(/\s+/)[0] ?? "";
  const link = `${site.replace(/\/$/, "")}/pedido/${pedido.id}`;
  const oi = `Oi, ${nome}! Aqui é da Mó Visão.`;
  const retirada = pedido.entrega_tipo === "retirada";

  if (pedido.precisa_estorno && pedido.status === "expirado") {
    return `${oi} Teu pagamento do pedido ${pedido.numero} entrou depois do prazo e a peça já tinha saído — desculpa. O dinheiro volta inteiro pelo mesmo meio que tu pagou. Qualquer coisa, me chama aqui.`;
  }

  switch (pedido.status) {
    case "pago":
      return `${oi} Recebi teu pagamento do pedido ${pedido.numero}. ${
        retirada
          ? "Qual dia e horário ficam bons pra tu buscar?"
          : "Me confirma o melhor dia e horário pra entrega?"
      } Acompanha o pedido por aqui: ${link}`;
    case "separado":
      return `${oi} Teu pedido ${pedido.numero} tá separado ${
        retirada ? "e pronto pra retirar" : "e pronto pra sair pra entrega"
      }. Acompanha por aqui: ${link}`;
    case "entregue":
      return `${oi} Valeu pela compra! Qualquer coisa com o óculos, me chama aqui. Troca e devolução: ${site.replace(/\/$/, "")}/trocas-e-devolucoes`;
    case "cancelado":
      return `${oi} Teu pedido ${pedido.numero} foi cancelado. Se tu pagou, o dinheiro volta pelo mesmo meio do pagamento.`;
    default:
      return null;
  }
}

export function linkWhatsApp(pedido: Pedido, site: string): string | null {
  const numero = telefoneWhatsApp(pedido.cliente_telefone);
  const texto = mensagemPraCliente(pedido, site);
  if (!numero || !texto) return null;
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
}

import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import MercadoPagoConfig, { Payment, Preference } from "mercadopago";

/**
 * Mercado Pago — Checkout Pro.
 *
 * O cliente é mandado pra página do Mercado Pago e volta. O site nunca vê
 * número de cartão, e a conta que recebe é a do DONO (o access token no
 * ambiente é o dele, nunca o da Norman.dgt).
 *
 * Nada aqui confia no que chega pelo navegador ou pelo corpo do webhook: o
 * pagamento é sempre relido na API do Mercado Pago com o token da loja.
 */

function config() {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) throw new Error("MP_SEM_TOKEN");
  return new MercadoPagoConfig({ accessToken, options: { timeout: 8000 } });
}

/** Endereço público do site, sem barra no fim. */
export function urlDoSite(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

export type DadosPreferencia = {
  pedidoId: string;
  numero: string;
  token: string;
  expiraEm: string;
  cliente: { nome: string; email: string };
  itens: { id: string; titulo: string; precoCentavos: number; quantidade: number }[];
  freteCentavos: number;
  freteTitulo: string;
};

export async function criarPreferencia(d: DadosPreferencia) {
  const site = urlDoSite();

  /**
   * O Mercado Pago recusa `notification_url` e `auto_return` apontando pra
   * http://localhost. Em desenvolvimento a volta é manual e a confirmação
   * vem pela página do pedido (ver `processarPagamento`); em produção, que é
   * https, vai tudo.
   */
  const publico = site.startsWith("https://");
  const paginaPedido = `${site}/pedido/${d.numero}?k=${d.token}`;

  const itens = d.itens.map((i) => ({
    id: i.id,
    title: i.titulo,
    quantity: i.quantidade,
    unit_price: i.precoCentavos / 100,
    currency_id: "BRL",
  }));

  if (d.freteCentavos > 0) {
    itens.push({
      id: "entrega",
      title: d.freteTitulo,
      quantity: 1,
      unit_price: d.freteCentavos / 100,
      currency_id: "BRL",
    });
  }

  const [nome, ...sobrenome] = d.cliente.nome.trim().split(/\s+/);

  // O MP pede "2026-09-24T18:00:00.000-03:00". O Postgres devolve microssegundos
  // (6 casas), que ele recusa; toISOString() normaliza pra 3.
  const vence = new Date(d.expiraEm).toISOString().replace("Z", "+00:00");

  return new Preference(config()).create({
    body: {
      items: itens,
      external_reference: d.pedidoId,
      payer: { name: nome, surname: sobrenome.join(" ") || undefined, email: d.cliente.email },
      back_urls: { success: paginaPedido, pending: paginaPedido, failure: paginaPedido },
      ...(publico
        ? { auto_return: "approved", notification_url: `${site}/api/mercadopago/webhook` }
        : {}),
      payment_methods: {
        // Boleto leva até 3 dias pra compensar, e a peça fica reservada por
        // 30 minutos. Com poucas unidades por modelo, não fecha.
        excluded_payment_types: [{ id: "ticket" }, { id: "atm" }],
        // Até 12x; da 3ª em diante o juros é do comprador. As parcelas SEM
        // juros (PARCELAS_SEM_JUROS, em lib/format.ts) não se configuram aqui:
        // são ajuste da conta do dono no Mercado Pago, e os dois têm que
        // bater, senão a vitrine promete o que o MP não dá.
        installments: 12,
      },
      // O link de pagamento vence junto com a reserva. O Pix gerado dentro
      // dele também — sem isso, dava pra pagar horas depois de a peça voltar
      // pra vitrine.
      expires: true,
      expiration_date_to: vence,
      date_of_expiration: vence,
      statement_descriptor: "MOVISAO",
      metadata: { numero: d.numero },
    },
  });
}

export async function buscarPagamento(id: string) {
  return new Payment(config()).get({ id });
}

/**
 * Confere a assinatura `x-signature` da notificação.
 *
 * É a segunda camada, não a primeira: mesmo com a assinatura válida, o
 * pagamento é relido na API antes de qualquer coisa mudar no banco. Sem o
 * segredo configurado, a checagem é pulada (e avisada no log) — o site não
 * pode parar de vender porque uma variável ficou pra trás.
 *
 * Formato documentado pelo MP:
 *   x-signature: ts=1704908010,v1=<hmac sha256 hex>
 *   manifesto:   id:<data.id>;request-id:<x-request-id>;ts:<ts>;
 */
export function assinaturaValida(
  cabecalhoAssinatura: string | null,
  requestId: string | null,
  dataId: string,
): boolean | "sem_segredo" {
  const segredo = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!segredo) return "sem_segredo";
  if (!cabecalhoAssinatura) return false;

  const partes = Object.fromEntries(
    cabecalhoAssinatura.split(",").map((p) => {
      const [k, ...v] = p.trim().split("=");
      return [k, v.join("=")];
    }),
  );
  const ts = partes.ts;
  const v1 = partes.v1;
  if (!ts || !v1) return false;

  // id alfanumérico entra em minúsculas no manifesto (regra do MP)
  const id = /^[a-z0-9]+$/i.test(dataId) ? dataId.toLowerCase() : dataId;
  let manifesto = `id:${id};`;
  if (requestId) manifesto += `request-id:${requestId};`;
  manifesto += `ts:${ts};`;

  const esperado = createHmac("sha256", segredo).update(manifesto).digest("hex");
  const a = Buffer.from(esperado, "hex");
  const b = Buffer.from(v1, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

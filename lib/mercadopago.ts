import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { MercadoPagoConfig, Payment, Preference } from "mercadopago";

/**
 * Mercado Pago — Checkout Pro.
 *
 * O cliente paga NA TELA do Mercado Pago, não aqui: o site nunca vê número de
 * cartão, e o dinheiro cai direto na conta do dono. Sem exceção, a conta é dele
 * — o token abaixo é o da conta dele, nunca o da Norman.dgt.
 *
 * Em teste, o token vem de uma conta de desenvolvedor com usuários de teste. A
 * troca pra produção é só trocar as variáveis de ambiente.
 */

function cliente() {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) return null;
  return new MercadoPagoConfig({ accessToken, options: { timeout: 10_000 } });
}

export function pagamentoConfigurado(): boolean {
  return !!process.env.MERCADOPAGO_ACCESS_TOKEN;
}

/** Endereço público do site, sem barra no fim. */
export function urlDoSite(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? process.env.URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}

type PedidoParaCobrar = {
  id: string;
  numero: string;
  total_centavos: number;
  expira_em: string;
  pagamento: "pix" | "cartao";
  email: string;
  nome: string;
};

/**
 * Cria a tela de pagamento de um pedido e devolve o link dela.
 *
 * O pedido vai como UMA linha com o total, e não item a item: o desconto do Pix
 * não cabe como item (o Mercado Pago não aceita valor negativo) e o frete
 * viraria mais uma linha pra conciliar. O detalhe fica no pedido, aqui.
 *
 * O que a pessoa escolheu no carrinho decide o que o Mercado Pago mostra:
 * escolheu Pix (com desconto), só aparece Pix — senão dava pra pegar o preço
 * de Pix e pagar no cartão. Boleto nunca: leva dias pra compensar e a reserva
 * da peça dura minutos.
 */
export async function criarCobranca(pedido: PedidoParaCobrar) {
  const config = cliente();
  if (!config) throw new Error("PAGAMENTO_NAO_CONFIGURADO");

  const site = urlDoSite();
  const publico = site.startsWith("https://");

  const excluidos =
    pedido.pagamento === "pix"
      ? ["ticket", "atm", "credit_card", "debit_card", "prepaid_card"]
      : ["ticket", "atm", "bank_transfer"];

  const resposta = await new Preference(config).create({
    body: {
      external_reference: pedido.id,
      items: [
        {
          id: pedido.numero,
          title: `Pedido ${pedido.numero} — Mó Visão`,
          quantity: 1,
          unit_price: pedido.total_centavos / 100,
          currency_id: "BRL",
        },
      ],
      payer: { email: pedido.email, name: pedido.nome },
      payment_methods: {
        excluded_payment_types: excluidos.map((id) => ({ id })),
        installments: pedido.pagamento === "cartao" ? 12 : 1,
      },
      back_urls: {
        success: `${site}/pedido/${pedido.id}`,
        pending: `${site}/pedido/${pedido.id}`,
        failure: `${site}/pedido/${pedido.id}`,
      },
      // o Mercado Pago recusa auto_return e notificação com endereço local
      ...(publico
        ? {
            auto_return: "approved",
            notification_url: `${site}/api/mercadopago/webhook`,
          }
        : {}),
      // a tela de pagamento e o QR do Pix vencem junto com a reserva da peça
      expires: true,
      expiration_date_to: dataMP(pedido.expira_em),
      date_of_expiration: dataMP(pedido.expira_em),
      statement_descriptor: "MOVISAO",
    },
  });

  if (!resposta.id || !resposta.init_point) throw new Error("PREFERENCIA_SEM_LINK");
  return { preferenciaId: resposta.id, url: resposta.init_point };
}

/**
 * O Mercado Pago quer `2026-09-28T12:30:00.000-03:00`. O Postgres devolve
 * microssegundo e fuso +00:00, que a API recusa — então a data é refeita no
 * horário de Brasília, com milissegundo.
 */
function dataMP(iso: string): string {
  const brasilia = new Date(new Date(iso).getTime() - 3 * 60 * 60 * 1000);
  return brasilia.toISOString().replace("Z", "-03:00");
}

export async function buscarPagamento(id: string) {
  const config = cliente();
  if (!config) throw new Error("PAGAMENTO_NAO_CONFIGURADO");
  return new Payment(config).get({ id });
}

/**
 * Confere a assinatura da notificação (cabeçalho `x-signature`).
 *
 * O Mercado Pago assina `id:<data.id>;request-id:<x-request-id>;ts:<ts>;` com a
 * chave secreta do webhook. Mesmo assinada, a notificação só serve de gatilho:
 * o status do pagamento é sempre relido na API do Mercado Pago, nunca tirado do
 * corpo da requisição.
 */
export function assinaturaValida(opcoes: {
  assinatura: string | null;
  requestId: string | null;
  dataId: string;
}): boolean {
  const segredo = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!segredo || !opcoes.assinatura) return false;

  const partes = Object.fromEntries(
    opcoes.assinatura.split(",").map((p) => {
      const [k, ...v] = p.trim().split("=");
      return [k, v.join("=")];
    }),
  );
  if (!partes.ts || !partes.v1) return false;

  // o id alfanumérico vem em minúscula na conta do Mercado Pago
  const id = /^[a-z0-9]+$/i.test(opcoes.dataId) ? opcoes.dataId.toLowerCase() : opcoes.dataId;
  let manifesto = `id:${id};`;
  if (opcoes.requestId) manifesto += `request-id:${opcoes.requestId};`;
  manifesto += `ts:${partes.ts};`;

  const esperado = createHmac("sha256", segredo).update(manifesto).digest("hex");
  const a = Buffer.from(esperado);
  const b = Buffer.from(partes.v1);
  return a.length === b.length && timingSafeEqual(a, b);
}

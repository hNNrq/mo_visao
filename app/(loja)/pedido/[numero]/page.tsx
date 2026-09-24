import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AcompanharPedido } from "@/componentes/AcompanharPedido";
import { linkWhatsApp, precoBRL } from "@/lib/format";
import { buscarPedidoPorToken, processarPagamento } from "@/lib/pedidos";
import { lerConfig } from "@/lib/produtos";

/**
 * O pedido, do lado do cliente. É pra cá que o Mercado Pago devolve a pessoa
 * (sucesso, pendente ou falha) e é o link que vai no email.
 *
 * Sem login: quem abre a porta é o token `k` na URL. Por isso a página não é
 * indexada e não aparece em lugar nenhum além do email e do aparelho de quem
 * comprou.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pedido",
  robots: { index: false, follow: false },
};

type Props = {
  params: Promise<{ numero: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const um = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

// página force-dynamic: o "agora" é o da requisição, e é esse que vale
function jaVenceu(iso: string): boolean {
  return new Date(iso).getTime() < Date.now();
}

export default async function PaginaPedido({ params, searchParams }: Props) {
  const { numero } = await params;
  const busca = await searchParams;
  const token = um(busca.k);

  let pedido = await buscarPedidoPorToken(numero, token);
  if (!pedido) notFound();

  /**
   * Voltou do Mercado Pago com o id do pagamento na URL: confere agora, sem
   * esperar o webhook. É o que faz a tela dizer "pago" no mesmo segundo — e em
   * localhost, onde o MP não alcança o webhook, é o único caminho.
   */
  const paymentId = um(busca.payment_id) || um(busca.collection_id);
  if (paymentId && /^\d+$/.test(paymentId) && (pedido.status === "pendente" || pedido.status === "expirado")) {
    try {
      await processarPagamento(paymentId, pedido.id);
      pedido = (await buscarPedidoPorToken(numero, token)) ?? pedido;
    } catch (e) {
      // o webhook ainda vai chegar; a tela mostra "esperando" e se atualiza
      console.error("[pedido] conferência na volta do MP:", e);
    }
  }

  const config = await lerConfig();
  const whatsapp = linkWhatsApp(
    String(config.whatsapp ?? ""),
    `Oi! Fiz o pedido ${pedido.numero} no site.`,
  );

  const vencido = jaVenceu(pedido.expira_em);
  const pago = ["pago", "separado", "entregue"].includes(pedido.status);
  const aguardando = pedido.status === "pendente" && !vencido;
  const voltouComFalha = um(busca.status) === "rejected" || um(busca.collection_status) === "rejected";
  const entrega = pedido.entrega as Record<string, string>;

  const { titulo, texto } = pedido.alerta
    ? {
        titulo: "Pagamento recebido, mas a peça saiu",
        texto:
          "O pagamento chegou depois que a reserva venceu, e o óculos já tinha sido vendido. A gente devolve o valor inteiro — chama no WhatsApp que resolve rápido.",
      }
    : pago
      ? {
          titulo:
            pedido.status === "entregue"
              ? "Entregue"
              : pedido.status === "separado"
                ? "Separado pra você"
                : "Pagamento confirmado",
          texto:
            pedido.entrega_tipo === "retirada"
              ? "Tá garantido. A gente chama no WhatsApp pra combinar a retirada."
              : "Tá garantido. A gente chama no WhatsApp pra combinar a entrega.",
        }
      : pedido.status === "cancelado"
        ? { titulo: "Pedido cancelado", texto: "Esse pedido foi cancelado. Se foi engano, chama no WhatsApp." }
        : aguardando
          ? {
              titulo: voltouComFalha ? "O pagamento não passou" : "Esperando o pagamento",
              texto: voltouComFalha
                ? "Nada foi cobrado. Dá pra tentar de novo com outro cartão ou no Pix — a peça continua guardada."
                : "Se você já pagou no Pix, essa tela atualiza sozinha quando cair. Se não, o link abaixo leva de volta pro pagamento.",
            }
          : {
              titulo: "A reserva venceu",
              texto:
                "O tempo pra pagar passou e a peça voltou pra loja. Se ela ainda estiver disponível, é só fazer o pedido de novo.",
            };

  return (
    <main className="bg-ink px-5 pt-28 pb-24 sm:px-10 sm:pt-32">
      <AcompanharPedido
        numero={pedido.numero}
        token={pedido.token}
        pago={pago}
        aguardando={aguardando}
      />

      <div className="mx-auto grid max-w-[1600px] gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)] lg:gap-20">
        <div>
          <p className="numeros font-mono text-base text-smoke">{pedido.numero}</p>
          <h1 className="mt-3 max-w-[16ch] font-display text-[clamp(2.25rem,6vw,4.5rem)] leading-[0.9] font-black tracking-tight text-balance uppercase text-paper">
            {titulo}
          </h1>
          <p className="mt-6 max-w-[46ch] font-sans text-xl leading-snug text-smoke">{texto}</p>

          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
            {aguardando && pedido.mp_init_point && !pedido.alerta ? (
              <a
                href={pedido.mp_init_point}
                className="skew-brand inline-block bg-gold px-8 py-4 font-display text-xl font-black tracking-tight uppercase text-ink transition-colors hover:bg-gold-deep"
              >
                <span className="unskew">Pagar {precoBRL(pedido.total_centavos)}</span>
              </a>
            ) : !pago && !pedido.alerta ? (
              <Link
                href="/produtos"
                className="skew-brand inline-block bg-gold px-8 py-4 font-display text-xl font-black tracking-tight uppercase text-ink transition-colors hover:bg-gold-deep"
              >
                <span className="unskew">Ver os óculos</span>
              </Link>
            ) : null}

            {whatsapp && (
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className={
                  pago || pedido.alerta
                    ? "skew-brand inline-block bg-gold px-8 py-4 font-display text-xl font-black tracking-tight uppercase text-ink transition-colors hover:bg-gold-deep"
                    : "flex min-h-11 items-center font-sans text-base tracking-[0.16em] text-paper uppercase underline underline-offset-4 hover:text-gold"
                }
              >
                {pago || pedido.alerta ? (
                  <span className="unskew">Chamar no WhatsApp</span>
                ) : (
                  "Dúvida? Chama no WhatsApp"
                )}
              </a>
            )}
          </div>

          {aguardando && (
            <p className="numeros mt-6 font-sans text-base text-smoke">
              Peça guardada até{" "}
              {new Date(pedido.expira_em).toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "America/Sao_Paulo",
              })}
              .
            </p>
          )}
        </div>

        <section aria-labelledby="resumo">
          <h2 id="resumo" className="font-sans text-sm tracking-[0.16em] text-smoke uppercase">
            Resumo
          </h2>
          <ul className="mt-4 border-t regua">
            {pedido.itens.map((i) => (
              <li key={i.id} className="flex justify-between gap-4 border-b regua py-4 font-sans text-lg">
                <span className="text-paper">
                  <span className="numeros font-mono">{i.quantidade}x</span> {i.nome_snapshot}
                </span>
                <span className="numeros shrink-0 font-mono text-paper">
                  {precoBRL(i.preco_snapshot_centavos * i.quantidade)}
                </span>
              </li>
            ))}
            {pedido.frete_centavos > 0 && (
              <li className="flex justify-between gap-4 border-b regua py-4 font-sans text-lg">
                <span className="text-paper">Entrega</span>
                <span className="numeros font-mono text-paper">{precoBRL(pedido.frete_centavos)}</span>
              </li>
            )}
          </ul>
          <p className="mt-4 flex items-baseline justify-between gap-4">
            <span className="font-sans text-base tracking-[0.16em] text-smoke uppercase">Total</span>
            <span className="numeros font-mono text-2xl font-bold text-gold">
              {precoBRL(pedido.total_centavos)}
            </span>
          </p>

          <dl className="mt-8 flex flex-col gap-4 font-sans text-lg leading-snug">
            <div>
              <dt className="text-sm tracking-[0.16em] text-smoke uppercase">Como recebe</dt>
              <dd className="mt-1 text-paper">
                {pedido.entrega_tipo === "retirada" ? "Retirada combinada" : "Entrega na região"}
                {entrega?.endereco ? ` — ${entrega.endereco}` : ""}
              </dd>
            </div>
            <div>
              <dt className="text-sm tracking-[0.16em] text-smoke uppercase">Contato</dt>
              <dd className="mt-1 text-paper">
                {pedido.cliente_nome}
                <br />
                <span className="text-smoke">{pedido.cliente_email}</span>
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </main>
  );
}

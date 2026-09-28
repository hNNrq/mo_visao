import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AcompanharPedido } from "@/componentes/AcompanharPedido";
import { lerPedidoPublico, sincronizarPagamento, type PedidoPublico } from "@/lib/checkout";
import { precoBRL } from "@/lib/format";
import { lerConfig } from "@/lib/produtos";

export const dynamic = "force-dynamic";

// o link do pedido é pessoal: não entra em busca
export const metadata: Metadata = { title: "Teu pedido", robots: { index: false, follow: false } };

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PaginaPedido({ params, searchParams }: Props) {
  const { id } = await params;
  const busca = await searchParams;

  let pedido = await lerPedidoPublico(id);
  if (!pedido) notFound();

  /**
   * Voltou do Mercado Pago com o pagamento na URL e o pedido ainda não virou
   * pago: confere na API na hora, sem esperar o webhook. A URL só diz QUAL
   * pagamento olhar — status, valor e pedido vêm da API.
   */
  const pagamentoId = String(busca.payment_id ?? busca.collection_id ?? "");
  if (pagamentoId && (pedido.status === "pendente" || pedido.status === "expirado")) {
    try {
      const r = await sincronizarPagamento(pagamentoId);
      if (r !== "ignorado") pedido = (await lerPedidoPublico(id)) ?? pedido;
    } catch (e) {
      console.error("[pedido] sincronizar na volta:", e);
    }
  }

  const config = await lerConfig();
  const whats = String(config.whatsapp ?? "").replace(/\D/g, "");
  // o seed traz um número de mentira (5500000000000) até o dono preencher
  const temWhats = whats.length >= 12 && !/^550+$/.test(whats);
  const linkWhats = temWhats
    ? `https://wa.me/${whats}?text=${encodeURIComponent(`Oi! Fiz o pedido ${pedido.numero} no site.`)}`
    : null;

  const aguardando = pedido.status === "pendente" && new Date(pedido.expira_em) > new Date();

  return (
    <main className="bg-ink px-5 pt-28 pb-24 sm:px-10 sm:pt-32 sm:pb-32">
      <AcompanharPedido id={pedido.id} aguardando={aguardando} />

      <div className="mx-auto max-w-[760px]">
        <p className="numeros font-mono text-base tracking-wide text-smoke">Pedido {pedido.numero}</p>

        <Situacao pedido={pedido} aguardando={aguardando} linkWhats={linkWhats} />

        <section aria-label="Resumo do pedido" className="mt-14 border-t regua">
          <ul>
            {pedido.itens.map((item, i) => (
              <li key={i} className="flex justify-between gap-4 border-b regua py-4 font-sans text-lg">
                <span className="text-paper">
                  <span className="numeros">{item.quantidade}x</span> {item.nome_snapshot}
                </span>
                <span className="numeros shrink-0 font-mono text-paper">
                  {precoBRL(item.preco_snapshot_centavos * item.quantidade)}
                </span>
              </li>
            ))}
          </ul>
          <dl className="numeros mt-4 flex flex-col gap-2 font-sans text-lg">
            {pedido.frete_centavos > 0 && <Linha rotulo="Entrega" valor={precoBRL(pedido.frete_centavos)} />}
            {pedido.desconto_centavos > 0 && (
              <Linha rotulo="Desconto no Pix" valor={`− ${precoBRL(pedido.desconto_centavos)}`} />
            )}
            <div className="mt-1 flex items-baseline justify-between gap-4">
              <dt className="font-sans text-sm tracking-[0.16em] uppercase text-smoke">Total</dt>
              <dd className="font-mono text-3xl font-bold text-gold">{precoBRL(pedido.total_centavos)}</dd>
            </div>
          </dl>
          <p className="mt-6 font-sans text-base leading-snug text-smoke">
            {pedido.entrega_tipo === "retirada" ? "Retirada combinada." : "Entrega na região."}{" "}
            Guarda este link: é por ele que tu acompanha o pedido.{" "}
            <Link href="/trocas-e-devolucoes" className="underline underline-offset-4 transition-colors hover:text-gold">
              Trocas e devoluções
            </Link>
            .
          </p>
        </section>
      </div>
    </main>
  );
}

const TITULO =
  "mt-4 max-w-[18ch] font-display text-[clamp(2.25rem,6vw,4.5rem)] leading-[0.9] font-black tracking-tight text-balance uppercase text-paper";
const TEXTO = "mt-6 max-w-[46ch] font-sans text-xl leading-snug text-smoke";
const CARIMBO =
  "carimbo skew-brand mt-8 inline-block bg-gold px-8 py-4 font-display text-xl font-black tracking-tight uppercase text-ink transition-colors hover:bg-gold-deep";

function Situacao({
  pedido,
  aguardando,
  linkWhats,
}: {
  pedido: PedidoPublico;
  aguardando: boolean;
  linkWhats: string | null;
}) {
  const primeiroNome = pedido.cliente_nome.split(" ")[0];

  if (["pago", "separado", "entregue"].includes(pedido.status)) {
    const entregue = pedido.status === "entregue";
    return (
      <>
        <h1 className={TITULO}>{entregue ? "Entregue" : `Pagou, ${primeiroNome}. Tá garantido.`}</h1>
        <p className={TEXTO}>
          {entregue
            ? "Bom proveito. Qualquer coisa com a peça, chama a gente."
            : pedido.entrega_tipo === "retirada"
              ? "A gente te chama no WhatsApp pra combinar onde e quando buscar."
              : "A gente te chama no WhatsApp pra combinar a entrega."}
        </p>
        {linkWhats && (
          <a href={linkWhats} className={CARIMBO}>
            <span className="unskew">Chamar no WhatsApp</span>
          </a>
        )}
      </>
    );
  }

  if (aguardando) {
    const ate = new Date(pedido.expira_em).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    });
    return (
      <>
        <h1 className={TITULO}>Falta pagar</h1>
        <p className={TEXTO}>
          A peça está guardada pra ti até <span className="numeros text-paper">{ate}</span>. Se já
          pagou, esta página muda sozinha em instantes.
        </p>
        {pedido.mp_checkout_url && (
          <a href={pedido.mp_checkout_url} className={CARIMBO}>
            <span className="unskew">Pagar agora</span>
          </a>
        )}
      </>
    );
  }

  if (pedido.precisa_estorno) {
    return (
      <>
        <h1 className={TITULO}>O pagamento entrou depois do prazo</h1>
        <p className={TEXTO}>
          E a peça já tinha saído. O dinheiro volta inteiro pra ti, pelo mesmo meio que tu pagou — a
          gente te chama pra avisar quando for feito.
        </p>
        {linkWhats && (
          <a href={linkWhats} className={CARIMBO}>
            <span className="unskew">Falar com a loja</span>
          </a>
        )}
      </>
    );
  }

  if (pedido.status === "cancelado") {
    return (
      <>
        <h1 className={TITULO}>Pedido cancelado</h1>
        <p className={TEXTO}>Se tu pagou, o dinheiro volta pelo mesmo meio do pagamento.</p>
        <Link href="/produtos" className={CARIMBO}>
          <span className="unskew">Ver os óculos</span>
        </Link>
      </>
    );
  }

  // expirado, ou pendente com o prazo já vencido (o job ainda não passou)
  return (
    <>
      <h1 className={TITULO}>O prazo pra pagar acabou</h1>
      <p className={TEXTO}>
        A peça voltou pra loja. Se ela ainda estiver lá, é só fazer o pedido de novo — nada foi
        cobrado.
      </p>
      <Link href="/produtos" className={CARIMBO}>
        <span className="unskew">Ver os óculos</span>
      </Link>
    </>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-smoke">{rotulo}</dt>
      <dd className="font-mono text-paper">{valor}</dd>
    </div>
  );
}

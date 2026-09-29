"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { lembrarPedido, pedidosLembrados } from "@/lib/carrinho";
import { precoBRL } from "@/lib/format";
import { acharPedido, buscarMeusPedidos } from "@/app/(loja)/carrinho/acoes";
import type { PedidoPublico } from "@/lib/checkout";

/**
 * Os pedidos feitos NESTE aparelho.
 *
 * A loja não tem cadastro, então não existe "todos os meus pedidos" — existe o
 * que este navegador lembra. Quem comprou pelo celular e abre no computador vê
 * a lista vazia, e o texto de vazio diz isso em vez de fingir que não há nada.
 */

const NOMES: Record<string, string> = {
  pendente: "Falta pagar",
  pago: "Pago",
  separado: "Separado",
  entregue: "Entregue",
  expirado: "Prazo vencido",
  cancelado: "Cancelado",
};

export function MeusPedidos() {
  const [pedidos, setPedidos] = useState<PedidoPublico[] | null>(null);

  useEffect(() => {
    const ids = pedidosLembrados();
    (ids.length > 0 ? buscarMeusPedidos(ids) : Promise.resolve([]))
      .then(setPedidos)
      .catch(() => setPedidos([]));
  }, []);

  return (
    <main className="min-h-[70svh] bg-ink px-5 pt-28 pb-24 sm:px-10 sm:pt-32">
      <div className="mx-auto max-w-[760px]">
        <h1 className="font-display text-[clamp(2.25rem,6vw,4.5rem)] leading-[0.9] font-black tracking-tight uppercase text-paper">
          Meus pedidos
        </h1>

        {pedidos === null ? (
          <p className="mt-8 font-sans text-xl text-smoke" aria-live="polite">
            Carregando…
          </p>
        ) : pedidos.length === 0 ? (
          <>
            <p className="mt-8 max-w-[46ch] font-sans text-xl leading-snug text-smoke">
              Nenhum pedido feito neste aparelho. Comprou por outro celular ou navegador? Procura
              logo abaixo, com o número do pedido e o teu WhatsApp.
            </p>
            <Link
              href="/produtos"
              className="carimbo skew-brand mt-10 inline-block bg-gold px-8 py-4 font-display text-xl font-black tracking-tight uppercase text-ink transition-colors hover:bg-gold-deep"
            >
              <span className="unskew">Ver os óculos</span>
            </Link>
          </>
        ) : (
          <ul className="mt-10 border-t regua">
            {pedidos.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/pedido/${p.id}`}
                  className="group flex items-baseline justify-between gap-4 border-b regua py-5"
                >
                  <span>
                    <span className="numeros block font-display text-2xl leading-none font-black tracking-tight uppercase text-paper transition-colors group-hover:text-gold">
                      {p.numero}
                    </span>
                    <span className="mt-1.5 block font-sans text-base text-smoke">
                      {new Date(p.created_at).toLocaleDateString("pt-BR")} ·{" "}
                      {p.itens.map((i) => i.nome_snapshot).join(", ")}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="numeros block font-mono text-lg font-bold text-gold">
                      {precoBRL(p.total_centavos)}
                    </span>
                    <span className="block font-sans text-sm tracking-[0.16em] uppercase text-smoke">
                      {p.precisa_estorno ? "Estorno" : (NOMES[p.status] ?? p.status)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {pedidos !== null && <AcharPedido />}
      </div>
    </main>
  );
}

const ROTULO = "font-sans text-sm tracking-[0.16em] uppercase text-smoke";
const CAMPO =
  "w-full border-b regua bg-transparent py-3 font-sans text-xl text-paper outline-none transition-colors placeholder:text-sob focus:border-gold";

/**
 * Pra quem comprou em outro aparelho ou perdeu o link: número do pedido e o
 * WhatsApp que foi usado na compra. Achou, o pedido passa a ser lembrado aqui
 * também — da próxima vez aparece na lista.
 */
function AcharPedido() {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const [buscando, iniciar] = useTransition();

  function buscar(form: FormData) {
    setErro(null);
    iniciar(async () => {
      const r = await acharPedido(
        String(form.get("numero") ?? ""),
        String(form.get("telefone") ?? ""),
      ).catch(() => ({ ok: false as const, erro: "Não deu pra buscar agora. Tenta de novo." }));
      if (!r.ok) {
        setErro(r.erro);
        return;
      }
      lembrarPedido(r.id);
      router.push(`/pedido/${r.id}`);
    });
  }

  return (
    <section aria-labelledby="titulo-achar" className="mt-16 border-t regua pt-10">
      <h2
        id="titulo-achar"
        className="font-display text-2xl leading-none font-black tracking-tight uppercase text-paper sm:text-3xl"
      >
        Comprou em outro aparelho?
      </h2>
      {/* onSubmit e não action: com action o React limpa os campos, e quem
          errou um dígito teria que digitar tudo de novo */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          buscar(new FormData(e.currentTarget));
        }}
        className="mt-8 grid gap-6 sm:grid-cols-2 sm:gap-8"
        noValidate
      >
        <label className="flex flex-col gap-1">
          <span className={ROTULO}>Número do pedido</span>
          <input
            name="numero"
            placeholder="MV-00012"
            autoCapitalize="characters"
            autoComplete="off"
            required
            className={`${CAMPO} numeros`}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className={ROTULO}>WhatsApp usado na compra</span>
          <input
            name="telefone"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            placeholder="(31) 99999-0000"
            required
            className={`${CAMPO} numeros`}
          />
        </label>
        {erro && (
          <p role="alert" className="border-l-2 border-gold pl-4 font-sans text-lg leading-snug text-paper sm:col-span-2">
            {erro}
          </p>
        )}
        <button
          type="submit"
          disabled={buscando}
          className="inline-flex min-h-12 items-center justify-self-start border regua px-6 font-sans text-base tracking-[0.16em] uppercase text-paper transition-colors hover:border-gold hover:text-gold disabled:opacity-60"
        >
          {buscando ? "Procurando…" : "Achar meu pedido"}
        </button>
      </form>
    </section>
  );
}

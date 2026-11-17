"use client";

import { useState, useTransition } from "react";
import { Aviso } from "@/componentes/admin/Aviso";
import { mudarStatusPedido, salvarRastreio } from "@/app/admin/acoes";
import { linkWhatsApp } from "@/lib/aviso-cliente";
import { precoBRL } from "@/lib/format";
import type { PedidoComItens } from "@/app/admin/(painel)/pedidos/page";
import type { PedidoStatus } from "@/lib/types";

/** O que ele pode fazer a partir de cada estado — nada de dropdown com tudo. */
const PROXIMO: Partial<Record<PedidoStatus, { valor: string; texto: string }[]>> = {
  pago: [
    { valor: "separado", texto: "Marcar como separado" },
    { valor: "cancelado", texto: "Cancelar e devolver ao estoque" },
  ],
  separado: [
    { valor: "entregue", texto: "Marcar como entregue" },
    { valor: "cancelado", texto: "Cancelar e devolver ao estoque" },
  ],
  entregue: [],
  cancelado: [],
  expirado: [],
  pendente: [],
};

const NOMES: Record<string, string> = {
  pago: "Pago — separar",
  separado: "Separado",
  entregue: "Entregue",
  cancelado: "Cancelado",
  expirado: "Expirado",
};

/** O Mercado Pago devolve o tipo em inglês; o dono lê em português. */
const METODOS: Record<string, string> = {
  bank_transfer: "Pix",
  pix: "Pix",
  credit_card: "Cartão de crédito",
  debit_card: "Cartão de débito",
  prepaid_card: "Cartão pré-pago",
  account_money: "Saldo Mercado Pago",
};

/**
 * Só o pedido que PEDE alguma coisa dele leva carimbo de ouro. Separado,
 * entregue e cancelado são letra miúda: se todo estado brilhar, brilhar para
 * de significar "olha aqui".
 */
const CARIMBADO: Record<string, boolean> = { pago: true };

export function ListaPedidos({ pedidos, site }: { pedidos: PedidoComItens[]; site: string }) {
  return (
    <ul>
      {pedidos.map((p) => (
        <BlocoPedido key={p.id} pedido={p} site={site} />
      ))}
    </ul>
  );
}

function formatarCpf(cpf: string) {
  const d = cpf.replace(/\D/g, "");
  return d.length === 11 ? `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}` : cpf;
}

function BlocoPedido({ pedido, site }: { pedido: PedidoComItens; site: string }) {
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();

  const correios = pedido.entrega_tipo === "correios";
  // nos Correios, "separado" é postado: o passo acontece ao salvar o rastreio
  const acoes = (PROXIMO[pedido.status] ?? []).filter(
    (a) => !(correios && a.valor === "separado"),
  );
  const entrega = pedido.entrega as Record<string, string>;
  // pagou depois de vencer e a peça já tinha ido: é o pedido mais urgente da
  // tela, porque tem dinheiro de cliente parado esperando estorno
  const estornar = pedido.precisa_estorno && pedido.status === "expirado";
  const carimbado = CARIMBADO[pedido.status] || estornar;
  const rotuloStatus = estornar
    ? "Pagou sem peça — estornar"
    : correios && pedido.status === "pago"
      ? "Pago — postar"
      : correios && pedido.status === "separado"
        ? "Postado"
        : (NOMES[pedido.status] ?? pedido.status);
  /**
   * A mensagem muda com o estado: marcou "separado", o próximo toque aqui já
   * manda "tá separado". O link do pedido vai junto — é assim que ele chega no
   * cliente, já que a loja não manda email.
   *
   * Aço e não ouro: ouro em bloco é a ação que muda o pedido. Avisar é recado.
   */
  const whats = linkWhatsApp(pedido, site);

  const metodo = pedido.metodo_pagamento
    ? (METODOS[pedido.metodo_pagamento] ?? pedido.metodo_pagamento)
    : null;

  return (
    <li
      className={`border-b border-paper/10 py-6 transition-opacity last:border-b-0 ${
        pendente ? "opacity-60" : ""
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div>
          <p className="numeros font-display text-2xl leading-none font-black tracking-tight uppercase text-paper">
            {pedido.numero}
          </p>
          <p className="numeros mt-1.5 font-sans text-sm tracking-wide text-smoke">
            {new Date(pedido.created_at).toLocaleString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })}
            {metodo && ` · ${metodo}`}
          </p>
        </div>

        {carimbado ? (
          <span className="carimbo skew-brand inline-block bg-gold px-3 py-1.5 font-display text-sm font-black tracking-tight uppercase text-ink">
            <span className="unskew">{rotuloStatus}</span>
          </span>
        ) : (
          <span className="font-sans text-sm tracking-[0.16em] uppercase text-smoke">
            {rotuloStatus}
          </span>
        )}
      </div>

      <ul className="mt-5 flex flex-col gap-1.5">
        {pedido.itens?.map((item) => (
          <li key={item.id} className="flex justify-between gap-4 font-sans text-lg">
            <span className="text-paper/85">
              <span className="numeros">{item.quantidade}x</span>{" "}
              {item.nome_snapshot}
            </span>
            <span className="numeros shrink-0 text-smoke">
              {precoBRL(item.preco_snapshot_centavos * item.quantidade)}
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-3 flex items-baseline justify-between gap-4">
        <span className="font-sans text-base tracking-[0.16em] uppercase text-smoke">
          Total
        </span>
        <span className="numeros font-display text-2xl font-black tracking-tight text-gold">
          {precoBRL(pedido.total_centavos)}
        </span>
      </p>

      <div className="mt-5 font-sans text-lg leading-snug">
        <p className="text-paper">{pedido.cliente_nome}</p>
        <p className="numeros text-smoke">
          <a
            href={`tel:${pedido.cliente_telefone}`}
            className="underline underline-offset-4 transition-colors hover:text-gold"
          >
            {pedido.cliente_telefone}
          </a>
          {" · "}
          <a
            href={`mailto:${pedido.cliente_email}`}
            className="underline underline-offset-4 transition-colors hover:text-gold"
          >
            {pedido.cliente_email}
          </a>
        </p>
        {correios ? (
          <div className="mt-1 text-smoke">
            <p>
              Correios {entrega?.servico_nome ?? ""}
              {pedido.frete_centavos > 0 ? ` · frete ${precoBRL(pedido.frete_centavos)}` : " · frete grátis"}
            </p>
            {/* do jeito que o Melhor Envio pede na etiqueta: dá pra copiar campo a campo */}
            <p className="text-paper/85">
              {[entrega?.rua, entrega?.numero, entrega?.complemento].filter(Boolean).join(", ")}
            </p>
            <p className="text-paper/85">
              {entrega?.bairro} · {entrega?.cidade}/{entrega?.uf}
            </p>
            <p className="numeros text-paper/85">CEP {entrega?.cep}</p>
            {pedido.cliente_cpf && <p className="numeros">CPF {formatarCpf(pedido.cliente_cpf)}</p>}
          </div>
        ) : (
          <p className="mt-1 text-smoke">
            {pedido.entrega_tipo === "retirada" ? "Retirada" : "Entrega na região"}
            {entrega?.endereco ? ` · ${entrega.endereco}` : ""}
          </p>
        )}
        {entrega?.observacao && <p className="mt-1 text-smoke">“{entrega.observacao}”</p>}
        {estornar && (
          <p className="mt-3 text-paper">
            O pagamento entrou depois do prazo e a peça já tinha sido vendida. Devolva pelo Mercado
            Pago: abra essa venda e toque em Devolver dinheiro.
          </p>
        )}
      </div>

      {correios && ["pago", "separado"].includes(pedido.status) && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const codigo = String(new FormData(e.currentTarget).get("rastreio") ?? "");
            setErro(null);
            iniciar(async () => {
              const r = await salvarRastreio(pedido.id, codigo);
              if (!r.ok) setErro(r.erro ?? "Não deu certo.");
            });
          }}
          className="mt-5 flex flex-wrap items-end gap-2.5"
        >
          <label className="flex min-w-[14rem] flex-1 flex-col gap-1.5">
            <span className="font-sans text-sm tracking-[0.16em] uppercase text-smoke">
              Código de rastreio
            </span>
            <input
              name="rastreio"
              defaultValue={pedido.rastreio ?? ""}
              placeholder="AB123456789BR"
              autoCapitalize="characters"
              className="numeros border-b border-paper/20 bg-transparent py-2 font-mono text-lg text-paper uppercase outline-none focus:border-gold"
            />
          </label>
          <button
            type="submit"
            className="carimbo skew-brand bg-gold px-4 py-3 font-display text-sm font-black tracking-tight uppercase text-ink transition-colors hover:bg-gold-deep"
          >
            <span className="unskew">{pedido.rastreio ? "Trocar código" : "Salvar e marcar postado"}</span>
          </button>
        </form>
      )}

      {whats && (
        <a
          href={whats}
          target="_blank"
          rel="noopener noreferrer"
          className="skew-brand mt-5 inline-block bg-steel px-4 py-3 font-display text-sm font-black tracking-tight uppercase text-paper transition-colors hover:text-gold"
        >
          <span className="unskew">Avisar no WhatsApp</span>
        </a>
      )}

      {acoes.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2.5">
          {acoes.map((a) => (
            <button
              key={a.valor}
              type="button"
              onClick={() => {
                setErro(null);
                iniciar(async () => {
                  const r = await mudarStatusPedido(pedido.id, a.valor);
                  if (!r.ok) setErro(r.erro ?? "Não deu certo.");
                });
              }}
              className={`skew-brand px-4 py-3 font-display text-sm font-black tracking-tight uppercase transition-colors ${
                a.valor === "cancelado"
                  ? "bg-paper/10 text-paper/70 hover:bg-paper/20"
                  : "carimbo bg-gold text-ink hover:bg-gold-deep"
              }`}
            >
              <span className="unskew">{a.texto}</span>
            </button>
          ))}
        </div>
      )}

      {erro && (
        <p role="alert" className="mt-3">
          <Aviso>{erro}</Aviso>
        </p>
      )}
    </li>
  );
}

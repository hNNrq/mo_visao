"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import {
  ajustarNaLista,
  alternarBooleano,
  excluirProduto,
} from "@/app/admin/acoes";
import { precoBRL } from "@/lib/format";
import { urlFoto } from "@/lib/supabase/publico";
import type { ProdutoComFotos } from "@/lib/types";

/**
 * Lista de produtos do painel.
 *
 * Cartão por produto, não tabela: ele mexe nisso pelo celular, e tabela com
 * várias colunas obriga a rolar pro lado. Preço e quantidade — o que muda toda
 * semana — se editam aqui mesmo, sem abrir outra tela.
 */
export function ListaProdutos({ produtos }: { produtos: ProdutoComFotos[] }) {
  return (
    <ul className="flex flex-col gap-4">
      {produtos.map((p) => (
        <CartaoProduto key={p.id} produto={p} />
      ))}
    </ul>
  );
}

function CartaoProduto({ produto }: { produto: ProdutoComFotos }) {
  const [erro, setErro] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [pendente, iniciar] = useTransition();

  const foto = produto.fotos[0];

  function rodar(fn: () => Promise<{ ok: boolean; erro?: string }>) {
    setErro(null);
    iniciar(async () => {
      const r = await fn();
      if (!r.ok) setErro(r.erro ?? "Não deu certo.");
    });
  }

  return (
    <li
      className={`rounded border border-white/10 bg-steel p-4 transition-opacity ${
        pendente ? "opacity-60" : ""
      } ${produto.ativo ? "" : "border-dashed"}`}
    >
      <div className="flex gap-4">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded bg-paper">
          {foto ? (
            <Image
              src={urlFoto(foto.storage_path)}
              alt=""
              fill
              sizes="80px"
              className="object-contain p-1"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-center font-sans text-[11px] leading-tight text-ink/40">
              sem
              <br />
              foto
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate font-display text-xl font-bold uppercase">
                {produto.nome}
              </h2>
              <p className="font-sans text-sm text-white/45">
                {produto.categoria === "corrida" ? "Corrida" : "Rua"}
                {produto.reservado > 0 && ` · ${produto.reservado} reservado`}
                {!produto.ativo && " · oculto da loja"}
              </p>
            </div>

            <Link
              href={`/admin/produtos/${produto.id}`}
              className="shrink-0 font-sans text-sm tracking-wide text-white/50 underline underline-offset-4 hover:text-white"
            >
              Editar
            </Link>
          </div>

          <div className="mt-3 flex flex-wrap gap-3">
            <CampoRapido
              rotulo="Preço"
              valorInicial={(produto.preco_centavos / 100).toFixed(2).replace(".", ",")}
              exibicao={precoBRL(produto.preco_centavos)}
              inputMode="decimal"
              aoSalvar={(v) => ajustarNaLista(produto.id, "preco_centavos", v)}
              onErro={setErro}
            />
            <CampoRapido
              rotulo="Quantidade"
              valorInicial={String(produto.estoque)}
              exibicao={
                produto.estoque === 0 ? "Esgotado" : `${produto.estoque} un.`
              }
              inputMode="numeric"
              aoSalvar={(v) => ajustarNaLista(produto.id, "estoque", v)}
              onErro={setErro}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
        <Interruptor
          ligado={produto.destaque}
          rotulo="Na página inicial"
          onChange={(v) => rodar(() => alternarBooleano(produto.id, "destaque", v))}
        />
        <Interruptor
          ligado={produto.ativo}
          rotulo="Visível na loja"
          onChange={(v) => rodar(() => alternarBooleano(produto.id, "ativo", v))}
        />

        <div className="ml-auto">
          {confirmando ? (
            <span className="flex items-center gap-2">
              <span className="font-sans text-sm text-white/70">Apagar mesmo?</span>
              <button
                type="button"
                onClick={() => rodar(() => excluirProduto(produto.id))}
                className="rounded bg-hot px-3 py-2 font-display text-sm font-bold uppercase text-white"
              >
                Apagar
              </button>
              <button
                type="button"
                onClick={() => setConfirmando(false)}
                className="rounded border border-white/20 px-3 py-2 font-display text-sm font-bold uppercase text-white/70"
              >
                Não
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmando(true)}
              className="rounded px-3 py-2 font-sans text-sm text-white/40 hover:text-hot"
            >
              Apagar
            </button>
          )}
        </div>
      </div>

      {erro && (
        <p role="alert" className="mt-3 font-sans text-sm text-hot">
          {erro}
        </p>
      )}
    </li>
  );
}

/**
 * Campo que vira input ao toque e salva ao sair. Sem botão "salvar" por campo:
 * um toque a menos em cada ajuste de preço.
 */
function CampoRapido({
  rotulo,
  valorInicial,
  exibicao,
  inputMode,
  aoSalvar,
  onErro,
}: {
  rotulo: string;
  valorInicial: string;
  exibicao: string;
  inputMode: "decimal" | "numeric";
  aoSalvar: (valor: string) => Promise<{ ok: boolean; erro?: string }>;
  onErro: (e: string | null) => void;
}) {
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(valorInicial);
  const [salvando, setSalvando] = useState(false);

  async function confirmar() {
    setEditando(false);
    if (valor === valorInicial) return;

    setSalvando(true);
    onErro(null);
    const r = await aoSalvar(valor);
    setSalvando(false);
    if (!r.ok) {
      onErro(r.erro ?? "Não deu pra salvar.");
      setValor(valorInicial);
    }
  }

  if (editando) {
    return (
      <label className="flex flex-col gap-1">
        <span className="font-display text-[11px] font-bold tracking-wider uppercase text-white/45">
          {rotulo}
        </span>
        <input
          autoFocus
          value={valor}
          inputMode={inputMode}
          onChange={(e) => setValor(e.target.value)}
          onBlur={confirmar}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            if (e.key === "Escape") {
              setValor(valorInicial);
              setEditando(false);
            }
          }}
          className="w-28 rounded border border-hot bg-ink px-3 py-2 font-display text-lg text-white outline-none"
        />
      </label>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditando(true)}
      className="flex flex-col gap-1 rounded border border-white/15 px-3 py-2 text-left transition-colors hover:border-white/40"
    >
      <span className="font-display text-[11px] font-bold tracking-wider uppercase text-white/45">
        {rotulo}
      </span>
      <span className="font-display text-lg text-white">
        {salvando ? "salvando..." : exibicao}
      </span>
    </button>
  );
}

function Interruptor({
  ligado,
  rotulo,
  onChange,
}: {
  ligado: boolean;
  rotulo: string;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligado}
      onClick={() => onChange(!ligado)}
      className={`flex items-center gap-2 rounded border px-3 py-2 font-sans text-sm transition-colors ${
        ligado
          ? "border-hot/60 bg-hot/15 text-white"
          : "border-white/15 text-white/45"
      }`}
    >
      <span
        aria-hidden
        className={`h-3 w-3 rounded-full ${ligado ? "bg-hot" : "bg-white/25"}`}
      />
      {rotulo}
    </button>
  );
}

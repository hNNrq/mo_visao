"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Aviso } from "@/componentes/admin/Aviso";
import { ajustarNaLista, alternarBooleano } from "@/app/admin/acoes";
import { precoBRL } from "@/lib/format";
import { urlFoto } from "@/lib/supabase/publico";
import type { ProdutoComFotos } from "@/lib/types";

/**
 * O quadro de preços da loja.
 *
 * Uma coluna de nomes de um lado, a coluna de ouro dos preços do outro. Não é
 * tabela — tabela de colunas obriga a rolar pro lado no celular, que é onde ele
 * mexe nisso. E não é cartão: cartão gasta a tela inteira pra mostrar três
 * produtos, quando o que ele quer é bater o olho em dez.
 *
 * Preço e quantidade — o que muda toda semana — se editam na própria linha. O
 * resto (foto, descrição, apagar) mora na tela do produto, a um toque no nome.
 */
export function ListaProdutos({ produtos }: { produtos: ProdutoComFotos[] }) {
  return (
    <ul>
      {produtos.map((p) => (
        <LinhaProduto key={p.id} produto={p} />
      ))}
    </ul>
  );
}

function LinhaProduto({ produto }: { produto: ProdutoComFotos }) {
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();

  const foto = produto.fotos[0];

  const meta = [
    produto.reservado > 0 ? `${produto.reservado} reservado` : null,
    produto.ativo ? null : "oculto da loja",
  ]
    .filter(Boolean)
    .join(" · ");

  function alternar(coluna: "destaque" | "ativo", valor: boolean) {
    setErro(null);
    iniciar(async () => {
      const r = await alternarBooleano(produto.id, coluna, valor);
      if (!r.ok) setErro(r.erro ?? "Não deu certo.");
    });
  }

  return (
    <li
      className={`border-b border-paper/10 py-3 transition-opacity last:border-b-0 sm:py-4 ${
        pendente ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-start gap-3.5 sm:gap-4">
        {/* Papel, mas chapado: a folha de verdade — torta, com a folha de ontem
            deslocada 7px/8px embaixo — mora na tela do produto. Aqui ela
            quebraria o ritmo da coluna, e é o ritmo que faz a lista ser lista.
            40px no celular pra sobrar altura de linha; a lista existe pra ele
            bater o olho em dez produtos, não em três. */}
        <div className="relative size-10 shrink-0 bg-paper sm:size-14">
          {foto ? (
            <Image
              src={urlFoto(foto.storage_path)}
              alt=""
              fill
              sizes="56px"
              className="object-contain p-1"
            />
          ) : (
            <span className="flex h-full items-center justify-center font-sans text-sm tracking-[0.2em] uppercase text-ink/45">
              sem
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Link
                href={`/admin/produtos/${produto.id}`}
                // duas linhas em vez de reticências: com o carimbo de preço
                // ocupando a direita, "Radar EV Prizm Road" chegava cortado em
                // 390px, e nome cortado é produto que ele não reconhece
                className={`line-clamp-2 font-display text-lg leading-tight font-black tracking-tight uppercase transition-colors hover:text-gold sm:text-2xl ${
                  produto.ativo ? "text-paper" : "text-paper/55"
                }`}
              >
                {produto.nome}
              </Link>
              <p className="font-sans text-sm tracking-wide text-smoke">
                {meta}
              </p>
            </div>

            <CampoNaLinha
              rotulo="Preço"
              valorInicial={(produto.preco_centavos / 100)
                .toFixed(2)
                .replace(".", ",")}
              exibicao={precoBRL(produto.preco_centavos)}
              inputMode="decimal"
              aparencia="carimbo"
              aoSalvar={(v) => ajustarNaLista(produto.id, "preco_centavos", v)}
              onErro={setErro}
            />
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <CampoNaLinha
              rotulo="Quantidade"
              valorInicial={String(produto.estoque)}
              exibicao={
                produto.estoque === 0 ? "Esgotado" : `${produto.estoque} un.`
              }
              inputMode="numeric"
              aparencia="campo"
              aoSalvar={(v) => ajustarNaLista(produto.id, "estoque", v)}
              onErro={setErro}
            />

            <Interruptor
              ligado={produto.ativo}
              texto="Na loja"
              nomeCompleto="Mostrar na loja"
              onChange={(v) => alternar("ativo", v)}
            />
            <Interruptor
              ligado={produto.destaque}
              texto="Em destaque"
              nomeCompleto="Mostrar em destaque na página inicial"
              onChange={(v) => alternar("destaque", v)}
            />
          </div>
        </div>
      </div>

      {erro && (
        <p role="alert" className="mt-3">
          <Aviso>{erro}</Aviso>
        </p>
      )}
    </li>
  );
}

/**
 * Campo que vira input ao toque e salva ao sair. Sem botão "salvar" por campo:
 * um toque a menos em cada ajuste de preço.
 *
 * Em `carimbo` ele é o próprio bloco de ouro do preço — ele digita em cima do
 * carimbo, não num formulário sobre ele. Por isso o cursor de texto vira preto
 * ali: o cursor de ouro do resto do site sumiria contra o fundo dourado.
 */
function CampoNaLinha({
  rotulo,
  valorInicial,
  exibicao,
  inputMode,
  aparencia,
  aoSalvar,
  onErro,
}: {
  rotulo: string;
  valorInicial: string;
  exibicao: string;
  inputMode: "decimal" | "numeric";
  aparencia: "carimbo" | "campo";
  aoSalvar: (valor: string) => Promise<{ ok: boolean; erro?: string }>;
  onErro: (e: string | null) => void;
}) {
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(valorInicial);
  const [salvando, setSalvando] = useState(false);

  const carimbo = aparencia === "carimbo";

  const bloco = carimbo
    ? "carimbo skew-brand bg-gold text-ink"
    : "skew-brand bg-paper/12 text-paper";

  /**
   * No celular o bloco encolhe: a coluna de preço é a tese da tela, mas o nome
   * é como ele acha o produto — com o carimbo em corpo grande, "Radar EV Prizm
   * Road" já chegava truncado em 390px.
   */
  const corpo = "font-display text-base font-black sm:text-lg";

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
      <span className={`${bloco} inline-block shrink-0 px-3 py-1.5 sm:py-2`}>
        <input
          autoFocus
          value={valor}
          aria-label={rotulo}
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
          className={`numeros unskew ${corpo} bg-transparent outline-none ${
            carimbo ? "w-24 text-right [caret-color:var(--color-ink)]" : "w-14"
          }`}
        />
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditando(true)}
      aria-label={`${rotulo}: ${exibicao}. Tocar pra mudar.`}
      className={`${bloco} shrink-0 px-3 py-1.5 transition-opacity sm:py-2 ${
        salvando ? "opacity-60" : ""
      } ${carimbo ? "" : "hover:bg-paper/20"}`}
    >
      <span className={`numeros unskew ${corpo}`}>
        {salvando ? "..." : exibicao}
      </span>
    </button>
  );
}

/**
 * Ligado é bloco de PAPEL com letra preta; parado é papel a 8% sobre o muro.
 *
 * Não é bloco de ouro, e isso foi uma correção: numa loja em ordem quase todo
 * produto está na loja e vários estão em destaque, então dois carimbos de ouro
 * por linha enchiam a tela de dourado e a coluna de preço — que é a tese dessa
 * tela — sumia no meio. O ouro aqui é só do preço e da ação. O binário fica na
 * segunda tinta: tem papel ou não tem.
 */
function Interruptor({
  ligado,
  texto,
  nomeCompleto,
  onChange,
}: {
  ligado: boolean;
  texto: string;
  nomeCompleto: string;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligado}
      aria-label={nomeCompleto}
      onClick={() => onChange(!ligado)}
      className={`skew-brand px-3 py-1.5 font-display text-sm font-black tracking-tight uppercase transition-colors sm:py-2 ${
        ligado
          ? "bg-paper text-ink hover:bg-paper/85"
          : "bg-paper/8 text-paper/55 hover:bg-paper/20"
      }`}
    >
      <span className="unskew">{texto}</span>
    </button>
  );
}

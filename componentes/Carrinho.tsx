"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore, useTransition } from "react";
import {
  esvaziar,
  lembrarPedido,
  lerItens,
  substituir,
  mudarQuantidade,
  remover,
  useCarrinho,
  MAX_POR_ITEM,
} from "@/lib/carrinho";
import { precoBRL } from "@/lib/format";
import type { ItemCarrinho } from "@/lib/types";
import { conferirCarrinho, fecharPedido } from "@/app/(loja)/carrinho/acoes";

/**
 * O carrinho e o fechamento na mesma tela.
 *
 * Numa loja de poucos modelos e peça única, "carrinho" e "checkout" em duas
 * páginas é uma etapa a mais pra quem já decidiu. Aqui a lista vem em cima e o
 * formulário embaixo, e o botão final leva direto pro Mercado Pago.
 *
 * A conta mostrada é ESTIMATIVA feita com o preço do carrinho e a config da
 * loja — quem calcula o valor cobrado é o banco. As duas batem porque as
 * regras são as mesmas (desconto do Pix só sobre as peças, frete grátis acima
 * do valor configurado); se o preço mudou no meio do caminho, a `conferir`
 * abaixo corrige a lista assim que a página abre.
 *
 * O formulário é a régua da prancha: campo sem caixa, só o fio embaixo, que
 * acende em ouro no foco. O `steel` dos campos do painel não entra na vitrine.
 */

export type ConfigCheckout = {
  descontoPixPct: number;
  freteLocalCentavos: number;
  freteGratisAcimaCentavos: number;
  entregaTexto: string;
  parcelasSemJuros: number;
  pagamentoLigado: boolean;
};

const ROTULO = "font-sans text-sm tracking-[0.16em] uppercase text-smoke";
const CAMPO =
  "w-full border-b regua bg-transparent py-3 font-sans text-xl text-paper outline-none transition-colors placeholder:text-sob focus:border-gold";

export function Carrinho({ config }: { config: ConfigCheckout }) {
  const itens = useCarrinho();
  const [entrega, setEntrega] = useState<"retirada" | "local">("local");
  const [pagamento, setPagamento] = useState<"pix" | "cartao">("pix");
  const [erro, setErro] = useState<{ texto: string; campo?: string } | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [enviando, iniciar] = useTransition();

  // localStorage só existe no navegador: antes disso a lista é sempre vazia,
  // e mostrar "carrinho vazio" por um quadro enganaria quem tem peça nele
  const montado = useSyncExternalStore(
    nada,
    () => true,
    () => false,
  );

  // preço e estoque de agora, não os de quando a peça entrou no carrinho
  const ids = itens.map((i) => i.produto_id).join(",");
  useEffect(() => {
    if (!ids) return;
    let vivo = true;
    conferirCarrinho(ids.split(",")).then((atuais) => {
      if (!vivo) return;
      const mudou = aplicarConferencia(atuais);
      if (mudou) setAviso(mudou);
    });
    return () => {
      vivo = false;
    };
    // só quando muda QUAIS peças estão no carrinho, não a quantidade
  }, [ids]);

  if (!montado) return <main className="min-h-[70svh] bg-ink" />;

  if (itens.length === 0) {
    return (
      <main className="flex min-h-[70svh] flex-col justify-center bg-ink px-5 pt-28 pb-20 sm:px-10">
        <div className="mx-auto w-full max-w-[1100px]">
          <h1 className="max-w-[16ch] font-display text-[clamp(2.25rem,7vw,5rem)] leading-[0.9] font-black tracking-tight text-balance uppercase text-paper">
            Carrinho vazio
          </h1>
          <p className="mt-8 max-w-[46ch] font-sans text-xl leading-snug text-smoke">
            Escolhe um óculos no catálogo e ele aparece aqui.
          </p>
          <Link
            href="/produtos"
            className="carimbo skew-brand mt-10 inline-block bg-gold px-8 py-4 font-display text-xl font-black tracking-tight uppercase text-ink transition-colors hover:bg-gold-deep"
          >
            <span className="unskew">Ver os óculos</span>
          </Link>
        </div>
      </main>
    );
  }

  const subtotal = itens.reduce((s, i) => s + i.preco_centavos * i.quantidade, 0);
  const gratis = config.freteGratisAcimaCentavos > 0 && subtotal >= config.freteGratisAcimaCentavos;
  const frete = entrega === "local" && !gratis ? config.freteLocalCentavos : 0;
  const desconto =
    pagamento === "pix" && config.descontoPixPct > 0
      ? Math.round((subtotal * Math.min(config.descontoPixPct, 50)) / 100)
      : 0;
  const total = subtotal + frete - desconto;

  function enviar(form: FormData) {
    setErro(null);
    iniciar(async () => {
      // se a ação estourar no servidor (500), a promise rejeita e nada mais
      // acontece — sem este catch a pessoa fica olhando o botão sem resposta
      const r = await fecharPedido({
        nome: String(form.get("nome") ?? ""),
        email: String(form.get("email") ?? ""),
        telefone: String(form.get("telefone") ?? ""),
        entrega,
        endereco: String(form.get("endereco") ?? ""),
        observacao: String(form.get("observacao") ?? ""),
        pagamento,
        itens: itens.map((i) => ({ produto_id: i.produto_id, quantidade: i.quantidade })),
      }).catch(() => ({
        ok: false as const,
        erro: "Não deu pra fechar o pedido agora. Tenta de novo em instantes — nada foi cobrado.",
        campo: undefined,
      }));

      if (!r.ok) {
        setErro({ texto: r.erro, campo: r.campo });
        if (r.campo) document.querySelector<HTMLElement>(`[name="${r.campo}"]`)?.focus();
        return;
      }

      // o pedido existe e a peça está reservada: o carrinho já cumpriu o papel.
      // Se a pessoa fechar o Mercado Pago, o link de pagar está na página do pedido.
      lembrarPedido(r.pedidoId);
      esvaziar();
      window.location.assign(r.url);
    });
  }

  return (
    <main className="bg-ink px-5 pt-28 pb-24 sm:px-10 sm:pt-32 sm:pb-32">
      <div className="mx-auto grid max-w-[1100px] gap-16 lg:grid-cols-[1fr_minmax(0,420px)] lg:gap-20">
        <section aria-labelledby="titulo-carrinho">
          <h1
            id="titulo-carrinho"
            className="font-display text-[clamp(2.25rem,6vw,4.5rem)] leading-[0.9] font-black tracking-tight uppercase text-paper"
          >
            Carrinho
          </h1>

          {aviso && (
            <p role="status" className="mt-6 max-w-[52ch] font-sans text-lg leading-snug text-gold">
              {aviso}
            </p>
          )}

          <ul className="mt-10 border-t regua">
            {itens.map((item) => (
              <li key={item.produto_id} className="flex gap-5 border-b regua py-6">
                <Link
                  href={`/produtos/${item.slug}`}
                  className="relative aspect-[4/3] w-28 shrink-0 border regua sm:w-36"
                >
                  {item.foto && (
                    <Image
                      src={item.foto}
                      alt=""
                      fill
                      sizes="144px"
                      className="object-contain p-2"
                    />
                  )}
                </Link>

                <div className="flex min-w-0 flex-1 flex-col gap-3">
                  {/* no celular o preço desce pra linha da quantidade: lado a lado com o
                      nome, "Radar EV Prizm Road" quebrava em quatro linhas de uma palavra */}
                  <div className="flex items-start justify-between gap-4">
                    <Link
                      href={`/produtos/${item.slug}`}
                      className="font-display text-xl leading-tight font-black tracking-tight uppercase text-paper transition-colors hover:text-gold sm:text-2xl"
                    >
                      {item.nome}
                    </Link>
                    <span className="numeros hidden shrink-0 font-mono text-lg font-bold text-gold sm:inline">
                      {precoBRL(item.preco_centavos * item.quantidade)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                    <div className="flex items-center border regua" role="group" aria-label={`Quantidade de ${item.nome}`}>
                      <button
                        type="button"
                        onClick={() => mudarQuantidade(item.produto_id, item.quantidade - 1)}
                        className="flex size-11 items-center justify-center font-mono text-xl text-paper transition-colors hover:text-gold"
                        aria-label="Tirar uma"
                      >
                        −
                      </button>
                      <span className="numeros w-8 text-center font-mono text-lg text-paper" aria-live="polite">
                        {item.quantidade}
                      </span>
                      <button
                        type="button"
                        onClick={() => mudarQuantidade(item.produto_id, item.quantidade + 1)}
                        disabled={item.quantidade >= MAX_POR_ITEM}
                        className="flex size-11 items-center justify-center font-mono text-xl text-paper transition-colors hover:text-gold disabled:text-sob"
                        aria-label="Mais uma"
                      >
                        +
                      </button>
                    </div>
                    <span className="numeros order-last ml-auto font-mono text-lg font-bold text-gold sm:hidden">
                      {precoBRL(item.preco_centavos * item.quantidade)}
                    </span>
                    <button
                      type="button"
                      onClick={() => remover(item.produto_id)}
                      className="min-h-11 font-sans text-sm tracking-[0.16em] uppercase text-smoke underline-offset-4 transition-colors hover:text-gold hover:underline"
                    >
                      Tirar
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <Link
            href="/produtos"
            className="mt-6 inline-flex min-h-11 items-center font-sans text-base tracking-[0.16em] uppercase text-smoke transition-colors hover:text-gold"
          >
            ← Continuar olhando
          </Link>
        </section>

        <section aria-labelledby="titulo-fechar">
          <h2
            id="titulo-fechar"
            className="font-display text-3xl leading-none font-black tracking-tight uppercase text-paper"
          >
            Fechar o pedido
          </h2>

          {/*
            onSubmit, e NÃO action={enviar}: com action o React 19 limpa o
            formulário depois de cada envio — e quando o pedido falha (peça
            esgotou, Mercado Pago fora) a pessoa perdia nome, WhatsApp e email.
          */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              enviar(new FormData(e.currentTarget));
            }}
            className="mt-8 flex flex-col gap-8"
            noValidate
          >
            <fieldset className="flex flex-col gap-6">
              <legend className="sr-only">Teus dados</legend>
              <label className="flex flex-col gap-1">
                <span className={ROTULO}>Nome</span>
                <input name="nome" autoComplete="name" required className={CAMPO} />
              </label>
              <label className="flex flex-col gap-1">
                <span className={ROTULO}>WhatsApp</span>
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
              <label className="flex flex-col gap-1">
                <span className={ROTULO}>Email</span>
                <input
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  required
                  className={CAMPO}
                />
                <span className="mt-1 font-sans text-sm text-smoke">
                  O comprovante do Mercado Pago chega nele.
                </span>
              </label>
            </fieldset>

            <fieldset>
              <legend className={ROTULO}>Como tu recebe</legend>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Opcao
                  nome="entrega"
                  ativo={entrega === "local"}
                  aoEscolher={() => setEntrega("local")}
                  titulo="Entrega"
                  detalhe={
                    gratis || config.freteLocalCentavos === 0
                      ? "Grátis na região"
                      : `${precoBRL(config.freteLocalCentavos)} na região`
                  }
                />
                <Opcao
                  nome="entrega"
                  ativo={entrega === "retirada"}
                  aoEscolher={() => setEntrega("retirada")}
                  titulo="Retirada"
                  detalhe="Combinada no WhatsApp"
                />
              </div>
              {config.entregaTexto && (
                <p className="mt-3 font-sans text-base leading-snug text-smoke">{config.entregaTexto}</p>
              )}
            </fieldset>

            {entrega === "local" && (
              <label className="flex flex-col gap-1">
                <span className={ROTULO}>Endereço</span>
                <input
                  name="endereco"
                  autoComplete="street-address"
                  placeholder="Rua, número, bairro"
                  className={CAMPO}
                />
              </label>
            )}

            <label className="flex flex-col gap-1">
              <span className={ROTULO}>Observação (opcional)</span>
              <input name="observacao" placeholder="Ponto de referência, melhor horário…" className={CAMPO} />
            </label>

            <fieldset>
              <legend className={ROTULO}>Como tu paga</legend>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Opcao
                  nome="pagamento"
                  ativo={pagamento === "pix"}
                  aoEscolher={() => setPagamento("pix")}
                  titulo="Pix"
                  detalhe={config.descontoPixPct > 0 ? `${config.descontoPixPct}% de desconto` : "Cai na hora"}
                />
                <Opcao
                  nome="pagamento"
                  ativo={pagamento === "cartao"}
                  aoEscolher={() => setPagamento("cartao")}
                  titulo="Cartão"
                  detalhe={
                    config.parcelasSemJuros > 1
                      ? `Até ${config.parcelasSemJuros}x sem juros`
                      : "Crédito ou débito"
                  }
                />
              </div>
            </fieldset>

            <dl className="numeros flex flex-col gap-2 border-t regua pt-6 font-sans text-lg">
              <Linha rotulo="Peças" valor={precoBRL(subtotal)} />
              {entrega === "local" && (
                <Linha rotulo="Entrega" valor={frete === 0 ? "Grátis" : precoBRL(frete)} />
              )}
              {desconto > 0 && <Linha rotulo="Desconto no Pix" valor={`− ${precoBRL(desconto)}`} />}
              <div className="mt-2 flex items-baseline justify-between gap-4">
                <dt className={ROTULO}>Total</dt>
                <dd className="font-mono text-3xl font-bold text-gold">{precoBRL(total)}</dd>
              </div>
            </dl>

            {erro && (
              <p role="alert" className="border-l-2 border-gold pl-4 font-sans text-lg leading-snug text-paper">
                {erro.texto}
              </p>
            )}

            <button
              type="submit"
              disabled={enviando || !config.pagamentoLigado}
              // o skew empurra os cantos ~1rem pra fora da caixa: sem o recuo, o
              // botão de largura cheia passa da margem da tela no celular
              className="carimbo skew-brand mx-auto block w-[calc(100%-1.5rem)] bg-gold px-8 py-5 font-display text-2xl font-black tracking-tight uppercase text-ink transition-colors hover:bg-gold-deep disabled:opacity-60"
            >
              <span className="unskew">
                {enviando ? "Abrindo o pagamento…" : pagamento === "pix" ? "Pagar com Pix" : "Pagar com cartão"}
              </span>
            </button>

            <p className="font-sans text-base leading-snug text-smoke">
              {config.pagamentoLigado
                ? "Tu paga na tela do Mercado Pago — a loja não vê os dados do teu cartão. A peça fica guardada pra ti enquanto o pagamento acontece."
                : "A compra pelo site ainda não abriu. Chama no Instagram que a gente reserva."}{" "}
              <Link href="/trocas-e-devolucoes" className="underline underline-offset-4 transition-colors hover:text-gold">
                Trocas e devoluções
              </Link>
              .
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}

const nada = () => () => {};

/**
 * Escolha de duas vias. É `radio` de verdade por baixo (teclado e leitor de
 * tela funcionam como em qualquer formulário), com cara de bloco: ligado é
 * PAPEL com letra preta — o ouro fica pro botão de pagar, que é a ação.
 */
function Opcao({
  nome,
  ativo,
  aoEscolher,
  titulo,
  detalhe,
}: {
  nome: string;
  ativo: boolean;
  aoEscolher: () => void;
  titulo: string;
  detalhe: string;
}) {
  return (
    <label
      className={`flex min-h-16 cursor-pointer flex-col justify-center gap-0.5 border px-4 py-3 transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-gold ${
        ativo ? "border-paper bg-paper text-ink" : "regua text-paper hover:border-paper/50"
      }`}
    >
      <input type="radio" name={nome} checked={ativo} onChange={aoEscolher} className="sr-only" />
      <span className="font-display text-lg leading-none font-black tracking-tight uppercase">{titulo}</span>
      <span className={`font-sans text-sm leading-tight ${ativo ? "text-ink/70" : "text-smoke"}`}>
        {detalhe}
      </span>
    </label>
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

/**
 * Aplica o que o servidor devolveu sobre o carrinho guardado. Devolve a frase
 * pra mostrar se algo mudou, ou null.
 */
function aplicarConferencia(
  atuais: (Omit<ItemCarrinho, "quantidade"> & { disponivel: number })[],
): string | null {
  const porId = new Map(atuais.map((a) => [a.produto_id, a]));
  const avisos: string[] = [];

  const novos = lerItens().flatMap((i): ItemCarrinho[] => {
    const atual = porId.get(i.produto_id);
    if (!atual || atual.disponivel <= 0) {
      avisos.push(`${i.nome} esgotou e saiu do carrinho.`);
      return [];
    }
    if (atual.preco_centavos !== i.preco_centavos) {
      avisos.push(`O preço de ${atual.nome} mudou pra ${precoBRL(atual.preco_centavos)}.`);
    }
    const quantidade = Math.min(i.quantidade, atual.disponivel, MAX_POR_ITEM);
    if (quantidade < i.quantidade) {
      avisos.push(`Só ${atual.disponivel === 1 ? "sobrou 1" : `sobraram ${atual.disponivel}`} de ${atual.nome}.`);
    }
    return [
      {
        produto_id: atual.produto_id,
        slug: atual.slug,
        nome: atual.nome,
        preco_centavos: atual.preco_centavos,
        foto: atual.foto,
        quantidade,
      },
    ];
  });

  if (avisos.length === 0) return null;
  substituir(novos);
  return avisos.join(" ");
}

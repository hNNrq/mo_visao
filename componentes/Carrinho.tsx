"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore, useTransition } from "react";
import {
  conferirCarrinho,
  cotarFrete,
  fecharPedido,
  type LinhaCarrinho,
} from "@/app/(loja)/carrinho/acoes";
import type { OpcaoFrete } from "@/lib/frete";
import { definirQuantidade, lembrarPedido, useCarrinho } from "@/lib/carrinho";
import { parcelamento, precoBRL } from "@/lib/format";

/**
 * Carrinho e fechamento numa tela só.
 *
 * Quem chega aqui veio de um "Comprar" e quase sempre tem UMA peça. Dividir em
 * carrinho → dados → entrega → revisão seria quatro telas pra um óculos, no
 * celular, no navegador do Instagram. Aqui é uma rolagem: o que leva, quem é,
 * como recebe, pagar.
 *
 * Preço e estoque na tela são os de AGORA (relidos no servidor ao abrir), e o
 * total que vale é o que o banco calcula quando o pedido nasce.
 */

type Props = {
  entregaTexto: string;
  freteGratisAcimaCentavos: number;
  reservaMinutos: number;
};

/** Cotação feita pra um carrinho específico: mudou a quantidade, vale de novo. */
type Cotacao = { chave: string; cep: string; opcoes: OpcaoFrete[] };
type Endereco = { rua: string; numero: string; complemento: string; bairro: string; cidade: string; uf: string };
const enderecoVazio: Endereco = { rua: "", numero: "", complemento: "", bairro: "", cidade: "", uf: "" };

const naoAssina = () => () => {};

const rotulo = "font-sans text-sm tracking-[0.16em] uppercase text-smoke";
const campo =
  "w-full bg-steel px-4 py-4 font-sans text-lg text-paper outline-none placeholder:text-smoke";

export function Carrinho({
  entregaTexto,
  freteGratisAcimaCentavos,
  reservaMinutos,
}: Props) {
  const itens = useCarrinho();
  // o carrinho mora no navegador: no HTML do servidor ele sempre está vazio
  const noNavegador = useSyncExternalStore(naoAssina, () => true, () => false);

  const [linhas, setLinhas] = useState<Record<string, LinhaCarrinho> | null>(null);
  const [entrega, setEntrega] = useState<"correios" | "retirada">("correios");
  const [cep, setCep] = useState("");
  const [cotacao, setCotacao] = useState<Cotacao | null>(null);
  const [servico, setServico] = useState<number | null>(null);
  const [endereco, setEndereco] = useState<Endereco>(enderecoVazio);
  const [erroFrete, setErroFrete] = useState<string | null>(null);
  const [cotando, iniciarCotacao] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [esgotado, setEsgotado] = useState<string | null>(null);
  const [falhou, setFalhou] = useState(false);
  const [enviando, iniciar] = useTransition();

  const chaveIds = itens.map((i) => i.produto_id).sort().join(",");

  useEffect(() => {
    if (!chaveIds) return;
    let vivo = true;
    conferirCarrinho(chaveIds.split(",")).then((r) => {
      if (!vivo) return;
      if (r === null) {
        setFalhou(true);
        return;
      }
      setFalhou(false);
      const mapa = Object.fromEntries(r.map((l) => [l.id, l]));
      // produto que saiu da loja (apagado ou oculto) sai do carrinho também
      for (const id of chaveIds.split(",")) if (!mapa[id]) definirQuantidade(id, 0);
      setLinhas(mapa);
    });
    return () => {
      vivo = false;
    };
  }, [chaveIds]);

  if (falhou && linhas === null) {
    return (
      <Moldura>
        <p role="alert" className="max-w-[40ch] font-sans text-xl leading-snug text-smoke">
          Não deu pra carregar o carrinho agora. Tuas peças continuam guardadas —
          atualiza a página em instantes.
        </p>
      </Moldura>
    );
  }

  if (!noNavegador || (itens.length > 0 && linhas === null)) {
    return (
      <Moldura>
        <p className="font-sans text-lg text-smoke" role="status">
          Abrindo o carrinho…
        </p>
      </Moldura>
    );
  }

  const visiveis = itens.filter((i) => linhas?.[i.produto_id]);

  if (visiveis.length === 0) {
    return (
      <Moldura>
        <p className="max-w-[40ch] font-sans text-xl leading-snug text-smoke">
          Nada aqui ainda. Escolhe o modelo no catálogo e aperta comprar.
        </p>
        <Link
          href="/produtos"
          className="skew-brand mt-10 inline-block bg-gold px-8 py-4 font-display text-xl font-black tracking-tight uppercase text-ink transition-colors hover:bg-gold-deep"
        >
          <span className="unskew">Ver os óculos</span>
        </Link>
      </Moldura>
    );
  }

  const subtotal = visiveis.reduce(
    (s, i) => s + linhas![i.produto_id].preco_centavos * i.quantidade,
    0,
  );
  const itensPedido = visiveis.map((i) => ({ produto_id: i.produto_id, quantidade: i.quantidade }));
  const chaveItens = itensPedido.map((i) => `${i.produto_id}:${i.quantidade}`).join(",");
  // cotação feita pra outro carrinho ou outro CEP não vale: peso, valor
  // declarado ou distância mudaram
  const soDigitos = (t: string) => t.replace(/\D/g, "");
  const opcoes =
    cotacao?.chave === chaveItens && soDigitos(cotacao.cep) === soDigitos(cep)
      ? cotacao.opcoes
      : null;
  const escolhida = opcoes?.find((o) => o.servico === servico) ?? null;
  const freteGratis = freteGratisAcimaCentavos > 0 && subtotal >= freteGratisAcimaCentavos;
  const frete = entrega === "correios" && escolhida && !freteGratis ? escolhida.precoCentavos : 0;
  const faltaFrete = entrega === "correios" && !escolhida;
  const total = subtotal + frete;
  const parcelas = parcelamento(total);
  const algumEsgotado = visiveis.some(
    (i) => linhas![i.produto_id].disponivel < i.quantidade,
  );

  function cotar() {
    setErroFrete(null);
    iniciarCotacao(async () => {
      const r = await cotarFrete(cep, itensPedido);
      if (!r.ok) {
        setCotacao(null);
        setErroFrete(r.erro);
        return;
      }
      setCotacao({ chave: chaveItens, cep, opcoes: r.opcoes });
      // o mais barato já vem marcado: é o que quase todo mundo escolhe
      setServico(r.opcoes[0]?.servico ?? null);
      // ViaCEP preenche o que sabe; o que a pessoa já digitou não é apagado
      if (r.endereco) {
        const e = r.endereco;
        setEndereco((atual) => ({
          ...atual,
          rua: e.rua || atual.rua,
          bairro: e.bairro || atual.bairro,
          cidade: e.cidade || atual.cidade,
          uf: e.uf || atual.uf,
        }));
      }
    });
  }

  function enviar(form: FormData) {
    setErro(null);
    setEsgotado(null);
    iniciar(async () => {
      const r = await fecharPedido({
        nome: String(form.get("nome") ?? ""),
        telefone: String(form.get("telefone") ?? ""),
        email: String(form.get("email") ?? ""),
        entrega_tipo: entrega,
        correios:
          entrega === "correios" && escolhida && cotacao
            ? { cep: cotacao.cep, servico: escolhida.servico, ...endereco }
            : undefined,
        observacao: String(form.get("observacao") ?? "") || undefined,
        itens: itensPedido,
      });

      if (!r.ok) {
        setErro(r.erro);
        if (r.esgotado) {
          setEsgotado(r.esgotado);
          // o estoque mudou desde que a tela abriu: relê pra mostrar o real
          conferirCarrinho(visiveis.map((i) => i.produto_id)).then((l) => {
            if (l) setLinhas(Object.fromEntries(l.map((x) => [x.id, x])));
          });
        }
        return;
      }

      lembrarPedido({ numero: r.numero, token: r.token });
      window.location.assign(r.url);
    });
  }

  return (
    <Moldura>
      <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)] lg:gap-20">
        {/* o que leva */}
        <section aria-labelledby="leva">
          <h2 id="leva" className={rotulo}>
            O que você leva
          </h2>
          <ul className="mt-4 border-t regua">
            {visiveis.map((item) => {
              const l = linhas![item.produto_id];
              const falta = l.disponivel < item.quantidade;
              return (
                <li
                  key={item.produto_id}
                  className={`flex gap-4 border-b regua py-5 ${
                    esgotado === item.produto_id ? "border-l-2 border-l-gold pl-3" : ""
                  }`}
                >
                  <Link
                    href={`/produtos/${l.slug}`}
                    className="relative block aspect-[4/3] w-24 shrink-0 border regua sm:w-32"
                  >
                    {l.foto ? (
                      <Image
                        src={l.foto}
                        alt={l.nome}
                        fill
                        sizes="128px"
                        className={`object-contain p-2 ${falta ? "opacity-30" : ""}`}
                      />
                    ) : null}
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-display text-xl leading-[0.95] font-black tracking-tight text-balance text-paper uppercase">
                          {l.nome}
                        </p>
                        {l.marca && <p className="mt-1 font-sans text-base text-smoke">{l.marca}</p>}
                      </div>
                      <p className="numeros shrink-0 cota pl-3 text-right font-mono text-lg font-bold text-gold">
                        {precoBRL(l.preco_centavos * item.quantidade)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                      {falta ? (
                        <p className="font-sans text-sm tracking-[0.16em] text-gold uppercase">
                          {l.disponivel === 0
                            ? "Esgotado"
                            : `Só ${l.disponivel} ${l.disponivel === 1 ? "disponível" : "disponíveis"}`}
                        </p>
                      ) : (
                        <Quantidade
                          valor={item.quantidade}
                          maximo={Math.min(l.disponivel, 10)}
                          nome={l.nome}
                          onChange={(q) => definirQuantidade(item.produto_id, q)}
                        />
                      )}
                      {falta && l.disponivel > 0 && (
                        <button
                          type="button"
                          onClick={() => definirQuantidade(item.produto_id, l.disponivel)}
                          className="min-h-11 font-sans text-sm tracking-[0.16em] text-paper uppercase underline underline-offset-4 hover:text-gold"
                        >
                          Ajustar
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => definirQuantidade(item.produto_id, 0)}
                        className="min-h-11 font-sans text-sm tracking-[0.16em] text-smoke uppercase underline underline-offset-4 hover:text-paper"
                      >
                        Tirar
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <dl className="mt-5 flex flex-col gap-2 font-sans text-lg">
            <div className="flex justify-between gap-4">
              <dt className="text-smoke">Óculos</dt>
              <dd className="numeros font-mono text-paper">{precoBRL(subtotal)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-smoke">Entrega</dt>
              <dd className="numeros font-mono text-paper">
                {frete > 0
                  ? precoBRL(frete)
                  : entrega === "correios" && escolhida && freteGratis
                    ? "Grátis"
                    : "—"}
              </dd>
            </div>
            <div className="mt-2 flex items-baseline justify-between gap-4 border-t regua pt-4">
              <dt className="font-sans text-base tracking-[0.16em] text-smoke uppercase">Total</dt>
              <dd className="text-right">
                <span className="numeros block font-mono text-2xl font-bold text-gold">
                  {precoBRL(total)}
                </span>
                {parcelas && (
                  <span className="numeros mt-1 block font-mono text-sm text-smoke">
                    ou {parcelas.parcelas}x de {parcelas.valor} sem juros
                  </span>
                )}
              </dd>
            </div>
          </dl>
        </section>

        {/* quem é e como recebe */}
        {/* onSubmit, e não `action`: com `action` o React limpa o formulário
            quando a ação termina — e num erro ("esse óculos acabou") a pessoa
            perderia tudo o que digitou no celular */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            enviar(new FormData(e.currentTarget));
          }}
          className="flex flex-col gap-7"
        >
          <fieldset className="flex flex-col gap-5">
            <legend className={rotulo}>Seus dados</legend>
            <label className="mt-4 flex flex-col gap-2">
              <span className="font-sans text-base text-paper">Nome</span>
              <input name="nome" required autoComplete="name" minLength={3} className={campo} />
            </label>
            <label className="flex flex-col gap-2">
              <span className="font-sans text-base text-paper">WhatsApp, com DDD</span>
              <input
                name="telefone"
                required
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                placeholder="(11) 99999-9999"
                className={`${campo} numeros`}
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="font-sans text-base text-paper">Email</span>
              <input
                name="email"
                required
                type="email"
                inputMode="email"
                autoComplete="email"
                className={campo}
              />
              <span className="font-sans text-base leading-snug text-smoke">
                A confirmação do pedido chega aqui.
              </span>
            </label>
          </fieldset>

          <fieldset className="flex flex-col gap-3">
            <legend className={rotulo}>Como você recebe</legend>
            <div className="mt-4 grid grid-cols-2 gap-2" role="radiogroup">
              {(
                [
                  ["correios", "Correios"],
                  ["retirada", "Retirada"],
                ] as const
              ).map(([valor, texto]) => (
                <label
                  key={valor}
                  className={`flex min-h-14 cursor-pointer items-center justify-center px-3 py-3 text-center font-sans text-base font-medium tracking-[0.08em] uppercase transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-gold ${
                    entrega === valor ? "bg-paper text-ink" : "bg-paper/8 text-paper/70 hover:bg-paper/20"
                  }`}
                >
                  <input
                    type="radio"
                    name="entrega_tipo"
                    value={valor}
                    checked={entrega === valor}
                    onChange={() => setEntrega(valor)}
                    className="sr-only"
                  />
                  {texto}
                </label>
              ))}
            </div>
            {entregaTexto && (
              <p className="font-sans text-base leading-snug text-smoke">{entregaTexto}</p>
            )}
            {entrega === "correios" && (
              <>
                <label className="mt-2 flex flex-col gap-2">
                  <span className="font-sans text-base text-paper">CEP</span>
                  <span className="flex gap-2">
                    <input
                      value={cep}
                      onChange={(e) => setCep(e.target.value)}
                      onKeyDown={(e) => {
                        // Enter aqui calcula o frete; não fecha o pedido
                        if (e.key === "Enter") {
                          e.preventDefault();
                          cotar();
                        }
                      }}
                      inputMode="numeric"
                      autoComplete="postal-code"
                      placeholder="00000-000"
                      maxLength={9}
                      className={`${campo} numeros`}
                    />
                    <button
                      type="button"
                      onClick={cotar}
                      disabled={cotando}
                      className="shrink-0 bg-paper px-5 font-sans text-base font-medium tracking-[0.08em] text-ink uppercase transition-colors hover:bg-gold disabled:opacity-55"
                    >
                      {cotando ? "Calculando…" : "Calcular"}
                    </button>
                  </span>
                </label>

                {erroFrete && (
                  <p role="alert" className="font-sans text-base leading-snug text-paper">
                    {erroFrete}
                  </p>
                )}

                {opcoes && (
                  <>
                    <div className="mt-1 flex flex-col gap-2" role="radiogroup" aria-label="Frete">
                      {opcoes.map((o) => (
                        <label
                          key={o.servico}
                          className={`flex min-h-14 cursor-pointer items-center justify-between gap-4 px-4 py-3 font-sans text-base transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-gold ${
                            servico === o.servico ? "bg-paper text-ink" : "bg-paper/8 text-paper/80 hover:bg-paper/20"
                          }`}
                        >
                          <input
                            type="radio"
                            name="servico"
                            checked={servico === o.servico}
                            onChange={() => setServico(o.servico)}
                            className="sr-only"
                          />
                          <span>
                            <span className="font-medium tracking-[0.08em] uppercase">{o.nome}</span>
                            {o.prazoDias > 0 && (
                              <span className="ml-2">
                                até {o.prazoDias} {o.prazoDias === 1 ? "dia útil" : "dias úteis"}
                              </span>
                            )}
                          </span>
                          <span className="numeros font-mono">
                            {freteGratis ? "Grátis" : precoBRL(o.precoCentavos)}
                          </span>
                        </label>
                      ))}
                    </div>
                    <p className="font-sans text-base leading-snug text-smoke">
                      O prazo conta a partir da postagem.
                    </p>

                    <div className="mt-2 grid grid-cols-[minmax(0,1fr)_7rem] gap-3">
                      <Campo rotulo="Rua" nome="rua" valor={endereco.rua} auto="address-line1" onChange={setEndereco} />
                      <Campo rotulo="Número" nome="numero" valor={endereco.numero} onChange={setEndereco} />
                    </div>
                    <Campo
                      rotulo="Complemento (opcional)"
                      nome="complemento"
                      valor={endereco.complemento}
                      auto="address-line2"
                      opcional
                      onChange={setEndereco}
                    />
                    <Campo rotulo="Bairro" nome="bairro" valor={endereco.bairro} onChange={setEndereco} />
                    <div className="grid grid-cols-[minmax(0,1fr)_5rem] gap-3">
                      <Campo rotulo="Cidade" nome="cidade" valor={endereco.cidade} auto="address-level2" onChange={setEndereco} />
                      <Campo rotulo="UF" nome="uf" valor={endereco.uf} auto="address-level1" onChange={setEndereco} />
                    </div>
                  </>
                )}
              </>
            )}
            <label className="mt-2 flex flex-col gap-2">
              <span className="font-sans text-base text-paper">Observação (opcional)</span>
              <input
                name="observacao"
                maxLength={300}
                placeholder={entrega === "correios" ? "Alguma observação sobre a entrega" : "Melhor horário pra combinar"}
                className={campo}
              />
            </label>
          </fieldset>

          {erro && (
            <p role="alert" className="flex items-start gap-3 font-sans text-lg leading-snug text-paper">
              <span aria-hidden className="mt-1.5 inline-block h-4 w-1.5 shrink-0 -skew-x-12 bg-gold" />
              {erro}
            </p>
          )}

          <div>
            <button
              type="submit"
              disabled={enviando || algumEsgotado || faltaFrete}
              className="skew-brand w-full bg-gold px-8 py-5 font-display text-xl font-black tracking-tight uppercase text-ink transition-colors hover:bg-gold-deep disabled:opacity-55 sm:text-2xl"
            >
              <span className="unskew">
                {enviando ? "Abrindo o pagamento…" : `Pagar ${precoBRL(total)}`}
              </span>
            </button>
            <p className="mt-4 font-sans text-base leading-snug text-smoke">
              {algumEsgotado
                ? "Ajusta o que esgotou pra seguir."
                : faltaFrete
                  ? "Calcula o frete com teu CEP pra seguir."
                  : `Você paga no Mercado Pago (Pix, crédito ou débito) e volta pra cá. A peça fica guardada pra você por ${reservaMinutos} minutos.`}
            </p>
          </div>
        </form>
      </div>
    </Moldura>
  );
}

function Campo({
  rotulo: texto,
  nome,
  valor,
  auto,
  opcional,
  onChange,
}: {
  rotulo: string;
  nome: keyof Endereco;
  valor: string;
  auto?: string;
  opcional?: boolean;
  onChange: (f: (e: Endereco) => Endereco) => void;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-2">
      <span className="font-sans text-base text-paper">{texto}</span>
      <input
        name={nome}
        value={valor}
        required={!opcional}
        autoComplete={auto}
        onChange={(e) => onChange((atual) => ({ ...atual, [nome]: e.target.value }))}
        className={campo}
      />
    </label>
  );
}

function Moldura({ children }: { children: React.ReactNode }) {
  return (
    <main className="bg-ink px-5 pt-28 pb-24 sm:px-10 sm:pt-32">
      <div className="mx-auto max-w-[1600px]">
        <h1 className="font-display text-[clamp(2.5rem,7vw,5rem)] leading-[0.9] font-black tracking-tight uppercase text-paper">
          Carrinho
        </h1>
        <div className="mt-10">{children}</div>
      </div>
    </main>
  );
}

function Quantidade({
  valor,
  maximo,
  nome,
  onChange,
}: {
  valor: number;
  maximo: number;
  nome: string;
  onChange: (q: number) => void;
}) {
  const botao =
    "flex h-11 w-11 items-center justify-center bg-paper/8 font-mono text-lg text-paper transition-colors hover:bg-paper/20 disabled:opacity-30 disabled:hover:bg-paper/8";
  return (
    <div className="flex items-center" role="group" aria-label={`Quantidade de ${nome}`}>
      <button
        type="button"
        className={botao}
        onClick={() => onChange(valor - 1)}
        aria-label="Uma a menos"
      >
        −
      </button>
      <span className="numeros w-10 text-center font-mono text-lg text-paper" aria-live="polite">
        {valor}
      </span>
      <button
        type="button"
        className={botao}
        disabled={valor >= maximo}
        onClick={() => onChange(valor + 1)}
        aria-label="Uma a mais"
      >
        +
      </button>
    </div>
  );
}

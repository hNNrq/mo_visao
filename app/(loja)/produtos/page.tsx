import type { Metadata } from "next";
import Link from "next/link";
import { CardProduto } from "@/componentes/CardProduto";
import { Esticar } from "@/componentes/Esticar";
import { MODELOS } from "@/lib/modelos";
import { lerParcelasSemJuros, listarProdutos } from "@/lib/produtos";

// Estoque muda a cada venda — catálogo com cache mostraria peça que já saiu.
export const dynamic = "force-dynamic";

/**
 * ⚠️ **Não existe filtro por tipo de óculos.** "Rua" e "Corrida" saíram em
 * set/2026, a pedido do Henrique: a loja é catálogo único, e a única divisão que
 * ela reconhece é por MODELO — que é o que o cliente digita no Google. A coluna
 * `categoria` continua no banco, com default, mas não aparece em lugar nenhum
 * da interface. Não recriar a separação sem pedido.
 */
const NOMES = MODELOS.map((m) => m.nome);

type Busca = { modelo?: string };

function lerFiltros({ modelo }: Busca): { modelo?: string } {
  // o rótulo com maiúscula certa vem da lista, não da URL
  return { modelo: NOMES.find((m) => m.toLowerCase() === modelo?.trim().toLowerCase()) };
}

/**
 * Os filtros são carimbos, não abas: bloco chapado, sem borda. Ativo é ouro com
 * letra preta (8.8:1); parado é letra de papel sobre o muro.
 */
const CARIMBO =
  "skew-brand inline-block px-4 py-2 font-display text-sm font-black tracking-tight uppercase transition-colors sm:text-base";
const ATIVO = "bg-gold text-ink";
const PARADO = "bg-paper/10 text-paper hover:bg-paper/20";

// No Next 16 searchParams é uma Promise
type Props = { searchParams: Promise<Busca> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { modelo } = lerFiltros(await searchParams);

  // Cada modelo é uma página de entrada de busca própria — vale título próprio.
  if (modelo) {
    return {
      title: `Óculos ${modelo}`,
      description: `Óculos ${modelo} na Mó Visão. Modelo de rolê, com preço na tela.`,
    };
  }

  return {
    title: "Produtos",
    description:
      "Todos os óculos da Mó Visão — Juliet, Romeo, Penny e o resto da linha.",
  };
}

export default async function PaginaProdutos({ searchParams }: Props) {
  const filtros = lerFiltros(await searchParams);
  const [produtos, maxParcelas] = await Promise.all([
    listarProdutos(filtros),
    lerParcelasSemJuros(),
  ]);
  const semFiltro = !filtros.modelo;

  return (
    <main className="bg-ink px-5 pt-28 pb-24 sm:px-10 sm:pt-32 sm:pb-32">
      <div className="mx-auto max-w-[1600px]">
        <h1 className="text-paper">
          {/* ⚠️ 16vw, não 19vw. A `Esticar` só mexe no eixo de largura da face:
              quando a palavra não cabe nem no mais estreito (wdth 62), ela não
              tem como encolher e a linha VAZA a margem. "Produtos" tem oito
              letras e em 19vw estourava 39px pra fora em 390px — a página
              ganhava rolagem lateral. Palavra longa pede corpo menor; é o ponto
              de uso que manda no tamanho. */}
          <Esticar
            wdthInicial={86}
            className="text-[clamp(2.5rem,16vw,15rem)] leading-[0.84] uppercase"
            peso={900}
          >
            {filtros.modelo ?? "Produtos"}
          </Esticar>
        </h1>

        <div className="mt-10 flex flex-wrap items-center gap-2.5 sm:mt-12 sm:gap-3">
          <Link
            href="/produtos"
            aria-current={semFiltro ? "page" : undefined}
            className={`${CARIMBO} ${semFiltro ? ATIVO : PARADO}`}
          >
            <span className="unskew">Todos</span>
          </Link>

          {NOMES.map((modelo) => {
            const ativo = filtros.modelo === modelo;
            return (
              <Link
                key={modelo}
                href={ativo ? "/produtos" : `/produtos?modelo=${modelo.toLowerCase()}`}
                aria-current={ativo ? "page" : undefined}
                className={`${CARIMBO} ${ativo ? ATIVO : PARADO}`}
              >
                <span className="unskew">{modelo}</span>
              </Link>
            );
          })}
        </div>

        {produtos.length === 0 ? (
          <p className="mt-16 max-w-[46ch] font-sans text-lg text-smoke">
            {filtros.modelo
              ? `Nenhum ${filtros.modelo} no catálogo agora. Chama no Instagram que a gente avisa quando entrar.`
              : "Nenhum óculos cadastrado por enquanto."}
          </p>
        ) : (
          <ul className="mt-12 grid grid-cols-1 gap-x-10 gap-y-12 sm:mt-16 sm:grid-cols-2 lg:grid-cols-3">
            {produtos.map((produto) => (
              <li key={produto.id}>
                <CardProduto produto={produto} maxParcelas={maxParcelas} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

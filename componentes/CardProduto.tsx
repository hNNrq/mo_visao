import Image from "next/image";
import Link from "next/link";
import { parcelamento, precoBRL } from "@/lib/format";
import { urlFoto } from "@/lib/supabase/publico";
import type { ProdutoComFotos } from "@/lib/types";

/**
 * A célula do catálogo.
 *
 * Não é card: é uma CÉLULA de prancha. O que a separa da vizinha é um fio de
 * régua e o respiro, nunca uma caixa com fundo próprio, sombra ou canto
 * arredondado — esse é o vocabulário da loja pronta, e é o que esta direção
 * recusa.
 *
 * ## A moldura de detalhe
 *
 * A foto vive dentro de uma moldura regrada, que num manual é como um inset
 * fotográfico entra no meio do traço. Isso não é enfeite, é seguro: as fotos que
 * o dono sobe HOJE são recorte com canal alfa (conferido no banco, alfa 0 no
 * canto), e recorte flutua lindo sobre o preto. Mas nada garante que a próxima
 * venha recortada — e foto de marketplace com fundo branco chapado, solta sobre
 * o preto, vira um retângulo aceso no meio da prancha. Dentro da moldura ela lê
 * como inset e o desenho continua de pé nos dois casos.
 *
 * ## O preço é COTA, não etiqueta
 *
 * Numa prancha o número que importa fica na coluna, alinhado, em face
 * monoespaçada, pra poder ser comparado descendo a página. É o oposto do badge
 * de desconto da categoria, e é mais honesto: o preço não grita, ele se deixa
 * comparar. `tabular-nums` é requisito e não detalhe — com largura proporcional
 * as colunas dançam de linha em linha e o olho perde a referência.
 *
 * ## Estoque é GRAU, não carimbo binário
 *
 * "Última peça" lê ANTES de virar "esgotado": um selo que só aparece quando já
 * acabou chega tarde demais pra servir de alguma coisa. E o estado nunca é só
 * cor — cada um carrega rótulo escrito e uma forma própria (hachura na moldura
 * quando esgotado), porque cor sozinha não chega a quem não distingue o ouro.
 */

/** Quantas peças ainda contam como "tem", antes do aviso de fim de estoque. */
const POUCAS = 3;

export function CardProduto({
  produto,
  maxParcelas,
}: {
  produto: ProdutoComFotos;
  maxParcelas?: number;
}) {
  const foto = produto.fotos[0];
  const esgotado = produto.disponivel <= 0;
  const poucas = !esgotado && produto.disponivel <= POUCAS;
  const parcelas = parcelamento(produto.preco_centavos, maxParcelas);

  return (
    <Link
      href={`/produtos/${produto.slug}`}
      className="group block focus-visible:outline-offset-4"
    >
      <div className="relative aspect-[4/3] border regua transition-colors duration-300 group-hover:border-gold">
        {/* os tiques de canto: a moldura de detalhe de um desenho é marcada nos
            cantos, não fechada com borda grossa */}
        <Canto className="top-0 left-0" />
        <Canto className="top-0 right-0 rotate-90" />
        <Canto className="right-0 bottom-0 rotate-180" />
        <Canto className="bottom-0 left-0 -rotate-90" />

        {foto ? (
          <Image
            src={urlFoto(foto.storage_path)}
            alt={foto.alt ?? produto.nome}
            fill
            /**
             * A medida declarada tem que bater com a MAIOR célula que este
             * componente ocupa, senão o Next serve o arquivo errado nos dois
             * sentidos: curto demais e a foto sai mole, largo demais e o
             * celular baixa megabyte à toa.
             *
             * Hoje a maior é a de três colunas do desktop (home e catálogo),
             * que fecha em ~480px quando o contêiner bate os 1600px — daí os
             * 30vw. Entre 640 e 1023px são duas colunas (46vw), e abaixo disso
             * uma só, com o padding de 20px de cada lado (90vw).
             *
             * ⚠️ Mexeu no número de colunas de alguma das duas listas, mexe
             * aqui junto.
             */
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 46vw, 90vw"
            className={`object-contain p-5 transition-transform duration-500 group-hover:scale-[1.03] ${
              esgotado ? "opacity-30" : ""
            }`}
          />
        ) : (
          <div className="flex h-full items-center justify-center font-sans text-sm tracking-[0.2em] text-smoke uppercase">
            sem foto
          </div>
        )}

        {esgotado && (
          <>
            {/* a forma, não só a palavra: hachura de 45°, que num desenho marca
                seção — aqui marca a peça que saiu */}
            <svg
              aria-hidden
              className="pointer-events-none absolute inset-0 h-full w-full"
              preserveAspectRatio="none"
            >
              <defs>
                <pattern
                  id={`hachura-${produto.id}`}
                  width="9"
                  height="9"
                  patternTransform="rotate(45)"
                  patternUnits="userSpaceOnUse"
                >
                  <line
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="9"
                    stroke="var(--color-regua)"
                    strokeWidth="1"
                  />
                </pattern>
              </defs>
              <rect
                width="100%"
                height="100%"
                fill={`url(#hachura-${produto.id})`}
              />
            </svg>
            <span className="absolute bottom-3 left-3 border regua bg-ink px-2 py-1 font-sans text-xs tracking-[0.2em] text-smoke uppercase">
              Esgotado
            </span>
          </>
        )}
      </div>

      <div className="mt-4 flex items-start justify-between gap-4 border-t regua pt-3">
        <div className="min-w-0">
          <h3 className="font-display text-[clamp(1.25rem,2vw,1.75rem)] leading-[0.95] font-black tracking-tight text-balance text-paper uppercase transition-colors group-hover:text-gold">
            {produto.nome}
          </h3>
          {poucas && (
            <p className="mt-2 font-sans text-xs tracking-[0.18em] text-gold uppercase">
              ·{" "}
              {produto.disponivel === 1
                ? "última peça"
                : `últimas ${produto.disponivel}`}
            </p>
          )}
        </div>

        {/* a coluna de cota: alinhada à direita, tabular, comparável linha a linha */}
        <p className="shrink-0 cota pl-4 text-right">
          <span className="numeros block font-mono text-lg leading-none font-bold text-gold sm:text-xl">
            {precoBRL(produto.preco_centavos)}
          </span>
          {parcelas && (
            <span className="numeros mt-1.5 block font-mono text-[0.75rem] leading-none text-smoke">
              {parcelas.parcelas}x {parcelas.valor}
            </span>
          )}
        </p>
      </div>
    </Link>
  );
}

/** Tique de canto da moldura de detalhe. */
function Canto({ className }: { className: string }) {
  return (
    <svg
      aria-hidden
      width="12"
      height="12"
      viewBox="0 0 12 12"
      className={`pointer-events-none absolute ${className}`}
    >
      <path
        d="M0 0 L12 0 M0 0 L0 12"
        stroke="var(--color-fio)"
        strokeWidth="1.5"
        fill="none"
      />
    </svg>
  );
}

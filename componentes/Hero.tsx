import Image from "next/image";
import Link from "next/link";
import { existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Hero clara.
 *
 * A imagem é uma silhueta preta sobre fundo branco estourado. Em vez de
 * recortar o fundo, ela entra com `mix-blend-multiply` sobre o creme da marca:
 * o branco multiplica pelo fundo e some, o preto continua preto. Isso deixa o
 * nome da marca passar POR TRÁS da silhueta — e evita manter um PNG recortado.
 *
 * Enquadramento por tamanho de tela, e não é detalhe:
 *  - desktop: a imagem cabe inteira (contain) e o nome vai pras laterais livres
 *  - mobile:  a imagem preenche (cover), senão a figura encolhe no rodapé e
 *             sobra um buraco branco no meio da tela
 */

const ARQUIVO_HERO = "hero.jpg";

/**
 * Meia-largura da cabeça na altura do texto, medida na renderização real:
 * 324px de silhueta numa viewport de 922px de altura => 0.176 * 100svh.
 * É constante porque a imagem é contida pela ALTURA — a figura escala com svh,
 * não com a largura da tela.
 */
const MEIA_CABECA = "17.6svh";
const RESPIRO = "5rem";

/** Distância do centro da tela até cada palavra — igual dos dois lados. */
const RECUO_DO_CENTRO = `calc(50% + ${MEIA_CABECA} + ${RESPIRO})`;

/**
 * Tamanho do nome no desktop.
 *
 * Não pode ser `vw` puro: a faixa livre ao lado da figura depende de 100svh,
 * não da largura da tela. Com vw a palavra "Visão" cresce mais rápido que a
 * faixa e entra por trás da cabeça em telas largas.
 *
 * O divisor é calibrado por FONTE, e o skew entra na conta. Já medido, com o
 * skew incluído: "Visão" mede 2.58x o font-size na Hard Zone e 2.45x na Anton.
 * Trocar a fonte da marca sem refazer essa medida deixa o nome pequeno demais
 * ou por cima da figura. O teto em svh limita a altura na hero.
 *
 * O 2.84 é o da Hard Zone. Quando a fonte cai no fallback da Anton (deploy sem
 * o arquivo da demo), o nome sai 5% menor que o calibrado — invisível a olho,
 * e é o lado seguro do erro: sobra folga, não falta.
 *
 * Pra recalibrar depois de trocar a fonte:
 * `referencias/render-graffiti.js` cospe o divisor já medido.
 */
const TAMANHO_NOME = `min(30svh, max(2.75rem, calc((50vw - ${MEIA_CABECA} - ${RESPIRO}) / 2.84)))`;

export function Hero() {
  const temImagem = existsSync(join(process.cwd(), "public", ARQUIVO_HERO));

  return (
    <section className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden bg-paper text-ink">
      <div className="stripes-dark absolute inset-0 opacity-70" />

      {/* nome da marca — atrás da silhueta */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <h1 className="sr-only">Mó Visão</h1>

        {/* mobile: no topo, onde o fundo ainda é claro */}
        <div aria-hidden className="px-6 pt-20 text-center sm:hidden">
          <p className="skew-brand inline-block font-marca text-[clamp(2.5rem,13vw,5rem)] leading-none uppercase">
            Mó <span className="text-hot">Visão</span>
          </p>
          <p className="mt-4 font-display text-xs font-extrabold tracking-[0.16em] uppercase text-ink/55">
            Corrida · Rua · Treino
          </p>
        </div>

        {/*
          Desktop: uma palavra de cada lado da figura, ancoradas à MESMA
          distância do centro. Com `justify-between` elas colam nas bordas da
          tela e, como "Visão" é bem mais larga que "Mó", a assimetria salta:
          "Visão" fica rente à cabeça e "Mó" perdido no canto.
        */}
        <div
          aria-hidden
          className="relative hidden h-full font-marca leading-none uppercase sm:block"
          style={{ fontSize: TAMANHO_NOME }}
        >
          <span
            data-hero-nome="mo"
            className="absolute top-1/2 whitespace-nowrap"
            style={{ right: RECUO_DO_CENTRO, transform: "translateY(-50%) skewX(-12deg)" }}
          >
            Mó
          </span>
          <span
            data-hero-nome="visao"
            className="absolute top-1/2 whitespace-nowrap text-hot"
            style={{ left: RECUO_DO_CENTRO, transform: "translateY(-50%) skewX(-12deg)" }}
          >
            Visão
          </span>
        </div>
      </div>

      {temImagem ? (
        <div className="absolute inset-x-0 top-[26%] bottom-0 sm:inset-0">
          <Image
            src={`/${ARQUIVO_HERO}`}
            alt="Pessoa de óculos, silhueta"
            fill
            priority
            quality={90}
            sizes="100vw"
            className="object-cover object-center mix-blend-multiply sm:object-contain sm:object-bottom"
          />
        </div>
      ) : (
        <div className="absolute inset-x-0 bottom-0 flex h-2/3 items-end justify-center pb-28">
          <p className="max-w-[34ch] rounded border-2 border-dashed border-ink/25 px-6 py-5 text-center font-sans text-base text-ink/50">
            Falta a imagem da hero. Salve o arquivo em{" "}
            <code className="font-mono text-sm text-ink/70">
              public/{ARQUIVO_HERO}
            </code>
            .
          </p>
        </div>
      )}

      {/*
        A foto termina reto nos ombros e o corte aparece contra o fundo claro.
        Em vez de tapar com um elemento novo, a base da hero desce pro #050505 —
        que já é o fundo da seção seguinte. A silhueta preta se funde com ele:
        o corte some e a virada claro→escuro do site sai de graça.
      */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-[38%] bg-gradient-to-b from-transparent via-ink/75 to-ink" />

      {/* rodapé da hero */}
      <div className="relative z-10 pb-10 sm:pb-16">
        <div className="mx-auto flex max-w-7xl flex-col items-stretch gap-6 px-6 sm:flex-row sm:items-end sm:justify-between sm:px-10">
          {/* no mobile esse texto já apareceu no topo */}
          <p className="skew-brand hidden border-l-[6px] border-hot pl-4 font-display text-sm font-extrabold tracking-[0.16em] uppercase text-white/70 sm:block sm:text-base">
            Corrida · Rua · Treino
          </p>

          <Link
            href="/produtos"
            className="skew-brand bg-hot px-10 py-5 text-center font-display text-2xl font-black uppercase text-white transition-colors hover:bg-hot-dark sm:text-3xl"
          >
            <span className="unskew">Ver os óculos</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

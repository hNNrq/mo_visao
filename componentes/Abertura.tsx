import Image from "next/image";
import { Fagulhas } from "@/componentes/Fagulhas";

/**
 * A ABERTURA — o nome da loja com a peça por cima dele.
 *
 * Composição pedida pelo Henrique em set/2026, a partir do key visual da
 * campanha de retorno da X-Metal da Oakley ("RISE FROM THE FIRE"): fundo preto,
 * o nome empilhado numa coluna central, o óculos pousado no meio da pilha com as
 * letras passando POR TRÁS dele, e as margens preenchidas.
 *
 * ## O que veio da referência e o que não veio
 *
 * Veio a ESTRUTURA: coluna centralizada, uma palavra por linha, produto no
 * centro óptico por cima do tipo, margens ocupadas e miolo preto.
 *
 * Não veio a TINTA. Na referência as laterais queimam em fogo e o tipo é de
 * haste fina e espaçada. Fogo é luz, e a regra que decide tudo neste site é que
 * aqui é impresso e não iluminado; e copiar o peso fino faria a home parar de
 * parecer Mó Visão pra começar a parecer uma peça da Oakley — o que, numa loja
 * que tem regra escrita de nunca sugerir vínculo com a marca, é problema de
 * produto antes de ser de design. O fogo virou fagulha de retícula
 * (`Fagulhas`), e o tipo continua Archivo 900.
 *
 * ## A sobreposição, e por que ela é ASSIMÉTRICA
 *
 * 🔴 **O óculos morde MUITO mais "MÓ" do que "VISÃO", de propósito.** Letra
 * caixa-alta se reconhece pela METADE DE CIMA — é por isso que dá pra ler uma
 * palavra com a base coberta e não com o topo. Então a peça sobe sobre a linha
 * de baixo e sobra na de cima.
 *
 * E tem um agravante que esta base de código já pagou uma vez: **o til do Ã e o
 * acento do Ó moram ACIMA da caixa da linha** (está registrado no `globals.css`,
 * onde um `clip-path` comeu os dois e "MÓ VISÃO" virou "MO VISAO"). Cobrir o
 * topo de "VISÃO" não come uma sobra de letra: come o til, e o nome da loja sai
 * escrito errado com cara de composição.
 *
 * A mordida tem teto e o teto é a leitura do nome.
 *
 * ## A hero não tem chamada, e isso foi escolha do Henrique (set/2026)
 *
 * Havia uma linha numerada embaixo do nome ("01 — JULIET — armação de metal,
 * lente de alto contraste"), e ela saiu. Ela era a única peça de texto entre a
 * manchete e a frase de posicionamento, e nomear UM modelo no primeiro quadro
 * dizia que a loja é de Juliet — quando são três os modelos que puxam, e o
 * Índice logo abaixo já lista os três com preço.
 *
 * ⚠️ Isso deixa a `Abertura` **sem nenhum link**. É de propósito: a ação primária
 * da home é o carimbo "Ver o catálogo", que vem três blocos abaixo no mesmo eixo
 * central. Não recolocar link aqui sem que ele ganhe uma função que o carimbo
 * não tenha — dois destinos concorrentes no mesmo quadro é o que a composição
 * centralizada existe pra evitar.
 *
 * ## A peça é RECORTE, e não passa por retícula
 *
 * `public/hero-juliet.png` tem canal alfa de verdade (`npm run preparar-juliet`,
 * a partir de `public/hero-juliet-original.png`).
 * Por isso ela pousa no muro sem folha, sem moldura e sem emenda — que é o que o
 * contrato de direção pedia desde o começo ("a foto do produto flutua na prancha
 * sem caixa"). Reticular devolveria o retângulo de papel que o recorte resolve, e
 * apagaria o espelho da lente, que é o que faz a peça acender. Ver o cabeçalho
 * de `scripts/preparar-recorte.js`.
 */

/** A peça em pixels dela mesma. */
const LARGURA = 948;
const ALTURA = 302;

export function Abertura() {
  return (
    <div className="relative">
      <Fagulhas />

      {/*
        A pilha do nome. `leading-[0.74]` junta as duas linhas até elas lerem
        como um bloco só — é o que segura a peça no meio sem ela parecer
        pendurada entre dois títulos separados.
      */}
      <div className="relative mx-auto max-w-[1100px] px-2 text-center">
        <h1 className="font-display text-[clamp(3.25rem,15vw,10rem)] leading-[0.74] font-black tracking-[-0.03em] text-paper uppercase">
          <span className="block">Mó</span>
          {/*
            A peça entra ENTRE as duas linhas, no fluxo, e sobe por margem
            negativa. Foi feito assim, e não com `position: absolute`, porque
            absoluto tiraria a peça do fluxo: a altura do bloco passaria a ser só
            a das duas linhas de texto, e a haste do óculos vazaria por cima do
            parágrafo abaixo em toda largura que não fosse a que eu afinei.
            No fluxo, a caixa cresce junto e a composição aguenta 320px a 1600px.

            As duas margens são medidas em `em` do PRÓPRIO h1, então a
            sobreposição acompanha o `clamp` da manchete em vez de descolar dela
            em algum ponto no meio do caminho.
          */}
          <span className="relative z-10 -mt-[0.34em] -mb-[0.015em] block">
            <Image
              src="/hero-juliet.png"
              width={LARGURA}
              height={ALTURA}
              priority
              sizes="(min-width: 1024px) 560px, 76vw"
              alt="Óculos Juliet de armação preta e lente espelhada dourada, visto de frente."
              className="mx-auto h-auto w-[min(76%,560px)]"
            />
          </span>
          {/*
            "VISÃO" é DESENHADO, não escrito — ver a nota do Ã no cabeçalho.
            O `aria-hidden` some com a construção inteira pro leitor de tela, e o
            `sr-only` logo abaixo devolve a palavra inteira e correta. Sem esse
            par, o nome da loja chegaria como "VISAO" na leitura e na busca.
          */}
          <span className="block font-graffiti tracking-[0.06em]" aria-hidden="true">
            VIS
            <span className="relative inline-block">
              A
              <span className="til" aria-hidden="true">
                ~
              </span>
            </span>
            O
          </span>
          <span className="sr-only">Visão — óculos de rolê</span>
        </h1>
      </div>
    </div>
  );
}

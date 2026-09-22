import Image from "next/image";
import { Fagulhas } from "@/componentes/Fagulhas";

/**
 * A ABERTURA — três retratos lado a lado, e o nome pousado embaixo.
 *
 * Virou em set/2026, a pedido do Henrique, e substituiu a composição do nome
 * empilhado com a Juliet recortada por cima. A peça anterior era uma ASSINATURA:
 * nome da loja mais o objeto flutuando. Ela dizia como a loja se chama e não
 * dizia nada sobre o que se ganha comprando ali — e num primeiro quadro de loja
 * que ninguém conhece, apresentar-se não é o mesmo que vender.
 *
 * ## Por que três pessoas, e não o produto
 *
 * A dúvida que trava quem compra óculos pela internet é uma só: **como isso fica
 * na minha cara.** Foto de produto solto não responde, por melhor que seja o
 * recorte — e era o que a abertura anterior fazia. O objeto sem referência de
 * tamanho lê como ícone, não como peça. Três rostos respondem a pergunta antes
 * de ela ser feita, e ainda dão escala ao produto de graça.
 *
 * É também o padrão da categoria: marca de rua abre com gente usando a peça, e
 * quando abre com o objeto (Corteiz, Stüssy) é porque quem chega já conhece a
 * marca e não precisa de apresentação. Esta loja precisa.
 *
 * ## O que o arquivo NÃO faz, e é de propósito
 *
 * 🔴 **Não existe véu, scrim nem degradê de CSS por cima da foto.** O que abre o
 * lugar do nome é a QUEIMA que o `scripts/preparar-trio.js` já imprimiu em cada
 * arquivo: de 42% pra baixo a foto apaga, e de 70% pra baixo ela é `#000000`
 * chapado. Escurecer foto com camada semitransparente por cima é iluminação, e a
 * regra que decide tudo neste site é que aqui é impresso, não iluminado — quem
 * escurece a foto é a própria foto, na chapa, antes de chegar no navegador.
 *
 * ⚠️ **O alinhamento das três é do ARQUIVO, não do CSS.** Linha dos olhos e
 * tamanho do óculos são normalizados no preparador. Por isso as três entram com
 * a mesma classe, o mesmo `sizes` e o mesmo `object-position` — e por isso trocar
 * uma foto é mexer no script, nunca aqui.
 *
 * ## No celular entram as três, e quem paga a conta é a ALTURA
 *
 * ⚠️ Até set/2026 as laterais sumiam no celular (`hidden sm:block`), com o
 * argumento de que 130px de largura por foto viram uma tira de ombro. O
 * argumento estava meio certo: 130px de largura *com a altura de antes* viram.
 * O corte lateral do `object-cover` não é função da largura da coluna sozinha —
 * é da RAZÃO entre as duas. Quanto mais alta a faixa, mais o navegador tem que
 * ampliar a foto pra preencher, e mais largura ele joga fora.
 *
 * A conta, com a foto em 1200×1800: a coluna mede `100vw/3` e o que sobra da
 * foto é `coluna × 1800 / altura`. A cabeça ocupa uns 540 dos 1200, centrada —
 * então enquanto sobrar ~600px de foto o rosto entra inteiro. Resolvendo:
 * **a faixa não pode ser mais alta do que a tela é larga.** Daí o
 * `min(100vw,22rem)`: em 320px sobram 596px de foto, em 390px sobram 665px.
 *
 * 🔴 **O `vh` saiu do celular de propósito.** O que havia antes era
 * `clamp(24rem,62vh,34rem)`, e num celular alto o `62vh` levava a faixa a
 * ~540px — mais alta do que a tela é larga, que é exatamente o caso em que as
 * três viram tiras. Altura amarrada na ALTURA da tela não sabe nada sobre a
 * largura da coluna, que é a medida que decide o corte. No `sm:` pra cima o
 * `vh` continua, porque lá a coluna é larga o bastante pra não haver corte.
 *
 * O que o corte come é fundo preto, não foto: o preparador já centrou o óculos
 * na largura dos três arquivos, então apertar as bordas é apertar muro.
 *
 * ## O nome encolheu, e o que ele deixou de ser
 *
 * ⚠️ Ele não é mais a manchete — é assinatura. Quem puxa o olho agora é o trio,
 * e o nome entra pequeno na faixa preta embaixo, no eixo central. Continua sendo
 * o `<h1>` da home: é o nome da loja na página raiz, que é o que a busca espera
 * ali, e corpo pequeno não muda o que o documento declara.
 *
 * ## O nome é TEXTO de novo, e isso custou três hacks a menos
 *
 * Em set/2026 a face virou **Clash Display 700** (`font-marca`), a pedido do
 * Henrique, e com ela o `h1` voltou a ser uma linha de texto comum. O que saiu
 * junto:
 *
 * - **O par de faces.** "Mó" em Archivo e "VISÃO" em Vandalust existia porque a
 *   Vandalust não tem Ó. Uma face só com os dois acentos desenhados acaba com a
 *   divisão — e com a linha dupla, que só existia porque os glifos de graffiti
 *   pintam fora da caixa de avanço e derrubavam a haste da V sobre o acento do Ó.
 * - **O til pousado por CSS** (`til`, no `globals.css`). A Clash tem Ã de
 *   verdade. A utilitária segue no CSS pra quem ainda usar a Vandalust.
 * - 🔴 **O par `aria-hidden` + `sr-only`.** Ele existia pra consertar o nome
 *   pro leitor de tela e pra busca, que recebiam "VISAO" da montagem à mão.
 *   Agora o texto no DOM é "Mó Visão" e chega certo sem intermediário — **e é
 *   por isso que ele não pode voltar por hábito**: com o texto correto, um
 *   `aria-hidden` no `h1` esconderia o nome da loja de quem ouve a página.
 *
 * **A caixa alta é do `uppercase`, não do texto.** Conteúdo em caixa mista é o
 * que leitor de tela e busca leem bem — é a mesma regra da frase de efeito.
 */

/** A peça em pixels dela mesma — as três saem iguais do preparador. */
const LARGURA = 1200;
const ALTURA = 1800;

type Retrato = { arquivo: string; alt: string };

/**
 * A ordem é a da tela, e as três aparecem em qualquer largura.
 *
 * As laterais entram com `alt` vazio de propósito: elas repetem o que a do meio
 * já diz, e três descrições iguais em sequência é ruído pra quem ouve a página.
 */
const RETRATOS: Retrato[] = [
  { arquivo: "trio-esq", alt: "" },
  {
    arquivo: "trio-meio",
    alt: "Pessoa de moletom com capuz usando óculos de armação metálica e lente espelhada.",
  },
  { arquivo: "trio-dir", alt: "" },
];

export function Abertura() {
  return (
    <div className="relative">
      {/*
        O trio sangra de borda a borda: a seção da home não põe padding lateral
        nele, só no bloco de texto que vem depois. Retrato vertical com margem
        dos dois lados vira cartão, e cartão é o que esta página não tem.

        A altura vem do `min(100vw,…)` no celular e do `clamp` com `vh` no `sm:`
        pra cima — o porquê está no cabeçalho, em "No celular entram as três". As
        fotos entram com `object-top`: quando sobra corte vertical ele precisa
        comer por BAIXO, nunca pelo meio, porque embaixo é a queima, que é preto
        chapado e não custa nada perder; no meio estão os rostos.
      */}
      <div className="relative h-[min(100vw,22rem)] sm:h-[clamp(28rem,72vh,46rem)]">
        <div className="grid h-full grid-cols-3">
          {RETRATOS.map((r) => (
            <div key={r.arquivo} className="relative h-full">
              <Image
                src={`/${r.arquivo}.jpg`}
                width={LARGURA}
                height={ALTURA}
                priority
                sizes="34vw"
                alt={r.alt}
                className="h-full w-full object-cover object-top"
              />
            </div>
          ))}
        </div>

        {/*
          As fagulhas por cima do trio, espalhadas na largura e empurradas pra
          faixa queimada. O porquê do remapeamento está no cabeçalho do
          componente — resumido: ponto de ouro sobre rosto lê como sujeira.
        */}
        <Fagulhas espalhar />
      </div>

      {/*
        O nome sobe PRA DENTRO da queima, por margem negativa em `em`.

        ⚠️ A margem mora no `h1` e NÃO na `div` que o embrulha. `em` é sempre o
        corpo do elemento que a declara: na `div` ela valeria 16px fixos e a
        subida descolaria do nome assim que o `clamp` mexesse no corpo. No `h1`
        ela vale o corpo do próprio nome, que é o que faz a composição aguentar
        de 320px a 1600px sem ponto de quebra escrito à mão.

        🔴 **Duas linhas, e não uma.** "Mó VISÃO" em linha única não funciona:
        as duas palavras estão em faces diferentes (a Vandalust não tem Ó, então
        o "Mó" é obrigatoriamente Archivo), e a Vandalust é face de graffiti —
        os glifos dela pintam FORA da caixa de avanço, de propósito, pra
        entrelaçar. O navegador encosta as duas caixas sem sobrepor nada, e
        mesmo assim a haste da V cai por cima do acento do Ó. Empilhado o
        problema não existe, e é o mesmo par de faces que a marca já usava.
      */}
      <div className="relative z-10 text-center">
        <h1 className="-mt-[1.9em] font-marca text-[clamp(1.75rem,5vw,3.25rem)] leading-none font-bold tracking-[0.02em] text-paper uppercase">
          Mó Visão
        </h1>
      </div>
    </div>
  );
}

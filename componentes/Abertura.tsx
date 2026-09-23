import Image from "next/image";
import { BlurIn } from "@/componentes/BlurIn";
import { Fagulhas } from "@/componentes/Fagulhas";
import { DURACAO_NOME } from "@/lib/animacao";

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
 * a mesma classe, o mesmo `sizes` e o mesmo `object-position` — a exceção é o
 * zoom de destaque do meio (ver `Retrato`), que parte do olho pra não desalinhar
 * a fileira. E é por isso que trocar
 * uma foto é mexer no script, nunca aqui.
 *
 * ## No celular entra SÓ o retrato do meio
 *
 * ⚠️ Esta regra já foi e voltou. Até set/2026 as laterais sumiam no celular;
 * depois entraram as três, com a faixa limitada a `min(100vw,22rem)` pra que o
 * `object-cover` não transformasse cada coluna numa tira. Ainda em set/2026 o
 * Henrique pediu pra voltar a mostrar uma só: com 130px de largura, a roupa da
 * `dir` terminava num corte reto que nem a máscara das bordas disfarçava, e as
 * três espremidas não conversavam com o resto da página, que é de coluna única.
 *
 * Com uma foto só, a coluna mede `100vw` e o corte lateral deixa de existir. A
 * altura passa a ser `min(115vw,30rem)`: a foto em 1200×1800 ocupa 150vw de
 * altura na largura da tela, então 115vw mostra do topo até dentro da queima
 * (que fecha em 70%, ~105vw) — rosto inteiro e preto chapado embaixo pro nome.
 *
 * 🔴 **Nada de `vh` no celular.** Altura amarrada na altura da tela não sabe
 * nada da largura da coluna, que é o que decide o corte. No `sm:` pra cima o
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

/**
 * `destaque` amplia o retrato do meio em 12%.
 *
 * ⚠️ O zoom parte da LINHA DOS OLHOS (`origin` em 36% da altura), não do centro
 * nem do topo. O preparador pousa o olho em 34% do arquivo, o que dá entre 34% e
 * ~38% da caixa conforme a largura da tela; 36% é o meio disso. Com a origem
 * ali o olho quase não se move ao ampliar (1–2px de erro), e a fileira continua
 * alinhada. Ampliar a partir do topo ou do centro derrubaria o olho do meio
 * abaixo ou acima dos laterais.
 */
type Retrato = { arquivo: string; alt: string; destaque?: boolean };

/**
 * A ordem é a da tela. No celular só a do meio (`destaque`) aparece.
 *
 * As laterais entram com `alt` vazio de propósito: elas repetem o que a do meio
 * já diz, e três descrições iguais em sequência é ruído pra quem ouve a página.
 */
const RETRATOS: Retrato[] = [
  { arquivo: "trio-esq", alt: "" },
  {
    arquivo: "trio-meio",
    destaque: true,
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

        A altura vem do `min(115vw,…)` no celular e do `clamp` com `vh` no `sm:`
        pra cima — o porquê está no cabeçalho, em "No celular entra SÓ o retrato do meio". As
        fotos entram com `object-top`: quando sobra corte vertical ele precisa
        comer por BAIXO, nunca pelo meio, porque embaixo é a queima, que é preto
        chapado e não custa nada perder; no meio estão os rostos.

        ⚠️ As laterais de cada coluna ESFUMAM até sumir (`mask-image`). Duas das
        fotos têm roupa encostando na borda do arquivo — o casaco da `esq`, o
        capuz e o casaco da `dir` — e, no celular, a coluna ainda corta a foto
        por cima disso. Sem a máscara a roupa termina numa linha reta vertical
        contra o preto da coluna vizinha, e a montagem aparece.

        Não é véu: nada é pintado POR CIMA da foto. A máscara só torna a borda
        transparente, e o que aparece por trás é o `#000000` da página, a mesma
        cor em que a foto já termina. Os pixels do arquivo não mudam, então a
        foto não perde qualidade. Tem que ficar na coluna, e não no arquivo, porque
        é a coluna que decide onde a foto é cortada em cada largura de tela.
      */}
      <div className="relative h-[min(115vw,30rem)] sm:h-[clamp(28rem,72vh,46rem)]">
        <div className="grid h-full grid-cols-1 sm:grid-cols-3">
          {RETRATOS.map((r) => (
            <div
              key={r.arquivo}
              className={`relative h-full overflow-hidden ${r.destaque ? "" : "hidden sm:block"} [mask-image:linear-gradient(to_right,transparent,#000_16%,#000_84%,transparent)]`}
            >
              <Image
                src={`/${r.arquivo}.jpg`}
                width={LARGURA}
                height={ALTURA}
                priority
                sizes={r.destaque ? "(min-width: 640px) 34vw, 100vw" : "34vw"}
                alt={r.alt}
                className={`h-full w-full object-cover object-top ${r.destaque ? "origin-[50%_36%] scale-[1.12]" : ""}`}
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
        <BlurIn
          word="Mó Visão"
          duration={DURACAO_NOME}
          className="-mt-[1.9em] font-marca text-[clamp(2.1875rem,6.25vw,4.0625rem)] leading-none font-bold tracking-[0.02em] text-paper uppercase"
        />
      </div>
    </div>
  );
}

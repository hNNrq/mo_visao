import Link from "next/link";
import { CardProduto } from "@/componentes/CardProduto";
import { Abertura } from "@/componentes/Abertura";
import { Indice } from "@/componentes/Indice";
import { Obturador } from "@/componentes/Obturador";
import { DURACAO_NOME } from "@/lib/animacao";
import { parcelamento, precoBRL } from "@/lib/format";
import { MODELOS } from "@/lib/modelos";
import { listarDestaques, precosDaVitrine } from "@/lib/produtos";

// Os destaques mostram estoque; cache aqui exibiria peça que já saiu.
export const dynamic = "force-dynamic";

/**
 * A home como PRANCHA 01 de um catálogo de peças.
 *
 * Três blocos e nada mais: a abertura com o nome e a peça, o índice de modelos
 * e a lista de peças em estoque. Não há carrossel de banner, não há barra de
 * promoção, não há grade de cards iguais.
 *
 * ⚠️ **"NÃO PASSE DESPERCEBIDO" é a única frase de efeito da loja, e é uma
 * oração só.** Não cita modelo — citar Juliet ali dizia que a loja é de Juliet,
 * e o Índice logo abaixo já lista os três com preço. O registro é o das
 * referências que o Henrique passou (Thug Nine, "all hustle no hype"; a campanha
 * do X-Metal, "forged in heat, reborn through vision"): curta, declarativa, sem
 * promessa e sem explicação pendurada atrás. Ela já teve uma segunda oração
 * sobre preço e o Henrique cortou — a frase existe pra puxar o olho depois da
 * manchete, e quem informa preço é a cota logo abaixo do carimbo.
 *
 * A caixa alta está no `uppercase` da classe, não no texto: o conteúdo em caixa
 * mista é o que os leitores de tela e a busca leem bem.
 *
 * 🔴 **Não escrever "sem pedir no direct" em lugar nenhum da loja.** A frase
 * esteve aqui e no cartucho, e o Henrique cortou as duas em set/2026: dita pro
 * cliente, ela soa como reclamação de quem não quer ser perguntado. O que a loja
 * promete é o preço na tela — quem tem esse problema é o dono, e isso é assunto
 * do `PRODUCT.md`, não da vitrine. O Instagram continua sendo o caminho quando
 * falta peça, e aí o convite é explícito ("chama no Instagram").
 *
 * A hero passou por duas trocas em set/2026: saiu a vista explodida desenhada à
 * mão, entrou a chapa do rei, e entrou no lugar dela a ABERTURA — o nome
 * empilhado com a Juliet recortada por cima. O porquê de cada uma está no
 * cabeçalho de `componentes/Abertura.tsx`.
 *
 * ⚠️ **A chamada numerada saiu da hero em set/2026** e vive agora só no Índice,
 * onde ela numera os três modelos. Era ela que carregava o único link da
 * abertura; hoje a ação primária do primeiro quadro é o carimbo "Ver o catálogo",
 * e é ele que não pode ganhar concorrente.
 *
 * ⚠️ O skew de -12° é compromisso de marca registrado no `PRODUCT.md` ("título,
 * botão e faixa"). Numa prancha técnica nada sai do esquadro, então ele ficou
 * PINADO num lugar só: o bloco de ação primária. Um bloco inclinado dentro de um
 * desenho ortogonal lê como carimbo aplicado por cima da folha, que é o que ele
 * é — e é assim que o compromisso sobrevive à troca de mundo sem virar ruído.
 */
export default async function Home() {
  const [destaques, precos] = await Promise.all([
    listarDestaques(),
    precosDaVitrine(MODELOS.map((m) => m.nome)),
  ]);
  const parcelas = precos.minimo ? parcelamento(precos.minimo) : null;

  return (
    <main className="pt-14">
      {/*
        A ABERTURA — o trio de retratos sangrando, e o nome pequeno embaixo.

        ⚠️ **O padding lateral saiu da SEÇÃO e desceu pro bloco de texto.** O trio
        sangra de borda a borda e não pode herdar `px` de ninguém: com margem dos
        dois lados as três fotos viram cartões soltos no muro, que é o oposto do
        que a composição pede. O que ainda precisa de medida — frase, carimbo e
        cota — pega o padding por conta própria.

        ⚠️ O respiro de baixo continua maior que o de cima porque a `Abertura`
        leva as fagulhas até a própria borda: apertar embaixo faria o campo de
        pontos encostar no Índice.
      */}
      <section className="relative overflow-hidden pb-20 sm:pb-28">
        <div className="mx-auto max-w-[1600px]">
          <Abertura />

          {/*
            🔴 **`relative z-10` aqui não é enfeite: sem ele a frase e o carimbo
            somem debaixo das fotos.**

            O nome da `Abertura` sobe pra dentro da queima por margem negativa, e
            margem negativa arrasta TUDO que vem depois junto — frase e ação
            passam a ocupar os últimos pixels da caixa do trio. Lá dentro, o
            envelope do trio é `relative` e este bloco era estático, e elemento
            posicionado pinta por cima de elemento estático mesmo vindo ANTES no
            documento. O texto continuava no DOM, com caixa, cor e tamanho
            certos, e simplesmente não aparecia na tela.
          */}
          <div className="relative z-10">
            <Obturador
              texto="Não passe despercebido."
              atraso={DURACAO_NOME}
              className="mx-auto mt-10 max-w-[28ch] px-5 text-center font-sans text-[1.5625rem] leading-snug tracking-[0.02em] text-paper/80 uppercase sm:mt-12 sm:px-10 sm:text-[1.875rem]"
            />

            {/*
              Ação e cota centralizadas, e o preço DEBAIXO do botão em vez de ao
              lado. Numa coluna simétrica o par lado a lado puxa o peso pra um dos
              lados e desmancha o eixo que o resto da composição construiu.
            */}
            <div className="mt-9 flex flex-col items-center gap-6 sm:mt-10">
              <Link
                href="/produtos"
                className="skew-brand inline-block bg-gold px-8 py-4 font-display text-[1.40625rem] font-black tracking-tight text-ink uppercase transition-colors hover:bg-gold-deep sm:px-10 sm:py-5 sm:text-[1.5625rem]"
              >
                <span className="unskew">Ver o catálogo</span>
              </Link>

              {precos.minimo !== null && (
                <p className="text-center">
                  <span className="numeros block font-mono text-[1.5625rem] leading-none font-bold text-gold sm:text-[1.875rem]">
                    {precoBRL(precos.minimo)}
                    {parcelas && (
                      <span className="ml-3 text-[1.09375rem] font-normal text-smoke">
                        ou {parcelas.parcelas}x de {parcelas.valor}
                      </span>
                    )}
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <Indice />

      <section className="px-5 pt-16 pb-24 sm:px-10 sm:pt-24 sm:pb-32">
        <div className="mx-auto max-w-[1600px]">
          <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3 border-b regua pb-3">
            <h2 className="font-display text-[clamp(1.75rem,3.5vw,2.75rem)] leading-none font-black tracking-tight text-paper uppercase">
              Peças em estoque
            </h2>
            <Link
              href="/produtos"
              className="font-sans text-sm tracking-[0.18em] text-smoke uppercase transition-colors hover:text-gold"
            >
              Catálogo completo →
            </Link>
          </div>

          {destaques.length === 0 ? (
            /**
             * O que o COMPRADOR lê quando não há destaque.
             *
             * Já esteve escrito "No painel, marque um produto como destaque pra
             * ele aparecer aqui" — instrução de administrador servida na loja,
             * pra quem não tem painel nenhum. O dono descobre a vitrine vazia
             * abrindo a vitrine; o cliente precisa é de um caminho.
             */
            <p className="mt-10 max-w-[46ch] font-sans text-lg text-smoke">
              Nenhuma peça em destaque agora.{" "}
              <Link
                href="/produtos"
                className="text-paper underline underline-offset-4 transition-colors hover:text-gold"
              >
                Vê o catálogo inteiro
              </Link>{" "}
              ou chama no Instagram que a gente mostra o que tem.
            </p>
          ) : (
            /*
              🔴 **Três colunas no desktop, a mesma medida do catálogo — e isso
              é de RESOLUÇÃO, não de arrumação.**

              Esta lista já saiu em duas colunas, pelo argumento de que a peça
              precisa de tamanho pra ser lida como desenho. Só que em duas
              colunas a célula chega a 658px, e a moldura passa a pedir ~1236px
              de foto em tela retina. As fotos que o dono sobe têm 1000×375 e
              943×467 — a moldura esticava as duas e a peça saía mole justo na
              seção que existe pra mostrar a peça.

              O tamanho da moldura é um contrato com quem alimenta a loja: o
              dono cadastra do celular, entre um corte e outro, e não vai
              reexportar foto em 2500px. Moldura que só fica boa com foto que a
              loja não tem é defeito de projeto, não de acervo.
            */
            <ul className="mt-10 grid grid-cols-1 gap-x-10 gap-y-12 sm:mt-14 sm:grid-cols-2 lg:grid-cols-3">
              {destaques.map((produto) => (
                <li key={produto.id}>
                  <CardProduto produto={produto} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}

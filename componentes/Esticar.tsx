"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * Estica uma linha até ela encostar nas duas margens da folha.
 *
 * É o ato tipográfico do lambe-lambe. Num cartaz de gráfica de esquina o
 * compositor abre ou fecha a letra até a palavra ocupar a largura inteira do
 * papel — é isso que faz "MÓ VISÃO" ler como um bloco sólido e não como uma
 * frase solta no meio do preto.
 *
 * Feito no eixo de LARGURA da face (`wdth`, 62–125 na Archivo), não no
 * `font-size`. A diferença é o bloco: mexendo no corpo, cada linha ganharia uma
 * altura de maiúscula diferente e as linhas parariam de formar uma massa só. O
 * eixo de largura mantém a altura e muda só a gordura da letra, como uma chapa
 * esticada. O que o eixo não alcança vira entreletra, que é o segundo recurso
 * do compositor — espacejar a linha curta até a margem.
 *
 * ⚠️ **A face é deste componente, não do ponto de uso.** Sem `font-display` aqui
 * a linha herda a fonte do corpo, que não tem eixo de largura: o eixo é ajustado
 * e nada acontece, e a manchete sai fina sem ninguém entender por quê.
 *
 * ⚠️ **O tamanho, ao contrário, é do ponto de uso.** Este componente não decide
 * corpo; sem um `text-[...]` na className a linha herda 16px do body.
 *
 * Sem JavaScript a linha renderiza no `wdthInicial`, que é uma aproximação
 * razoável e não quebra layout: o ajuste é melhoria, não requisito.
 */

const WDTH_MIN = 62;
const WDTH_MAX = 125;
/**
 * 7 passos fecham a faixa de 63 em meio ponto de eixo, que ninguém enxerga.
 * Cada passo força um layout síncrono, e isso roda em Android de entrada.
 */
const PASSOS = 7;
/** Tolerância de encaixe. Abaixo disso ninguém vê e a correção pararia de convergir. */
const FOLGA = 0.75;
/** Piso de entreletra negativa, do craft floor. Abaixo disso a linha vira mancha. */
const APERTO_MAX = -0.04;
/**
 * Teto de entreletra, em em.
 *
 * Encher a medida é o objetivo, mas não a qualquer preço: uma palavra curta numa
 * medida larga precisaria de tanto espacejamento que sai como letra espalhada,
 * com buraco entre cada uma — exatamente o contrário do bloco sólido que o
 * cartaz quer. Compositor nenhum espaceja MÓ por um metro e meio de papel: ele
 * aumenta o corpo. Acima deste teto a linha desiste de encostar na margem e fica
 * na largura natural, que lê como linha de cartaz normal.
 *
 * Quem quiser a linha cheia aumenta o `text-[...]` no ponto de uso.
 */
const SOLTO_MAX = 0.16;
/**
 * Quanto o vão ENTRE PALAVRAS cresce além do vão entre letras.
 *
 * Sem isso, o espacejamento se distribui igual em tudo e o limite de palavra
 * some: "ESCOLHE O TEU" vira uma fieira só de letras. Em caixa alta espacejada o
 * vão de palavra precisa ficar visivelmente maior que o de letra pra leitura
 * sobreviver.
 */
const VAO_PALAVRA = 1.7;

type Ajuste = { wdth: number; espaco: number };

type Props = {
  children: string;
  /** Largura inicial do eixo, usada no servidor e antes da primeira medida. */
  wdthInicial?: number;
  className?: string;
  /** Peso do eixo `wght`. Mantido fixo; quem varia é a largura. */
  peso?: number;
};

export function Esticar({
  children,
  wdthInicial = 100,
  className = "",
  peso = 900,
}: Props) {
  const caixa = useRef<HTMLSpanElement>(null);
  const linha = useRef<HTMLSpanElement>(null);
  const larguraAnterior = useRef(-1);
  const [ajuste, setAjuste] = useState<Ajuste | null>(null);

  /**
   * Mede, APLICA e devolve o ajuste.
   *
   * Medir e aplicar são a mesma operação de propósito. A medição precisa zerar
   * entreletra e margem pra ler a largura limpa — e se sair sem repor o valor
   * calculado, deixa o DOM no estado de medição. Foi exatamente o que travava a
   * linha curta: a passada de conferência media, achava o mesmo resultado, saía
   * cedo pra não repetir trabalho, e a entreletra ficava em zero pra sempre.
   */
  const calcular = useCallback((): Ajuste | null => {
    const c = caixa.current;
    const l = linha.current;
    if (!c || !l) return null;

    const alvo = c.clientWidth;
    if (alvo <= 0) return null;

    const largura = (wdth: number) => {
      l.style.fontVariationSettings = `"wght" ${peso}, "wdth" ${wdth}`;
      l.style.letterSpacing = "0px";
      l.style.wordSpacing = "0px";
      l.style.marginRight = "0px";
      // getBoundingClientRect e não scrollWidth: subpixel, e sem a semântica de
      // recorte do scrollWidth, que arredonda e confunde a conta.
      return l.getBoundingClientRect().width;
    };

    // Bisseção no eixo: a largura do texto cresce de forma monótona com `wdth`.
    let baixo = WDTH_MIN;
    let alto = WDTH_MAX;
    for (let i = 0; i < PASSOS; i++) {
      const meio = (baixo + alto) / 2;
      if (largura(meio) > alvo) alto = meio;
      else baixo = meio;
    }

    const wdth = baixo;
    const letras = [...children];
    const n = Math.max(1, letras.length);
    const palavras = letras.filter((x) => x === " ").length;
    const corpo = parseFloat(getComputedStyle(l).fontSize) || 16;

    // A folga se reparte entre vãos de letra e vãos de palavra, e os de palavra
    // pesam mais: quem resolve `x` é `folga = x * (n + palavras * VAO_PALAVRA)`.
    const folga = alvo - largura(wdth);
    const bruto = folga / (n + palavras * VAO_PALAVRA);
    const espaco = Math.min(
      Math.max(bruto, APERTO_MAX * corpo),
      SOLTO_MAX * corpo,
    );
    const feito: Ajuste = { wdth, espaco };

    // repõe antes de devolver: o DOM nunca fica no estado de medição
    l.style.letterSpacing = `${feito.espaco}px`;
    l.style.wordSpacing = `${feito.espaco * VAO_PALAVRA}px`;
    l.style.marginRight = `${-feito.espaco}px`;

    return feito;
  }, [children, peso]);

  const medir = useCallback(() => {
    const novo = calcular();
    if (novo) setAjuste(novo);
  }, [calcular]);

  useEffect(() => {
    const c = caixa.current;
    if (!c) return;

    let quadro = 0;
    const agendar = () => {
      cancelAnimationFrame(quadro);
      quadro = requestAnimationFrame(medir);
    };

    // A face variável chega depois da primeira pintura. Medir antes dela mede a
    // fonte de fallback, que não tem eixo de largura — trabalho jogado fora, e
    // são sete layouts síncronos por linha. Se a face já chegou, mede uma vez
    // só; se não, espera ela.
    if (document.fonts?.status === "loaded") agendar();
    else document.fonts?.ready.then(agendar).catch(agendar);

    const observador = new ResizeObserver(() => {
      const largura = c.clientWidth;
      // altura mudando dispara o observador sem mudar a medida; remedir aí é
      // layout síncrono de graça, no aparelho que menos aguenta.
      if (largura === larguraAnterior.current) return;
      larguraAnterior.current = largura;
      agendar();
    });
    observador.observe(c);

    return () => {
      cancelAnimationFrame(quadro);
      observador.disconnect();
    };
  }, [medir]);

  /**
   * Conferência depois de pintar.
   *
   * A medida acontece fora do ciclo do React e o resultado é aplicado pelo
   * React — entre as duas coisas cabe uma troca de fonte, um reflow do pai ou
   * uma pintura. Em vez de tentar ordenar isso, aqui se olha o resultado real:
   * se a linha não encostou nas margens, mede de novo. Converge em uma ou duas
   * passadas e não depende de quem chegou primeiro.
   */
  useLayoutEffect(() => {
    const c = caixa.current;
    const l = linha.current;
    if (!c || !l || !ajuste) return;

    const sobra = c.clientWidth - l.getBoundingClientRect().width;
    if (Math.abs(sobra) <= FOLGA) return;
    // sobra grande com o teto batido é resultado final, não erro de medida

    const novo = calcular();
    if (!novo) return;
    // `calcular` já aplicou; o estado só precisa acompanhar pra sobreviver a um
    // novo render. Valor igual não vira setState, senão o efeito se repete sem fim.
    if (Math.abs(novo.espaco - ajuste.espaco) <= 0.01 && novo.wdth === ajuste.wdth) {
      return;
    }
    setAjuste(novo);
  }, [ajuste, calcular]);

  return (
    <span ref={caixa} className={`block font-display ${className}`}>
      <span
        ref={linha}
        className="inline-block whitespace-nowrap"
        style={{
          /**
           * O peso vai nos DOIS lugares de propósito.
           *
           * `font-variation-settings` só fala com uma face variável. Se a
           * Archivo não chegar — rede do público caindo, `@font-face` que o
           * build não emitiu, navegador que bloqueia webfont — a linha herda o
           * peso do body, que é 400, e a manchete do cartaz sai FINA. Foi o que
           * aconteceu em set/2026 e ninguém viu, porque a falha é silenciosa:
           * o eixo não reclama de não existir.
           *
           * Com `font-weight` junto, uma queda de fonte custa o eixo de largura
           * — a linha fica na largura natural, que é feio mas é cartaz — e não
           * o peso, que é o que fazia a letra ler como chapa de impressão.
           */
          fontWeight: peso,
          fontVariationSettings: `"wght" ${peso}, "wdth" ${ajuste?.wdth ?? wdthInicial}`,
          letterSpacing: ajuste ? `${ajuste.espaco}px` : undefined,
          wordSpacing: ajuste ? `${ajuste.espaco * VAO_PALAVRA}px` : undefined,
          // `letter-spacing` também é aplicado DEPOIS do último caractere; a
          // margem negativa devolve esse resto pra linha fechar na margem.
          marginRight: ajuste ? `${-ajuste.espaco}px` : undefined,
        }}
      >
        {children}
      </span>
    </span>
  );
}

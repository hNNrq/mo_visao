import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

/**
 * A voz do cartaz.
 *
 * Archivo entra como fonte VARIÁVEL com o eixo de largura (`wdth`, 62–125)
 * carregado junto do peso — e o eixo é o ponto, não um detalhe de configuração.
 * O ato tipográfico de um lambe-lambe é encher a medida: o compositor abre ou
 * fecha a letra até a linha encostar nas duas margens da folha. Com um eixo de
 * largura dá pra fazer isso de verdade (ver `componentes/Esticar.tsx`), em vez
 * de imitar com `font-size`, que quebraria a altura de maiúscula e desmontaria
 * o bloco sólido que duas linhas empilhadas formam no cartaz.
 *
 * Custa bytes: a variável inteira são 90 KB. Vale porque ela é a única face de
 * display do site e substitui duas que saíram.
 *
 * 🔴 **As faces são AUTO-HOSPEDADAS (`next/font/local`), e isso não é preferência.**
 * Com `next/font/google` o build BUSCA a fonte na rede, e quando essa busca
 * falha o Next não estoura: ele emite um `@font-face` só de fallback
 * (`src: local(Arial)`) e segue. Aconteceu em set/2026 — os chunks daquele
 * compile saíram com ZERO `url()`, o site inteiro renderizou em Arial peso 400,
 * a `Esticar` mexeu num eixo que não existia e a manchete virou letra espalhada,
 * que é o anti-padrão que o `DESIGN.md` bane por nome. Nenhum erro, nenhum
 * aviso, nenhum teste quebrado. Com o `.woff2` no repositório o build não tem
 * rede pra falhar, e o `PRODUCT.md` é explícito: nada aqui pode depender de
 * manutenção contínua.
 *
 * O subconjunto é `latin` (U+0000–00FF), que cobre o português inteiro — ã, õ,
 * ç e os acentos todos. `latin-ext` e `vietnamese` seriam 2/3 de peso a mais
 * pra nenhum caractere que esta loja escreve.
 */
const cartaz = localFont({
  src: "./fontes/archivo-latin-var.woff2",
  variable: "--font-cartaz",
  display: "swap",
  weight: "100 900",
  // O eixo de largura precisa ser DECLARADO: sem a faixa aqui o navegador
  // trata a face como largura única e ignora o `wdth` que a Esticar aplica.
  declarations: [{ prop: "font-stretch", value: "62% 125%" }],
  fallback: ["Arial Narrow", "system-ui", "sans-serif"],
});

/**
 * O pé da folha. Todo cartaz termina num bloco denso de letra miúda — data,
 * endereço, telefone, "vendas no local". Barlow Condensed é essa voz: lisa,
 * estreita, sem opinião, legível em corpo pequeno num Android de entrada, que
 * é o aparelho do público.
 *
 * Só 400 e 500 embarcam. 600 e 700 estavam sendo baixados e a página não tinha
 * uma única ocorrência de `font-semibold` ou `font-bold` — eram 45 KB de rede
 * móvel pagos por ninguém.
 */
const pe = localFont({
  src: [
    { path: "./fontes/barlow-condensed-400-latin.woff2", weight: "400" },
    { path: "./fontes/barlow-condensed-500-latin.woff2", weight: "500" },
  ],
  variable: "--font-pe",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

/**
 * A MÃO — a face de graffiti.
 *
 * ⚠️ **Hoje ela não entra em lugar nenhum.** Montava o "VISÃO" da abertura até
 * set/2026, quando a Clash Display (`marca`, abaixo) tomou o nome da loja
 * inteiro. O token `--font-graffiti` continua no `globals.css` e nenhum
 * componente o usa. Ela fica registrada aqui porque a face pode voltar em peça
 * de Instagram ou em página interna — e porque a ressalva abaixo precisa
 * continuar visível pra quem for tentar isso.
 *
 * 🔴 **ESTA FONTE NÃO PODE IR PRO AR COMERCIALMENTE.** Vandalust Graffiti, do
 * Cikareotype Studio, é "free for personal use" — o autor proíbe uso comercial
 * sem licença paga (cikareotype.com/license). Enquanto ela esteve no nome da
 * loja, esse era o lugar mais exposto possível pra uma fonte com essa restrição;
 * a troca pela Clash tirou a abertura de baixo do problema. Se a face voltar
 * pra qualquer coisa que venda, a licença tem que ser comprada ANTES. Está
 * registrado em `app/fontes/LEIA-ME.md`.
 *
 * ⚠️ **O arquivo fica NO REPOSITÓRIO, e isso não é descuido.** A Hard Zone, a
 * face de graffiti anterior, ficava no `.gitignore`: o localhost mostrava uma
 * fonte que o deploy nunca mostraria, e o bug só aparecia em produção. Fonte que
 * o build precisa não pode depender de um arquivo que só existe nesta máquina.
 *
 * 🔴 **A fonte NÃO TEM Ã, e por isso "VISÃO" é montado à mão.** São 125 glifos,
 * sem nenhum latino acentuado. O Chrome decompõe o Ã em A + til combinante e
 * acha o til na própria face — só que o GDEF dela não classifica esse til como
 * marca, então ele ganha avanço próprio e pousa em cima do O: sai "VISAÕ". O til
 * é posicionado por CSS em `componentes/Abertura.tsx`. Ver o cabeçalho de lá.
 */
const mao = localFont({
  src: "./fontes/vandalust.ttf",
  variable: "--font-mao",
  display: "swap",
  // Sem fallback de graffiti possível: se ela não chegar, a linha cai na face de
  // display do site, que é a Archivo — feio, mas legível e com o Ã certo.
  fallback: ["var(--font-cartaz)", "Arial Black", "sans-serif"],
});

/**
 * A MARCA — a face do nome da loja na abertura.
 *
 * Clash Display 700, do Indian Type Foundry (Fontshare). Entrou em set/2026 a
 * pedido do Henrique e tomou o lugar do par Archivo + Vandalust que montava o
 * nome até então.
 *
 * ## Ela resolveu três problemas de uma vez
 *
 * 1. 🔴 **Tirou a única fonte de licença proibida de cima do nome da loja.** A
 *    Vandalust é "free for personal use" e o nome da marca era o lugar mais
 *    exposto em que ela aparecia. Ver a nota da `mao` acima: aquela ressalva
 *    continua valendo pra onde a face ainda for usada, mas a abertura saiu de
 *    baixo dela.
 * 2. **Tem os acentos.** Ó, Ã, Á, À, Â, Ç, É, Ê, Í, Õ, Ú — todos desenhados. É o
 *    oposto da Vandalust, que não tem glifo acentuado nenhum e obrigava o til do
 *    Ã a ser pousado por CSS. Com ela "MÓ VISÃO" é texto, não montagem.
 * 3. **Cabe numa linha.** O nome era empilhado em duas porque as duas palavras
 *    estavam em faces diferentes e os glifos de graffiti pintavam fora da caixa
 *    de avanço, derrubando a haste da V em cima do acento do Ó. Com uma face só,
 *    o problema não existe.
 *
 * ⚠️ **O `.woff2` é AUTO-HOSPEDADO, como as outras quatro.** A Fontshare serve
 * um `<link>` de CDN, e foi assim que o Henrique passou a fonte — mas fonte
 * buscada na rede é exatamente o que já quebrou este site em silêncio
 * (`next/font/google` falhando no build e emitindo só fallback de Arial, sem
 * erro nenhum). O arquivo mora em `app/fontes/` e entra no repositório.
 *
 * Licença: ITF Free Font License — uso pessoal e COMERCIAL liberado. Registrado
 * em `app/fontes/LEIA-ME.md`.
 */
const marca = localFont({
  src: "./fontes/clash-display-700.woff2",
  variable: "--font-marca-face",
  display: "swap",
  weight: "700",
  fallback: ["var(--font-cartaz)", "Arial Black", "sans-serif"],
});

/**
 * A face do DADO.
 *
 * Numa prancha técnica o número não é texto: é medida. Chamada, cota, preço,
 * quantidade e código vivem numa monoespaçada porque a largura fixa é o que faz
 * uma coluna de preço PODER ser comparada descendo a página — com largura
 * proporcional as colunas dançam de linha em linha e o olho perde a referência.
 *
 * Azeret Mono é variável (400–700 num arquivo só, 26 KB) e tem o desenho
 * quadrado de letreiro de desenho técnico, que é o registro desta prancha.
 *
 * ⚠️ **Monoespaçada aqui é para dado, nunca para "parecer técnico".** Se um dia
 * aparecer um parágrafo de texto corrido nesta face, ela virou fantasia e o
 * motivo dela deixou de existir.
 */
const dado = localFont({
  src: "./fontes/azeret-mono-latin-var.woff2",
  variable: "--font-dado",
  display: "swap",
  weight: "400 700",
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
});

export const metadata: Metadata = {
  title: {
    default: "Mó Visão — óculos de rolê",
    template: "%s · Mó Visão",
  },
  description:
    "Óculos Oakley de rolê — Juliet, Romeo, Penny e o resto da linha. Do discreto ao que aparece de longe.",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Mó Visão",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

/**
 * Layout raiz: só o essencial de toda página.
 *
 * O Header e o Footer da loja NÃO ficam aqui — moram em `(loja)/layout.tsx`.
 * Aqui envolveriam o painel também, e o dono veria o menu da vitrine em cima
 * das telas de administração.
 */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      className={`${cartaz.variable} ${pe.variable} ${dado.variable} ${mao.variable} ${marca.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}

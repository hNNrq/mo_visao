import Link from "next/link";

/**
 * A faixa de utilidade da prancha.
 *
 * Numa folha de desenho técnico a borda de cima carrega a identificação da
 * folha — não um menu de loja. Aqui ela é isso: um fio de régua embaixo, rótulos
 * em corpo miúdo na face do dado, e nada mais. Sem logo, sem barra de promoção,
 * sem "frete grátis 🔥", sem carrossel por baixo.
 *
 * ⚠️ **A faixa é opaca e SEMPRE visível, e isso mudou em set/2026.** Antes ela
 * nascia transparente na home e ganhava fundo depois de 70% da altura da janela,
 * o que exigia um listener de scroll e um componente de cliente. Numa prancha a
 * borda da folha não some quando você olha o desenho: ela é a folha. O
 * componente virou servidor e o listener saiu.
 *
 * ⚠️ **"Rua" e "Corrida" saíram em set/2026, a pedido do Henrique.** A loja não
 * separa óculos por tipo: é catálogo único. Não recolocar. Os modelos também não
 * entram aqui — eles são o ÍNDICE da home e têm linha no cartucho do rodapé.
 */
const LINKS = [
  { href: "/", texto: "Início" },
  { href: "/produtos", texto: "Catálogo" },
];

/**
 * A área do cliente.
 *
 * No celular só o ícone aparece — três rótulos escritos ao lado dos da esquerda
 * não cabem em 375px sem encolher tudo a um corpo ilegível.
 *
 * ⚠️ **O alvo de toque é maior que o desenho do ícone.** `py-3 -my-3 px-2 -mx-2`
 * dá 44px de área tocável sem mudar uma linha do layout: o ícone continua com
 * 20px na tela e o dedo ganha o resto. Os três já foram 20x20 de alvo real, que
 * é menos da metade do mínimo — e o público usa isso em pé, no ônibus.
 */
const CONTA = [
  { href: "/carrinho", texto: "Carrinho", icone: IconeCarrinho },
  { href: "/pedidos", texto: "Pedidos", icone: IconePedidos },
  { href: "/conta", texto: "Conta", icone: IconeConta },
];

const ROTULO =
  "font-sans text-sm font-medium tracking-[0.18em] uppercase text-paper/70 transition-colors hover:text-gold max-[374px]:tracking-[0.1em] sm:text-base";

export function Header() {
  return (
    <header className="fixed top-0 right-0 left-0 z-50 border-b regua bg-ink">
      <nav className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-5 py-2.5 max-[374px]:gap-2 sm:gap-6 sm:px-10">
        <ul className="flex items-center gap-4 max-[374px]:gap-3 sm:gap-8">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className={`flex min-h-11 items-center px-1 ${ROTULO}`}>
                {link.texto}
              </Link>
            </li>
          ))}
        </ul>

        <ul className="flex items-center gap-1 sm:gap-4">
          {CONTA.map(({ href, texto, icone: Icone }) => (
            <li key={href}>
              <Link
                href={href}
                className={`flex min-h-11 min-w-11 items-center justify-center gap-2 px-2 ${ROTULO}`}
              >
                <Icone />
                <span className="hidden sm:inline">{texto}</span>
                <span className="sr-only sm:hidden">{texto}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}

/*
  Ícones inline: são três, de traço simples, e herdam a cor do link — não vale
  uma dependência de biblioteca de ícones por causa disso. O traço acompanha o
  da prancha (1.25), não o de interface (1.8): numa folha de desenho existe uma
  espessura de pena só.
*/

const TRACO = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function IconeCarrinho() {
  return (
    <svg {...TRACO}>
      <path d="M4 5h2l1.6 9.2a2 2 0 0 0 2 1.8h6.9a2 2 0 0 0 2-1.6L20 8H6.4" />
      <circle cx="10" cy="20" r="1.4" />
      <circle cx="17" cy="20" r="1.4" />
    </svg>
  );
}

function IconeConta() {
  return (
    <svg {...TRACO}>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </svg>
  );
}

function IconePedidos() {
  return (
    <svg {...TRACO}>
      <path d="M4 4h11l5 5v11H4z" />
      <path d="M15 4v5h5" />
      <path d="M8 13h8M8 17h5" />
    </svg>
  );
}

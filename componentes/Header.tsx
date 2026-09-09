"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/** Esquerda: navegação do catálogo. */
const LINKS = [
  { href: "/produtos", texto: "Produtos" },
  { href: "/produtos?categoria=corrida", texto: "Corrida" },
  { href: "/produtos?categoria=rua", texto: "Rua" },
];

/**
 * Direita: a área do cliente.
 *
 * No mobile só o ícone aparece — três rótulos escritos ao lado das três
 * categorias não cabem numa tela de 375px sem encolher tudo a um tamanho
 * ilegível. O texto entra a partir de `sm`.
 */
const CONTA = [
  { href: "/carrinho", texto: "Carrinho", icone: IconeCarrinho },
  { href: "/pedidos", texto: "Pedidos", icone: IconePedidos },
  { href: "/conta", texto: "Conta", icone: IconeConta },
];

/**
 * Na home o header flutua por cima da hero clara, então nasce transparente e
 * com texto escuro. Ao passar da hero, vira a barra preta padrão.
 * Nas outras páginas já começa preta.
 */
export function Header() {
  const naHome = usePathname() === "/";
  const [passouDaHero, setPassouDaHero] = useState(false);

  useEffect(() => {
    if (!naHome) return;

    const aoRolar = () =>
      setPassouDaHero(window.scrollY > window.innerHeight * 0.8);

    aoRolar(); // cobre o caso de recarregar já rolado
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, [naHome]);

  const claro = naHome && !passouDaHero;
  const cor = claro
    ? "text-ink/70 hover:text-ink"
    : "text-white/70 hover:text-white";

  return (
    <header
      className={`fixed top-0 right-0 left-0 z-50 transition-colors duration-300 ${
        claro
          ? "border-b border-transparent bg-transparent"
          : "border-b border-white/10 bg-ink/90 backdrop-blur"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4 sm:gap-6 sm:px-10">
        <ul className="flex items-center gap-4 sm:gap-8">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`font-sans text-sm tracking-[0.16em] uppercase transition-colors sm:text-base ${cor}`}
              >
                {link.texto}
              </Link>
            </li>
          ))}
        </ul>

        <ul className="flex items-center gap-4 sm:gap-7">
          {CONTA.map(({ href, texto, icone: Icone }) => (
            <li key={href}>
              <Link
                href={href}
                className={`flex items-center gap-2 font-sans text-sm tracking-[0.16em] uppercase transition-colors ${cor}`}
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
  uma dependência de biblioteca de ícones por causa disso.
*/

const TRACO = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
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

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * As abas do painel, no topo do desktop e fixas no pé do celular.
 *
 * A aba ligada é o mesmo carimbo de ouro que marca o filtro ativo do catálogo:
 * o painel não inventa um segundo jeito de dizer "é aqui que você está". O
 * estado sai de `aria-current`, não só da cor.
 */
const ABAS = [
  { href: "/admin/produtos", texto: "Produtos" },
  { href: "/admin/pedidos", texto: "Pedidos" },
  { href: "/admin/config", texto: "Ajustes" },
];

export function Abas({ onde }: { onde: "topo" | "pe" }) {
  const caminho = usePathname();

  return (
    <ul
      className={
        onde === "topo"
          ? "mx-auto hidden max-w-[900px] gap-3 px-8 pb-3 sm:flex"
          : "grid grid-cols-3"
      }
    >
      {ABAS.map((aba) => {
        const aqui = caminho.startsWith(aba.href);

        return (
          <li key={aba.href} className={onde === "pe" ? "flex" : undefined}>
            <Link
              href={aba.href}
              aria-current={aqui ? "page" : undefined}
              className={
                onde === "pe"
                  ? "flex flex-1 items-center justify-center py-4"
                  : "inline-block"
              }
            >
              <span
                className={`skew-brand inline-block px-4 py-2 font-display text-base font-black tracking-tight uppercase transition-colors ${
                  aqui
                    ? "bg-gold text-ink"
                    : "bg-paper/10 text-paper hover:bg-paper/20"
                }`}
              >
                <span className="unskew">{aba.texto}</span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

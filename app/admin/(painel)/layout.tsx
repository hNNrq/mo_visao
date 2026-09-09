import type { Metadata } from "next";
import Link from "next/link";
import { sair } from "@/app/admin/acoes";

export const metadata: Metadata = {
  title: "Painel",
  robots: { index: false, follow: false },
};

/**
 * Layout do painel.
 *
 * Ele usa isso pelo celular, entre um corte e outro. Por isso:
 *  - navegação fixa embaixo no mobile (onde o polegar alcança), no topo no desktop
 *  - alvos de toque grandes
 *  - nada de tabela larga que rola pro lado
 */

const ABAS = [
  { href: "/admin/produtos", texto: "Produtos" },
  { href: "/admin/pedidos", texto: "Pedidos" },
  { href: "/admin/config", texto: "Ajustes" },
];

export default function LayoutAdmin({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ink pb-24 sm:pb-0">
      <div className="border-b border-white/10 bg-steel">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-5 py-4">
          <Link
            href="/admin/produtos"
            className="skew-brand inline-block font-marca text-xl uppercase sm:text-2xl"
          >
            Mó <span className="text-hot">Visão</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="font-sans text-sm tracking-wide text-white/50 hover:text-white"
            >
              Ver a loja
            </Link>
            <form action={sair}>
              <button
                type="submit"
                className="font-sans text-sm tracking-wide text-white/50 hover:text-hot"
              >
                Sair
              </button>
            </form>
          </div>
        </div>

        {/* desktop: abas no topo */}
        <nav className="mx-auto hidden max-w-4xl gap-1 px-5 sm:flex">
          {ABAS.map((aba) => (
            <Link
              key={aba.href}
              href={aba.href}
              className="border-b-2 border-transparent px-4 py-3 font-display text-lg font-bold uppercase text-white/60 transition-colors hover:border-hot hover:text-white"
            >
              {aba.texto}
            </Link>
          ))}
        </nav>
      </div>

      <main className="mx-auto max-w-4xl px-5 py-6">{children}</main>

      {/* mobile: barra fixa embaixo, na altura do polegar */}
      <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-3 border-t border-white/10 bg-steel sm:hidden">
        {ABAS.map((aba) => (
          <Link
            key={aba.href}
            href={aba.href}
            className="py-4 text-center font-display text-base font-bold uppercase text-white/70 active:bg-white/10"
          >
            {aba.texto}
          </Link>
        ))}
      </nav>
    </div>
  );
}

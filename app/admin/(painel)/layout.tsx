import type { Metadata } from "next";
import Link from "next/link";
import { sair } from "@/app/admin/acoes";
import { Abas } from "@/componentes/admin/Abas";

export const metadata: Metadata = {
  title: "Painel",
  robots: { index: false, follow: false },
};

/**
 * Layout do painel — o quadro de preços do balcão.
 *
 * Ele usa isso pelo celular, entre um corte e outro. Por isso:
 *  - navegação fixa embaixo no mobile (onde o polegar alcança), no topo no desktop
 *  - alvos de toque grandes
 *  - nada de tabela larga que rola pro lado
 *
 * A medida aqui é de trabalho (900px), não a da vitrine (1600px): uma lista de
 * cinco elementos esticada até 1600px vira olho indo e voltando na tela.
 */
export default function LayoutAdmin({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ink pb-[calc(5rem+env(safe-area-inset-bottom))] sm:pb-0">
      <header className="bg-steel">
        <div className="mx-auto flex max-w-[900px] items-center justify-between gap-4 px-5 py-1.5 sm:px-8 sm:py-2.5">
          <Link
            href="/admin/produtos"
            className="skew-brand inline-block py-2.5 font-marca text-xl leading-none font-black uppercase text-paper sm:text-2xl"
          >
            Mó <span className="text-gold">Visão</span>
          </Link>

          {/* Alvos de polegar, não links de rodapé: um deles desloga ele no meio
              da tarefa. "Sair" vem mais apagado de propósito — é a ação que ele
              menos quer tocar por engano. */}
          <div className="flex items-center gap-1">
            <Link
              href="/"
              className="px-2 py-3 font-sans text-sm tracking-[0.16em] uppercase text-paper/80 transition-colors hover:text-gold"
            >
              Ver a loja
            </Link>
            <form action={sair}>
              <button
                type="submit"
                className="px-2 py-3 font-sans text-sm tracking-[0.16em] uppercase text-smoke transition-colors hover:text-gold"
              >
                Sair
              </button>
            </form>
          </div>
        </div>

        {/* desktop: abas no topo */}
        <Abas onde="topo" />
      </header>

      <main className="mx-auto max-w-[900px] px-5 py-7 sm:px-8 sm:py-10">
        {children}
      </main>

      {/* Mobile: barra fixa embaixo, na altura do polegar. O respiro de baixo é
          a faixa do gesto do aparelho — sem ele os rótulos ficam debaixo da
          barrinha do sistema, justo no aparelho que é a tela principal daqui. */}
      <nav className="fixed inset-x-0 bottom-0 z-50 bg-steel pb-[env(safe-area-inset-bottom)] sm:hidden">
        <Abas onde="pe" />
      </nav>
    </div>
  );
}

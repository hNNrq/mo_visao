import type { Metadata } from "next";

/**
 * Layout de todo o /admin — inclusive a tela de entrar.
 *
 * A navegação do painel NÃO mora aqui: ela está no grupo `(painel)`, para que
 * a tela de login não mostre abas de uma área onde a pessoa ainda não entrou.
 */
export const metadata: Metadata = {
  title: "Painel",
  robots: { index: false, follow: false },
};

export default function LayoutAdmin({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-ink">{children}</div>;
}

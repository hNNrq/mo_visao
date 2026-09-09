import { Header } from "@/componentes/Header";
import { Footer } from "@/componentes/Footer";

/**
 * Layout da loja — o que o cliente vê.
 *
 * Header e Footer moram aqui, e não no layout raiz, senão apareceriam também
 * dentro do /admin: o dono via o menu "Produtos / Corrida / Rua" da vitrine
 * empilhado em cima do painel.
 */
export default function LayoutLoja({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}

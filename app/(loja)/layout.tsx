import { Header } from "@/componentes/Header";
import { Footer } from "@/componentes/Footer";

/**
 * Layout da loja — o que o cliente vê.
 *
 * Header e Footer moram aqui, e não no layout raiz, senão apareceriam também
 * dentro do /admin: o dono via a barra de navegação da vitrine empilhada em
 * cima do painel.
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

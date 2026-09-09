import type { Metadata } from "next";
import { EmBreve } from "@/componentes/EmBreve";

export const metadata: Metadata = { title: "Carrinho" };

export default function PaginaCarrinho() {
  return (
    <EmBreve
      etiqueta="Carrinho"
      titulo="Ainda não dá pra fechar aqui"
      texto="A compra pelo site entra na próxima fase. Por enquanto, escolha o modelo no catálogo e chame no Instagram — a gente reserva."
    />
  );
}

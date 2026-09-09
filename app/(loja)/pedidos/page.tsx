import type { Metadata } from "next";
import { EmBreve } from "@/componentes/EmBreve";

export const metadata: Metadata = { title: "Meus pedidos" };

export default function PaginaPedidos() {
  return (
    <EmBreve
      etiqueta="Pedidos"
      titulo="Nenhum pedido por aqui ainda"
      texto="Assim que a compra pelo site abrir, cada pedido aparece nessa página com o código de rastreio."
    />
  );
}

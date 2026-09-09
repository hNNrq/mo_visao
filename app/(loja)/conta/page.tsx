import type { Metadata } from "next";
import { EmBreve } from "@/componentes/EmBreve";

export const metadata: Metadata = { title: "Minha conta" };

export default function PaginaConta() {
  return (
    <EmBreve
      etiqueta="Conta"
      titulo="A conta vem com o checkout"
      texto="Quando a compra pelo site abrir, é aqui que você salva endereço e forma de pagamento pra não digitar tudo de novo na próxima."
    />
  );
}

import { redirect } from "next/navigation";

/**
 * A loja não tem cadastro — o pedido se acompanha pelo link dele. A rota fica
 * pra quem tiver o endereço salvo de quando "Conta" estava no header.
 */
export default function PaginaConta() {
  redirect("/pedidos");
}

"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { esvaziar, lembrarPedido } from "@/lib/carrinho";

/**
 * O que a página do pedido faz no navegador, sem desenhar nada:
 *
 *  - lembra o pedido neste aparelho (é o "meus pedidos" de quem não tem conta)
 *  - quando o pagamento confirma, esvazia o carrinho — antes disso não, porque
 *    quem volta do MP sem pagar ainda quer as peças lá
 *  - enquanto espera o Pix, relê a página a cada 5 segundos, por até 15
 *    minutos. O Pix é pago no app do banco, fora daqui, e a pessoa volta pra
 *    esta aba esperando ver "confirmado" sem apertar nada.
 */
export function AcompanharPedido({
  numero,
  token,
  pago,
  aguardando,
}: {
  numero: string;
  token: string;
  pago: boolean;
  aguardando: boolean;
}) {
  const router = useRouter();

  useEffect(() => {
    lembrarPedido({ numero, token });
  }, [numero, token]);

  useEffect(() => {
    if (pago) esvaziar();
  }, [pago]);

  useEffect(() => {
    if (!aguardando) return;
    const inicio = Date.now();
    const id = setInterval(() => {
      if (Date.now() - inicio > 15 * 60_000 || document.hidden) return;
      router.refresh();
    }, 5000);
    return () => clearInterval(id);
  }, [aguardando, router]);

  return null;
}

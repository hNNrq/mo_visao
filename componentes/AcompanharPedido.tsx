"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { esvaziar, lembrarPedido } from "@/lib/carrinho";

/**
 * O pedaço de cliente da página do pedido.
 *
 * - guarda o id neste aparelho, pra "Meus pedidos" achar depois
 * - esvazia o carrinho de novo: quem abriu o Mercado Pago em outra aba e
 *   voltou por aqui não pode ver as mesmas peças esperando
 * - enquanto o pagamento não entra, relê a página de tempos em tempos. Pix
 *   pago no app do banco chega pelo webhook, sem a pessoa voltar por link
 *   nenhum — sem isto ela ficaria olhando "falta pagar" depois de pagar.
 */
export function AcompanharPedido({ id, aguardando }: { id: string; aguardando: boolean }) {
  const router = useRouter();

  useEffect(() => {
    lembrarPedido(id);
    esvaziar();
  }, [id]);

  useEffect(() => {
    if (!aguardando) return;
    const t = setInterval(() => router.refresh(), 8000);
    return () => clearInterval(t);
  }, [aguardando, router]);

  return null;
}

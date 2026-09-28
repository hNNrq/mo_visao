import type { Metadata } from "next";
import { Bloco, PaginaTexto } from "@/componentes/PaginaTexto";

export const metadata: Metadata = {
  title: "Trocas e devoluções",
  description: "Mudou de ideia em até 7 dias ou veio com defeito em até 90: como funciona a troca na Mó Visão.",
};

/**
 * ⚠️ TEXTO SUGERIDO PELA NORMAN.DGT, AINDA NÃO CONFIRMADO PELO DONO (set/2026).
 *
 * O que é lei e não muda: 7 dias de arrependimento em compra online, com frete
 * da devolução por conta da loja (CDC art. 49), e 90 dias de garantia legal
 * contra defeito em produto durável (CDC art. 26). O que é escolha dele: troca
 * por outro modelo, prazo maior que 7 dias, prazo do reembolso, e a exigência
 * de estojo e película. Pedir "sem uso" não pode virar desculpa pra negar o
 * arrependimento — vale uma olhada de advogado antes de tratar como definitivo.
 */
export default function PaginaTrocas() {
  return (
    <PaginaTexto
      titulo="Trocas e devoluções"
      abertura="Óculos comprado pela internet a gente só vê de verdade quando põe na cara. Por isso a regra é simples."
    >
      <Bloco titulo="Mudou de ideia? 7 dias">
        <p>
          Em até 7 dias depois de receber o óculos, tu pode devolver e receber o dinheiro de volta, ou
          trocar por outro modelo.
        </p>
        <p>
          O óculos precisa voltar sem marca de uso, com o estojo e a película da lente. A gente
          combina a retirada, sem custo pra ti.
        </p>
      </Bloco>

      <Bloco titulo="Veio com defeito? 90 dias">
        <p>
          Defeito de fabricação — dobradiça solta, lente descolando, armação trincada sem ter caído —
          tem 90 dias a partir da entrega. A gente troca pelo mesmo modelo, ou devolve o dinheiro se
          ele não estiver mais em estoque.
        </p>
      </Bloco>

      <Bloco titulo="O que não entra">
        <p>Risco ou quebra por uso, queda ou pressão.</p>
      </Bloco>

      <Bloco titulo="Como pedir">
        <p>
          Manda o número do pedido (começa com MV-) no WhatsApp ou no direct do Instagram. Ele está
          na página do pedido e no email do Mercado Pago.
        </p>
      </Bloco>

      <Bloco titulo="Dinheiro de volta">
        <p>
          Pelo mesmo meio do pagamento, em até 7 dias depois de a gente receber o óculos. No cartão,
          o estorno aparece na fatura seguinte ou na outra, conforme o banco.
        </p>
      </Bloco>
    </PaginaTexto>
  );
}

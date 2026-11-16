import type { Metadata } from "next";
import { Bloco, PaginaTexto } from "@/componentes/PaginaTexto";

export const metadata: Metadata = {
  title: "Trocas e devoluções",
  description: "Desistência em até 7 dias e defeito em até 90: como funciona a devolução na Mó Visão.",
};

/**
 * Regra do dono (out/2026): troca só por problema, não por gosto. O que a lei
 * não deixa tirar e entra mesmo assim:
 *  - compra pela internet tem 7 dias CORRIDOS de desistência, sem motivo, com
 *    o dinheiro de volta inteiro, frete incluso (CDC, art. 49)
 *  - defeito em produto durável vale por 90 dias (CDC, art. 26), e a loja tem
 *    30 dias pra resolver (art. 18)
 *
 * O "não troca por gosto" que ele pediu cabe aqui como: desistência é devolução
 * com reembolso, não troca por outro modelo.
 *
 * ⚠️ Falta o dono confirmar que sabe que o frete da devolução é por conta dele.
 */
export default function PaginaTrocas() {
  return (
    <PaginaTexto
      titulo="Trocas e devoluções"
      abertura="Comprou pela internet e não ficou como esperava? Aqui está o que tu pode fazer."
    >
      <Bloco titulo="Desistiu? 7 dias">
        <p>
          Em até 7 dias depois de receber o óculos, tu pode devolver sem precisar explicar o motivo, e
          recebe o dinheiro de volta inteiro, frete incluso.
        </p>
        <p>
          O óculos volta com o que veio junto, como estojo e flanela. A gente combina a devolução, sem
          custo pra ti.
        </p>
      </Bloco>

      <Bloco titulo="Não troca por outro modelo">
        <p>
          A gente não faz troca por outro modelo ou outra cor só porque não curtiu. Nesse caso, o caminho
          é a desistência: devolve e recebe o dinheiro.
        </p>
      </Bloco>

      <Bloco titulo="Veio com problema? 90 dias">
        <p>
          Defeito de fabricação, peça quebrada no transporte ou modelo diferente do que tu pediu: avisa a
          gente em até 90 dias depois de receber, de preferência com foto.
        </p>
        <p>
          A gente resolve em até 30 dias: manda outro igual, devolve o dinheiro ou, se tu preferir ficar
          com a peça, abate do valor.
        </p>
      </Bloco>

      <Bloco titulo="O que não entra">
        <p>Risco ou quebra por uso, queda ou pressão.</p>
      </Bloco>

      <Bloco titulo="Como pedir">
        <p>
          Manda o número do pedido (começa com MV-) no WhatsApp ou no direct do Instagram. Ele está na
          página do pedido e no email do Mercado Pago.
        </p>
      </Bloco>

      <Bloco titulo="Dinheiro de volta">
        <p>
          Pelo mesmo meio do pagamento, em até 7 dias depois de a gente receber o óculos. No cartão, o
          estorno aparece na fatura seguinte ou na outra, conforme o banco.
        </p>
      </Bloco>
    </PaginaTexto>
  );
}

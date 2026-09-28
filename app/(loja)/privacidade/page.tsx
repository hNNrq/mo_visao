import type { Metadata } from "next";
import { Bloco, PaginaTexto } from "@/componentes/PaginaTexto";

export const metadata: Metadata = {
  title: "Privacidade",
  description: "Que dado a Mó Visão pede no pedido, pra quê, e com quem ele é compartilhado.",
};

/**
 * Descreve o que o site FAZ hoje — se o checkout passar a guardar outra coisa
 * (conta, cookie de análise, pixel de anúncio), este texto muda junto. Aviso
 * de privacidade que não bate com o código é pior que nenhum.
 */
export default function PaginaPrivacidade() {
  return (
    <PaginaTexto
      titulo="Privacidade"
      abertura="O site pede só o que precisa pra te entregar o óculos, e mais nada."
    >
      <Bloco titulo="O que a gente pede">
        <p>
          No pedido: nome, WhatsApp, email e, se for entrega, o endereço. É pra combinar a entrega,
          mandar o comprovante e atender troca ou defeito.
        </p>
      </Bloco>

      <Bloco titulo="Pagamento">
        <p>
          O pagamento acontece na tela do Mercado Pago. A loja não vê nem guarda número de cartão —
          recebe só a confirmação de que o pedido foi pago e por qual meio.
        </p>
      </Bloco>

      <Bloco titulo="Com quem é compartilhado">
        <p>
          Com o Mercado Pago, pra processar o pagamento, e com os serviços que hospedam o site e o
          banco de dados. Não vendemos nem passamos teu contato pra ninguém, e não mandamos
          propaganda sem tu pedir.
        </p>
      </Bloco>

      <Bloco titulo="No teu navegador">
        <p>
          O carrinho e a lista de pedidos feitos neste aparelho ficam guardados no próprio
          navegador. O site não usa cookie de propaganda nem rastreador de terceiros.
        </p>
      </Bloco>

      <Bloco titulo="Teus direitos">
        <p>
          Pela LGPD, tu pode pedir pra ver, corrigir ou apagar teus dados a qualquer momento. É só
          chamar no WhatsApp ou no direct do Instagram. Dado de pedido pago precisa ficar guardado o
          tempo que a lei fiscal exige; o resto sai quando tu pedir.
        </p>
      </Bloco>
    </PaginaTexto>
  );
}

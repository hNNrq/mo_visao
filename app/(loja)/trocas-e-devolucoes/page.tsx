import type { Metadata } from "next";
import { linkWhatsApp } from "@/lib/format";
import { lerConfig } from "@/lib/produtos";

export const metadata: Metadata = {
  title: "Trocas e devoluções",
  description: "Desistência em 7 dias, defeito em até 90 dias e como pedir.",
};

/**
 * Trocas e devoluções.
 *
 * Regra do dono (out/2026): troca só por problema, não por gosto. O que a lei
 * não deixa tirar e entrou mesmo assim:
 * - compra pela internet tem 7 dias CORRIDOS de desistência, sem motivo, com
 *   o dinheiro de volta inteiro, frete incluso (CDC, art. 49)
 * - defeito em produto durável vale por 90 dias (CDC, art. 26), e a loja tem
 *   30 dias pra resolver (art. 18)
 * O "não troca por gosto" que ele pediu cabe aqui como: desistência é
 * devolução com reembolso, não troca por outro modelo.
 */

export const dynamic = "force-dynamic";

const titulo = "font-display text-2xl leading-[0.95] font-black tracking-tight uppercase text-paper";
const corpo = "mt-4 flex flex-col gap-3 font-sans text-lg leading-snug text-paper/85";

export default async function PaginaTrocas() {
  const config = await lerConfig();
  const whatsapp = linkWhatsApp(
    String(config.whatsapp ?? ""),
    "Oi! Quero falar sobre uma devolução. Meu pedido é o ",
  );

  return (
    <main className="bg-ink px-5 pt-28 pb-24 sm:px-10 sm:pt-32">
      <div className="mx-auto max-w-[1600px]">
        <h1 className="font-display text-[clamp(2.5rem,7vw,5rem)] leading-[0.9] font-black tracking-tight uppercase text-paper">
          Trocas e devoluções
        </h1>

        <div className="mt-12 grid max-w-[1100px] gap-14 md:grid-cols-2 md:gap-x-20">
          <section>
            <h2 className={titulo}>Desistiu? 7 dias</h2>
            <div className={corpo}>
              <p>
                Comprou pelo site e mudou de ideia? Você tem 7 dias, contados do dia em
                que recebeu, pra devolver. Não precisa explicar o motivo.
              </p>
              <p>
                O óculos volta com o que veio junto (estojo, flanela) e você recebe o
                dinheiro de volta inteiro, frete incluso. O envio da devolução é por
                nossa conta.
              </p>
            </div>
          </section>

          <section>
            <h2 className={titulo}>Não troca por outro modelo</h2>
            <div className={corpo}>
              <p>
                A gente não faz troca por outro modelo ou outra cor só porque não
                curtiu. Nesse caso, o caminho é a desistência ao lado: devolve e
                recebe o dinheiro.
              </p>
            </div>
          </section>

          <section>
            <h2 className={titulo}>Veio com problema? Até 90 dias</h2>
            <div className={corpo}>
              <p>
                Defeito de fábrica, peça quebrada no transporte ou modelo diferente do
                que você pediu: avisa a gente em até 90 dias do recebimento, de
                preferência com foto.
              </p>
              <p>
                A gente resolve em até 30 dias: manda outro igual, devolve o dinheiro
                ou, se você preferir ficar com a peça, abate do valor.
              </p>
            </div>
          </section>

          <section>
            <h2 className={titulo}>Como pedir</h2>
            <div className={corpo}>
              <p>
                Chama no WhatsApp com o número do pedido (começa com MV-). Ele está no
                email de confirmação e em Meus pedidos.
              </p>
              {whatsapp && (
                <p>
                  <a
                    href={whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="skew-brand mt-2 inline-block bg-gold px-6 py-3 font-display text-lg font-black tracking-tight uppercase text-ink transition-colors hover:bg-gold-deep"
                  >
                    <span className="unskew">Chamar no WhatsApp</span>
                  </a>
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

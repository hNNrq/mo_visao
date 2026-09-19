import Link from "next/link";
import { MODELOS, rotaModelo } from "@/lib/modelos";

/**
 * O CARTUCHO — o bloco de título no pé da prancha.
 *
 * Toda folha de desenho técnico termina no mesmo lugar e do mesmo jeito: uma
 * caixa regrada no canto, dividida em campos, cada campo com o rótulo miúdo em
 * cima e o valor embaixo. Título, número da folha, escala, data, quem desenhou.
 * É a assinatura burocrática do desenho, e é exatamente o que um rodapé de loja
 * precisa ser: denso, factual, sem promessa.
 *
 * Por isso aqui não há coluna de links solta no preto. Há CAMPOS, e os campos
 * têm fio entre eles.
 *
 * ⚠️ **Só o que é verdade entra.** Sem selo de compra segura, sem bandeira de
 * cartão, sem "desde 19xx", sem contador de clientes. A loja abriu em setembro
 * de 2026 e o `PRODUCT.md` proíbe prova social inventada — num cartucho isso é
 * ainda mais literal, porque cada campo ali é uma declaração.
 */

const ANO = new Date().getFullYear();

function Campo({
  rotulo,
  children,
  className = "",
}: {
  rotulo: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`border-t regua px-5 py-5 sm:px-6 ${className}`}>
      <p className="font-sans text-xs tracking-[0.22em] text-smoke uppercase">
        {rotulo}
      </p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

const LINK =
  "font-sans text-base text-paper/80 transition-colors hover:text-gold sm:text-lg";

export function Footer() {
  return (
    <footer className="px-5 pb-10 sm:px-10">
      <div className="mx-auto max-w-[1600px] border-b regua">
        <h2 className="border-t regua px-5 pt-7 pb-6 font-display text-[clamp(2.5rem,12vw,9rem)] leading-[0.8] font-black tracking-[-0.02em] text-paper uppercase sm:px-6">
          <Link href="/" className="transition-colors hover:text-gold">
            Mó Visão
          </Link>
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3">
          <Campo rotulo="Modelos">
            <nav aria-label="Modelos">
              <ul className="space-y-2">
                {MODELOS.map((modelo) => (
                  <li key={modelo.nome}>
                    <Link href={rotaModelo(modelo.nome)} className={LINK}>
                      {modelo.nome}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link href="/produtos" className={LINK}>
                    Catálogo completo
                  </Link>
                </li>
              </ul>
            </nav>
          </Campo>

          <Campo rotulo="A loja" className="sm:border-l">
            <nav aria-label="A loja">
              <ul className="space-y-2">
                <li>
                  <Link href="/trocas-e-devolucoes" className={LINK}>
                    Trocas e devoluções
                  </Link>
                </li>
                <li>
                  <Link href="/privacidade" className={LINK}>
                    Privacidade
                  </Link>
                </li>
              </ul>
            </nav>
          </Campo>

          <Campo rotulo="Contato" className="lg:border-l">
            <a
              href="https://www.instagram.com/mo_visao2k26"
              className={LINK}
              target="_blank"
              rel="noopener noreferrer"
            >
              @mo_visao2k26
            </a>
          </Campo>
        </div>

        {/*
          A última fileira do cartucho. Era o bloco de identificação do desenho
          (Folha 01 de 01 · Escala 1:1 · Data · Desenho), e o Henrique cortou em
          set/2026: numa loja aquilo são quatro campos que ninguém lê, e três
          deles não dizem nada sobre a loja. Sobrou o único que dizia — o
          crédito. Ele fica em face de DADO e no mesmo corpo dos antigos valores,
          porque o registro do cartucho é esse; o que mudou foi a quantidade de
          campos, não a voz.
        */}
        <p className="numeros border-t regua px-5 py-4 font-mono text-sm text-paper/80 sm:px-6">
          Feito por Norman.dgt · {ANO}
        </p>
      </div>
    </footer>
  );
}

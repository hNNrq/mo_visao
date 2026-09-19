import Link from "next/link";
import { precoBRL } from "@/lib/format";
import { MODELOS, rotaModelo } from "@/lib/modelos";
import { precosDaVitrine } from "@/lib/produtos";

/**
 * O ÍNDICE — os três modelos como linhas numeradas da prancha.
 *
 * Num catálogo de peças o índice é a coisa mais útil da publicação: número,
 * nome, descrição e a coluna de preço alinhada à direita, tudo separado por um
 * fio. Não é uma grade de três cards iguais, e não é uma parede de folhas — é
 * uma TABELA, e a tabela é o que deixa comparar sem precisar caçar.
 *
 * ⚠️ **A coluna de preço é `tabular-nums` em face monoespaçada, e isso é
 * requisito.** O índice inteiro existe pra responder "quanto custa cada um"
 * descendo a página com o olho. Com largura de dígito proporcional os números
 * dançam de linha em linha e a coluna deixa de ser coluna.
 *
 * ⚠️ **Modelo sem peça no catálogo não vira link morto.** Quando `porModelo` não
 * traz preço, a linha não some e não ganha número inventado: ela mostra o estado
 * real e aponta pro Instagram, que é onde a loja de fato avisa quando entra.
 * Nove links levando a catálogo vazio foi o defeito mais caro da versão
 * anterior — a página prometia três modelos que a loja não tinha, três vezes.
 */
export async function Indice() {
  const precos = await precosDaVitrine(MODELOS.map((m) => m.nome));

  return (
    <section className="px-5 sm:px-10">
      <div className="mx-auto max-w-[1600px]">
        <div className="flex items-baseline justify-between gap-6 border-b regua pb-3">
          <h2 className="font-display text-[clamp(1.75rem,3.5vw,2.75rem)] leading-none font-black tracking-tight text-paper uppercase">
            Os mais falados
          </h2>
          <p className="shrink-0 font-sans text-sm tracking-[0.18em] text-smoke uppercase">
            {MODELOS.length} linhas
          </p>
        </div>

        <ol>
          {MODELOS.map((modelo, i) => {
            const preco = precos.porModelo[modelo.nome];
            const temPeca = preco !== undefined;
            const n = String(i + 1).padStart(2, "0");

            const miolo = (
              <>
                <span className="chamada h-9 shrink-0 text-sm font-bold transition-colors group-hover:bg-gold group-hover:text-ink sm:h-11 sm:text-base">
                  {n}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block font-display text-[clamp(1.75rem,5vw,3.25rem)] leading-[0.92] font-black tracking-tight text-paper uppercase transition-colors group-hover:text-gold">
                    {modelo.nome}
                  </span>
                  <span className="mt-1.5 block max-w-[46ch] font-sans text-base leading-snug text-smoke sm:text-lg">
                    {modelo.texto}
                  </span>
                </span>

                <span className="shrink-0 cota pl-4 text-right sm:pl-6">
                  {temPeca ? (
                    <>
                      <span className="block font-sans text-xs tracking-[0.18em] text-smoke uppercase">
                        a partir de
                      </span>
                      <span className="numeros mt-1 block font-mono text-lg leading-none font-bold text-gold sm:text-2xl">
                        {precoBRL(preco)}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="block font-sans text-xs tracking-[0.18em] text-smoke uppercase">
                        sem peça agora
                      </span>
                      <span className="mt-1 block font-sans text-sm leading-tight text-paper/70 uppercase">
                        avisa no insta
                      </span>
                    </>
                  )}
                </span>
              </>
            );

            return (
              <li key={modelo.nome} className="border-b regua">
                {temPeca ? (
                  <Link
                    href={rotaModelo(modelo.nome)}
                    className="group flex items-center gap-4 py-6 sm:gap-7 sm:py-8"
                  >
                    {miolo}
                  </Link>
                ) : (
                  /* sem peça no catálogo, a linha aponta pro canal que de fato
                     avisa — nunca pra uma página de catálogo vazia */
                  <a
                    href="https://www.instagram.com/mo_visao2k26"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-4 py-6 opacity-70 transition-opacity hover:opacity-100 sm:gap-7 sm:py-8"
                  >
                    {miolo}
                  </a>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

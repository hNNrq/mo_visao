import Link from "next/link";
import { FormLogin } from "@/componentes/admin/FormLogin";
import { Muro } from "@/componentes/Muro";

/**
 * A única tela do painel que ganha o muro atrás.
 *
 * Ela não tem lista nem dado — é um formulário de dois campos num campo preto,
 * e sem o muro nada ali diz em que loja o dono acabou de entrar. Nas telas de
 * trabalho o muro não entra: são 30 linhas de texto no DOM, e atrás de um
 * catálogo isso é peso que a tela não devolve.
 */
export default function PaginaEntrar() {
  return (
    <main className="relative flex min-h-screen flex-col justify-center overflow-hidden px-5 py-16 sm:px-8">
      <Muro />

      <div className="relative mx-auto w-full max-w-[480px]">
        <Link
          href="/"
          className="skew-brand inline-block font-marca text-3xl leading-none font-black uppercase text-paper"
        >
          Mó <span className="text-gold">Visão</span>
        </Link>

        <h1 className="mt-12 font-display text-3xl leading-none font-black tracking-tight uppercase text-paper sm:text-4xl">
          Painel da loja
        </h1>
        <p className="mt-4 mb-9 max-w-[42ch] font-sans text-lg leading-snug text-smoke">
          Entre pra cadastrar produtos, mudar preço e ver os pedidos.
        </p>

        <FormLogin />
      </div>
    </main>
  );
}

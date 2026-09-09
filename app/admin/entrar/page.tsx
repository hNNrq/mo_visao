import Link from "next/link";
import { FormLogin } from "@/componentes/admin/FormLogin";

export default function PaginaEntrar() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <Link
        href="/"
        className="skew-brand mb-10 inline-block self-start font-marca text-3xl uppercase"
      >
        Mó <span className="text-hot">Visão</span>
      </Link>

      <h1 className="font-display text-3xl font-black uppercase">Painel da loja</h1>
      <p className="mt-2 mb-8 font-sans text-lg text-white/60">
        Entre pra cadastrar produtos, mudar preço e ver os pedidos.
      </p>

      <FormLogin />
    </main>
  );
}

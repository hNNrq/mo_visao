import Link from "next/link";
import { FormProduto } from "@/componentes/admin/FormProduto";
import { exigirAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function PaginaNovoProduto() {
  await exigirAdmin();

  return (
    <div>
      <Link
        href="/admin/produtos"
        className="font-sans text-white/50 underline underline-offset-4 hover:text-white"
      >
        ← Voltar
      </Link>

      <h1 className="mt-4 font-display text-3xl font-black uppercase">Novo óculos</h1>
      <p className="mt-1 mb-7 font-sans text-white/50">
        Preencha os dados e salve. As fotos você adiciona na tela seguinte.
      </p>

      <FormProduto />
    </div>
  );
}

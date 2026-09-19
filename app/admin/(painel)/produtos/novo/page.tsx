import Link from "next/link";
import { FormProduto } from "@/componentes/admin/FormProduto";
import { Cabecalho } from "@/componentes/admin/Cabecalho";
import { exigirAdminNaPagina } from "@/lib/admin";
import { SemAcesso } from "@/componentes/admin/SemAcesso";

export const dynamic = "force-dynamic";

export default async function PaginaNovoProduto() {
  const { admin, user } = await exigirAdminNaPagina();
  if (!admin) return <SemAcesso email={user.email} />;

  return (
    <div>
      <Link
        href="/admin/produtos"
        className="mb-5 inline-block font-sans text-base tracking-[0.16em] uppercase text-smoke transition-colors hover:text-gold"
      >
        ← Voltar
      </Link>

      <Cabecalho
        titulo="Novo óculos"
        descricao="Preencha os dados e salve. As fotos você adiciona na tela seguinte."
      />

      <FormProduto />
    </div>
  );
}

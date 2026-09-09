import Link from "next/link";
import { notFound } from "next/navigation";
import { FormProduto } from "@/componentes/admin/FormProduto";
import { GerenciadorFotos } from "@/componentes/admin/GerenciadorFotos";
import { exigirAdminNaPagina } from "@/lib/admin";
import { SemAcesso } from "@/componentes/admin/SemAcesso";
import type { Produto, ProdutoFoto } from "@/lib/types";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ salvo?: string }>;
};

export default async function PaginaEditarProduto({ params, searchParams }: Props) {
  const { id } = await params;
  const { salvo } = await searchParams;
  const { supabase, admin, user } = await exigirAdminNaPagina();
  if (!admin) return <SemAcesso email={user.email} />;

  const { data: produto } = await supabase
    .from("produtos")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!produto) notFound();

  const { data: fotos } = await supabase
    .from("produto_fotos")
    .select("id, produto_id, storage_path, alt, ordem")
    .eq("produto_id", id)
    .order("ordem", { ascending: true });

  const semFoto = (fotos ?? []).length === 0;

  return (
    <div>
      <Link
        href="/admin/produtos"
        className="font-sans text-white/50 underline underline-offset-4 hover:text-white"
      >
        ← Voltar
      </Link>

      <h1 className="mt-4 font-display text-3xl font-black uppercase">
        {(produto as Produto).nome}
      </h1>

      {salvo === "1" && (
        <p className="mt-4 rounded border border-hot/40 bg-hot/10 px-4 py-3 font-sans text-white">
          Salvo.
          {semFoto && " Agora adicione as fotos — sem foto o óculos não vende."}
        </p>
      )}

      <div className="mt-8">
        <GerenciadorFotos
          produtoId={id}
          fotos={(fotos ?? []) as ProdutoFoto[]}
        />
      </div>

      <hr className="my-10 border-white/10" />

      <h2 className="mb-5 font-display text-2xl font-black uppercase">Dados</h2>
      <FormProduto produto={produto as Produto} />
    </div>
  );
}

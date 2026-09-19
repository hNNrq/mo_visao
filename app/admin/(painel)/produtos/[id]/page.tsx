import Link from "next/link";
import { notFound } from "next/navigation";
import { ApagarProduto } from "@/componentes/admin/ApagarProduto";
import { Cabecalho } from "@/componentes/admin/Cabecalho";
import { FormProduto } from "@/componentes/admin/FormProduto";
import { GerenciadorFotos } from "@/componentes/admin/GerenciadorFotos";
import { carimboOk } from "@/componentes/admin/campos";
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
        className="mb-5 inline-block font-sans text-base tracking-[0.16em] uppercase text-smoke transition-colors hover:text-gold"
      >
        ← Voltar
      </Link>

      <Cabecalho titulo={(produto as Produto).nome} />

      {salvo === "1" && (
        <p role="status" className="-mt-2 mb-8">
          <span className={carimboOk}>
            <span className="unskew">Salvo</span>
          </span>
          {semFoto && (
            <span className="mt-3 block max-w-[46ch] font-sans text-lg leading-snug text-smoke">
              Agora adicione as fotos — sem foto o óculos não vende.
            </span>
          )}
        </p>
      )}

      <GerenciadorFotos produtoId={id} fotos={(fotos ?? []) as ProdutoFoto[]} />

      <h2 className="mt-12 mb-6 font-display text-2xl leading-none font-black tracking-tight uppercase text-paper">
        Dados
      </h2>
      <FormProduto produto={produto as Produto} />

      <div className="mt-14 border-t border-paper/10 pt-7">
        <ApagarProduto id={id} nome={(produto as Produto).nome} />
      </div>
    </div>
  );
}

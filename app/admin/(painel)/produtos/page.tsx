import Link from "next/link";
import { exigirAdmin } from "@/lib/admin";
import { ListaProdutos } from "@/componentes/admin/ListaProdutos";
import type { ProdutoComFotos } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PaginaProdutosAdmin() {
  const { supabase } = await exigirAdmin();

  // aqui, ao contrário da vitrine, os inativos também aparecem —
  // é onde ele volta pra republicar um produto que tinha escondido
  const { data, error } = await supabase
    .from("produtos")
    .select(
      `id, slug, nome, marca, modelo, descricao, preco_centavos, estoque,
       reservado, disponivel, categoria, destaque, ordem, ativo,
       created_at, updated_at,
       fotos:produto_fotos ( id, produto_id, storage_path, alt, ordem )`
    )
    .order("ordem", { ascending: true })
    .order("created_at", { ascending: false });

  const produtos = ((data ?? []) as unknown as ProdutoComFotos[]).map((p) => ({
    ...p,
    fotos: (p.fotos ?? []).sort((a, b) => a.ordem - b.ordem),
  }));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-black uppercase">Produtos</h1>
          <p className="mt-1 font-sans text-white/50">
            {produtos.length === 0
              ? "Nenhum produto ainda"
              : `${produtos.length} ${produtos.length === 1 ? "produto" : "produtos"}`}
          </p>
        </div>

        <Link
          href="/admin/produtos/novo"
          className="skew-brand bg-hot px-6 py-4 font-display text-lg font-black uppercase text-white transition-colors hover:bg-hot-dark"
        >
          <span className="unskew">+ Novo óculos</span>
        </Link>
      </div>

      {error && (
        <p className="mb-6 rounded border border-hot/40 bg-hot/10 px-4 py-3 font-sans text-white">
          Não consegui carregar os produtos. Recarregue a página.
        </p>
      )}

      {produtos.length === 0 ? (
        <div className="rounded border border-dashed border-white/20 px-6 py-14 text-center">
          <p className="font-display text-xl font-bold uppercase text-white/70">
            Sua loja está vazia
          </p>
          <p className="mx-auto mt-3 max-w-[38ch] font-sans text-white/50">
            Cadastre o primeiro óculos. Assim que ele tiver foto e preço, já
            aparece na loja pros clientes.
          </p>
          <Link
            href="/admin/produtos/novo"
            className="skew-brand mt-8 inline-block bg-hot px-8 py-4 font-display text-lg font-black uppercase text-white"
          >
            <span className="unskew">Cadastrar o primeiro</span>
          </Link>
        </div>
      ) : (
        <ListaProdutos produtos={produtos} />
      )}
    </div>
  );
}

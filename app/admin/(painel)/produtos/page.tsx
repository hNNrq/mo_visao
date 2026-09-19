import { exigirAdminNaPagina } from "@/lib/admin";
import { Cabecalho } from "@/componentes/admin/Cabecalho";
import { SemAcesso } from "@/componentes/admin/SemAcesso";
import { ListaProdutos } from "@/componentes/admin/ListaProdutos";
import { Vazio } from "@/componentes/admin/Vazio";
import { Aviso } from "@/componentes/admin/Aviso";
import type { ProdutoComFotos } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PaginaProdutosAdmin() {
  const { supabase, admin, user } = await exigirAdminNaPagina();
  if (!admin) return <SemAcesso email={user.email} />;

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

  // esgotado e escondido são o que ele precisa saber antes de rolar a lista
  const esgotados = produtos.filter((p) => p.estoque === 0).length;
  const ocultos = produtos.filter((p) => !p.ativo).length;

  const contagem = [
    `${produtos.length} ${produtos.length === 1 ? "produto" : "produtos"}`,
    esgotados > 0 ? `${esgotados} esgotado${esgotados > 1 ? "s" : ""}` : null,
    ocultos > 0 ? `${ocultos} oculto${ocultos > 1 ? "s" : ""}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div>
      <Cabecalho
        titulo="Produtos"
        contagem={produtos.length === 0 ? undefined : contagem}
        acao={{ href: "/admin/produtos/novo", texto: "+ Novo óculos" }}
      />

      {error && (
        <p role="alert" className="mb-6">
          <Aviso>Não consegui carregar os produtos. Recarregue a página.</Aviso>
        </p>
      )}

      {produtos.length === 0 ? (
        <Vazio
          titulo="Sua loja está vazia"
          texto="Cadastre o primeiro óculos. Assim que ele tiver foto e preço, já aparece na loja pros clientes."
          acao={{ href: "/admin/produtos/novo", texto: "Cadastrar o primeiro" }}
        />
      ) : (
        <ListaProdutos produtos={produtos} />
      )}
    </div>
  );
}

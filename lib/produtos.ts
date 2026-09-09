import { criarClientePublico } from "@/lib/supabase/publico";
import type { Categoria, ProdutoComFotos } from "@/lib/types";

/**
 * Leitura da vitrine.
 *
 * Enquanto o Supabase não estiver configurado, tudo devolve vazio em vez de
 * estourar — assim o site sobe e dá pra trabalhar o layout antes das credenciais.
 */

/**
 * Erro de leitura da vitrine.
 *
 * Quando o Supabase local não está no ar, o supabase-js devolve só
 * "TypeError: fetch failed" — que não diz nada e manda a gente caçar bug em
 * código que está certo. Aqui a falha de conexão vira a instrução de como
 * resolver. Erro de query continua saindo como veio.
 */
function avisarFalha(contexto: string, error: { message: string }) {
  const semConexao = /fetch failed|ECONNREFUSED|ENOTFOUND/i.test(error.message);

  if (semConexao) {
    console.error(
      `[produtos] ${contexto}: sem resposta de ${process.env.NEXT_PUBLIC_SUPABASE_URL}. ` +
        "O Supabase local está no ar? Abra o Docker Desktop e rode `npx supabase start`. " +
        "A vitrine sobe vazia até lá.",
    );
    return;
  }

  console.error(`[produtos] ${contexto}:`, error.message);
}

const SELECT_PRODUTO = `
  id, slug, nome, marca, modelo, descricao, preco_centavos,
  estoque, reservado, disponivel, categoria, destaque, ordem, ativo,
  created_at, updated_at,
  fotos:produto_fotos ( id, produto_id, storage_path, alt, ordem )
`;

export async function listarDestaques(limite = 6): Promise<ProdutoComFotos[]> {
  const supabase = criarClientePublico();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("produtos")
    .select(SELECT_PRODUTO)
    .eq("ativo", true)
    .eq("destaque", true)
    .order("ordem", { ascending: true })
    .limit(limite);

  if (error) {
    avisarFalha("destaques", error);
    return [];
  }
  return ordenarFotos(data as unknown as ProdutoComFotos[]);
}

export async function listarProdutos(filtros?: {
  categoria?: Categoria;
  somenteDisponiveis?: boolean;
}): Promise<ProdutoComFotos[]> {
  const supabase = criarClientePublico();
  if (!supabase) return [];

  let query = supabase
    .from("produtos")
    .select(SELECT_PRODUTO)
    .eq("ativo", true)
    .order("ordem", { ascending: true });

  if (filtros?.categoria) query = query.eq("categoria", filtros.categoria);
  if (filtros?.somenteDisponiveis) query = query.gt("disponivel", 0);

  const { data, error } = await query;

  if (error) {
    avisarFalha("catálogo", error);
    return [];
  }
  return ordenarFotos(data as unknown as ProdutoComFotos[]);
}

export async function buscarProduto(slug: string): Promise<ProdutoComFotos | null> {
  const supabase = criarClientePublico();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("produtos")
    .select(SELECT_PRODUTO)
    .eq("slug", slug)
    .eq("ativo", true)
    .maybeSingle();

  if (error) {
    avisarFalha("produto", error);
    return null;
  }
  if (!data) return null;

  return ordenarFotos([data as unknown as ProdutoComFotos])[0];
}

export async function lerConfig(): Promise<Record<string, unknown>> {
  const supabase = criarClientePublico();
  if (!supabase) return {};

  const { data, error } = await supabase.from("config").select("chave, valor");
  if (error || !data) return {};

  return Object.fromEntries(data.map((c) => [c.chave, c.valor]));
}

/** O Postgres não garante ordem no join; a galeria depende dela. */
function ordenarFotos(produtos: ProdutoComFotos[]): ProdutoComFotos[] {
  return produtos.map((p) => ({
    ...p,
    fotos: (p.fotos ?? []).sort((a, b) => a.ordem - b.ordem),
  }));
}

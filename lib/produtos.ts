import { criarClientePublico } from "@/lib/supabase/publico";
import type { ProdutoComFotos } from "@/lib/types";

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
    // A ordem é só a do dono. Havia aqui um desempate por categoria, que saiu
    // junto com a separação por tipo em set/2026.
    .order("ordem", { ascending: true })
    .limit(limite);

  if (error) {
    avisarFalha("destaques", error);
    return [];
  }
  return ordenarFotos(data as unknown as ProdutoComFotos[]);
}

/**
 * O filtro de `modelo` é `ilike` e não igualdade: o dono cadastra o nome
 * completo ("Juliet X-Metal", "Penny anos 2000") e quem chega pelo atalho da
 * home ou pelo Google busca só "juliet". Exigir o nome exato deixaria a
 * página vazia sem ninguém entender por quê.
 *
 * O `%` sai da entrada porque, vindo da URL, viraria curinga: "%" sozinho
 * casaria com o catálogo inteiro.
 */
function padraoModelo(modelo: string): string {
  return `%${modelo.replace(/[%_]/g, "").trim()}%`;
}

export async function listarProdutos(filtros?: {
  modelo?: string;
  somenteDisponiveis?: boolean;
}): Promise<ProdutoComFotos[]> {
  const supabase = criarClientePublico();
  if (!supabase) return [];

  let query = supabase
    .from("produtos")
    .select(SELECT_PRODUTO)
    .eq("ativo", true)
    .order("ordem", { ascending: true });

  if (filtros?.modelo) query = query.ilike("modelo", padraoModelo(filtros.modelo));
  if (filtros?.somenteDisponiveis) query = query.gt("disponivel", 0);

  const { data, error } = await query;

  if (error) {
    avisarFalha("catálogo", error);
    return [];
  }
  return ordenarFotos(data as unknown as ProdutoComFotos[]);
}

/**
 * Preços de vitrine pra hero: o mais barato disponível, e o mais barato de cada
 * modelo pedido.
 *
 * Existe porque a hero promete 'vê o preço na hora' e não pode ser a única
 * página da loja que não cumpre. Tudo aqui é dado do catálogo — modelo sem
 * produto simplesmente não ganha preço, em vez de ganhar um número inventado.
 *
 * Uma consulta só, filtrando por disponível: preço de peça esgotada é promessa
 * que a loja não pode cumprir.
 */
export async function precosDaVitrine(
  modelos: readonly string[],
): Promise<{ minimo: number | null; porModelo: Record<string, number> }> {
  const vazio = { minimo: null, porModelo: {} };
  const supabase = criarClientePublico();
  if (!supabase) return vazio;

  const { data, error } = await supabase
    .from("produtos")
    .select("preco_centavos, modelo, nome")
    .eq("ativo", true)
    .gt("disponivel", 0);

  if (error || !data) {
    if (error) avisarFalha("preços", error);
    return vazio;
  }

  const porModelo: Record<string, number> = {};
  let minimo: number | null = null;

  for (const linha of data) {
    const preco = linha.preco_centavos as number;
    if (minimo === null || preco < minimo) minimo = preco;

    // casa pelo mesmo critério do filtro do catálogo, e também pelo nome:
    // produto cadastrado como 'Juliet Ruby' sem preencher o campo modelo
    // continua sendo um Juliet pra quem está olhando a hero.
    const alvo = `${linha.modelo ?? ""} ${linha.nome ?? ""}`.toLowerCase();
    for (const m of modelos) {
      if (!alvo.includes(m.toLowerCase())) continue;
      if (porModelo[m] === undefined || preco < porModelo[m]) porModelo[m] = preco;
    }
  }

  return { minimo, porModelo };
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

/**
 * Quantas parcelas sem juros a loja banca. É o número que a vitrine promete ao
 * lado do preço, e tem que ser o mesmo configurado na conta do Mercado Pago.
 */
export async function lerParcelasSemJuros(): Promise<number> {
  const n = Number((await lerConfig()).parcelas_sem_juros);
  return Number.isFinite(n) && n >= 1 ? Math.min(12, Math.floor(n)) : 3;
}

/** O Postgres não garante ordem no join; a galeria depende dela. */
function ordenarFotos(produtos: ProdutoComFotos[]): ProdutoComFotos[] {
  return produtos.map((p) => ({
    ...p,
    fotos: (p.fotos ?? []).sort((a, b) => a.ordem - b.ordem),
  }));
}

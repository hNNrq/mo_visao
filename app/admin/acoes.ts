"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { exigirAdmin, mensagemDeErro } from "@/lib/admin";
import { criarClienteServidor } from "@/lib/supabase/server";
import { slugificar } from "@/lib/format";

/**
 * Ações do painel.
 *
 * Toda ação que escreve chama `exigirAdmin()` primeiro — Server Actions são
 * endpoints POST alcançáveis por requisição direta, então a checagem não pode
 * depender de a tela ter sido carregada.
 *
 * O retorno é sempre `{ ok, erro? }` em vez de exceção: quem chama são
 * formulários, e o dono precisa ver uma frase em português, não um stack trace.
 */

export type Resultado = { ok: boolean; erro?: string };

// ============================================================
// sessão
// ============================================================

export async function entrar(_anterior: Resultado, form: FormData): Promise<Resultado> {
  const email = String(form.get("email") ?? "").trim();
  const senha = String(form.get("senha") ?? "");

  if (!email || !senha) return { ok: false, erro: "Preencha e-mail e senha." };

  const supabase = await criarClienteServidor();
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });

  if (error) return { ok: false, erro: "E-mail ou senha não conferem." };

  redirect("/admin/produtos");
}

export async function sair() {
  const supabase = await criarClienteServidor();
  await supabase.auth.signOut();
  redirect("/admin/entrar");
}

// ============================================================
// produtos
// ============================================================

const esquemaProduto = z.object({
  nome: z.string().trim().min(2, "O nome precisa ter pelo menos 2 letras."),
  marca: z.string().trim().optional(),
  modelo: z.string().trim().optional(),
  descricao: z.string().trim().optional(),
  preco: z.string(),
  estoque: z.string(),
  categoria: z.enum(["corrida", "rua"]),
  destaque: z.boolean(),
});

/** "349,90" e "349.90" viram 34990 centavos. Dinheiro nunca vira float. */
function paraCentavos(texto: string): number | null {
  const limpo = texto
    .replace(/[^\d,.-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const n = Number(limpo);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}

export async function salvarProduto(
  _anterior: Resultado,
  form: FormData
): Promise<Resultado> {
  let idSalvo: string | null = null;

  try {
    const { supabase } = await exigirAdmin();

    const dados = esquemaProduto.safeParse({
      nome: form.get("nome"),
      marca: form.get("marca") ?? undefined,
      modelo: form.get("modelo") ?? undefined,
      descricao: form.get("descricao") ?? undefined,
      preco: String(form.get("preco") ?? ""),
      estoque: String(form.get("estoque") ?? ""),
      categoria: form.get("categoria") ?? "rua",
      destaque: form.get("destaque") === "on",
    });

    if (!dados.success) {
      return { ok: false, erro: dados.error.issues[0]?.message ?? "Confira os campos." };
    }

    const preco = paraCentavos(dados.data.preco);
    if (preco === null) return { ok: false, erro: "Informe um preço válido, como 349,90." };

    const estoque = Number(dados.data.estoque);
    if (!Number.isInteger(estoque) || estoque < 0) {
      return { ok: false, erro: "A quantidade precisa ser um número inteiro, 0 ou mais." };
    }

    const id = String(form.get("id") ?? "").trim();
    const registro = {
      nome: dados.data.nome,
      slug: slugificar(dados.data.nome),
      marca: dados.data.marca || null,
      modelo: dados.data.modelo || null,
      descricao: dados.data.descricao || null,
      preco_centavos: preco,
      estoque,
      categoria: dados.data.categoria,
      destaque: dados.data.destaque,
    };

    if (id) {
      const { error } = await supabase.from("produtos").update(registro).eq("id", id);
      if (error) throw error;
      idSalvo = id;
    } else {
      const { data, error } = await supabase
        .from("produtos")
        .insert(registro)
        .select("id")
        .single();
      if (error) throw error;
      idSalvo = data.id;
    }
  } catch (e) {
    return { ok: false, erro: mensagemDeErro(e) };
  }

  revalidarVitrine();
  redirect(`/admin/produtos/${idSalvo}?salvo=1`);
}

/** Edição direta na lista: só preço e quantidade, que é o que muda toda hora. */
export async function ajustarNaLista(
  id: string,
  campo: "preco_centavos" | "estoque",
  valor: string
): Promise<Resultado> {
  try {
    const { supabase } = await exigirAdmin();

    let numero: number | null;
    if (campo === "preco_centavos") {
      numero = paraCentavos(valor);
      if (numero === null) return { ok: false, erro: "Preço inválido." };
    } else {
      numero = Number(valor);
      if (!Number.isInteger(numero) || numero < 0) {
        return { ok: false, erro: "Quantidade inválida." };
      }
    }

    const { error } = await supabase
      .from("produtos")
      .update({ [campo]: numero })
      .eq("id", id);
    if (error) throw error;
  } catch (e) {
    return { ok: false, erro: mensagemDeErro(e) };
  }

  revalidarVitrine();
  return { ok: true };
}

export async function alternarBooleano(
  id: string,
  campo: "destaque" | "ativo",
  valor: boolean
): Promise<Resultado> {
  try {
    const { supabase } = await exigirAdmin();
    const { error } = await supabase
      .from("produtos")
      .update({ [campo]: valor })
      .eq("id", id);
    if (error) throw error;
  } catch (e) {
    return { ok: false, erro: mensagemDeErro(e) };
  }

  revalidarVitrine();
  return { ok: true };
}

export async function excluirProduto(id: string): Promise<Resultado> {
  try {
    const { supabase } = await exigirAdmin();

    // apaga os arquivos antes do registro: as linhas somem por cascade, e sem
    // isso o bucket vira depósito de imagem órfã ocupando o plano grátis
    const { data: fotos } = await supabase
      .from("produto_fotos")
      .select("storage_path")
      .eq("produto_id", id);

    if (fotos?.length) {
      await supabase.storage.from("produtos").remove(fotos.map((f) => f.storage_path));
    }

    const { error } = await supabase.from("produtos").delete().eq("id", id);
    if (error) throw error;
  } catch (e) {
    return { ok: false, erro: mensagemDeErro(e) };
  }

  revalidarVitrine();
  return { ok: true };
}

// ============================================================
// fotos
// ============================================================

/** O arquivo sobe direto do navegador pro Storage; aqui só registra o caminho. */
export async function registrarFotos(
  produtoId: string,
  caminhos: string[]
): Promise<Resultado> {
  try {
    const { supabase } = await exigirAdmin();

    const { data: existentes } = await supabase
      .from("produto_fotos")
      .select("ordem")
      .eq("produto_id", produtoId)
      .order("ordem", { ascending: false })
      .limit(1);

    const inicio = (existentes?.[0]?.ordem ?? -1) + 1;

    const { error } = await supabase.from("produto_fotos").insert(
      caminhos.map((storage_path, i) => ({
        produto_id: produtoId,
        storage_path,
        ordem: inicio + i,
      }))
    );
    if (error) throw error;
  } catch (e) {
    return { ok: false, erro: mensagemDeErro(e) };
  }

  revalidatePath(`/admin/produtos/${produtoId}`);
  revalidarVitrine();
  return { ok: true };
}

export async function excluirFoto(fotoId: string, produtoId: string): Promise<Resultado> {
  try {
    const { supabase } = await exigirAdmin();

    const { data: foto } = await supabase
      .from("produto_fotos")
      .select("storage_path")
      .eq("id", fotoId)
      .maybeSingle();

    if (foto) await supabase.storage.from("produtos").remove([foto.storage_path]);

    const { error } = await supabase.from("produto_fotos").delete().eq("id", fotoId);
    if (error) throw error;
  } catch (e) {
    return { ok: false, erro: mensagemDeErro(e) };
  }

  revalidatePath(`/admin/produtos/${produtoId}`);
  revalidarVitrine();
  return { ok: true };
}

/** A primeira foto é a que aparece no catálogo — por isso a ordem importa. */
export async function reordenarFotos(
  produtoId: string,
  idsNaOrdem: string[]
): Promise<Resultado> {
  try {
    const { supabase } = await exigirAdmin();

    for (let i = 0; i < idsNaOrdem.length; i++) {
      const { error } = await supabase
        .from("produto_fotos")
        .update({ ordem: i })
        .eq("id", idsNaOrdem[i])
        .eq("produto_id", produtoId);
      if (error) throw error;
    }
  } catch (e) {
    return { ok: false, erro: mensagemDeErro(e) };
  }

  revalidatePath(`/admin/produtos/${produtoId}`);
  revalidarVitrine();
  return { ok: true };
}

// ============================================================
// pedidos e configuração
// ============================================================

export async function mudarStatusPedido(id: string, status: string): Promise<Resultado> {
  const permitidos = ["pago", "separado", "entregue", "cancelado"];
  if (!permitidos.includes(status)) return { ok: false, erro: "Status inválido." };

  try {
    const { supabase } = await exigirAdmin();

    // cancelar devolve o estoque, então tem função própria no banco
    if (status === "cancelado") {
      const { error } = await supabase.rpc("cancelar_pedido", { p_pedido_id: id });
      if (error) throw error;
    } else {
      const { error } = await supabase.from("pedidos").update({ status }).eq("id", id);
      if (error) throw error;
    }
  } catch (e) {
    return { ok: false, erro: mensagemDeErro(e) };
  }

  revalidatePath("/admin/pedidos");
  return { ok: true };
}

export async function salvarConfig(
  _anterior: Resultado,
  form: FormData
): Promise<Resultado> {
  try {
    const { supabase } = await exigirAdmin();

    for (const [chave, bruto] of form.entries()) {
      if (typeof bruto !== "string") continue;
      const texto = bruto.trim();
      // campos numéricos viram número; o resto vira string JSON
      const numerico = /_centavos$|_pct$|_minutos$/.test(chave);
      const valor: unknown = numerico ? Number(texto || 0) : texto;

      const { error } = await supabase
        .from("config")
        .upsert({ chave, valor }, { onConflict: "chave" });
      if (error) throw error;
    }
  } catch (e) {
    return { ok: false, erro: mensagemDeErro(e) };
  }

  revalidatePath("/admin/config");
  revalidatePath("/");
  return { ok: true };
}

/** Toda mudança de produto reflete na loja — sem isso o cliente vê preço velho. */
function revalidarVitrine() {
  revalidatePath("/admin/produtos");
  revalidatePath("/produtos");
  revalidatePath("/");
}

import "server-only";
import { criarClienteServidor } from "@/lib/supabase/server";

/**
 * Porteiro do painel.
 *
 * O `proxy.ts` redireciona quem não está logado, mas isso protege só a
 * navegação: Server Actions são endpoints POST que respondem a requisição
 * direta, sem passar pela tela. Por isso TODA ação chama isto antes de
 * escrever qualquer coisa.
 *
 * A checagem final ainda é o RLS no banco — aqui é a segunda camada, não a
 * única.
 */
export async function exigirAdmin() {
  const supabase = await criarClienteServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("NAO_AUTENTICADO");

  const { data, error } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) throw new Error("SEM_PERMISSAO");

  return { supabase, user };
}

/** Traduz o erro técnico numa frase que o dono entende. */
export function mensagemDeErro(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes("NAO_AUTENTICADO")) return "Sua sessão expirou. Entre de novo.";
  if (msg.includes("SEM_PERMISSAO")) return "Você não tem acesso a essa área.";
  if (msg.includes("duplicate key") && msg.includes("slug"))
    return "Já existe um produto com esse nome. Mude o nome ou o link.";
  if (msg.includes("SEM_ESTOQUE")) return "Não há estoque suficiente.";
  return "Não deu pra salvar. Tente de novo — se continuar, me chame.";
}

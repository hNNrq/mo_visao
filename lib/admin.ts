import "server-only";
import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/server";

type Cliente = Awaited<ReturnType<typeof criarClienteServidor>>;

/**
 * Quem é a pessoa e ela é admin? Sem decidir o que fazer a respeito.
 *
 * Ter usuário no Supabase Auth e ter linha na tabela `admins` são coisas
 * separadas: dá pra logar e mesmo assim não ter acesso ao painel. Foi assim
 * que o acesso caiu em set/2026 — o usuário foi apagado e recriado, e o
 * `on delete cascade` levou a linha de `admins` junto, sem aviso.
 */
async function verificar(): Promise<{
  supabase: Cliente;
  user: Awaited<ReturnType<Cliente["auth"]["getUser"]>>["data"]["user"];
  admin: boolean;
}> {
  const supabase = await criarClienteServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { supabase, user: null, admin: false };

  const { data, error } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  return { supabase, user, admin: !error && !!data };
}

/**
 * Porteiro das Server Actions.
 *
 * Estoura de propósito: quem chama são formulários, que capturam o erro e
 * passam por `mensagemDeErro()` pra virar frase em português. Toda ação que
 * escreve chama isto antes — Server Actions são endpoints POST alcançáveis por
 * requisição direta, então a checagem não pode depender de a tela ter sido
 * carregada.
 *
 * A checagem final ainda é o RLS no banco — aqui é a segunda camada, não a
 * única.
 */
export async function exigirAdmin() {
  const { supabase, user, admin } = await verificar();

  if (!user) throw new Error("NAO_AUTENTICADO");
  if (!admin) throw new Error("SEM_PERMISSAO");

  return { supabase, user };
}

/**
 * Porteiro das PÁGINAS do painel.
 *
 * Aqui não pode estourar. Em produção o Next apaga a mensagem de erro de
 * Server Component antes de entregá-la ao `error.tsx` — sobra só o `digest`.
 * Ou seja: um `throw new Error("SEM_PERMISSAO")` numa página vira uma tela de
 * erro de servidor sem pista nenhuma, que foi exatamente o que aconteceu.
 *
 * Então sessão ausente vira redirect (que não é erro), e falta de permissão
 * volta como `admin: false` pra página renderizar <SemAcesso />.
 */
export async function exigirAdminNaPagina() {
  const { supabase, user, admin } = await verificar();

  if (!user) redirect("/admin/entrar");

  return { supabase, user, admin };
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

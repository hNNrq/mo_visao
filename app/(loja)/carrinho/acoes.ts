"use server";

import { z } from "zod";
import { criarClientePublico, urlFoto } from "@/lib/supabase/publico";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { criarPreferencia } from "@/lib/mercadopago";

/**
 * Ações do carrinho.
 *
 * São endpoints POST públicos — qualquer um chama sem passar pela tela. Por
 * isso nada que chega aqui é confiado: o carrinho traz só id e quantidade, e
 * preço, nome e estoque saem do banco.
 */

const uuid = z.string().uuid();

export type LinhaCarrinho = {
  id: string;
  slug: string;
  nome: string;
  marca: string | null;
  preco_centavos: number;
  disponivel: number;
  foto: string | null;
};

/**
 * Preço e estoque de agora, pros itens que o navegador lembra.
 *
 * `null` = não deu pra consultar (banco fora, rede). É diferente de lista sem o
 * produto: quem chama só tira do carrinho o que o banco RESPONDEU que não
 * existe mais. Sem essa diferença, um soluço do Supabase esvaziava o carrinho.
 */
export async function conferirCarrinho(ids: string[]): Promise<LinhaCarrinho[] | null> {
  const validos = ids.filter((id) => uuid.safeParse(id).success).slice(0, 20);
  const supabase = criarClientePublico();
  if (!supabase) return null;
  if (validos.length === 0) return [];

  const { data, error } = await supabase
    .from("produtos")
    .select("id, slug, nome, marca, preco_centavos, disponivel, fotos:produto_fotos ( storage_path, ordem )")
    .in("id", validos)
    .eq("ativo", true);

  if (error || !data) return null;

  return data.map((p) => {
    const fotos = ((p.fotos ?? []) as { storage_path: string; ordem: number }[]).sort(
      (a, b) => a.ordem - b.ordem,
    );
    return {
      id: p.id,
      slug: p.slug,
      nome: p.nome,
      marca: p.marca,
      preco_centavos: p.preco_centavos,
      disponivel: p.disponivel,
      foto: fotos[0] ? urlFoto(fotos[0].storage_path) : null,
    };
  });
}

const esquemaPedido = z
  .object({
    nome: z.string().trim().min(3, "Escreve teu nome completo.").max(120),
    telefone: z
      .string()
      .transform((t) => t.replace(/\D/g, ""))
      .refine((t) => t.length >= 10 && t.length <= 13, "Confere o WhatsApp, com DDD."),
    email: z.string().trim().toLowerCase().email("Confere o email."),
    entrega_tipo: z.enum(["retirada", "local"]),
    endereco: z.string().trim().max(300).optional(),
    observacao: z.string().trim().max(300).optional(),
    itens: z
      .array(z.object({ produto_id: uuid, quantidade: z.number().int().min(1).max(10) }))
      .min(1, "Teu carrinho está vazio.")
      .max(20),
  })
  .refine((d) => d.entrega_tipo !== "local" || (d.endereco?.length ?? 0) >= 8, {
    message: "Escreve o endereço da entrega, com número e bairro.",
    path: ["endereco"],
  });

export type EntradaPedido = z.input<typeof esquemaPedido>;

export type ResultadoFechar =
  | { ok: true; url: string; numero: string; token: string }
  | { ok: false; erro: string; esgotado?: string };

export async function fecharPedido(entrada: EntradaPedido): Promise<ResultadoFechar> {
  const dados = esquemaPedido.safeParse(entrada);
  if (!dados.success) {
    return { ok: false, erro: dados.error.issues[0]?.message ?? "Confere os campos." };
  }
  const d = dados.data;
  const supabase = criarClienteAdmin();

  // 1. pedido + reserva, numa transação só, dentro do banco
  const { data: criado, error } = await supabase
    .rpc("criar_pedido", {
      p_cliente: { nome: d.nome, email: d.email, telefone: d.telefone },
      p_entrega_tipo: d.entrega_tipo,
      p_entrega: {
        ...(d.entrega_tipo === "local" ? { endereco: d.endereco } : {}),
        ...(d.observacao ? { observacao: d.observacao } : {}),
      },
      p_itens: d.itens,
    })
    .single<{ id: string; numero: string; token: string; total_centavos: number; expira_em: string }>();

  if (error || !criado) {
    const msg = error?.message ?? "";
    const esgotado = msg.match(/SEM_ESTOQUE:([0-9a-f-]{36})/)?.[1];
    if (esgotado) {
      return {
        ok: false,
        esgotado,
        erro: "Um dos óculos acabou de sair ou está reservado por outra pessoa. Tira ele do carrinho pra seguir.",
      };
    }
    console.error("[checkout] criar_pedido:", msg);
    return { ok: false, erro: "Não deu pra fechar o pedido agora. Tenta de novo em instantes." };
  }

  // 2. link de pagamento no Mercado Pago
  const { data: itens } = await supabase
    .from("pedido_itens")
    .select("produto_id, nome_snapshot, preco_snapshot_centavos, quantidade")
    .eq("pedido_id", criado.id);

  const { data: pedido } = await supabase
    .from("pedidos")
    .select("frete_centavos")
    .eq("id", criado.id)
    .single();

  try {
    const preferencia = await criarPreferencia({
      pedidoId: criado.id,
      numero: criado.numero,
      token: criado.token,
      expiraEm: criado.expira_em,
      cliente: { nome: d.nome, email: d.email },
      freteCentavos: pedido?.frete_centavos ?? 0,
      itens: (itens ?? []).map((i) => ({
        id: i.produto_id ?? "item",
        titulo: i.nome_snapshot,
        precoCentavos: i.preco_snapshot_centavos,
        quantidade: i.quantidade,
      })),
    });

    if (!preferencia.id || !preferencia.init_point) throw new Error("MP_SEM_LINK");

    await supabase
      .from("pedidos")
      .update({ mp_preference_id: preferencia.id, mp_init_point: preferencia.init_point })
      .eq("id", criado.id);

    return { ok: true, url: preferencia.init_point, numero: criado.numero, token: criado.token };
  } catch (e) {
    // Sem link de pagamento, a reserva não pode ficar segurando a peça por 30
    // minutos. Vence o pedido agora e devolve o estoque.
    console.error("[checkout] Mercado Pago:", e);
    await supabase
      .from("pedidos")
      .update({ expira_em: new Date(Date.now() - 1000).toISOString() })
      .eq("id", criado.id);
    await supabase.rpc("liberar_reservas_expiradas");

    return {
      ok: false,
      erro: "O pagamento não abriu. Nada foi cobrado — tenta de novo em instantes.",
    };
  }
}

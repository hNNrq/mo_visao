"use server";

import { z } from "zod";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { criarCobranca, pagamentoConfigurado } from "@/lib/mercadopago";
import { ehUuid, lerPedidosPublicos, type PedidoPublico } from "@/lib/checkout";
import { criarClientePublico, urlFoto } from "@/lib/supabase/publico";

/**
 * Fecha o pedido: valida, cria no banco (que reserva a peça) e abre a cobrança
 * no Mercado Pago.
 *
 * Isto é um endpoint POST público — qualquer um chama, com qualquer corpo.
 * Por isso nada que vem do navegador decide valor: o carrinho manda só id e
 * quantidade, e preço, frete e desconto saem do `criar_pedido` no banco.
 */

const Entrada = z
  .object({
    nome: z.string().trim().min(2, "Coloca teu nome.").max(120),
    email: z.string().trim().email("Esse email não parece certo.").max(160),
    telefone: z
      .string()
      .transform((t) => t.replace(/\D/g, ""))
      .pipe(z.string().min(10, "Coloca o WhatsApp com DDD.").max(13, "Confere o número.")),
    entrega: z.enum(["retirada", "local"]),
    endereco: z.string().trim().max(300).optional().default(""),
    observacao: z.string().trim().max(300).optional().default(""),
    pagamento: z.enum(["pix", "cartao"]),
    itens: z
      .array(
        z.object({
          produto_id: z.string().uuid(),
          quantidade: z.number().int().min(1).max(5),
        }),
      )
      .min(1, "O carrinho está vazio.")
      .max(20),
  })
  .refine((d) => d.entrega !== "local" || d.endereco.length >= 8, {
    message: "Coloca o endereço pra entrega.",
    path: ["endereco"],
  });

export type EntradaPedido = z.input<typeof Entrada>;

export type ResultadoPedido =
  | { ok: true; pedidoId: string; url: string }
  | { ok: false; erro: string; campo?: string; esgotado?: string[] };

export async function fecharPedido(entrada: EntradaPedido): Promise<ResultadoPedido> {
  const lido = Entrada.safeParse(entrada);
  if (!lido.success) {
    const primeiro = lido.error.issues[0];
    return { ok: false, erro: primeiro.message, campo: String(primeiro.path[0] ?? "") };
  }
  const d = lido.data;

  if (!pagamentoConfigurado()) {
    return {
      ok: false,
      erro: "O pagamento pelo site ainda não foi ligado. Chama no Instagram que a gente fecha por lá.",
    };
  }

  const supabase = criarClienteAdmin();

  const { data, error } = await supabase.rpc("criar_pedido", {
    p_cliente: { nome: d.nome, email: d.email, telefone: d.telefone },
    p_entrega_tipo: d.entrega,
    p_entrega: {
      endereco: d.entrega === "local" ? d.endereco : "",
      observacao: d.observacao,
    },
    p_itens: d.itens,
    p_pagamento: d.pagamento,
  });

  if (error) {
    const msg = error.message ?? "";
    const esgotado = msg.match(/SEM_ESTOQUE:([0-9a-f-]{36})/i)?.[1];
    if (esgotado) {
      return {
        ok: false,
        erro: "Uma das peças acabou de sair. Tira ela do carrinho e fecha de novo.",
        esgotado: [esgotado],
      };
    }
    if (msg.includes("PRODUTO_INDISPONIVEL")) {
      return { ok: false, erro: "Um dos óculos saiu da loja. Confere o carrinho." };
    }
    console.error("[checkout] criar_pedido:", msg);
    return { ok: false, erro: "Não deu pra fechar o pedido agora. Tenta de novo em instantes." };
  }

  const pedido = (data as { id: string; numero: string; total_centavos: number; expira_em: string }[])[0];

  try {
    const { preferenciaId, url } = await criarCobranca({
      id: pedido.id,
      numero: pedido.numero,
      total_centavos: pedido.total_centavos,
      expira_em: pedido.expira_em,
      pagamento: d.pagamento,
      email: d.email,
      nome: d.nome,
    });

    await supabase
      .from("pedidos")
      .update({ mp_preference_id: preferenciaId, mp_checkout_url: url })
      .eq("id", pedido.id);

    return { ok: true, pedidoId: pedido.id, url };
  } catch (e) {
    // sem cobrança, a reserva não pode ficar prendendo a peça até vencer
    console.error("[checkout] Mercado Pago:", e);
    await supabase
      .from("pedidos")
      .update({ expira_em: new Date().toISOString() })
      .eq("id", pedido.id);
    await supabase.rpc("liberar_reservas_expiradas");
    return {
      ok: false,
      erro: "O Mercado Pago não respondeu. Tenta de novo em instantes — nada foi cobrado.",
    };
  }
}

/**
 * Preço, nome e estoque de AGORA das peças do carrinho. O carrinho guardado no
 * navegador pode ter dias; sem isto a pessoa só descobriria o preço novo na
 * tela do Mercado Pago.
 */
export async function conferirCarrinho(ids: string[]) {
  if (!Array.isArray(ids)) return [];
  const validos = ids.filter((x) => typeof x === "string" && ehUuid(x)).slice(0, 20);
  if (validos.length === 0) return [];

  const supabase = criarClientePublico();
  if (!supabase) return [];
  const { data } = await supabase
    .from("produtos")
    .select("id, slug, nome, preco_centavos, disponivel, fotos:produto_fotos ( storage_path, ordem )")
    .in("id", validos)
    .eq("ativo", true);

  return (data ?? []).map((p) => {
    const fotos = ((p.fotos ?? []) as { storage_path: string; ordem: number }[]).sort(
      (a, b) => a.ordem - b.ordem,
    );
    return {
      produto_id: p.id as string,
      slug: p.slug as string,
      nome: p.nome as string,
      preco_centavos: p.preco_centavos as number,
      disponivel: p.disponivel as number,
      foto: fotos[0] ? urlFoto(fotos[0].storage_path) : null,
    };
  });
}

/** Resumo dos pedidos feitos neste aparelho, pra "Meus pedidos". */
export async function buscarMeusPedidos(ids: string[]): Promise<PedidoPublico[]> {
  if (!Array.isArray(ids)) return [];
  return lerPedidosPublicos(ids.filter((x) => typeof x === "string"));
}

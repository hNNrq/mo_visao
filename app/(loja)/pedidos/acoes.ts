"use server";

import { redirect } from "next/navigation";
import { criarClienteAdmin } from "@/lib/supabase/admin";

/**
 * Número + email → link do pedido.
 *
 * O número é sequencial e se adivinha; o email é o segundo fator. A resposta é
 * a mesma pra "número não existe" e "email não confere", pra busca não virar
 * jeito de descobrir quais números existem.
 */
export async function buscarPedido(
  _anterior: { erro: string | null },
  form: FormData,
): Promise<{ erro: string | null }> {
  const bruto = String(form.get("numero") ?? "").trim().toUpperCase().replace(/\s+/g, "");
  const email = String(form.get("email") ?? "").trim().toLowerCase();

  // aceita "12", "00012", "MV00012" e "MV-00012"
  const digitos = bruto.replace(/^MV-?/, "");
  if (!/^\d{1,8}$/.test(digitos) || !email.includes("@")) {
    return { erro: "Confere o número (tipo MV-00012) e o email." };
  }
  const numero = `MV-${digitos.padStart(5, "0")}`;

  const { data } = await criarClienteAdmin()
    .from("pedidos")
    .select("numero, token")
    .eq("numero", numero)
    .eq("cliente_email", email)
    .maybeSingle();

  if (!data) return { erro: "Não achamos pedido com esse número e esse email." };

  redirect(`/pedido/${data.numero}?k=${data.token}`);
}

import { createClient } from "@supabase/supabase-js";

/**
 * Cliente com service_role: IGNORA o RLS.
 *
 * Usar apenas em rotas de API e server actions que precisam escrever
 * pedido, reservar estoque ou processar webhook. Nunca importar em
 * componente de cliente — o "server-only" abaixo quebra o build se alguém tentar.
 */
import "server-only";

export function criarClienteAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Faltam NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente."
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

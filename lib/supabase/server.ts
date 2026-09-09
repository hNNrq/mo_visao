import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente de servidor com a sessão do usuário logado.
 * Usar nas páginas e actions do painel — respeita RLS, então só devolve
 * o que aquele usuário pode ver.
 */
export async function criarClienteServidor() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component não pode escrever cookie. O middleware
            // renova a sessão, então isso pode ser ignorado com segurança.
          }
        },
      },
    }
  );
}

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Roda antes de cada request (no Next 16 isso se chama proxy; era "middleware").
 *
 * Faz duas coisas:
 *  1. renova a sessão do Supabase — sem isso o dono é deslogado do painel
 *  2. barra /admin pra quem não está logado
 *
 * A checagem de "é admin mesmo?" mora no banco, via RLS. Aqui é só o portão
 * de entrada — nunca a única defesa.
 *
 * Sem as variáveis do Supabase configuradas, a loja pública continua no ar e
 * só o painel fecha. Falhar aberto na vitrine e fechado no admin é de propósito:
 * uma env faltando não pode derrubar a venda.
 */
export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const rotaAdmin = request.nextUrl.pathname.startsWith("/admin");

  if (!url || !anon) {
    if (rotaAdmin) {
      return new NextResponse(
        "Painel indisponível: faltam as credenciais do Supabase no ambiente.",
        { status: 503, headers: { "content-type": "text/plain; charset=utf-8" } }
      );
    }
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const rotaLogin = request.nextUrl.pathname === "/admin/entrar";

  if (rotaAdmin && !rotaLogin && !user) {
    const destino = request.nextUrl.clone();
    destino.pathname = "/admin/entrar";
    return NextResponse.redirect(destino);
  }

  if (rotaLogin && user) {
    const destino = request.nextUrl.clone();
    destino.pathname = "/admin/produtos";
    return NextResponse.redirect(destino);
  }

  return response;
}

export const config = {
  matcher: [
    // tudo, menos assets estáticos e imagens
    "/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp|avif)$).*)",
  ],
};

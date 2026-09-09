"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente do navegador. Usa a chave anon, que é pública por natureza —
 * toda proteção real vem do RLS no banco (ver supabase/migrations/003_rls.sql).
 */
export function criarClienteBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

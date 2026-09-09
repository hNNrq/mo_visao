import { createClient } from "@supabase/supabase-js";

/**
 * Cliente sem sessão, pra ler a vitrine.
 * Usa a chave anon — o RLS garante que só produto com ativo=true sai daqui
 * (ver supabase/migrations/003_rls.sql).
 */
export function criarClientePublico() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) return null;

  return createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Monta a URL pública de uma foto no bucket `produtos`. */
export function urlFoto(storagePath: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return `${base}/storage/v1/object/public/produtos/${storagePath}`;
}

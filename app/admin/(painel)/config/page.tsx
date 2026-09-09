import { exigirAdmin } from "@/lib/admin";
import { FormConfig } from "@/componentes/admin/FormConfig";

export const dynamic = "force-dynamic";

export default async function PaginaConfig() {
  const { supabase } = await exigirAdmin();

  const { data } = await supabase.from("config").select("chave, valor");
  const config = Object.fromEntries((data ?? []).map((c) => [c.chave, c.valor]));

  return (
    <div>
      <h1 className="font-display text-3xl font-black uppercase">Ajustes</h1>
      <p className="mt-1 mb-7 font-sans text-white/50">
        O que aparece na loja e como funciona a entrega.
      </p>

      <FormConfig config={config as Record<string, unknown>} />
    </div>
  );
}

import { exigirAdminNaPagina } from "@/lib/admin";
import { Cabecalho } from "@/componentes/admin/Cabecalho";
import { SemAcesso } from "@/componentes/admin/SemAcesso";
import { FormConfig } from "@/componentes/admin/FormConfig";
import { FormSenha } from "@/componentes/admin/FormSenha";

export const dynamic = "force-dynamic";

export default async function PaginaConfig() {
  const { supabase, admin, user } = await exigirAdminNaPagina();
  if (!admin) return <SemAcesso email={user.email} />;

  const { data } = await supabase.from("config").select("chave, valor");
  const config = Object.fromEntries((data ?? []).map((c) => [c.chave, c.valor]));

  return (
    <div>
      <Cabecalho
        titulo="Ajustes"
        descricao="O que aparece na loja e como funciona a entrega."
      />
      <FormConfig config={config as Record<string, unknown>} />

      <section className="mt-14 border-t regua pt-10">
        <Cabecalho titulo="Sua senha" descricao="A que você usa pra entrar neste painel." />
        <FormSenha />
      </section>
    </div>
  );
}

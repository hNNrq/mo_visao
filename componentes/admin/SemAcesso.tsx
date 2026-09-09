import { sair } from "@/app/admin/acoes";

/**
 * A pessoa está logada, mas não é admin.
 *
 * Não é erro nem tela em branco: é um estado previsto do sistema, com o nome
 * de quem está logado (quase sempre a resposta é "logou com a conta errada")
 * e o caminho de saída. O texto diz o que destrava, porque quem cai aqui
 * normalmente não tem como adivinhar que existe uma tabela `admins`.
 */
export function SemAcesso({ email }: { email?: string }) {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="font-display text-2xl font-black uppercase">
        Você não tem acesso a essa área
      </h1>

      <p className="mt-4 font-sans text-white/60">
        {email ? (
          <>
            Você entrou como <span className="text-white">{email}</span>, mas
            essa conta não tem permissão de administrador da loja.
          </>
        ) : (
          <>Essa conta não tem permissão de administrador da loja.</>
        )}
      </p>

      <p className="mt-3 font-sans text-white/40">
        Entrar no site e ter acesso ao painel são coisas separadas. Se a conta
        certa é essa, quem administra o Supabase precisa liberá-la.
      </p>

      <form action={sair}>
        <button
          type="submit"
          className="skew-brand mt-8 bg-hot px-8 py-4 font-display text-lg font-black uppercase text-white transition-colors hover:bg-hot-dark"
        >
          <span className="unskew">Entrar com outra conta</span>
        </button>
      </form>
    </div>
  );
}

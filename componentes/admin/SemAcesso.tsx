import { sair } from "@/app/admin/acoes";
import { botao } from "@/componentes/admin/campos";

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
    <div className="max-w-[46ch] py-12">
      <h1 className="font-display text-3xl leading-none font-black tracking-tight uppercase text-paper">
        Você não tem acesso a essa área
      </h1>

      <p className="mt-5 font-sans text-lg leading-snug text-paper/80">
        {email ? (
          <>
            Você entrou como <span className="text-paper">{email}</span>, mas essa
            conta não tem permissão de administrador da loja.
          </>
        ) : (
          <>Essa conta não tem permissão de administrador da loja.</>
        )}
      </p>

      <p className="mt-3 font-sans text-lg leading-snug text-smoke">
        Entrar no site e ter acesso ao painel são coisas separadas. Se a conta
        certa é essa, quem administra o Supabase precisa liberá-la.
      </p>

      <form action={sair}>
        <button type="submit" className={`${botao} mt-8`}>
          <span className="unskew">Entrar com outra conta</span>
        </button>
      </form>
    </div>
  );
}

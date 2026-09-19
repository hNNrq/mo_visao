"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { excluirProduto } from "@/app/admin/acoes";
import { Aviso } from "@/componentes/admin/Aviso";

/**
 * Apagar mora aqui, na tela do produto, e não na lista.
 *
 * Na lista ele está com pressa, rolando com o polegar entre um corte e outro —
 * é onde um toque errado custa um produto. Aqui ele já abriu a peça de
 * propósito. Sem modal: a confirmação acontece no lugar do botão, que é onde a
 * mão já está.
 */
export function ApagarProduto({ id, nome }: { id: string; nome: string }) {
  const [confirmando, setConfirmando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();
  const router = useRouter();

  if (!confirmando) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setConfirmando(true)}
          className="font-sans text-base tracking-[0.16em] uppercase text-smoke transition-colors hover:text-gold"
        >
          Apagar esse óculos
        </button>
        {erro && (
          <p role="alert" className="mt-3">
            <Aviso>{erro}</Aviso>
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      <p className="max-w-[42ch] font-sans text-lg leading-snug text-paper">
        Apagar <span className="text-gold">{nome}</span> de vez? As fotos vão
        junto, e não dá pra desfazer.
      </p>

      <div className="mt-4 flex flex-wrap gap-2.5">
        <button
          type="button"
          disabled={pendente}
          onClick={() => {
            setErro(null);
            iniciar(async () => {
              const r = await excluirProduto(id);
              if (!r.ok) {
                setErro(r.erro ?? "Não deu certo.");
                setConfirmando(false);
                return;
              }
              // sem isso a tela tentaria se redesenhar com um produto que
              // acabou de deixar de existir, e ele cairia num 404
              router.replace("/admin/produtos");
            });
          }}
          // NÃO é carimbo de ouro. O ouro aqui é do preço, da ação que fecha a
          // tela e do pedido que pede providência — apagar não é nenhum dos
          // três, e usar o mesmo bloco de "Salvar alterações" pra destruir um
          // produto é o jeito de ele perder a peça errada com o polegar.
          className="skew-brand bg-paper/10 px-6 py-3.5 font-display text-base font-black tracking-tight uppercase text-paper transition-colors hover:bg-paper/20 disabled:opacity-60"
        >
          <span className="unskew">{pendente ? "Apagando..." : "Apagar de vez"}</span>
        </button>

        <button
          type="button"
          onClick={() => setConfirmando(false)}
          className="px-2 py-3.5 font-sans text-base tracking-[0.16em] uppercase text-smoke transition-colors hover:text-gold"
        >
          Deixa pra lá
        </button>
      </div>

      {erro && (
        <p role="alert" className="mt-3">
          <Aviso>{erro}</Aviso>
        </p>
      )}
    </div>
  );
}

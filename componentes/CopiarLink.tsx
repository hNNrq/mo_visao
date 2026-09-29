"use client";

import { useState } from "react";

/**
 * Copia o endereço da página do pedido.
 *
 * Sem cadastro, esse endereço é o único jeito de voltar ao pedido de outro
 * aparelho — e "guarda este link" escrito solto não diz que o link é a barra
 * do navegador. O botão faz o gesto pela pessoa.
 *
 * Navegador sem permissão de área de transferência (http, iframe, alguns
 * Android antigos) cai no compartilhar nativo, e se nem isso existir o botão
 * mostra o endereço pra copiar à mão.
 */
export function CopiarLink() {
  const [estado, setEstado] = useState<"parado" | "copiado" | "manual">("parado");

  async function copiar() {
    const url = window.location.href.split("?")[0];
    try {
      await navigator.clipboard.writeText(url);
      setEstado("copiado");
      setTimeout(() => setEstado("parado"), 2500);
      return;
    } catch {
      // segue pro plano B
    }
    try {
      if (navigator.share) {
        await navigator.share({ title: "Meu pedido na Mó Visão", url });
        return;
      }
    } catch {
      return; // a pessoa fechou o compartilhar
    }
    setEstado("manual");
  }

  return (
    <span className="inline-flex flex-col gap-2">
      <button
        type="button"
        onClick={copiar}
        className="inline-flex min-h-11 items-center border regua px-4 font-sans text-sm tracking-[0.16em] uppercase text-paper transition-colors hover:border-gold hover:text-gold"
      >
        {estado === "copiado" ? "Link copiado" : "Copiar link do pedido"}
      </button>
      {estado === "manual" && (
        <span className="font-mono text-sm break-all text-paper select-all">
          {window.location.href.split("?")[0]}
        </span>
      )}
      <span className="sr-only" aria-live="polite">
        {estado === "copiado" ? "Link do pedido copiado" : ""}
      </span>
    </span>
  );
}

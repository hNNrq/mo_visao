"use client";

import { useActionState } from "react";
import { salvarConfig, type Resultado } from "@/app/admin/acoes";

const inicial: Resultado = { ok: false };

const rotulo =
  "font-display text-sm font-bold tracking-wider uppercase text-white/60";
const campo =
  "rounded border border-white/15 bg-ink px-4 py-4 font-sans text-lg text-white outline-none focus:border-hot";
const dica = "font-sans text-sm text-white/40";

/**
 * Cada campo tem uma frase explicando o efeito na loja. O dono não sabe (nem
 * precisa saber) o que é "config key" — ele precisa saber o que muda na tela
 * do cliente.
 */
export function FormConfig({ config }: { config: Record<string, unknown> }) {
  const [estado, acao, enviando] = useActionState(salvarConfig, inicial);
  const v = (chave: string) => String(config[chave] ?? "");

  return (
    <form action={acao} className="flex flex-col gap-6">
      <label className="flex flex-col gap-2">
        <span className={rotulo}>WhatsApp</span>
        <input
          name="whatsapp"
          inputMode="numeric"
          defaultValue={v("whatsapp")}
          placeholder="5511999999999"
          className={campo}
        />
        <span className={dica}>
          Com código do país e DDD, só números. É o número que o cliente usa pra
          tirar dúvida antes de comprar.
        </span>
      </label>

      <label className="flex flex-col gap-2">
        <span className={rotulo}>Instagram</span>
        <input
          name="instagram"
          defaultValue={v("instagram")}
          placeholder="mo_visao2k26"
          className={campo}
        />
        <span className={dica}>Sem o @.</span>
      </label>

      <label className="flex flex-col gap-2">
        <span className={rotulo}>Aviso no topo da loja</span>
        <input
          name="banner_topo"
          defaultValue={v("banner_topo")}
          placeholder="Frete grátis na região"
          className={campo}
        />
        <span className={dica}>
          Aparece pra todo mundo que entra. Deixe vazio pra não mostrar nada.
        </span>
      </label>

      <label className="flex flex-col gap-2">
        <span className={rotulo}>Desconto no Pix (%)</span>
        <input
          name="desconto_pix_pct"
          inputMode="numeric"
          defaultValue={v("desconto_pix_pct")}
          placeholder="5"
          className={campo}
        />
        <span className={dica}>
          No Pix a taxa é bem menor que no cartão, então o desconto sai quase de
          graça pra você — e o dinheiro cai na hora. Deixe 0 pra não dar desconto.
        </span>
      </label>

      <label className="flex flex-col gap-2">
        <span className={rotulo}>Texto sobre a entrega</span>
        <textarea
          name="entrega_texto"
          rows={3}
          defaultValue={v("entrega_texto")}
          placeholder="Retirada combinada ou entrega na região."
          className={campo}
        />
        <span className={dica}>
          Explique como o cliente recebe. Aparece na hora de fechar a compra.
        </span>
      </label>

      {estado.ok && !estado.erro && (
        <p className="rounded border border-hot/40 bg-hot/10 px-4 py-3 font-sans text-white">
          Ajustes salvos.
        </p>
      )}

      {estado.erro && (
        <p
          role="alert"
          className="rounded border border-hot/40 bg-hot/10 px-4 py-3 font-sans text-white"
        >
          {estado.erro}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="skew-brand bg-hot px-8 py-5 font-display text-xl font-black uppercase text-white transition-colors hover:bg-hot-dark disabled:opacity-60"
      >
        <span className="unskew">{enviando ? "Salvando..." : "Salvar ajustes"}</span>
      </button>
    </form>
  );
}

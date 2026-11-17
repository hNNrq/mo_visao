"use client";

import { useActionState } from "react";
import { salvarConfig, type Resultado } from "@/app/admin/acoes";
import { Aviso } from "@/componentes/admin/Aviso";
import {
  botao,
  campo,
  carimboOk,
  dica,
  rotulo,
} from "@/componentes/admin/campos";

const inicial: Resultado = { ok: false };

/**
 * Cada campo tem uma frase explicando o efeito na loja. O dono não sabe (nem
 * precisa saber) o que é "config key" — ele precisa saber o que muda na tela
 * do cliente.
 */
export function FormConfig({ config }: { config: Record<string, unknown> }) {
  const [estado, acao, enviando] = useActionState(salvarConfig, inicial);
  const v = (chave: string) => String(config[chave] ?? "");
  // centavos no banco, reais na tela
  const reais = (chave: string) => {
    const n = Number(config[chave] ?? 0);
    return n > 0 ? (n / 100).toFixed(2).replace(".", ",") : "0";
  };

  return (
    <form action={acao} className="flex max-w-[560px] flex-col gap-7">
      <label className="flex flex-col gap-2">
        <span className={rotulo}>WhatsApp</span>
        <input
          name="whatsapp"
          inputMode="numeric"
          defaultValue={v("whatsapp")}
          placeholder="5511999999999"
          className={`${campo} numeros`}
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
          placeholder="Enviamos pro Brasil todo"
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
          className={`${campo} numeros`}
        />
        <span className={dica}>
          No Pix a taxa é bem menor que no cartão, então o desconto sai quase de
          graça pra você — e o dinheiro cai na hora. Deixe 0 pra não dar desconto.
        </span>
      </label>

      <label className="flex flex-col gap-2">
        <span className={rotulo}>Parcelas sem juros</span>
        <input
          name="parcelas_sem_juros"
          inputMode="numeric"
          defaultValue={v("parcelas_sem_juros")}
          placeholder="3"
          className={`${campo} numeros`}
        />
        <span className={dica}>
          É o que a loja promete ao lado do preço (&quot;3x sem juros&quot;). Tem que
          ser o MESMO número que está configurado no Mercado Pago — se lá estiver
          diferente, o cliente vê juros que o site disse que não tinha.
        </span>
      </label>


      <label className="flex flex-col gap-2">
        <span className={rotulo}>Frete grátis acima de (R$)</span>
        <input
          name="frete_gratis_acima_reais"
          inputMode="decimal"
          defaultValue={reais("frete_gratis_acima_centavos")}
          placeholder="0"
          className={`${campo} numeros`}
        />
        <span className={dica}>
          Pedido desse valor pra cima não paga o frete. Só vale se a opção
          abaixo estiver ligada. Deixe 0 pra não usar.
        </span>
      </label>

      <label className="flex flex-col gap-2">
        <span className={rotulo}>Frete grátis nos Correios</span>
        <select
          name="frete_gratis_correios"
          defaultValue={String(config.frete_gratis_correios) === "true" ? "true" : "false"}
          className={campo}
        >
          <option value="false">Não — o cliente sempre paga o frete</option>
          <option value="true">Sim — acima do valor de cima, a loja paga</option>
        </select>
        <span className={dica}>
          Ligado, quem passa do valor não paga frete — mas a etiqueta no Melhor
          Envio continua sendo cobrada de você. Fica no seu bolso.
        </span>
      </label>

      <label className="flex flex-col gap-2">
        <span className={rotulo}>Texto sobre a entrega</span>
        <textarea
          name="entrega_texto"
          rows={3}
          defaultValue={v("entrega_texto")}
          placeholder="Enviamos pelos Correios pro Brasil todo, ou dá pra combinar a retirada."
          className={campo}
        />
        <span className={dica}>
          Explique como o cliente recebe. Aparece na hora de fechar a compra.
        </span>
      </label>

      {estado.ok && !estado.erro && (
        <p role="status">
          <span className={carimboOk}>
            <span className="unskew">Ajustes salvos</span>
          </span>
        </p>
      )}

      {estado.erro && (
        <p role="alert">
          <Aviso>{estado.erro}</Aviso>
        </p>
      )}

      <button type="submit" disabled={enviando} className={`${botao} self-start`}>
        <span className="unskew">{enviando ? "Salvando..." : "Salvar ajustes"}</span>
      </button>
    </form>
  );
}

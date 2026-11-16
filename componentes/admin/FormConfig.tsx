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
  // o banco guarda centavos; o dono lê e digita em reais
  const reais = (chave: string) =>
    (Number(config[chave] ?? 0) / 100).toFixed(2).replace(".", ",");

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
        <span className={rotulo}>Email que recebe os pedidos</span>
        <input
          name="email_contato"
          type="email"
          inputMode="email"
          defaultValue={v("email_contato")}
          placeholder="voce@email.com"
          className={campo}
        />
        <span className={dica}>
          Cada venda paga manda um aviso pra esse email, com o contato do cliente.
        </span>
      </label>

      <label className="flex flex-col gap-2">
        <span className={rotulo}>CEP de onde sai o envio</span>
        <input
          name="cep_origem"
          inputMode="numeric"
          defaultValue={v("cep_origem")}
          placeholder="00000-000"
          maxLength={9}
          className={`${campo} numeros`}
        />
        <span className={dica}>
          O frete dos Correios é calculado daqui até o CEP do cliente. Sem ele, a
          loja não consegue cotar o envio.
        </span>
      </label>

      <label className="flex flex-col gap-2">
        <span className={rotulo}>Entrega grátis a partir de (R$)</span>
        <input
          name="frete_gratis_acima_centavos"
          inputMode="decimal"
          defaultValue={reais("frete_gratis_acima_centavos")}
          placeholder="0,00"
          className={`${campo} numeros`}
        />
        <span className={dica}>
          Compra desse valor pra cima não paga frete — e o frete dos Correios
          sai do teu bolso. Deixe 0 pra não usar.
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

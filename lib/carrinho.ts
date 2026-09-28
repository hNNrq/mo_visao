"use client";

import { useSyncExternalStore } from "react";
import type { ItemCarrinho } from "@/lib/types";

/**
 * O carrinho mora no localStorage do visitante — a loja não tem cadastro, e
 * pedir conta pra comprar um óculos é atrito que não devolve nada.
 *
 * ⚠️ **O preço guardado aqui é só pra MOSTRAR.** Quem decide quanto a pessoa
 * paga é o `criar_pedido` no banco, que relê o preço de cada produto. Um
 * carrinho editado à mão no navegador não muda o valor cobrado.
 *
 * Leitura e escrita vão dentro de try/catch: navegador em modo privado ou com
 * dado de site bloqueado estoura no acesso ao localStorage, e isso não pode
 * derrubar a página do produto.
 */

const CHAVE = "mo-visao:carrinho";
const CHAVE_PEDIDOS = "mo-visao:pedidos";
const EVENTO = "mo-visao:carrinho";

/** Limite por peça — o mesmo que o banco aceita num pedido. */
export const MAX_POR_ITEM = 5;

const VAZIO: ItemCarrinho[] = [];
let cache: { bruto: string | null; itens: ItemCarrinho[] } = { bruto: null, itens: VAZIO };

function ler(): ItemCarrinho[] {
  let bruto: string | null = null;
  try {
    bruto = localStorage.getItem(CHAVE);
  } catch {
    return VAZIO;
  }
  // useSyncExternalStore exige a MESMA referência enquanto nada mudou
  if (bruto === cache.bruto) return cache.itens;
  let itens: ItemCarrinho[] = VAZIO;
  try {
    const lido = JSON.parse(bruto ?? "[]");
    if (Array.isArray(lido)) itens = lido.filter((i) => i && typeof i.produto_id === "string");
  } catch {
    itens = VAZIO;
  }
  cache = { bruto, itens };
  return itens;
}

function gravar(itens: ItemCarrinho[]) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(itens));
  } catch {
    // sem armazenamento, o carrinho vive só até recarregar
  }
  window.dispatchEvent(new Event(EVENTO));
}

function assinar(avisar: () => void) {
  const aoMudar = (e: Event) => {
    if (e instanceof StorageEvent && e.key !== CHAVE) return;
    avisar();
  };
  window.addEventListener(EVENTO, aoMudar);
  window.addEventListener("storage", aoMudar); // outra aba
  return () => {
    window.removeEventListener(EVENTO, aoMudar);
    window.removeEventListener("storage", aoMudar);
  };
}

export function useCarrinho(): ItemCarrinho[] {
  return useSyncExternalStore(assinar, ler, () => VAZIO);
}

export function adicionar(item: Omit<ItemCarrinho, "quantidade">, limite = MAX_POR_ITEM) {
  const itens = ler();
  const existente = itens.find((i) => i.produto_id === item.produto_id);
  const teto = Math.min(limite, MAX_POR_ITEM);
  if (existente) {
    gravar(
      itens.map((i) =>
        i.produto_id === item.produto_id
          ? { ...i, ...item, quantidade: Math.min(i.quantidade + 1, teto) }
          : i,
      ),
    );
  } else {
    gravar([...itens, { ...item, quantidade: 1 }]);
  }
}

export function mudarQuantidade(produtoId: string, quantidade: number) {
  if (quantidade < 1) return remover(produtoId);
  gravar(
    ler().map((i) =>
      i.produto_id === produtoId ? { ...i, quantidade: Math.min(quantidade, MAX_POR_ITEM) } : i,
    ),
  );
}

export function remover(produtoId: string) {
  gravar(ler().filter((i) => i.produto_id !== produtoId));
}

export function esvaziar() {
  gravar([]);
}

/** O carrinho como está agora, fora de componente. */
export function lerItens(): ItemCarrinho[] {
  return ler();
}

/** Troca a lista inteira — usado quando o servidor corrige preço ou estoque. */
export function substituir(itens: ItemCarrinho[]) {
  gravar(itens);
}

/**
 * Os pedidos feitos NESTE aparelho. Sem conta, é assim que "Meus pedidos"
 * sabe o que mostrar: guarda só o id (o link secreto do pedido), nada pessoal.
 */
export function lembrarPedido(id: string) {
  try {
    const atuais: string[] = JSON.parse(localStorage.getItem(CHAVE_PEDIDOS) ?? "[]");
    const novos = [id, ...atuais.filter((x) => x !== id)].slice(0, 30);
    localStorage.setItem(CHAVE_PEDIDOS, JSON.stringify(novos));
  } catch {
    // sem armazenamento, o link do pedido continua valendo
  }
}

export function pedidosLembrados(): string[] {
  try {
    const lido = JSON.parse(localStorage.getItem(CHAVE_PEDIDOS) ?? "[]");
    return Array.isArray(lido) ? lido.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

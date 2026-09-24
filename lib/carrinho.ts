"use client";

import { useSyncExternalStore } from "react";
import type { ItemCarrinho } from "@/lib/types";

/**
 * Carrinho no localStorage do visitante.
 *
 * Sem conta e sem banco: quem compra não loga, e carrinho abandonado não vale
 * uma linha no Postgres. Guarda só produto e quantidade — preço e estoque são
 * relidos do servidor sempre que importam (ver `lib/types.ts`).
 *
 * Tudo em try/catch: aba anônima, Safari com armazenamento bloqueado e
 * navegador de app (o do Instagram, de onde vem quase todo mundo) podem negar
 * o localStorage. Aí o carrinho vive só na memória da aba, e a compra continua.
 */

const CHAVE = "mv:carrinho";
const CHAVE_PEDIDOS = "mv:pedidos";
const EVENTO = "mv:carrinho";

let memoria: ItemCarrinho[] = [];
let cache: { bruto: string | null; itens: ItemCarrinho[] } = { bruto: null, itens: [] };

function ler(): ItemCarrinho[] {
  let bruto: string | null;
  try {
    bruto = localStorage.getItem(CHAVE);
  } catch {
    return memoria;
  }
  // useSyncExternalStore exige a MESMA referência enquanto nada mudou
  if (bruto === cache.bruto) return cache.itens;
  let itens: ItemCarrinho[] = [];
  try {
    const v = JSON.parse(bruto ?? "[]");
    if (Array.isArray(v)) {
      itens = v.filter(
        (i) => typeof i?.produto_id === "string" && Number.isInteger(i?.quantidade) && i.quantidade > 0,
      );
    }
  } catch {
    // JSON corrompido: começa do zero
  }
  cache = { bruto, itens };
  return itens;
}

function gravar(itens: ItemCarrinho[]) {
  memoria = itens;
  try {
    localStorage.setItem(CHAVE, JSON.stringify(itens));
  } catch {
    // fica só na memória
  }
  window.dispatchEvent(new Event(EVENTO));
}

function assinar(avisar: () => void) {
  // "storage" pega a mudança feita em outra aba; o evento próprio, a desta
  window.addEventListener("storage", avisar);
  window.addEventListener(EVENTO, avisar);
  return () => {
    window.removeEventListener("storage", avisar);
    window.removeEventListener(EVENTO, avisar);
  };
}

const VAZIO: ItemCarrinho[] = [];

export function useCarrinho(): ItemCarrinho[] {
  return useSyncExternalStore(assinar, ler, () => VAZIO);
}

export function adicionar(produtoId: string, quantidade = 1) {
  const itens = ler();
  const existe = itens.find((i) => i.produto_id === produtoId);
  gravar(
    existe
      ? itens.map((i) => (i.produto_id === produtoId ? { ...i, quantidade: i.quantidade + quantidade } : i))
      : [...itens, { produto_id: produtoId, quantidade }],
  );
}

export function definirQuantidade(produtoId: string, quantidade: number) {
  gravar(
    quantidade < 1
      ? ler().filter((i) => i.produto_id !== produtoId)
      : ler().map((i) => (i.produto_id === produtoId ? { ...i, quantidade } : i)),
  );
}

export function esvaziar() {
  gravar([]);
}

/**
 * Os pedidos feitos neste aparelho, pra /pedidos listar sem pedir login.
 * Sem conta, é o que substitui o "meus pedidos".
 */
export type PedidoLembrado = { numero: string; token: string; criado: string };

export function lembrarPedido(p: Omit<PedidoLembrado, "criado">) {
  try {
    const atuais = pedidosLembrados().filter((x) => x.numero !== p.numero);
    const novos = [{ ...p, criado: new Date().toISOString() }, ...atuais].slice(0, 20);
    localStorage.setItem(CHAVE_PEDIDOS, JSON.stringify(novos));
  } catch {
    // sem armazenamento, o link do email e da tela de confirmação continuam valendo
  }
}

export function pedidosLembrados(): PedidoLembrado[] {
  try {
    const v = JSON.parse(localStorage.getItem(CHAVE_PEDIDOS) ?? "[]");
    return Array.isArray(v) ? v.filter((x) => x?.numero && x?.token) : [];
  } catch {
    return [];
  }
}

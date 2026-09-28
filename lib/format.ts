/**
 * Dinheiro no projeto inteiro é integer em centavos.
 * Converter pra número quebrado só na hora de mostrar na tela.
 */

export function precoBRL(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/**
 * Maior parcela sem juros que não fique abaixo do mínimo (padrão: R$ 30).
 *
 * ⚠️ `maxParcelas` tem que bater com o que o dono configurou como "sem juros"
 * na conta do Mercado Pago — o site promete, o Mercado Pago cobra. Vem da
 * chave `parcelas_sem_juros` da config (`lerParcelasSemJuros()`).
 */
export function parcelamento(
  centavos: number,
  maxParcelas = 3,
  minimoCentavos = 3000
): { parcelas: number; valor: string } | null {
  const parcelas = Math.min(maxParcelas, Math.floor(centavos / minimoCentavos));
  if (parcelas < 2) return null;
  return { parcelas, valor: precoBRL(Math.ceil(centavos / parcelas)) };
}

export function descontoPix(centavos: number, pct: number): number {
  return Math.round(centavos * (1 - pct / 100));
}

export function slugificar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

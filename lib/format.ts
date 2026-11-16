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
 * Parcelas sem juros que a vitrine promete. Decisão do dono (out/2026): até 2x
 * sem juros, acima disso o juros é do comprador. 🔴 Tem que bater com o
 * parcelamento sem juros configurado na conta dele no Mercado Pago — quem
 * cobra é o MP, a vitrine só anuncia.
 */
export const PARCELAS_SEM_JUROS = 2;

/** Maior parcela sem juros que não fique abaixo do mínimo (padrão: R$ 30). */
export function parcelamento(
  centavos: number,
  maxParcelas = PARCELAS_SEM_JUROS,
  minimoCentavos = 3000
): { parcelas: number; valor: string } | null {
  const parcelas = Math.min(maxParcelas, Math.floor(centavos / minimoCentavos));
  if (parcelas < 2) return null;
  return { parcelas, valor: precoBRL(Math.ceil(centavos / parcelas)) };
}

export function slugificar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Link de WhatsApp com mensagem pronta.
 *
 * O número vem do config ("5511999999999"); qualquer coisa que não seja dígito
 * sai, porque o dono pode ter digitado com espaço, parêntese ou traço.
 */
export function linkWhatsApp(numero: string, mensagem: string): string | null {
  const digitos = numero.replace(/\D/g, "");
  // 55 + DDD + número: menos de 12 dígitos é o placeholder do seed ou erro
  if (digitos.length < 12 || /^5?5?0+$/.test(digitos)) return null;
  return `https://wa.me/${digitos}?text=${encodeURIComponent(mensagem)}`;
}

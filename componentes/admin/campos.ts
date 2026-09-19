/**
 * O vocabulário de formulário do painel, num lugar só.
 *
 * Três telas pedem dado dele (entrar, produto, ajustes) e um botão de salvar
 * com cara diferente em cada uma é o jeito mais barato de um painel parecer
 * remendado. Aqui não há borda nem canto arredondado: o campo se separa do
 * muro por ser uma superfície de aço, que é pra isso que o `steel` existe.
 *
 * O anel de foco não é declarado aqui — vem do `:focus-visible` global, em
 * ouro, igual ao do resto do site.
 */

/** Rótulo de campo: letra miúda espacejada, nunca a face de manchete. */
export const rotulo =
  "font-sans text-sm tracking-[0.16em] uppercase text-smoke";

/** A superfície de aço onde ele digita. */
export const campo =
  "bg-steel px-4 py-4 font-sans text-lg text-paper outline-none placeholder:text-smoke";

/** A frase que explica o efeito do campo na loja. */
export const dica = "font-sans text-base leading-snug text-smoke";

/** A ação que fecha a tela: carimbo de ouro, como na vitrine. */
export const botao =
  "carimbo skew-brand bg-gold px-8 py-5 font-display text-xl font-black tracking-tight uppercase text-ink transition-colors hover:bg-gold-deep disabled:opacity-60";

/**
 * Deu certo: carimbo. É o gesto de quem bate o carimbo no papel e devolve.
 *
 * Deu errado mora em `componentes/admin/Aviso.tsx`, e não aqui: a falha precisa
 * de uma marca, não só de uma cor. Letra de ouro sozinha é o que o total de um
 * pedido já usa.
 */
export const carimboOk =
  "carimbo skew-brand inline-block bg-gold px-4 py-2.5 font-display text-base font-black tracking-tight uppercase text-ink";

/**
 * Deu errado.
 *
 * O erro não é bloco de ouro — no painel bloco de ouro quer dizer "ligado",
 * "feito" ou "é aqui". Mas também não podia ser só letra de ouro: o total de um
 * pedido é letra de ouro, e falha de salvamento e valor de venda lendo como a
 * mesma coisa é ruim num painel usado com pressa.
 *
 * Então a falha vem em letra de papel com uma MARCA de ouro na frente — o
 * risco que o dono do balcão faz na margem do papel quando uma linha está
 * errada. A marca é decorativa pro leitor de tela; quem lê em voz alta recebe
 * o texto por `role="alert"` no ponto de uso.
 */
export function Aviso({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex gap-3">
      <span
        aria-hidden
        className="skew-brand mt-1.5 h-4 w-1.5 shrink-0 bg-gold"
      />
      <span className="font-sans text-lg leading-snug text-paper">{children}</span>
    </span>
  );
}

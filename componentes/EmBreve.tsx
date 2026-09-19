import Link from "next/link";

/**
 * Página da área do cliente que ainda não existe.
 *
 * Carrinho, conta e pedidos já estão no menu, mas o checkout é fase seguinte.
 * Sem isso os três links caem no 404 — que lê como site quebrado, e não como
 * funcionalidade que ainda vem.
 *
 * Sem etiqueta acima do título: o título aguenta sozinho, e rótulo pendurado em
 * cima de manchete é enfeite que rouba a primeira linha de leitura.
 *
 * 🔴 **O título aqui NÃO usa `Esticar`.** A `Esticar` põe `whitespace-nowrap` na
 * linha pra poder medi-la, e o que chega aqui é FRASE, não nome: "Ainda não dá
 * pra fechar aqui" numa linha só, no corpo mínimo de 36px, pede 553px de
 * largura — em tela de 320px a página ganhava rolagem lateral, e as três telas
 * de "em breve" vazavam de 320 até 1024px. Esticar é pra nome de marca e nome de
 * seção. Frase quebra em linha e usa `text-balance`, na mesma voz de cartaz.
 */
export function EmBreve({
  titulo,
  texto,
}: {
  titulo: string;
  texto: string;
}) {
  return (
    <main className="flex min-h-[70svh] flex-col justify-center bg-ink px-5 pt-28 pb-20 sm:px-10">
      <div className="mx-auto w-full max-w-[1100px]">
        <h1 className="max-w-[16ch] font-display text-[clamp(2.25rem,7vw,5rem)] leading-[0.9] font-black tracking-tight text-balance uppercase text-paper">
          {titulo}
        </h1>

        <p className="mt-8 max-w-[46ch] font-sans text-xl leading-snug text-smoke">
          {texto}
        </p>

        <Link
          href="/produtos"
          className="carimbo skew-brand mt-10 inline-block bg-gold px-8 py-4 font-display text-xl font-black tracking-tight uppercase text-ink transition-colors hover:bg-gold-deep"
        >
          <span className="unskew">Ver os óculos</span>
        </Link>
      </div>
    </main>
  );
}

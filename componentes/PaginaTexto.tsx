/**
 * Página de texto corrido da loja (trocas, privacidade).
 *
 * Mesma voz de cartaz das outras páginas — manchete grande, letra miúda
 * espacejada nos subtítulos — mas medida de leitura (~62ch) e corpo de texto
 * em papel, não em fumaça: aqui a pessoa LÊ, e texto longo em cinza cansa.
 */
export function PaginaTexto({
  titulo,
  abertura,
  children,
}: {
  titulo: string;
  abertura: string;
  children: React.ReactNode;
}) {
  return (
    <main className="bg-ink px-5 pt-28 pb-24 sm:px-10 sm:pt-32 sm:pb-32">
      <article className="mx-auto max-w-[760px]">
        <h1 className="max-w-[16ch] font-display text-[clamp(2.25rem,6vw,4.5rem)] leading-[0.9] font-black tracking-tight text-balance uppercase text-paper">
          {titulo}
        </h1>
        <p className="mt-8 max-w-[52ch] font-sans text-xl leading-snug text-smoke">{abertura}</p>
        <div className="mt-14 flex flex-col gap-12 border-t regua pt-12">{children}</div>
      </article>
    </main>
  );
}

export function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-2xl leading-none font-black tracking-tight uppercase text-paper sm:text-3xl">
        {titulo}
      </h2>
      <div className="mt-5 flex max-w-[62ch] flex-col gap-4 font-sans text-lg leading-relaxed text-paper/85">
        {children}
      </div>
    </section>
  );
}

import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/10 px-6 py-14 sm:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {/* único caminho de volta pra home: o header agora é só menu */}
          <Link href="/" className="skew-brand inline-block font-marca text-4xl uppercase">
            Mó <span className="text-hot">Visão</span>
          </Link>
          <p className="mt-2 max-w-[32ch] font-sans text-smoke">
            Óculos pra quem corre, treina e não abre mão de estilo na rua.
          </p>
        </div>

        <div className="flex flex-col gap-2 font-sans text-sm">
          <Link href="/produtos" className="text-white/70 hover:text-white">
            Todos os produtos
          </Link>
          <Link href="/trocas-e-devolucoes" className="text-white/70 hover:text-white">
            Trocas e devoluções
          </Link>
          <Link href="/privacidade" className="text-white/70 hover:text-white">
            Privacidade
          </Link>
          <a
            href="https://instagram.com/mo_visao2k26"
            className="text-white/70 hover:text-white"
            target="_blank"
            rel="noopener noreferrer"
          >
            @mo_visao2k26
          </a>
        </div>
      </div>

      <p className="mx-auto mt-10 max-w-7xl font-sans text-xs tracking-[0.18em] uppercase text-white/30">
        Mó Visão · Site por Norman.dgt
      </p>
    </footer>
  );
}

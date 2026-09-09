import type { Metadata } from "next";
import Link from "next/link";
import { CardProduto } from "@/componentes/CardProduto";
import { listarProdutos } from "@/lib/produtos";
import type { Categoria } from "@/lib/types";

// Estoque muda a cada venda — catálogo com cache mostraria peça que já saiu.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Produtos",
  description:
    "Todos os óculos disponíveis na Mó Visão — modelos pra corrida e pra rua.",
};

const FILTROS: { valor: Categoria | "todos"; texto: string }[] = [
  { valor: "todos", texto: "Todos" },
  { valor: "corrida", texto: "Corrida" },
  { valor: "rua", texto: "Rua" },
];

export default async function PaginaProdutos({
  searchParams,
}: {
  // No Next 16 searchParams é uma Promise
  searchParams: Promise<{ categoria?: string }>;
}) {
  const { categoria } = await searchParams;
  const filtroAtivo: Categoria | "todos" =
    categoria === "corrida" || categoria === "rua" ? categoria : "todos";

  const produtos = await listarProdutos(
    filtroAtivo === "todos" ? undefined : { categoria: filtroAtivo }
  );

  return (
    <main className="mx-auto max-w-7xl px-6 pt-28 pb-16 sm:px-10">
      <h1 className="skew-brand font-display text-[clamp(2.5rem,9vw,5rem)] leading-none font-black uppercase">
        Produtos
      </h1>

      <div className="mt-10 flex flex-wrap gap-3">
        {FILTROS.map((filtro) => {
          const ativo = filtro.valor === filtroAtivo;
          return (
            <Link
              key={filtro.valor}
              href={
                filtro.valor === "todos"
                  ? "/produtos"
                  : `/produtos?categoria=${filtro.valor}`
              }
              aria-current={ativo ? "page" : undefined}
              className={`border px-5 py-2 font-sans text-sm tracking-[0.16em] uppercase transition-colors ${
                ativo
                  ? "border-hot bg-hot text-white"
                  : "border-white/20 text-white/70 hover:border-white/50 hover:text-white"
              }`}
            >
              {filtro.texto}
            </Link>
          );
        })}
      </div>

      {produtos.length === 0 ? (
        <p className="mt-16 max-w-[46ch] font-sans text-lg text-smoke">
          Nenhum óculos cadastrado nessa categoria por enquanto.
        </p>
      ) : (
        <div className="mt-14 grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {produtos.map((produto) => (
            <CardProduto key={produto.id} produto={produto} />
          ))}
        </div>
      )}
    </main>
  );
}

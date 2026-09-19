"use client";

import Image from "next/image";
import { useState } from "react";
import { urlFoto } from "@/lib/supabase/publico";
import type { ProdutoFoto } from "@/lib/types";

/**
 * A foto do produto vive numa folha de papel, pelo mesmo motivo do card: as
 * fotos que o dono sobe vêm quase sempre em fundo branco de marketplace, e
 * sobre o muro preto cada uma viraria um retângulo branco.
 *
 * A miniatura ativa é marcada por uma barra de ouro embaixo, não por anel em
 * volta: anel é borda, e neste mundo nada é fechado por borda.
 */
export function Galeria({ fotos, nome }: { fotos: ProdutoFoto[]; nome: string }) {
  const [atual, setAtual] = useState(0);

  if (fotos.length === 0) {
    return (
      <div className="folha flex aspect-square items-center justify-center font-sans text-sm tracking-[0.2em] uppercase text-ink/35">
        sem foto
      </div>
    );
  }

  const foto = fotos[atual];

  return (
    <div>
      <div className="folha relative aspect-square overflow-hidden p-5 sm:p-6">
        <Image
          src={urlFoto(foto.storage_path)}
          alt={foto.alt ?? nome}
          fill
          // é o maior elemento da página de produto: carrega com prioridade
          priority
          quality={90}
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-contain p-4"
        />
      </div>

      {fotos.length > 1 && (
        <div className="mt-5 flex gap-3 overflow-x-auto pb-1">
          {fotos.map((f, i) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setAtual(i)}
              aria-label={`Foto ${i + 1} de ${fotos.length}`}
              aria-current={i === atual}
              className="shrink-0"
            >
              <span className="folha relative block aspect-square w-20 overflow-hidden p-1.5">
                <Image
                  src={urlFoto(f.storage_path)}
                  alt=""
                  fill
                  sizes="80px"
                  className={`object-contain p-2 transition-opacity ${
                    i === atual ? "opacity-100" : "opacity-55 hover:opacity-100"
                  }`}
                />
              </span>
              <span
                aria-hidden
                className={`mt-1.5 block h-1 transition-colors ${
                  i === atual ? "bg-gold" : "bg-transparent"
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import Image from "next/image";
import { useState } from "react";
import { urlFoto } from "@/lib/supabase/publico";
import type { ProdutoFoto } from "@/lib/types";

export function Galeria({ fotos, nome }: { fotos: ProdutoFoto[]; nome: string }) {
  const [atual, setAtual] = useState(0);

  if (fotos.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center bg-paper text-sm tracking-widest uppercase text-ink/30">
        sem foto
      </div>
    );
  }

  const foto = fotos[atual];

  return (
    <div>
      <div className="relative aspect-square overflow-hidden bg-paper">
        <Image
          src={urlFoto(foto.storage_path)}
          alt={foto.alt ?? nome}
          fill
          // é o maior elemento da página de produto: carrega com prioridade
          priority
          quality={90}
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-contain p-8"
        />
      </div>

      {fotos.length > 1 && (
        <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
          {fotos.map((f, i) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setAtual(i)}
              aria-label={`Foto ${i + 1} de ${fotos.length}`}
              aria-current={i === atual}
              className={`relative aspect-square w-20 shrink-0 overflow-hidden bg-paper transition-opacity ${
                i === atual ? "ring-2 ring-hot" : "opacity-60 hover:opacity-100"
              }`}
            >
              <Image
                src={urlFoto(f.storage_path)}
                alt=""
                fill
                sizes="80px"
                className="object-contain p-2"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

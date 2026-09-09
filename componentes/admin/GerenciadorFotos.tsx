"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import { excluirFoto, registrarFotos, reordenarFotos } from "@/app/admin/acoes";
import { criarClienteBrowser } from "@/lib/supabase/client";
import { urlFoto } from "@/lib/supabase/publico";
import type { ProdutoFoto } from "@/lib/types";

/**
 * Fotos do produto.
 *
 * O arquivo sobe direto do navegador pro Storage, sem passar pelo servidor do
 * site — foto de celular passa de 4 MB e estourar o limite de corpo da rota
 * seria o caminho fácil de quebrar. A Server Action só registra o caminho.
 *
 * A compressão antes do upload não é luxo: sem ela, uma dúzia de produtos com
 * quatro fotos cada come o plano grátis do Storage em pouco tempo — e o cliente
 * ainda espera a foto de 4 MB carregar no 4G.
 */

const LARGURA_MAX = 1600;
const TAMANHO_ALVO_MB = 0.6;

type Status = { enviando: boolean; total: number; feitos: number; erro: string | null };

export function GerenciadorFotos({
  produtoId,
  fotos: fotosIniciais,
}: {
  produtoId: string;
  fotos: ProdutoFoto[];
}) {
  const [fotos, setFotos] = useState(fotosIniciais);
  const [status, setStatus] = useState<Status>({
    enviando: false,
    total: 0,
    feitos: 0,
    erro: null,
  });
  const inputRef = useRef<HTMLInputElement>(null);

  async function aoEscolher(arquivos: FileList | null) {
    if (!arquivos?.length) return;

    const lista = Array.from(arquivos);
    setStatus({ enviando: true, total: lista.length, feitos: 0, erro: null });

    const supabase = criarClienteBrowser();
    const caminhos: string[] = [];

    try {
      for (let i = 0; i < lista.length; i++) {
        const original = lista[i];

        const comprimida = await imageCompression(original, {
          maxWidthOrHeight: LARGURA_MAX,
          maxSizeMB: TAMANHO_ALVO_MB,
          useWebWorker: true,
          fileType: "image/webp",
        });

        const caminho = `${produtoId}/${crypto.randomUUID()}.webp`;
        const { error } = await supabase.storage
          .from("produtos")
          .upload(caminho, comprimida, { contentType: "image/webp", upsert: false });

        if (error) throw error;

        caminhos.push(caminho);
        setStatus((s) => ({ ...s, feitos: i + 1 }));
      }

      const r = await registrarFotos(produtoId, caminhos);
      if (!r.ok) throw new Error(r.erro);

      // otimista: mostra na hora, o revalidate do servidor confirma depois
      setFotos((atuais) => [
        ...atuais,
        ...caminhos.map((storage_path, i) => ({
          id: `novo-${i}-${storage_path}`,
          produto_id: produtoId,
          storage_path,
          alt: null,
          ordem: atuais.length + i,
        })),
      ]);
      setStatus({ enviando: false, total: 0, feitos: 0, erro: null });
    } catch (e) {
      setStatus({
        enviando: false,
        total: 0,
        feitos: 0,
        erro:
          e instanceof Error && e.message
            ? `Não deu pra subir a foto: ${e.message}`
            : "Não deu pra subir a foto. Tente de novo.",
      });
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function mover(indice: number, direcao: -1 | 1) {
    const destino = indice + direcao;
    if (destino < 0 || destino >= fotos.length) return;

    const nova = [...fotos];
    [nova[indice], nova[destino]] = [nova[destino], nova[indice]];
    setFotos(nova);

    const r = await reordenarFotos(
      produtoId,
      nova.map((f) => f.id)
    );
    if (!r.ok) {
      setFotos(fotos); // desfaz se o servidor recusou
      setStatus((s) => ({ ...s, erro: r.erro ?? "Não deu pra mudar a ordem." }));
    }
  }

  async function apagar(foto: ProdutoFoto) {
    const antes = fotos;
    setFotos((f) => f.filter((x) => x.id !== foto.id));

    const r = await excluirFoto(foto.id, produtoId);
    if (!r.ok) {
      setFotos(antes);
      setStatus((s) => ({ ...s, erro: r.erro ?? "Não deu pra apagar a foto." }));
    }
  }

  return (
    <section>
      <h2 className="font-display text-2xl font-black uppercase">Fotos</h2>
      <p className="mt-1 mb-4 font-sans text-white/50">
        A primeira foto é a que aparece na loja. Use as setas pra mudar a ordem.
      </p>

      {fotos.length > 0 && (
        <ul className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {fotos.map((foto, i) => (
            <li
              key={foto.id}
              className="overflow-hidden rounded border border-white/10 bg-steel"
            >
              <div className="relative aspect-square bg-paper">
                <Image
                  src={urlFoto(foto.storage_path)}
                  alt=""
                  fill
                  sizes="(min-width: 640px) 30vw, 45vw"
                  className="object-contain p-2"
                />
                {i === 0 && (
                  <span className="absolute top-2 left-2 rounded bg-hot px-2 py-1 font-display text-[11px] font-bold tracking-wide uppercase text-white">
                    Capa
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between gap-1 p-2">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => mover(i, -1)}
                    disabled={i === 0}
                    aria-label="Mover para trás"
                    className="rounded border border-white/15 px-3 py-2 text-white/70 disabled:opacity-30"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => mover(i, 1)}
                    disabled={i === fotos.length - 1}
                    aria-label="Mover para frente"
                    className="rounded border border-white/15 px-3 py-2 text-white/70 disabled:opacity-30"
                  >
                    →
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => apagar(foto)}
                  className="px-2 py-2 font-sans text-sm text-white/40 hover:text-hot"
                >
                  Apagar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => aoEscolher(e.target.files)}
        className="hidden"
        id="entrada-fotos"
      />

      <label
        htmlFor="entrada-fotos"
        className="flex cursor-pointer items-center justify-center rounded border-2 border-dashed border-white/25 px-6 py-8 text-center font-display text-lg font-bold uppercase text-white/70 transition-colors hover:border-hot hover:text-white"
      >
        {status.enviando
          ? `Enviando ${status.feitos + 1} de ${status.total}...`
          : fotos.length
            ? "+ Adicionar mais fotos"
            : "+ Escolher fotos do celular"}
      </label>

      {status.erro && (
        <p role="alert" className="mt-3 font-sans text-sm text-hot">
          {status.erro}
        </p>
      )}
    </section>
  );
}

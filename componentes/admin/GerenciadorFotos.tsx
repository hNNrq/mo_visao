"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import { excluirFoto, registrarFotos, reordenarFotos } from "@/app/admin/acoes";
import { criarClienteBrowser } from "@/lib/supabase/client";
import { urlFoto } from "@/lib/supabase/publico";
import { Aviso } from "@/componentes/admin/Aviso";
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

/** Folha colada à mão não sai no esquadro, e três com o mesmo giro leem
 *  como grade em vez de muro. Nenhum valor é 0deg. */
const GIROS = ["-1.1deg", "0.9deg", "-0.6deg", "1.3deg"];

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
      <h2 className="font-display text-2xl leading-none font-black tracking-tight uppercase text-paper">
        Fotos
      </h2>
      <p className="mt-2 mb-5 font-sans text-lg leading-snug text-smoke">
        A primeira foto é a que aparece na loja. Use as setas pra mudar a ordem.
      </p>

      {/* Aqui a foto é FOLHA de verdade: torta, com a folha de ontem deslocada
          por baixo. É a única tela do painel com espaço pra isso — na lista o
          giro e a sombra sólida quebrariam o ritmo da coluna. O vão é maior que
          o normal porque o deslocamento de 7px/8px precisa de onde cair, e
          nenhum giro é 0deg. */}
      <ul className="grid grid-cols-2 gap-x-5 gap-y-6 sm:grid-cols-3">
        {fotos.map((foto, i) => (
            <li key={foto.id}>
              <div
                className="folha relative aspect-square"
                style={
                  { "--giro": GIROS[i % GIROS.length] } as React.CSSProperties
                }
              >
                <Image
                  src={urlFoto(foto.storage_path)}
                  alt=""
                  fill
                  sizes="(min-width: 640px) 30vw, 45vw"
                  className="object-contain p-2"
                />
                {i === 0 && (
                  <span className="carimbo skew-brand absolute top-2 left-2 bg-gold px-2.5 py-1 font-display text-xs font-black tracking-tight uppercase text-ink">
                    <span className="unskew">Capa</span>
                  </span>
                )}
              </div>

              <div className="mt-1.5 flex items-center justify-between gap-1.5">
                <div className="flex gap-1.5">
                  <BotaoSeta
                    sentido="tras"
                    onClick={() => mover(i, -1)}
                    desabilitado={i === 0}
                  />
                  <BotaoSeta
                    sentido="frente"
                    onClick={() => mover(i, 1)}
                    desabilitado={i === fotos.length - 1}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => apagar(foto)}
                  className="px-2 py-2 font-sans text-sm tracking-[0.16em] uppercase text-smoke transition-colors hover:text-gold"
                >
                  Apagar
                </button>
              </div>
            </li>
          ))}

          {/* A entrada é a PRÓXIMA vaga da grade, não uma faixa embaixo dela.
              Em faixa larga, o objeto mais vazio da tela virava o maior — uma
              chapa de aço de 840px sob uma folha de 230px. Como vaga, ela diz
              "cabe mais uma aqui", que é o que ela é. */}
          <li>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => aoEscolher(e.target.files)}
              className="sr-only"
              id="entrada-fotos"
            />

            <label
              htmlFor="entrada-fotos"
              className="flex aspect-square cursor-pointer items-center justify-center bg-steel p-4 text-center font-display text-base leading-tight font-black tracking-tight uppercase text-paper transition-colors hover:text-gold has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-gold sm:text-lg"
            >
              {status.enviando ? (
                <span className="numeros">
                  Enviando {status.feitos + 1} de {status.total}...
                </span>
              ) : fotos.length ? (
                "+ Mais fotos"
              ) : (
                "+ Escolher fotos do celular"
              )}
            </label>
          </li>
        </ul>

      {status.erro && (
        <p role="alert" className="mt-4">
          <Aviso>{status.erro}</Aviso>
        </p>
      )}

    </section>
  );
}

function BotaoSeta({
  sentido,
  onClick,
  desabilitado,
}: {
  sentido: "tras" | "frente";
  onClick: () => void;
  desabilitado: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={desabilitado}
      aria-label={sentido === "tras" ? "Mover para trás" : "Mover para frente"}
      className="bg-paper/10 px-3 py-2.5 text-paper transition-colors hover:bg-paper/20 disabled:bg-paper/5 disabled:text-paper/25"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        className={sentido === "frente" ? "rotate-180" : undefined}
      >
        <path d="M19 12H5" />
        <path d="m11 6-6 6 6 6" />
      </svg>
    </button>
  );
}

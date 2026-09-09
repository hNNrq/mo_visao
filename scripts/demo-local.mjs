/**
 * Popula o Supabase LOCAL com alguns óculos e fotos, pra dar pra ver o painel e
 * a loja com conteúdo. Só desenvolvimento — nunca roda contra produção.
 *
 * uso: node scripts/demo-local.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";

for (const linha of readFileSync(".env.local", "utf8").split("\n")) {
  const m = linha.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2];
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!url?.includes("127.0.0.1")) {
  console.error("Isto só roda contra o Supabase local. Abortando.");
  process.exit(1);
}

const db = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const PRODUTOS = [
  {
    slug: "radar-ev-prizm-road",
    nome: "Radar EV Prizm Road",
    marca: "Oakley",
    modelo: "Prizm Road",
    descricao:
      "Lente de alto contraste pra corrida na rua. Faz buraco, brita e mudança de piso aparecerem antes de você pisar.",
    preco_centavos: 42900,
    estoque: 2,
    categoria: "corrida",
    destaque: true,
    ordem: 0,
    foto: "../produtos/oculos-prizm-rosa.png",
  },
  {
    slug: "holbrook-preto-fosco",
    nome: "Holbrook Preto Fosco",
    marca: "Oakley",
    modelo: "Lente escura",
    descricao:
      "Preto fosco, lente escura. Combina com tudo e vai bem todo dia — do treino ao rolê.",
    preco_centavos: 38900,
    estoque: 1,
    categoria: "rua",
    destaque: true,
    ordem: 1,
    foto: "../produtos/oculos-preto.png",
  },
  {
    slug: "sutro-colorido",
    nome: "Sutro Colorido",
    marca: "Oakley",
    modelo: "Lente espelhada",
    descricao: "Máscara larga, cobertura grande. Esse é o que aparece de longe.",
    preco_centavos: 45900,
    estoque: 0,
    categoria: "rua",
    destaque: false,
    ordem: 2,
    foto: "../produtos/oculos-color.png",
  },
];

for (const p of PRODUTOS) {
  const { foto, ...dados } = p;

  const { data: prod, error } = await db
    .from("produtos")
    .upsert(dados, { onConflict: "slug" })
    .select("id")
    .single();
  if (error) throw error;

  const { data: jaTem } = await db
    .from("produto_fotos")
    .select("id")
    .eq("produto_id", prod.id);

  if (!jaTem?.length) {
    const caminho = `${prod.id}/${randomUUID()}.png`;
    const bytes = readFileSync(foto);

    const { error: e1 } = await db.storage
      .from("produtos")
      .upload(caminho, bytes, { contentType: "image/png" });
    if (e1) throw e1;

    const { error: e2 } = await db
      .from("produto_fotos")
      .insert({ produto_id: prod.id, storage_path: caminho, ordem: 0 });
    if (e2) throw e2;
  }

  console.log(`  ${p.nome} — ${(p.preco_centavos / 100).toFixed(2)} — estoque ${p.estoque}`);
}

console.log("\npronto. veja em http://localhost:3000 e http://localhost:3000/admin/produtos");

/**
 * Popula o Supabase com alguns óculos e fotos, pra loja não subir vazia.
 *
 *   node scripts/demo-produtos.mjs              # Supabase local
 *   node scripts/demo-produtos.mjs --confirmar  # o que estiver no .env.local
 *
 * Lê o alvo do `.env.local`. Contra qualquer coisa que não seja o localhost
 * ele PARA e pede `--confirmar`: o mesmo comando serve pra popular a demo na
 * nuvem e pra sujar a loja do dono depois que ela estiver vendendo.
 *
 * Não destrói nada: o produto é casado pelo slug, e a foto só sobe se aquele
 * produto ainda não tiver nenhuma.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";

for (const linha of readFileSync(".env.local", "utf8").split("\n")) {
  const m = linha.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].trim();
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const local = /127\.0\.0\.1|localhost/.test(url ?? "");

if (!local && !process.argv.includes("--confirmar")) {
  console.error(`Alvo: ${url}`);
  console.error("Isso não é o Supabase local. Rode com --confirmar se é isso mesmo.");
  process.exit(1);
}

console.log(`semeando ${url}\n`);

const db = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

/**
 * As fotos vêm de `clientes/mo-visao/produtos/`, e são todas PNG recortado: o
 * card da vitrine é `object-contain` sobre o creme da marca, então foto com
 * fundo branco chapado aparece como um quadrado branco dentro do card.
 */
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
    fotos: ["../produtos/oculos-prizm-rosa.png"],
  },
  {
    slug: "radar-ev-path",
    nome: "Radar EV Path",
    marca: "Oakley",
    modelo: "Lente espelhada",
    descricao:
      "Máscara larga, cobertura de ponta a ponta. Lente de alto contraste espelhada — esse é o que aparece de longe.",
    preco_centavos: 45900,
    estoque: 3,
    categoria: "corrida",
    destaque: true,
    ordem: 1,
    fotos: ["../produtos/oculos-color.png"],
  },
  {
    slug: "radar-preto-lente-escura",
    nome: "Radar Preto Lente Escura",
    marca: "Oakley",
    modelo: "Lente escura",
    descricao:
      "Preto no preto, lente escura. Combina com tudo e vai bem todo dia — do treino ao rolê.",
    preco_centavos: 38900,
    estoque: 1,
    categoria: "rua",
    destaque: true,
    ordem: 2,
    // duas fotos de propósito: é o que mostra a galeria da página do produto
    fotos: [
      "../produtos/oculos-preto-recorte.png",
      "../produtos/oculos-preto-dir.png",
    ],
  },
];

for (const { fotos, ...dados } of PRODUTOS) {
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
    for (const [ordem, caminhoLocal] of fotos.entries()) {
      const caminho = `${prod.id}/${randomUUID()}.png`;

      const { error: e1 } = await db.storage
        .from("produtos")
        .upload(caminho, readFileSync(caminhoLocal), { contentType: "image/png" });
      if (e1) throw e1;

      const { error: e2 } = await db.from("produto_fotos").insert({
        produto_id: prod.id,
        storage_path: caminho,
        alt: `${dados.nome} — ${dados.marca}`,
        ordem,
      });
      if (e2) throw e2;
    }
  }

  const preco = (dados.preco_centavos / 100).toFixed(2);
  console.log(`  ${dados.nome} — R$ ${preco} — estoque ${dados.estoque}`);
}

console.log(`\npronto. veja em ${local ? "http://localhost:3000" : "no site publicado"}`);

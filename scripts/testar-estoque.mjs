/**
 * Testa as funções de estoque contra um Postgres de verdade (PGlite, em processo).
 *
 * Por que isto existe: o controle de estoque é a parte do sistema onde um erro
 * custa dinheiro e reputação — vender duas vezes o mesmo óculos de 1 unidade,
 * ou baixar o estoque duas vezes porque o Mercado Pago reenviou a notificação.
 * Compilar não prova nada disso.
 *
 * O que NÃO dá pra testar aqui: concorrência real com duas conexões
 * simultâneas. PGlite roda em processo, com uma conexão só. O que se testa é a
 * lógica do UPDATE condicional — que é o mecanismo que protege da corrida.
 * O teste de duas transações ao mesmo tempo precisa do Supabase local (Docker).
 *
 * uso: node scripts/testar-estoque.mjs
 */
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";

let passou = 0;
let falhou = 0;

function ok(condicao, descricao, detalhe = "") {
  if (condicao) {
    passou++;
    console.log(`  OK    ${descricao}`);
  } else {
    falhou++;
    console.log(`  FALHA ${descricao}${detalhe ? ` — ${detalhe}` : ""}`);
  }
}

const db = new PGlite();

// --- stubs do que o Supabase fornece e o PGlite não tem ---
await db.exec(`
  create schema if not exists auth;
  create table auth.users (id uuid primary key, email text);
  create schema if not exists storage;
  create table storage.buckets (id text primary key, name text, public boolean);
  create table storage.objects (id uuid, bucket_id text, name text);
  create or replace function auth.uid() returns uuid language sql stable as $$
    select current_setting('teste.uid', true)::uuid
  $$;
  create role anon;
  create role authenticated;
  create role service_role;
`);

// --- migrations reais do projeto ---
// pgcrypto não existe no PGlite, e aqui nem precisa: gen_random_uuid() é nativo
// do Postgres desde a 13. No Supabase a linha continua fazendo sentido.
function carregar(arquivo) {
  return readFileSync(arquivo, "utf8").replace(
    /create extension if not exists "pgcrypto";/,
    ""
  );
}

try {
  await db.exec(carregar("supabase/migrations/001_schema.sql"));
  await db.exec(carregar("supabase/migrations/002_funcoes.sql"));
  await db.exec(carregar("supabase/migrations/004_seed.sql"));
  await db.exec(carregar("supabase/migrations/005_checkout.sql"));
} catch (e) {
  console.error("erro ao carregar as migrations:", e.message);
  process.exit(1);
}
console.log("schema e funções carregados\n");

// ============================================================
// cenário: um óculos com 1 unidade — o caso comum da loja
// ============================================================
console.log("Produto com 1 unidade (o caso comum):");

const { rows: criado } = await db.query(`
  insert into produtos (slug, nome, preco_centavos, estoque)
  values ('radar-ev', 'Radar EV', 40000, 1) returning id
`);
const produtoId = criado[0].id;

async function novoPedido(nome) {
  const { rows } = await db.query(
    `insert into pedidos (cliente_nome, cliente_email, cliente_telefone,
                          subtotal_centavos, total_centavos)
     values ($1, 'a@b.com', '11999999999', 40000, 40000) returning id`,
    [nome]
  );
  const pedidoId = rows[0].id;
  await db.query(
    `insert into pedido_itens (pedido_id, produto_id, nome_snapshot,
                               preco_snapshot_centavos, quantidade)
     values ($1, $2, 'Radar EV', 40000, 1)`,
    [pedidoId, produtoId]
  );
  return pedidoId;
}

const itens = JSON.stringify([{ produto_id: produtoId, quantidade: 1 }]);

// cliente A reserva
const pedidoA = await novoPedido("Cliente A");
await db.query(`select reservar_estoque($1::jsonb)`, [itens]);
let { rows: p } = await db.query(`select estoque, reservado, disponivel from produtos where id=$1`, [produtoId]);
ok(p[0].reservado === 1 && p[0].disponivel === 0, "cliente A reserva a única unidade", JSON.stringify(p[0]));

// cliente B tenta reservar a MESMA unidade
const pedidoB = await novoPedido("Cliente B");
let recusou = false;
try {
  await db.query(`select reservar_estoque($1::jsonb)`, [itens]);
} catch (e) {
  recusou = String(e.message).includes("SEM_ESTOQUE");
}
ok(recusou, "cliente B é recusado — não vende o mesmo óculos duas vezes");

// ============================================================
// confirmação de pagamento e idempotência
// ============================================================
console.log("\nPagamento confirmado pelo webhook:");

let { rows: r1 } = await db.query(`select confirmar_pedido($1,'mp_1','pix') as r`, [pedidoA]);
ok(r1[0].r === "confirmado", "primeira notificação confirma o pedido", r1[0].r);

({ rows: p } = await db.query(`select estoque, reservado from produtos where id=$1`, [produtoId]));
ok(p[0].estoque === 0 && p[0].reservado === 0, "estoque baixou e a reserva foi liberada", JSON.stringify(p[0]));

// o Mercado Pago reenvia a mesma notificação
let { rows: r2 } = await db.query(`select confirmar_pedido($1,'mp_1','pix') as r`, [pedidoA]);
ok(r2[0].r === "ja_processado", "notificação repetida não faz nada (idempotência)", r2[0].r);

({ rows: p } = await db.query(`select estoque from produtos where id=$1`, [produtoId]));
ok(p[0].estoque === 0, "estoque NÃO baixou duas vezes", `estoque=${p[0].estoque}`);

// ============================================================
// reserva que expira sem pagamento
// ============================================================
console.log("\nCliente não paga e a reserva expira:");

await db.query(`update produtos set estoque = 1 where id = $1`, [produtoId]);
const pedidoC = await novoPedido("Cliente C");
await db.query(`select reservar_estoque($1::jsonb)`, [itens]);
await db.query(`update pedidos set expira_em = now() - interval '1 minute' where id = $1`, [pedidoC]);

const { rows: libs } = await db.query(`select liberar_reservas_expiradas() as n`);
ok(libs[0].n === 1, "o job expira o pedido não pago", `liberou ${libs[0].n}`);

({ rows: p } = await db.query(`select reservado, disponivel from produtos where id=$1`, [produtoId]));
ok(p[0].reservado === 0 && p[0].disponivel === 1, "o óculos volta a ficar disponível", JSON.stringify(p[0]));

// ============================================================
// o caso chato: paga DEPOIS da reserva expirar
// ============================================================
console.log("\nPix pago depois da reserva expirar:");

// ainda tem peça: dá pra honrar
const { rows: r3 } = await db.query(`select confirmar_pedido($1,'mp_3','pix') as r`, [pedidoC]);
ok(r3[0].r === "confirmado", "com peça em estoque, o pagamento atrasado é honrado", r3[0].r);

// agora sem peça nenhuma
await db.query(`update produtos set estoque = 0 where id = $1`, [produtoId]);
const pedidoD = await novoPedido("Cliente D");
await db.query(`update pedidos set status='expirado', expira_em = now() - interval '1 hour' where id=$1`, [pedidoD]);
const { rows: r4 } = await db.query(`select confirmar_pedido($1,'mp_4','pix') as r`, [pedidoD]);
ok(r4[0].r === "sem_estoque", "sem peça, avisa 'sem_estoque' pro dono estornar", r4[0].r);

({ rows: p } = await db.query(`select estoque from produtos where id=$1`, [produtoId]));
ok(p[0].estoque === 0, "não deixa o estoque ficar negativo", `estoque=${p[0].estoque}`);

// ============================================================
// checkout: criar_pedido
// ============================================================
console.log("\nCheckout (criar_pedido):");

const { rows: dois } = await db.query(`
  insert into produtos (slug, nome, preco_centavos, estoque) values
    ('juliet', 'Juliet', 50000, 1),
    ('penny',  'Penny',  30000, 2)
  returning id, slug
`);
const juliet = dois.find((r) => r.slug === "juliet").id;
const penny = dois.find((r) => r.slug === "penny").id;
const cliente = JSON.stringify({ nome: "Ana", email: "Ana@Teste.com", telefone: "11999990000" });

async function criar(itensArr, tipo = "retirada", entrega = {}) {
  const { rows } = await db.query(
    `select * from criar_pedido($1::jsonb, $2::entrega_tipo, $3::jsonb, $4::jsonb)`,
    [cliente, tipo, JSON.stringify(entrega), JSON.stringify(itensArr)]
  );
  return rows[0];
}

// preço vem do banco, não do navegador — o payload nem tem campo de preço
const pedE = await criar([{ produto_id: penny, quantidade: 1 }, { produto_id: juliet, quantidade: 1 }]);
ok(pedE.total_centavos === 80000, "total sai do preço do banco", `total=${pedE.total_centavos}`);
ok(/^MV-\d{5}$/.test(pedE.numero), "pedido ganha número MV-00000", pedE.numero);
ok(typeof pedE.token === "string" && pedE.token.length === 64, "pedido ganha token de 64 caracteres");

let { rows: itE } = await db.query(
  `select nome_snapshot, preco_snapshot_centavos from pedido_itens where pedido_id=$1 order by nome_snapshot`,
  [pedE.id]
);
ok(itE.length === 2 && itE[0].preco_snapshot_centavos === 50000, "itens gravados com snapshot do preço", JSON.stringify(itE));

let { rows: emailE } = await db.query(`select cliente_email from pedidos where id=$1`, [pedE.id]);
ok(emailE[0].cliente_email === "ana@teste.com", "email guardado em minúsculas", emailE[0].cliente_email);

({ rows: p } = await db.query(`select reservado from produtos where id=$1`, [juliet]));
ok(p[0].reservado === 1, "estoque do Juliet reservado", JSON.stringify(p[0]));

// o Juliet acabou: o pedido inteiro volta, inclusive a reserva do Penny
let semEstoque = false;
try {
  await criar([{ produto_id: penny, quantidade: 1 }, { produto_id: juliet, quantidade: 1 }]);
} catch (e) {
  semEstoque = String(e.message).includes("SEM_ESTOQUE");
}
ok(semEstoque, "carrinho com peça esgotada é recusado");
({ rows: p } = await db.query(`select reservado from produtos where id=$1`, [penny]));
ok(p[0].reservado === 1, "e não deixa reserva do outro item pendurada", `penny reservado=${p[0].reservado}`);

// o mesmo produto duas vezes vira uma linha só, e a soma é conferida
let passou2 = false;
try {
  await criar([{ produto_id: penny, quantidade: 1 }, { produto_id: penny, quantidade: 1 }]);
} catch (e) {
  passou2 = String(e.message).includes("SEM_ESTOQUE");
}
ok(passou2, "item repetido no carrinho soma e respeita o estoque (só sobrou 1 Penny)");

let vazio = false;
try {
  await criar([]);
} catch (e) {
  vazio = String(e.message).includes("CARRINHO_VAZIO");
}
ok(vazio, "carrinho vazio é recusado");

let correios = false;
try {
  await criar([{ produto_id: penny, quantidade: 1 }], "correios");
} catch (e) {
  correios = String(e.message).includes("ENTREGA_INDISPONIVEL");
}
ok(correios, "envio pelos Correios ainda não é aceito");

// frete da região, e frete grátis acima do valor
await db.query(`update config set valor='1500'::jsonb where chave='frete_local_centavos'`);
const pedF = await criar([{ produto_id: penny, quantidade: 1 }], "local", { endereco: "Rua X, 10" });
ok(pedF.total_centavos === 31500, "entrega na região soma a taxa", `total=${pedF.total_centavos}`);
await db.query(`update pedidos set expira_em = now() - interval '1 minute' where id=$1`, [pedF.id]);

await db.query(`update config set valor='30000'::jsonb where chave='frete_gratis_acima_centavos'`);
// criar_pedido libera o vencido (pedF) antes de reservar — sem depender de cron
const pedG = await criar([{ produto_id: penny, quantidade: 1 }], "local", { endereco: "Rua X, 10" });
ok(pedG.total_centavos === 30000, "acima do valor mínimo, a entrega sai de graça", `total=${pedG.total_centavos}`);
let { rows: stF } = await db.query(`select status from pedidos where id=$1`, [pedF.id]);
ok(stF[0].status === "expirado", "criar_pedido expira a reserva vencida sem precisar de cron", stF[0].status);

// ============================================================
// pagamento atrasado num pedido de dois itens
// ============================================================
console.log("\nPix atrasado com dois itens, um deles já vendido:");

// pedE (Penny + Juliet) vence; o Juliet é vendido pra outra pessoa no balcão
await db.query(`update pedidos set expira_em = now() - interval '1 minute' where id=$1`, [pedE.id]);
await db.query(`select liberar_reservas_expiradas()`);
await db.query(`update produtos set estoque = 0 where id=$1`, [juliet]);
await db.query(`update produtos set estoque = 2, reservado = 0 where id=$1`, [penny]);
await db.query(`update pedidos set status='cancelado' where id=$1`, [pedG.id]);

const { rows: r5 } = await db.query(`select confirmar_pedido($1,'mp_5','pix') as r`, [pedE.id]);
ok(r5[0].r === "sem_estoque", "devolve sem_estoque", r5[0].r);
({ rows: p } = await db.query(`select estoque from produtos where id=$1`, [penny]));
ok(p[0].estoque === 2, "o Penny NÃO foi baixado pela metade", `penny estoque=${p[0].estoque}`);
let { rows: alE } = await db.query(`select status, alerta, mp_payment_id from pedidos where id=$1`, [pedE.id]);
ok(alE[0].alerta && alE[0].mp_payment_id === "mp_5" && alE[0].status === "expirado",
  "o pedido fica marcado pro dono estornar", JSON.stringify(alE[0]));

// ============================================================
// permissões: a chave pública não chama função de estoque
// ============================================================
console.log("\nPermissões:");

for (const [fn, args] of [
  ["reservar_estoque", "'[]'::jsonb"],
  ["confirmar_pedido", "gen_random_uuid(), 'x', 'x'"],
  ["liberar_reservas_expiradas", ""],
  ["criar_pedido", "'{}'::jsonb, 'retirada', '{}'::jsonb, '[]'::jsonb"],
]) {
  let negado = false;
  try {
    await db.exec(`set role anon; select ${fn}(${args});`);
  } catch (e) {
    negado = /permission denied/i.test(e.message);
  } finally {
    await db.exec(`reset role;`);
  }
  ok(negado, `anon não executa ${fn}()`);
}

// ============================================================
// proteções do schema
// ============================================================
console.log("\nProteções do banco:");

let barrou = false;
try {
  await db.query(`update produtos set reservado = 99 where id = $1`, [produtoId]);
} catch {
  barrou = true;
}
ok(barrou, "não deixa reservar mais do que existe em estoque");

barrou = false;
try {
  await db.query(`insert into produtos (slug, nome, preco_centavos) values ('x','X',-1)`);
} catch {
  barrou = true;
}
ok(barrou, "não aceita preço negativo");

barrou = false;
try {
  await db.query(`insert into produtos (slug, nome, preco_centavos) values ('radar-ev','Outro',100)`);
} catch {
  barrou = true;
}
ok(barrou, "não aceita dois produtos com o mesmo link (slug)");

// ============================================================
console.log(`\n${passou} passaram, ${falhou} falharam`);
await db.close();
process.exit(falhou > 0 ? 1 : 0);

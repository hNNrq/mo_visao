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
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin;
  create schema if not exists auth;
  create table auth.users (id uuid primary key, email text);
  create schema if not exists storage;
  create table storage.buckets (id text primary key, name text, public boolean);
  create table storage.objects (id uuid, bucket_id text, name text);
  create or replace function auth.uid() returns uuid language sql stable as $$
    select current_setting('teste.uid', true)::uuid
  $$;
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
// pago depois de expirar, com DOIS itens e só um deles esgotado
// ============================================================
console.log("\nPedido expirado com dois itens, um esgotado:");

const { rows: dupla } = await db.query(`
  insert into produtos (slug, nome, preco_centavos, estoque) values
    ('juliet-a', 'Juliet A', 50000, 1),
    ('penny-b',  'Penny B',  45000, 0)
  returning id`);
const [temPeca, semPeca] = dupla.map((d) => d.id);
const { rows: pe } = await db.query(`
  insert into pedidos (status, cliente_nome, cliente_email, cliente_telefone,
                       subtotal_centavos, total_centavos, expira_em)
  values ('expirado', 'Cliente E', 'e@e.com', '11', 95000, 95000, now() - interval '1 hour')
  returning id`);
const pedidoE = pe[0].id;
await db.query(
  `insert into pedido_itens (pedido_id, produto_id, nome_snapshot, preco_snapshot_centavos, quantidade)
   values ($1, $2, 'Juliet A', 50000, 1), ($1, $3, 'Penny B', 45000, 1)`,
  [pedidoE, temPeca, semPeca]
);
const { rows: r5 } = await db.query(`select confirmar_pedido($1,'mp_5','pix') as r`, [pedidoE]);
ok(r5[0].r === "sem_estoque", "avisa sem_estoque", r5[0].r);
({ rows: p } = await db.query(`select estoque from produtos where id=$1`, [temPeca]));
ok(p[0].estoque === 1, "o item que TINHA peça não foi baixado pela metade", `estoque=${p[0].estoque}`);
({ rows: p } = await db.query(`select precisa_estorno, mp_payment_id from pedidos where id=$1`, [pedidoE]));
ok(p[0].precisa_estorno === true && p[0].mp_payment_id === "mp_5", "pedido fica marcado pro dono estornar", JSON.stringify(p[0]));

// ============================================================
// criar_pedido — o checkout
// ============================================================
console.log("\nCheckout (criar_pedido):");

await db.query(`update config set valor = '5' where chave = 'desconto_pix_pct'`);
await db.query(`update config set valor = '1500' where chave = 'frete_local_centavos'`);
await db.query(`update config set valor = '0' where chave = 'frete_gratis_acima_centavos'`);
const { rows: cp } = await db.query(`
  insert into produtos (slug, nome, preco_centavos, estoque) values
    ('romeo-c', 'Romeo C', 40000, 2),
    ('inativo', 'Inativo', 10000, 5)
  returning id`);
const [romeo, inativo] = cp.map((d) => d.id);
await db.query(`update produtos set ativo = false where id = $1`, [inativo]);

const CLIENTE = JSON.stringify({ nome: " Ana ", email: "ANA@X.COM ", telefone: "31999990000" });
const criar = (itens, entrega = "local", pagamento = "pix") =>
  db.query(`select * from criar_pedido($1::jsonb, $2::entrega_tipo, $3::jsonb, $4::jsonb, $5)`, [
    CLIENTE, entrega, JSON.stringify({ endereco: "Rua A, 1" }), JSON.stringify(itens), pagamento,
  ]);

// o navegador manda a mesma peça em duas linhas — tem que virar uma só
const { rows: np } = await criar([
  { produto_id: romeo, quantidade: 1 },
  { produto_id: romeo, quantidade: 1 },
]);
const novo = np[0];
({ rows: p } = await db.query(
  `select subtotal_centavos s, frete_centavos f, desconto_centavos d, total_centavos t,
          cliente_nome, cliente_email, pagamento_escolhido,
          (select count(*)::int from pedido_itens where pedido_id = pedidos.id) linhas
     from pedidos where id = $1`, [novo.id]));
ok(p[0].s === 80000 && p[0].f === 1500 && p[0].d === 4000 && p[0].t === 77500,
  "preço do banco, frete da região e 5% de Pix só sobre as peças", JSON.stringify(p[0]));
ok(p[0].linhas === 1, "linhas repetidas viram um item com quantidade 2");
ok(p[0].cliente_nome === "Ana" && p[0].cliente_email === "ana@x.com", "limpa nome e email");
ok(novo.total_centavos === 77500 && /^MV-\d{5}$/.test(novo.numero), "devolve número e total", JSON.stringify(novo));
({ rows: p } = await db.query(`select reservado from produtos where id=$1`, [romeo]));
ok(p[0].reservado === 2, "reservou as duas unidades");

// esgotado: nada pode sobrar do pedido que falhou
const { rows: antes } = await db.query(`select count(*)::int n from pedidos`);
let erro = "";
try { await criar([{ produto_id: romeo, quantidade: 1 }]); } catch (e) { erro = e.message; }
const { rows: depois } = await db.query(`select count(*)::int n from pedidos`);
ok(erro.includes("SEM_ESTOQUE") && antes[0].n === depois[0].n,
  "sem peça, estoura e não deixa pedido pela metade", `${erro} / ${antes[0].n}→${depois[0].n}`);

erro = "";
try { await criar([{ produto_id: inativo, quantidade: 1 }]); } catch (e) { erro = e.message; }
ok(erro.includes("PRODUTO_INDISPONIVEL"), "produto fora da loja não entra no pedido", erro);

erro = "";
try { await criar([]); } catch (e) { erro = e.message; }
ok(erro.includes("CARRINHO_VAZIO"), "carrinho vazio é recusado", erro);

erro = "";
try { await criar([{ produto_id: romeo, quantidade: 50 }]); } catch (e) { erro = e.message; }
ok(erro.includes("QUANTIDADE_INVALIDA"), "não deixa um visitante travar o estoque inteiro", erro);

// reserva vencida não barra o próximo comprador
await db.query(`update pedidos set expira_em = now() - interval '1 minute' where id = $1`, [novo.id]);
const { rows: cartao } = await criar([{ produto_id: romeo, quantidade: 1 }], "retirada", "cartao");
({ rows: p } = await db.query(`select frete_centavos f, desconto_centavos d, total_centavos t from pedidos where id=$1`, [cartao[0].id]));
ok(p[0].f === 0 && p[0].d === 0 && p[0].t === 40000, "retirada sem frete, cartão sem desconto — e a reserva vencida saiu da frente", JSON.stringify(p[0]));

await db.query(`update config set valor = '50000' where chave = 'frete_gratis_acima_centavos'`);
await db.query(`update produtos set estoque = estoque + 5 where id = $1`, [romeo]);
const { rows: gratis } = await criar([{ produto_id: romeo, quantidade: 2 }], "local", "cartao");
ok(gratis[0].total_centavos === 80000, "frete grátis acima do valor configurado", String(gratis[0].total_centavos));

// ============================================================
// quem pode chamar as funções
// ============================================================
console.log("\nPermissões:");

const { rows: perm } = await db.query(`
  select
    has_function_privilege('anon', 'confirmar_pedido(uuid,text,text)', 'execute') as anon_confirma,
    has_function_privilege('authenticated', 'confirmar_pedido(uuid,text,text)', 'execute') as auth_confirma,
    has_function_privilege('anon', 'reservar_estoque(jsonb)', 'execute') as anon_reserva,
    has_function_privilege('anon', 'criar_pedido(jsonb,entrega_tipo,jsonb,jsonb,text)', 'execute') as anon_cria,
    has_function_privilege('anon', 'cancelar_pedido(uuid)', 'execute') as anon_cancela,
    has_function_privilege('service_role', 'confirmar_pedido(uuid,text,text)', 'execute') as srv_confirma,
    has_function_privilege('service_role', 'criar_pedido(jsonb,entrega_tipo,jsonb,jsonb,text)', 'execute') as srv_cria,
    has_function_privilege('authenticated', 'cancelar_pedido(uuid)', 'execute') as auth_cancela
`);
const pr = perm[0];
ok(!pr.anon_confirma && !pr.auth_confirma, "visitante NÃO consegue marcar pedido como pago");
ok(!pr.anon_reserva && !pr.anon_cria, "visitante NÃO reserva estoque nem cria pedido direto no banco");
ok(!pr.anon_cancela && pr.auth_cancela, "cancelar só com login (e a função ainda checa se é admin)");
ok(pr.srv_confirma && pr.srv_cria, "o servidor do site continua podendo tudo");

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

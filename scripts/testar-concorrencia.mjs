/**
 * Testa a corrida de verdade: duas transações simultâneas disputando o mesmo
 * óculos de 1 unidade.
 *
 * Isto é o que o teste em PGlite NÃO consegue fazer — lá roda uma conexão só.
 * Aqui são duas conexões reais contra o Postgres do Supabase local, com as
 * transações abertas ao mesmo tempo, que é o cenário que acontece quando dois
 * clientes clicam "comprar" no mesmo segundo.
 *
 * Requer: npx supabase start
 * uso: node scripts/testar-concorrencia.mjs
 */
import pg from "pg";

const CONEXAO = "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

// Sem isto, uma query que fique esperando um lock pendura o teste pra sempre —
// e é justamente disputa de lock que se está testando aqui.
const OPCOES = {
  connectionString: CONEXAO,
  connectionTimeoutMillis: 8000,
  options: "-c statement_timeout=10000 -c lock_timeout=8000",
};

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

const admin = new pg.Client(OPCOES);
await admin.connect();

// produto limpo pra cada rodada
await admin.query(`delete from pedido_itens; delete from pedidos; delete from produtos where slug like 'teste-%'`);
const { rows: criado } = await admin.query(`
  insert into produtos (slug, nome, preco_centavos, estoque)
  values ('teste-corrida', 'Teste Corrida', 40000, 1) returning id
`);
const produtoId = criado[0].id;

async function criarPedido(nome) {
  const { rows } = await admin.query(
    `insert into pedidos (cliente_nome, cliente_email, cliente_telefone,
                          subtotal_centavos, total_centavos)
     values ($1,'a@b.com','119','40000','40000') returning id`,
    [nome]
  );
  await admin.query(
    `insert into pedido_itens (pedido_id, produto_id, nome_snapshot,
                               preco_snapshot_centavos, quantidade)
     values ($1,$2,'Teste',40000,1)`,
    [rows[0].id, produtoId]
  );
  return rows[0].id;
}

await criarPedido("A");
await criarPedido("B");

const itens = JSON.stringify([{ produto_id: produtoId, quantidade: 1 }]);

// ============================================================
console.log("Dois clientes clicam comprar no mesmo instante (estoque = 1):");

const c1 = new pg.Client(OPCOES);
const c2 = new pg.Client(OPCOES);
await c1.connect();
await c2.connect();

/**
 * Cada transação commita sozinha, dentro da própria promise.
 *
 * Não dá pra esperar a primeira e só então commitar: a que fica bloqueada no
 * lock pode ser justamente a primeira, e aí ninguém avança — o teste trava sem
 * que haja nada errado com o código sendo testado.
 */
async function tentarReservar(cliente) {
  await cliente.query("begin");
  try {
    await cliente.query(`select reservar_estoque($1::jsonb)`, [itens]);
    await cliente.query("commit");
    return "reservou";
  } catch (e) {
    await cliente.query("rollback").catch(() => {});
    return String(e.message).includes("SEM_ESTOQUE") ? "recusado" : `erro: ${e.message}`;
  }
}

// as duas disputam a mesma linha ao mesmo tempo
const [primeiro, segundo] = await Promise.all([
  tentarReservar(c1),
  tentarReservar(c2),
]);

console.log(`  conexão 1: ${primeiro}`);
console.log(`  conexão 2: ${segundo}`);

const reservaram = [primeiro, segundo].filter((r) => r === "reservou").length;
const recusados = [primeiro, segundo].filter((r) => r === "recusado").length;

ok(reservaram === 1, "exatamente uma reserva vence a corrida", `${reservaram} reservaram`);
ok(recusados === 1, "a outra é recusada com SEM_ESTOQUE", `${recusados} recusadas`);

const { rows: estado } = await admin.query(
  `select estoque, reservado, disponivel from produtos where id=$1`,
  [produtoId]
);
ok(
  estado[0].reservado === 1 && estado[0].disponivel === 0,
  "o estoque fica consistente depois da disputa",
  JSON.stringify(estado[0])
);

// ============================================================
console.log("\nDez clientes ao mesmo tempo, estoque = 3:");

await admin.query(`update produtos set estoque = 3, reservado = 0 where id = $1`, [produtoId]);

const conexoes = await Promise.all(
  Array.from({ length: 10 }, async () => {
    const c = new pg.Client(OPCOES);
    await c.connect();
    return c;
  })
);

const resultados = await Promise.all(
  conexoes.map((c) =>
    c
      .query(`select reservar_estoque($1::jsonb)`, [itens])
      .then(() => "reservou")
      .catch(() => "recusado")
  )
);

const venceram = resultados.filter((r) => r === "reservou").length;
console.log(`  ${venceram} reservaram, ${10 - venceram} recusados`);
ok(venceram === 3, "só três passam — nem uma a mais que o estoque", `${venceram} passaram`);

const { rows: final } = await admin.query(
  `select estoque, reservado, disponivel from produtos where id=$1`,
  [produtoId]
);
ok(
  final[0].reservado === 3 && final[0].disponivel === 0,
  "reservado bate exatamente com o estoque",
  JSON.stringify(final[0])
);

await Promise.all(conexoes.map((c) => c.end()));
await c1.end();
await c2.end();

// limpeza
await admin.query(`delete from pedido_itens; delete from pedidos; delete from produtos where slug like 'teste-%'`);
await admin.end();

console.log(`\n${passou} passaram, ${falhou} falharam`);
process.exit(falhou > 0 ? 1 : 0);

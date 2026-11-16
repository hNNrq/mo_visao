/**
 * Testa a compra de ponta a ponta, pelo navegador, num celular.
 *
 * Percorre: produto → carrinho → fechamento → página do pedido → "meus
 * pedidos" → painel do dono, mais o webhook e as travas da chave pública.
 *
 * O que NÃO cobre: o pagamento aprovado DENTRO do Mercado Pago. Sem token de
 * teste do MP, a aprovação é simulada chamando `confirmar_pedido()` no banco —
 * que é exatamente o que o webhook chama depois de reler o pagamento no MP.
 * Com MERCADOPAGO_ACCESS_TOKEN de teste no ambiente, o passo "sem MP" vira
 * redirecionamento pro checkout, e o teste avisa.
 *
 * Requer: npx supabase start + npm run local:semear + produtos na vitrine
 *         (um com 1 unidade, slug juliet-x-metal) + npm run dev
 *         com MERCADOPAGO_WEBHOOK_SECRET=segredo-teste
 * uso: node scripts/testar-checkout.mjs
 */
import { createHmac } from "node:crypto";
import { chromium } from "playwright";
import pg from "pg";

const SITE = "http://localhost:3000";
const SLUG = "juliet-x-metal";
const ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

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

const db = new pg.Client("postgresql://postgres:postgres@127.0.0.1:54322/postgres");
await db.connect();
const um = async (sql, args = []) => (await db.query(sql, args)).rows[0];

const { id: produtoId } = await um(`select id from produtos where slug = $1`, [SLUG]);
await db.query(`update produtos set estoque = 1, reservado = 0, ativo = true where id = $1`, [produtoId]);
await db.query(`update pedidos set status = 'cancelado' where status = 'pendente'`);

const navegador = await chromium.launch();
const contexto = await navegador.newContext({ viewport: { width: 390, height: 844 } });
const pagina = await contexto.newPage();
const errosConsole = [];
pagina.on("pageerror", (e) => errosConsole.push(e.message));

async function criarPedidoDireto() {
  return um(
    `select * from criar_pedido($1::jsonb, 'retirada', '{}'::jsonb, $2::jsonb)`,
    [
      JSON.stringify({ nome: "Outra Pessoa", email: "outra@teste.com", telefone: "11911112222" }),
      JSON.stringify([{ produto_id: produtoId, quantidade: 1 }]),
    ],
  );
}

try {
  // ============================================================
  console.log("Produto → carrinho:");

  await pagina.goto(`${SITE}/produtos/${SLUG}`, { waitUntil: "networkidle" });
  await pagina.getByRole("button", { name: "Comprar" }).click();
  await pagina.waitForURL("**/carrinho");
  await pagina.getByText("O que você leva").waitFor();
  ok(true, "Comprar leva pro carrinho");
  ok(await pagina.getByText("Juliet X-Metal").first().isVisible(), "o óculos está no carrinho");
  ok(
    (await pagina.locator("header").innerText()).includes("1"),
    "o contador do header mostra 1 peça",
  );

  await pagina.goto(`${SITE}/produtos/${SLUG}`, { waitUntil: "networkidle" });
  ok(
    await pagina.getByRole("button", { name: "Ir pro carrinho" }).isVisible(),
    "com a peça já no carrinho, o botão vira 'Ir pro carrinho' (não soma de novo)",
  );
  await pagina.getByRole("button", { name: "Ir pro carrinho" }).click();
  await pagina.waitForURL("**/carrinho");
  await pagina.getByText("O que você leva").waitFor();

  // ============================================================
  console.log("\nTotal e entrega:");

  const botaoPagar = pagina.getByRole("button", { name: /^Pagar/ });
  // Correios é o padrão; a cotação real (Melhor Envio) não roda aqui — sem ela,
  // o botão de pagar não pode liberar
  ok(await botaoPagar.isDisabled(), "Correios: sem calcular o frete, não dá pra pagar");
  ok(await pagina.getByText("Calcula o frete com teu CEP").isVisible(), "e a tela diz o que falta");
  await pagina.getByText("Retirada", { exact: true }).click();
  ok((await botaoPagar.innerText()).includes("599,00"), "retirada: total é o preço da peça", await botaoPagar.innerText());

  await pagina.fill('input[name="nome"]', "Ana Teste");
  await pagina.fill('input[name="telefone"]', "(11) 98888-7777");
  await pagina.fill('input[name="email"]', "Ana@Teste.com");

  // ============================================================
  console.log("\nOutra pessoa reserva a única unidade antes:");

  const deOutro = await criarPedidoDireto();
  await botaoPagar.click();
  await pagina.locator("main [role=alert]").waitFor();
  ok(
    (await pagina.locator("main [role=alert]").innerText()).includes("acabou de sair"),
    "o fechamento é recusado com mensagem clara",
    await pagina.locator("main [role=alert]").innerText(),
  );
  await pagina.getByText("Esgotado").first().waitFor({ timeout: 5000 }).catch(() => {});
  ok(await pagina.getByText("Esgotado").first().isVisible(), "a peça aparece como esgotada no carrinho");
  ok(await botaoPagar.isDisabled(), "o botão de pagar trava enquanto houver peça esgotada");
  ok(
    (await pagina.inputValue('input[name="nome"]')) === "Ana Teste",
    "o que a pessoa digitou continua no formulário",
  );

  // a outra pessoa não paga; a reserva vence
  await db.query(`update pedidos set expira_em = now() - interval '1 minute' where id = $1`, [deOutro.id]);
  await db.query(`select liberar_reservas_expiradas()`);

  // ============================================================
  console.log("\nFechar o pedido:");

  await pagina.reload({ waitUntil: "networkidle" });
  await pagina.getByText("O que você leva").waitFor();
  await pagina.getByText("Retirada", { exact: true }).click();
  await pagina.fill('input[name="nome"]', "Ana Teste");
  await pagina.fill('input[name="telefone"]', "(11) 98888-7777");
  await pagina.fill('input[name="email"]', "Ana@Teste.com");

  const temMP = !!process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (temMP) {
    await Promise.all([
      pagina.waitForURL(/mercadopago/, { timeout: 30000 }),
      pagina.getByRole("button", { name: /^Pagar/ }).click(),
    ]);
    ok(true, "com token de teste, vai pro checkout do Mercado Pago");
  } else {
    await pagina.getByRole("button", { name: /^Pagar/ }).click();
    await pagina.locator("main [role=alert]").waitFor();
    ok(
      (await pagina.locator("main [role=alert]").innerText()).includes("pagamento não abriu"),
      "sem Mercado Pago configurado, avisa que nada foi cobrado",
      await pagina.locator("main [role=alert]").innerText(),
    );
    const p = await um(`select reservado from produtos where id = $1`, [produtoId]);
    ok(p.reservado === 0, "e a reserva é devolvida na hora (não segura a peça 30 min)", `reservado=${p.reservado}`);
    const ped = await um(`select status, cliente_email, total_centavos from pedidos order by created_at desc limit 1`);
    ok(
      ped.status === "expirado" && ped.cliente_email === "ana@teste.com" && ped.total_centavos === 61400,
      "o pedido ficou gravado com total do banco e email em minúsculas, e vencido",
      JSON.stringify(ped),
    );
  }

  // ============================================================
  console.log("\nPágina do pedido:");

  const pedido = await criarPedidoDireto();
  const urlPedido = `${SITE}/pedido/${pedido.numero}?k=${pedido.token}`;

  const semToken = await pagina.goto(`${SITE}/pedido/${pedido.numero}?k=${"0".repeat(64)}`);
  ok(semToken.status() === 404, "token errado dá 404 (número sozinho não abre pedido)", `status=${semToken.status()}`);

  await pagina.goto(urlPedido, { waitUntil: "networkidle" });
  ok(await pagina.getByRole("heading", { name: "Esperando o pagamento" }).isVisible(), "pendente: 'Esperando o pagamento'");
  ok(await pagina.getByText(/Peça guardada até/).isVisible(), "mostra até quando a peça fica guardada");

  const carrinhoAntes = await pagina.evaluate(() => localStorage.getItem("mv:carrinho"));
  ok(carrinhoAntes?.includes(produtoId), "enquanto não paga, o carrinho continua cheio");

  // o que o webhook faz depois de reler o pagamento aprovado no MP
  const r = await um(`select confirmar_pedido($1, $2, 'pix') as r`, [pedido.id, String(Date.now())]);
  ok(r.r === "confirmado", "pagamento confirmado no banco");

  // a própria página se relê a cada 5s enquanto espera
  await pagina.getByRole("heading", { name: "Pagamento confirmado" }).waitFor({ timeout: 15000 });
  ok(true, "a página vira 'Pagamento confirmado' sozinha, sem recarregar");
  const zap = await pagina.getByRole("link", { name: /WhatsApp/ }).getAttribute("href");
  ok(zap?.startsWith("https://wa.me/5511987654321?text=") && zap.includes(pedido.numero), "botão de WhatsApp com o número do pedido", zap);
  await pagina.waitForFunction(() => (localStorage.getItem("mv:carrinho") ?? "[]") === "[]", null, { timeout: 5000 }).catch(() => {});
  ok(
    (await pagina.evaluate(() => localStorage.getItem("mv:carrinho"))) === "[]",
    "pago: o carrinho esvazia",
  );
  const est = await um(`select estoque, reservado from produtos where id = $1`, [produtoId]);
  ok(est.estoque === 0 && est.reservado === 0, "estoque baixou de 1 pra 0", JSON.stringify(est));

  // ============================================================
  console.log("\nMeus pedidos:");

  await pagina.goto(`${SITE}/pedidos`, { waitUntil: "networkidle" });
  ok(await pagina.getByText(pedido.numero).isVisible(), "o pedido aparece em 'Feitos neste aparelho'");

  const outra = await contexto.browser().newPage({ viewport: { width: 390, height: 844 } });
  await outra.goto(`${SITE}/pedidos`, { waitUntil: "networkidle" });
  await outra.fill('input[name="numero"]', pedido.numero.replace("MV-", "").replace(/^0+/, ""));
  await outra.fill('input[name="email"]', "errado@teste.com");
  await outra.getByRole("button", { name: "Buscar" }).click();
  await outra.locator("main [role=alert]").waitFor();
  ok((await outra.locator("main [role=alert]").innerText()).includes("Não achamos"), "email errado não abre o pedido");
  await outra.fill('input[name="email"]', "OUTRA@teste.com");
  await Promise.all([outra.waitForURL(/\/pedido\/MV-/), outra.getByRole("button", { name: "Buscar" }).click()]);
  ok(outra.url().includes(`k=${pedido.token}`), "número (sem o MV-) + email abrem o pedido em outro aparelho");
  await outra.close();

  const conta = await pagina.goto(`${SITE}/conta`);
  ok(pagina.url().endsWith("/pedidos"), "/conta redireciona pra /pedidos", `${conta.status()} ${pagina.url()}`);

  // ============================================================
  console.log("\nVitrine depois da venda:");

  await pagina.goto(`${SITE}/produtos/${SLUG}`, { waitUntil: "networkidle" });
  ok(await pagina.getByText("Esgotado").first().isVisible(), "a peça vendida aparece esgotada");

  // ============================================================
  console.log("\nPainel do dono:");

  await pagina.goto(`${SITE}/admin/entrar`, { waitUntil: "networkidle" });
  await pagina.fill('input[name="email"]', "dono@movisao.teste");
  await pagina.fill('input[name="senha"]', "movisao123");
  await pagina.getByRole("button", { name: /^Entrar/ }).click();
  await pagina.waitForURL("**/admin/produtos", { timeout: 20000 });
  await pagina.goto(`${SITE}/admin/pedidos`, { waitUntil: "networkidle" });
  const painel = await pagina.locator("main").innerText();
  ok(painel.includes(pedido.numero) && /Pago — separar/i.test(painel), "o pedido pago aparece pra separar", painel.slice(0, 120));
  ok(painel.includes("· Pix"), "a forma de pagamento aparece com nome legível (Pix)");

  await pagina.goto(`${SITE}/admin/config`, { waitUntil: "networkidle" });
  await pagina.fill('input[name="frete_gratis_acima_centavos"]', "20");
  await pagina.fill('input[name="cep_origem"]', "30130-000");
  await pagina.getByRole("button", { name: "Salvar ajustes" }).click();
  await pagina.getByText("Ajustes salvos").waitFor();
  const cfg = await um(`select valor from config where chave = 'frete_gratis_acima_centavos'`);
  ok(Number(cfg.valor) === 2000, "o dono digita 20 e o banco guarda 2000 centavos", JSON.stringify(cfg.valor));
  const origem = await um(`select valor from config where chave = 'cep_origem'`);
  ok(origem?.valor === "30130-000", "o CEP de origem fica salvo", JSON.stringify(origem?.valor));
  await db.query(`update config set valor = '0' where chave = 'frete_gratis_acima_centavos'`);
  ok(!(await pagina.locator("main").innerText()).includes("Desconto no Pix"), "o campo de desconto no Pix saiu");

  // ============================================================
  console.log("\nWebhook:");

  const webhook = (corpo, headers = {}) =>
    fetch(`${SITE}/api/mercadopago/webhook`, {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify(corpo),
    });

  let resp = await webhook({ type: "merchant_order", data: { id: "1" } });
  ok(resp.status === 200, "notificação que não é de pagamento: 200 e nada muda");

  resp = await webhook({ type: "payment", data: { id: "123" } });
  ok(resp.status === 401, "pagamento sem assinatura: 401", `status=${resp.status}`);

  const ts = String(Date.now());
  const falsa = createHmac("sha256", "outro-segredo").update(`id:123;request-id:abc;ts:${ts};`).digest("hex");
  resp = await webhook({ type: "payment", data: { id: "123" } }, { "x-signature": `ts=${ts},v1=${falsa}`, "x-request-id": "abc" });
  ok(resp.status === 401, "assinatura com segredo errado: 401", `status=${resp.status}`);

  const certa = createHmac("sha256", "segredo-teste").update(`id:123;request-id:abc;ts:${ts};`).digest("hex");
  resp = await webhook({ type: "payment", data: { id: "123" } }, { "x-signature": `ts=${ts},v1=${certa}`, "x-request-id": "abc" });
  ok(
    temMP ? resp.status === 200 : resp.status === 500,
    temMP
      ? "assinatura certa, pagamento inexistente no MP: 200 (não adianta reenviar)"
      : "assinatura certa passa; sem token do MP responde 500 pro MP tentar de novo",
    `status=${resp.status}`,
  );

  // ============================================================
  console.log("\nChave pública (a do navegador):");

  const rest = (caminho, init = {}) =>
    fetch(`http://127.0.0.1:54321/rest/v1/${caminho}`, {
      ...init,
      headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, "content-type": "application/json" },
    });
  resp = await rest("pedidos?select=cliente_email");
  const lidos = resp.ok ? await resp.json() : [];
  ok(!resp.ok || lidos.length === 0, "não lê pedido de ninguém", `status=${resp.status} linhas=${lidos.length}`);
  resp = await rest("rpc/reservar_estoque", { method: "POST", body: JSON.stringify({ p_itens: [] }) });
  ok(resp.status === 401 || resp.status === 403, "não chama reservar_estoque()", `status=${resp.status}`);
  resp = await rest("produtos?select=nome&limit=1");
  ok(resp.ok && (await resp.json()).length === 1, "continua lendo a vitrine");

  ok(errosConsole.length === 0, "nenhum erro de JavaScript no navegador", errosConsole.join(" | "));
} catch (e) {
  falhou++;
  console.log(`  FALHA o teste parou: ${e.message.split("\n")[0]}`);
  await pagina.screenshot({ path: "scripts/.falha-checkout.png", fullPage: true }).catch(() => {});
} finally {
  await navegador.close();
  await db.end();
}

console.log(`\n${passou} passaram, ${falhou} falharam`);
process.exit(falhou > 0 ? 1 : 0);

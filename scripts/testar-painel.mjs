/**
 * Testa o painel de ponta a ponta, pelo navegador, como o dono usaria.
 *
 * Percorre o caminho real: entrar, cadastrar um óculos, subir foto, marcar
 * destaque, conferir que apareceu na loja, ajustar o preço direto na lista e
 * conferir que o preço novo chegou na vitrine.
 *
 * Requer: npx supabase start + npm run dev
 * uso: node scripts/testar-painel.mjs
 */
import { chromium } from "playwright";
import pg from "pg";

const SITE = "http://localhost:3000";
const EMAIL = "dono@movisao.teste";
const SENHA = "movisao123";
const FOTO = "../produtos/oculos-preto.png";
const NOME = `Teste E2E ${Date.now()}`;

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

const navegador = await chromium.launch();
// tela de celular: é assim que o dono vai usar
const pagina = await navegador.newPage({ viewport: { width: 390, height: 844 } });

try {
  // ============================================================
  console.log("Entrar no painel:");

  await pagina.goto(`${SITE}/admin/produtos`, { waitUntil: "networkidle" });
  ok(pagina.url().includes("/admin/entrar"), "sem sessão, é mandado pro login", pagina.url());

  await pagina.fill('input[name="email"]', EMAIL);
  await pagina.fill('input[name="senha"]', SENHA);
  await pagina.getByRole("button", { name: /^Entrar/ }).click();
  await pagina.waitForURL("**/admin/produtos", { timeout: 20000 });
  ok(true, "entrou e caiu na lista de produtos");

  // ============================================================
  console.log("\nCadastrar um óculos:");

  await pagina.click('a[href="/admin/produtos/novo"]');
  await pagina.waitForURL("**/admin/produtos/novo");

  await pagina.fill('input[name="nome"]', NOME);
  await pagina.fill('input[name="preco"]', "349,90");
  await pagina.fill('input[name="estoque"]', "2");
  await pagina.fill('input[name="modelo"]', "Prizm Road");
  await pagina.check('input[name="destaque"]');
  // pelo nome, não por 'button[type=submit]': o botão "Sair" do cabeçalho
  // do painel vem antes no DOM e seria clicado no lugar
  await pagina.getByRole("button", { name: /Cadastrar óculos/ }).click();

  await pagina.waitForURL(/\/admin\/produtos\/[0-9a-f-]{36}/, { timeout: 20000 });
  const idProduto = pagina.url().match(/produtos\/([0-9a-f-]{36})/)[1];
  ok(!!idProduto, "produto criado e abriu a tela de edição");

  const avisoSalvo = await pagina.getByText("Salvo.").isVisible().catch(() => false);
  ok(avisoSalvo, "mostra confirmação de que salvou");

  // ============================================================
  console.log("\nSubir foto:");

  await pagina.setInputFiles("#entrada-fotos", FOTO);
  await pagina.waitForSelector('img[alt=""]', { timeout: 40000 });
  await pagina.waitForTimeout(2500);

  const fotos = await pagina.locator("text=Capa").count();
  ok(fotos === 1, "a primeira foto vira capa", `${fotos} capas`);

  /**
   * Conferir que a imagem CARREGOU, não só que o cartão apareceu.
   * `naturalWidth === 0` é imagem quebrada — foi assim que passou despercebido
   * que o Next 16 bloqueia otimizar imagem vinda de IP local.
   */
  const carregou = await pagina.evaluate(() => {
    const imgs = [...document.querySelectorAll("img")];
    return imgs.length > 0 && imgs.every((i) => i.complete && i.naturalWidth > 0);
  });
  ok(carregou, "a foto carrega de verdade (não fica quebrada)");

  // ============================================================
  console.log("\nA loja recebeu o produto:");

  await pagina.goto(`${SITE}/produtos`, { waitUntil: "networkidle" });
  const naVitrine = await pagina.getByText(NOME).first().isVisible().catch(() => false);
  ok(naVitrine, "aparece no catálogo");

  const precoNoCatalogo = await pagina.getByText("R$ 349,90").first().isVisible().catch(() => false);
  ok(precoNoCatalogo, "com o preço certo");

  await pagina.goto(SITE, { waitUntil: "networkidle" });
  const naHome = await pagina.getByText(NOME).first().isVisible().catch(() => false);
  ok(naHome, "e nos destaques da página inicial (marcado como destaque)");

  // ============================================================
  console.log("\nMudar o preço direto na lista:");

  await pagina.goto(`${SITE}/admin/produtos`, { waitUntil: "networkidle" });
  await pagina.getByRole("button", { name: /Preço/ }).first().click();
  const campo = pagina.locator('input[inputmode="decimal"]').first();
  await campo.fill("299,00");
  await campo.press("Enter");
  await pagina.waitForTimeout(3000);

  await pagina.goto(`${SITE}/produtos`, { waitUntil: "networkidle" });
  const precoNovo = await pagina.getByText("R$ 299,00").first().isVisible().catch(() => false);
  ok(precoNovo, "o preço novo chega na loja sem republicar nada");

  // ============================================================
  console.log("\nEsconder da loja:");

  await pagina.goto(`${SITE}/admin/produtos`, { waitUntil: "networkidle" });
  await pagina.getByRole("switch", { name: "Visível na loja" }).first().click();
  await pagina.waitForTimeout(3000);

  await pagina.goto(`${SITE}/produtos`, { waitUntil: "networkidle" });
  const sumiu = !(await pagina.getByText(NOME).first().isVisible().catch(() => false));
  ok(sumiu, "produto oculto some do catálogo");

  // ============================================================
  console.log("\nProteção das ações:");

  // Server Action chamada direto, sem sessão: tem que ser barrada
  const semSessao = await navegador.newContext();
  const resposta = await semSessao.request.post(`${SITE}/admin/produtos`, {
    headers: { "Next-Action": "x", "content-type": "text/plain;charset=UTF-8" },
    data: "[]",
    failOnStatusCode: false,
  });
  ok(resposta.status() >= 300, "POST direto no painel sem sessão não passa", `status ${resposta.status()}`);
  await semSessao.close();

  // ============================================================
  // limpeza
  const db = new pg.Client({
    connectionString: "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
  });
  await db.connect();
  await db.query(`delete from produtos where nome like 'Teste E2E %'`);
  await db.end();
} finally {
  await navegador.close();
}

console.log(`\n${passou} passaram, ${falhou} falharam`);
process.exit(falhou > 0 ? 1 : 0);

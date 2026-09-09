/**
 * Cria o usuário do dono no Supabase LOCAL e o marca como admin.
 * Só faz sentido em desenvolvimento — em produção o usuário é criado no painel
 * do Supabase, no projeto do dono.
 *
 * uso: node scripts/semear-local.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

for (const linha of readFileSync(".env.local", "utf8").split("\n")) {
  const m = linha.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2];
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!url?.includes("127.0.0.1")) {
  console.error("Isto só roda contra o Supabase local. Abortando.");
  process.exit(1);
}

const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const EMAIL = "dono@movisao.teste";
const SENHA = "movisao123";

const { data: existentes } = await admin.auth.admin.listUsers();
let user = existentes.users.find((u) => u.email === EMAIL);

if (!user) {
  const { data, error } = await admin.auth.admin.createUser({
    email: EMAIL,
    password: SENHA,
    email_confirm: true,
  });
  if (error) throw error;
  user = data.user;
  console.log("usuário criado:", EMAIL);
} else {
  console.log("usuário já existia:", EMAIL);
}

const { error: e2 } = await admin
  .from("admins")
  .upsert({ user_id: user.id, nome: "Mó Visão" }, { onConflict: "user_id" });
if (e2) throw e2;

console.log("marcado como admin");
console.log(`\nentre em http://localhost:3000/admin/entrar`);
console.log(`  e-mail: ${EMAIL}`);
console.log(`  senha:  ${SENHA}`);

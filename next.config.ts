import type { NextConfig } from "next";

/**
 * O host das fotos sai da própria URL do Supabase.
 *
 * Protocolo e porta são derivados junto, e não fixados em https: o Supabase
 * local serve em `http://127.0.0.1:54321`, e com o protocolo cravado o
 * `next/image` recusa a foto e derruba a página do produto. Em produção a URL
 * é https sem porta, e o resultado é o mesmo de antes.
 *
 * Sem a variável (build sem ambiente), cai no curinga e o build não quebra.
 */
const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL)
  : null;

/**
 * O Next 16 bloqueia otimizar imagem hospedada em IP local — é proteção contra
 * SSRF, e a regra é boa. Só que o Supabase de desenvolvimento roda justamente
 * em 127.0.0.1, e sem a exceção nenhuma foto de produto carrega na máquina.
 *
 * Por isso a exceção é condicionada ao host ser local: quando as credenciais
 * de produção entrarem (um domínio .supabase.co), ela se desliga sozinha. Não
 * é uma flag que alguém precise lembrar de tirar antes de publicar.
 */
const hostEhLocal = ["127.0.0.1", "localhost", "::1"].includes(
  supabase?.hostname ?? ""
);

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: (supabase?.protocol.replace(":", "") ?? "https") as "http" | "https",
        hostname: supabase?.hostname ?? "**.supabase.co",
        ...(supabase?.port ? { port: supabase.port } : {}),
        pathname: "/storage/v1/object/public/**",
      },
    ],
    ...(hostEhLocal ? { dangerouslyAllowLocalIP: true } : {}),
    // Next 16 passou a aceitar só quality 75 por padrão.
    // 75 serve o grid; 90 é pro zoom da galeria do produto.
    qualities: [75, 90],
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;

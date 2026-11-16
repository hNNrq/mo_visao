import type { MetadataRoute } from "next";
import { urlDoSite } from "@/lib/mercadopago";
import { listarProdutos } from "@/lib/produtos";

// produto novo entra no mapa em até uma hora, sem depender de deploy
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = urlDoSite();
  const produtos = await listarProdutos();

  return [
    { url: site },
    { url: `${site}/produtos` },
    ...produtos.map((p) => ({
      url: `${site}/produtos/${p.slug}`,
      lastModified: p.updated_at,
    })),
    { url: `${site}/trocas-e-devolucoes` },
    { url: `${site}/privacidade` },
  ];
}

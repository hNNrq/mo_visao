import type { MetadataRoute } from "next";
import { urlDoSite } from "@/lib/mercadopago";

/** Painel, carrinho e pedidos não têm o que fazer no Google. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api", "/carrinho", "/conta", "/pedido", "/pedidos"],
    },
    sitemap: `${urlDoSite()}/sitemap.xml`,
  };
}

import type { Metadata } from "next";
import { Carrinho } from "@/componentes/Carrinho";
import { lerConfig } from "@/lib/produtos";

export const metadata: Metadata = { title: "Carrinho", robots: { index: false } };

// frete e texto de entrega vêm do painel do dono e mudam sem deploy
export const dynamic = "force-dynamic";

export default async function PaginaCarrinho() {
  const config = await lerConfig();
  const numero = (chave: string, padrao: number) => {
    const v = Number(config[chave]);
    return Number.isFinite(v) ? v : padrao;
  };

  return (
    <Carrinho
      entregaTexto={String(config.entrega_texto ?? "")}
      freteLocalCentavos={numero("frete_local_centavos", 0)}
      freteGratisAcimaCentavos={numero("frete_gratis_acima_centavos", 0)}
      reservaMinutos={numero("reserva_minutos", 30)}
    />
  );
}

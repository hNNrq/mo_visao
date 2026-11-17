import type { Metadata } from "next";
import { Carrinho } from "@/componentes/Carrinho";
import { pagamentoConfigurado } from "@/lib/mercadopago";
import { freteConfigurado } from "@/lib/frete";
import { lerConfig } from "@/lib/produtos";

export const metadata: Metadata = { title: "Carrinho", robots: { index: false } };

// frete e desconto são do dono e mudam pelo painel: nada de página congelada
export const dynamic = "force-dynamic";

const numero = (v: unknown, padrao = 0) => (Number.isFinite(Number(v)) ? Number(v) : padrao);

export default async function PaginaCarrinho() {
  const config = await lerConfig();

  return (
    <Carrinho
      config={{
        descontoPixPct: numero(config.desconto_pix_pct),
        freteGratisAcimaCentavos: numero(config.frete_gratis_acima_centavos),
        // o painel salva texto ("true"); a migration semeia booleano
        freteGratisCorreios: String(config.frete_gratis_correios) === "true",
        freteLigado: freteConfigurado(),
        entregaTexto: String(config.entrega_texto ?? ""),
        parcelasSemJuros: numero(config.parcelas_sem_juros, 3),
        pagamentoLigado: pagamentoConfigurado(),
      }}
    />
  );
}

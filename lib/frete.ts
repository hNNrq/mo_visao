import "server-only";

/**
 * Frete pelos Correios, pro Brasil todo.
 *
 * A API dos próprios Correios exige contrato desde 2023 (o webservice aberto,
 * CalcPrecoPrazo, foi desligado). Quem cota PAC e SEDEX sem contrato é o
 * Melhor Envio — e o preço que ele devolve é o da etiqueta comprada lá, mais
 * barato que o de balcão. 🔴 Por isso o dono gera a etiqueta no Melhor Envio:
 * se postar pagando no balcão, paga mais do que o cliente pagou de frete.
 *
 * A conta do Melhor Envio é do DONO, como todas as outras. O token dele fica em
 * MELHORENVIO_TOKEN; MELHORENVIO_SANDBOX=1 aponta pro ambiente de teste.
 *
 * Nada aqui confia no navegador: quem fecha o pedido chama `cotarCorreios` de
 * novo e usa o preço desta resposta, não o que a tela mostrou.
 */

/**
 * O pacote de UM óculos: estojo dentro de caixa. Medida de referência, pesada
 * à mão — se a caixa que o dono usa for outra, é aqui que muda. Errar pra
 * menos faz o Melhor Envio cobrar diferença na postagem.
 */
const PACOTE = { largura: 12, altura: 8, comprimento: 20, pesoKg: 0.3 };

// ids do Melhor Envio pros serviços dos Correios
const SERVICOS = { 1: "PAC", 2: "SEDEX" } as const;

export type OpcaoFrete = {
  servico: number;
  nome: string;
  precoCentavos: number;
  prazoDias: number;
};

export type Endereco = {
  rua: string;
  bairro: string;
  cidade: string;
  uf: string;
};

export function limparCep(cep: string): string {
  return cep.replace(/\D/g, "");
}

function urlBase() {
  return process.env.MELHORENVIO_SANDBOX === "1"
    ? "https://sandbox.melhorenvio.com.br"
    : "https://melhorenvio.com.br";
}

/**
 * Cota PAC e SEDEX.
 *
 * Estoura com código, e quem chama traduz pro cliente:
 * - FRETE_SEM_CONFIG: falta token ou CEP de origem (problema da loja, não do cliente)
 * - FRETE_FALHOU: Melhor Envio fora do ar ou recusou
 */
export async function cotarCorreios(d: {
  cepOrigem: string;
  cepDestino: string;
  itens: { id: string; quantidade: number; precoCentavos: number }[];
}): Promise<OpcaoFrete[]> {
  const token = process.env.MELHORENVIO_TOKEN;
  const origem = limparCep(d.cepOrigem);
  if (!token || origem.length !== 8) throw new Error("FRETE_SEM_CONFIG");

  const resposta = await fetch(`${urlBase()}/api/v2/me/shipment/calculate`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      // o Melhor Envio exige nome da aplicação e um email de contato aqui
      "User-Agent": `Mo Visao (${process.env.EMAIL_DONO || "loja"})`,
    },
    body: JSON.stringify({
      from: { postal_code: origem },
      to: { postal_code: limparCep(d.cepDestino) },
      products: d.itens.map((i) => ({
        id: i.id,
        width: PACOTE.largura,
        height: PACOTE.altura,
        length: PACOTE.comprimento,
        weight: PACOTE.pesoKg,
        // valor declarado: se o pacote some, os Correios devolvem o preço da peça
        insurance_value: i.precoCentavos / 100,
        quantity: i.quantidade,
      })),
      services: Object.keys(SERVICOS).join(","),
    }),
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });

  if (!resposta.ok) {
    console.error("[frete] Melhor Envio:", resposta.status, await resposta.text().catch(() => ""));
    throw new Error("FRETE_FALHOU");
  }

  const cotacoes = (await resposta.json()) as {
    id: number;
    error?: string;
    custom_price?: string;
    price?: string;
    custom_delivery_time?: number;
    delivery_time?: number;
  }[];

  // serviço que não atende o trecho vem com `error` e sem preço
  return cotacoes
    .filter((c) => c.id in SERVICOS && !c.error && (c.custom_price ?? c.price))
    .map((c) => ({
      servico: c.id,
      nome: SERVICOS[c.id as keyof typeof SERVICOS],
      precoCentavos: Math.round(Number(c.custom_price ?? c.price) * 100),
      prazoDias: c.custom_delivery_time ?? c.delivery_time ?? 0,
    }))
    .filter((o) => Number.isFinite(o.precoCentavos) && o.precoCentavos > 0)
    .sort((a, b) => a.precoCentavos - b.precoCentavos);
}

/**
 * Rua, bairro e cidade a partir do CEP (ViaCEP, aberto e sem chave).
 * `null` quando o CEP não existe; estoura só se o serviço estiver fora — e aí
 * o cliente digita o endereço na mão, a compra não para por isso.
 */
export async function buscarEndereco(cep: string): Promise<Endereco | null> {
  const resposta = await fetch(`https://viacep.com.br/ws/${limparCep(cep)}/json/`, {
    signal: AbortSignal.timeout(5000),
    cache: "no-store",
  });
  if (!resposta.ok) throw new Error("VIACEP_FALHOU");
  const e = (await resposta.json()) as {
    erro?: boolean | string;
    logradouro?: string;
    bairro?: string;
    localidade?: string;
    uf?: string;
  };
  if (e.erro) return null;
  return {
    rua: e.logradouro ?? "",
    bairro: e.bairro ?? "",
    cidade: e.localidade ?? "",
    uf: e.uf ?? "",
  };
}

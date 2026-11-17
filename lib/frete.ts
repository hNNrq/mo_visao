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
 * MELHORENVIO_TOKEN; MELHORENVIO_SANDBOX=1 aponta pro ambiente de teste. O CEP
 * de onde ele posta fica em MELHORENVIO_CEP_ORIGEM — variável de ambiente e
 * não `config`, porque a config é legível pela chave pública e o CEP aponta
 * pra casa dele.
 *
 * Nada aqui confia no navegador: quem fecha o pedido chama `cotarCorreios` de
 * novo e usa o preço desta resposta, não o que a tela mostrou.
 */

/**
 * O pacote de UM óculos: estojo dentro de caixa. Medida de referência, pesada
 * à mão — se a caixa que o dono usa for outra, é aqui que muda. Errar pra
 * menos faz o Melhor Envio cobrar diferença na postagem.
 *
 * ⏸️ Ainda é chute (nov/2026): falta o dono medir e pesar a caixa de verdade.
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

/** Sem token ou sem CEP de origem, o carrinho mostra só a retirada. */
export function freteConfigurado(): boolean {
  return Boolean(
    process.env.MELHORENVIO_TOKEN && limparCep(process.env.MELHORENVIO_CEP_ORIGEM ?? "").length === 8,
  );
}

/**
 * Cota PAC e SEDEX.
 *
 * Estoura com código, e quem chama traduz pro cliente:
 * - FRETE_SEM_CONFIG: falta token ou CEP de origem (problema da loja, não do cliente)
 * - FRETE_FALHOU: Melhor Envio fora do ar ou recusou
 */
export async function cotarCorreios(d: {
  cepDestino: string;
  itens: { id: string; quantidade: number; precoCentavos: number }[];
}): Promise<OpcaoFrete[]> {
  const token = process.env.MELHORENVIO_TOKEN;
  const origem = limparCep(process.env.MELHORENVIO_CEP_ORIGEM ?? "");
  if (!token || origem.length !== 8) throw new Error("FRETE_SEM_CONFIG");

  const resposta = await fetch(`${urlBase()}/api/v2/me/shipment/calculate`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      // o Melhor Envio exige nome da aplicação e um email de contato aqui
      "User-Agent": `Mo Visao (${process.env.AVISO_EMAIL_PARA || "movisao2026@gmail.com"})`,
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

/** CPF com os dois dígitos verificadores certos. Só dígitos na entrada. */
export function cpfValido(cpf: string): boolean {
  const d = cpf.replace(/\D/g, "");
  // 111.111.111-11 e afins passam na conta dos dígitos, mas não existem
  if (d.length !== 11 || new Set(d).size === 1) return false;
  for (const tamanho of [9, 10]) {
    let soma = 0;
    for (let i = 0; i < tamanho; i++) soma += Number(d[i]) * (tamanho + 1 - i);
    const digito = ((soma * 10) % 11) % 10;
    if (digito !== Number(d[tamanho])) return false;
  }
  return true;
}

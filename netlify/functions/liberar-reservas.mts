/**
 * Devolve pra loja as peças de pedido que venceu sem pagamento.
 *
 * Função AGENDADA da Netlify (roda sozinha, de 10 em 10 minutos; não tem
 * endereço público pra ninguém chamar). O `criar_pedido` já libera reserva
 * vencida antes de reservar, então isto não é o que impede venda — é o que
 * faz a vitrine voltar a mostrar a peça como disponível sem esperar o próximo
 * comprador.
 *
 * Fala direto com a API do Supabase em vez de importar o app: função agendada
 * é empacotada à parte, e aqui só precisa de uma chamada.
 */
export default async function liberarReservas() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !chave) {
    console.error("[liberar-reservas] faltam as variáveis do Supabase");
    return;
  }

  const resposta = await fetch(`${url}/rest/v1/rpc/liberar_reservas_expiradas`, {
    method: "POST",
    headers: {
      apikey: chave,
      Authorization: `Bearer ${chave}`,
      "Content-Type": "application/json",
    },
    body: "{}",
  });

  if (!resposta.ok) {
    console.error("[liberar-reservas] falhou:", resposta.status, await resposta.text());
    return;
  }
  const liberados = await resposta.json();
  if (liberados > 0) console.log(`[liberar-reservas] ${liberados} pedido(s) vencido(s)`);
}

export const config = { schedule: "*/10 * * * *" };

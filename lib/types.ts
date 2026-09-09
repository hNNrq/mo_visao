/**
 * Espelha supabase/migrations/001_schema.sql.
 * Quando o schema mudar, este arquivo muda junto — ou dá pra gerar com
 * `npx supabase gen types typescript --project-id <id> > lib/database.types.ts`.
 */

export type Categoria = "corrida" | "rua";

export type PedidoStatus =
  | "pendente"
  | "pago"
  | "separado"
  | "entregue"
  | "expirado"
  | "cancelado";

export type EntregaTipo = "retirada" | "local" | "correios";

export type Produto = {
  id: string;
  slug: string;
  nome: string;
  marca: string | null;
  modelo: string | null;
  descricao: string | null;
  preco_centavos: number;
  estoque: number;
  reservado: number;
  /** coluna gerada no banco: estoque - reservado */
  disponivel: number;
  categoria: Categoria;
  destaque: boolean;
  ordem: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
};

export type ProdutoFoto = {
  id: string;
  produto_id: string;
  storage_path: string;
  alt: string | null;
  ordem: number;
};

export type ProdutoComFotos = Produto & { fotos: ProdutoFoto[] };

export type Pedido = {
  id: string;
  numero: string;
  status: PedidoStatus;
  cliente_nome: string;
  cliente_email: string;
  cliente_telefone: string;
  entrega_tipo: EntregaTipo;
  entrega: Record<string, unknown>;
  subtotal_centavos: number;
  frete_centavos: number;
  desconto_centavos: number;
  total_centavos: number;
  mp_preference_id: string | null;
  mp_payment_id: string | null;
  metodo_pagamento: string | null;
  pago_em: string | null;
  expira_em: string;
  created_at: string;
};

export type PedidoItem = {
  id: string;
  pedido_id: string;
  produto_id: string | null;
  nome_snapshot: string;
  preco_snapshot_centavos: number;
  quantidade: number;
};

/** Item do carrinho, guardado no localStorage do visitante. */
export type ItemCarrinho = {
  produto_id: string;
  slug: string;
  nome: string;
  preco_centavos: number;
  quantidade: number;
  foto: string | null;
};

/** Retorno da função confirmar_pedido() no Postgres. */
export type ResultadoConfirmacao = "confirmado" | "ja_processado" | "sem_estoque";

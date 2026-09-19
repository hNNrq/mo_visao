/**
 * Os modelos que puxam a loja, em ordem de destaque.
 *
 * A ordem é informação, não arrumação: no cartaz quem encabeça vem maior, e
 * aqui a primeira posição é o modelo que a loja está puxando. Mexer na ordem
 * muda o tamanho na hero e na parede de modelos.
 *
 * O modelo é a ÚNICA divisão que a loja reconhece: a separação por tipo (rua /
 * corrida) saiu em set/2026, e o que o cliente digita no Google é mesmo o nome
 * do modelo. A busca é `ilike` (ver `lib/produtos.ts`), então um produto
 * cadastrado como "Juliet X-Metal" entra no filtro "juliet" sem o dono precisar
 * escrever o nome exato.
 *
 * ⚠️ O texto de cada modelo é descrição de FORMA, nunca de procedência
 * ("original", "importado") nem de venda ("o mais vendido"). Vale a regra do
 * projeto. Foi escrito pela Norman.dgt e ainda não foi conferido com o dono.
 */
export const MODELOS = [
  {
    nome: "Juliet",
    texto: "O ícone do X-Metal. Armação de metal e haste de borracha.",
  },
  {
    nome: "Romeo",
    texto: "Mesma família da Juliet, desenho mais fino no rosto.",
  },
  {
    nome: "Penny",
    texto: "Perfil baixo e discreto. Clássico dos anos 2000.",
  },
] as const;

/** Rota do atalho de um modelo. Um lugar só, porque hero, parede, rodapé e catálogo usam. */
export function rotaModelo(nome: string): string {
  return `/produtos?modelo=${nome.toLowerCase()}`;
}

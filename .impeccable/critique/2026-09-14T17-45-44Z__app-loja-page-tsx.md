---
target: home da loja Mó Visão
total_score: 22
max_score: 40
na_heuristics: 
p0_count: 2
p1_count: 2
target_identity: "file:C:\\Users\\Henrique Norman\\Desktop\\normanOS\\clientes\\mo-visao\\site\\app\\(loja)\\page.tsx"
target_fingerprint: "sha256:f659c293354155a4c54b0d05021420d21f6565e7cb666fe918d435cad639170b"
target_path: "C:\\Users\\Henrique Norman\\Desktop\\normanOS\\clientes\\mo-visao\\site\\app\\(loja)\\page.tsx"
timestamp: 2026-09-14T17-45-44Z
slug: app-loja-page-tsx
---
Method: dual-agent (A: abf8e7e839b97d45c · B: a518467fa87c12e9b) · alvo `app/(loja)/page.tsx` · modo Persuade · evidência de navegador no dev server do usuário na :3000.

## Design Health Score

| # | Heurística | Nota | Questão-chave |
|---|---|---|---|
| 1 | Visibilidade do estado | 2 | Os 3 atalhos de modelo não dão pista de que levam a página vazia — e o sistema já sabe disso no render |
| 2 | Sistema × mundo real | 3 | Voz ótima ("Sem pedir no direct."), mas a loja fala Juliet e mostra Radar |
| 3 | Controle e liberdade | 3 | Só links, nada prende; falta caminho pro que existe de fato em estoque |
| 4 | Consistência e padrões | 2 | `ESCOLHE O TEU` e `EM DESTAQUE` em escalas diferentes; um sangra, o outro atropela o link ao lado |
| 5 | Prevenção de erro | 1 | 9 links (hero + parede + rodapé) desembocam em catálogo vazio |
| 6 | Reconhecer > lembrar | 3 | Lista de modelos da hero aparece sem preço nenhum |
| 7 | Flexibilidade | 3 | Catálogo de 3 peças, não há atalho a inventar |
| 8 | Estético e minimalista | 2 | Tipo em fallback 400, 249px de vazio no desktop, lente Prizm magenta como objeto mais colorido de um sistema de duas tintas |
| 9 | Recuperação de erro | 2 | Estado vazio do catálogo é bom; mas o da home vaza instrução de admin pro comprador |
| 10 | Ajuda e documentação | 1 | Zero sobre entrega/retirada/pagamento — numa loja que existe pra substituir o direct, isso é a ajuda |
| **Total** | | **22/40** | **Precisa de trabalho** |

Nenhuma heurística marcada n/a — todas as dez se aplicam a uma home de loja em modo Persuade; a 10 se aplica porque esta página é o substituto declarado do atendimento humano.

## Design Specificity Verdict

**Autoral no documento, intercambiável na tela.**

LLM (A): a tese do lambe-lambe depende de um ato — Archivo 900 com o eixo `wdth` aberto, esticada até encostar nas margens. Esse ato não acontece. A tela entrega Arial peso 400 com 33px de entreletra: a "letra espalhada" que o DESIGN.md bane por nome. O primeiro viewport de uma loja de óculos não tem óculos nenhum, e "Em destaque" mostra os três Radar de corrida — a linha que o reposicionamento de set/2026 tirou da frente. No celular toda a sobreposição de folhas é `lg:`: sobra fundo preto, marca d'água e retângulos brancos empilhados.

Varredura determinística (B): `impeccable detect` → 0 findings, exit 0 nos 8 arquivos. Validado com arquivo de controle (#ff0000, 9px) que disparou 3 findings — o `[]` é genuíno. O sistema de tokens está limpo; o problema não está no código de design, está no que chega ao navegador.

Overlay: não existe. O `live-server` rodou 60s sem porta e sem saída; abandonado.

## Overall Impression

O mundo visual é bom e é próprio. Ele só não está sendo entregue. Três coisas independentes estão entre o desenho e a tela: a fonte não carrega, a hero está vazia, e a vitrine contradiz o posicionamento.

## O que está funcionando

1. O carimbo de preço é objeto de marca de verdade e à prova de falha. Bloco de ouro + erro de registro em `gold-deep` + skew -12°. Funciona porque é forma, não letra: atravessou intacto a queda das duas webfonts e mede 9,26:1.
2. O estado vazio do catálogo faz o que a home não faz: "Nenhum Juliet no catálogo agora. Chama no Instagram que a gente avisa quando entrar."
3. Peso de página honra o público: 225 nós de DOM, 42KB de imagem, zero erro de console, zero requisição falhando, zero overflow horizontal em 1440/390/320.

## Priority Issues

### [P0] As duas webfontes não carregam — o sistema tipográfico inteiro renderiza em Arial

`fontNetworkRequests: []`. O chunk gerado tem só `@font-face { font-family: Archivo Fallback; src: local(Arial) }` — nenhum `url()`, nem Archivo nem Barlow Condensed. Prova de eixos inertes: span de sondagem em `wdth` 62/100/125 mede 488,11px nos três; `wght` 100/400/900, 488,11px nos três.

Causa medida: os chunks de fonte antigos (Anton, Permanent Marker, Saira, Barlow de 08/09) têm `url()` real. Só os dois compilados hoje às 08:47 saíram sem. Google Fonts responde 200 agora. Falha de fetch em tempo de build que o `next/font` engoliu em silêncio — pode subir pra produção num build de CI que pegue o mesmo soluço.

Cascata medida: `MÓ VISÃO` satura o teto de 0.16em e ainda para a 22px da margem; `ESCOLHE O TEU` para a 256px e `EM DESTAQUE` a 467px (39% de sobra); hierarquia inverte, porque `CardProduto.tsx` tem `font-black` literal e o título de seção depende só do eixo — nome de produto pesa mais que título de seção.

Conserto: apagar `.next`, recompilar, reconferir; se persistir, servir `.woff2` de `public/` com `@font-face` manual. E blindar o `Esticar`: emitir `fontWeight` junto do `fontVariationSettings`.

Comando: /impeccable typeset

### [P0] A hero não tem imagem nenhuma — e a vitrine contradiz o posicionamento

`heroHasImg: 0` em todos os viewports. `grep hero-cartaz|hero-original` em app/ componentes/ lib/ → zero ocorrências. Os dois arquivos continuam servidos (124KB e 244KB) sem referência. No desktop, 249px de coluna preta vazia entre o nome e a lista de modelos. `/produtos?modelo=juliet|romeo|penny` retornam 0 cartões cada; `/produtos` retorna 3, todos Radar. A hero lista JULIET/ROMEO/PENNY sem preço (guard esconde porque `precos.porModelo` chega vazio) três linhas acima de "vê o preço na hora".

Conserto: hero nova com imagem + tratamento do nome. Enquanto a peça não existe no banco, renderizar o nome sem link, com "avisa quando entrar" apontando pro Instagram.

Comando: /impeccable shape

### [P1] "EM DESTAQUE" atropela "VER TODOS →" no celular

O `h2` é `min-w-0 flex-1 basis-[18ch]` na mesma linha flex do link. Em 390px a caixa tem 203px e o texto 238px (35px de estouro); em 360px, 173 contra 238 (65px). Entreletra já no piso de -0.04em e span `whitespace-nowrap`. Não vaza pro viewport (scrollWidth === clientWidth em 1440/390/320): é colisão interna.

Conserto: `flex-col sm:flex-row` no wrapper — título em largura cheia no celular, "Ver todos →" embaixo.

Comando: /impeccable adapt

### [P1] Alvos de toque de 20×20px no aparelho que é a tela principal

Em 390px: Início 46×17, Produtos 78×17, três ícones 20×20 com 12px de vão. Em 320px os links de texto caem pra 14px. 16 alvos abaixo de 44px na página. Os três ícones apontam pra fluxo que não existe (checkout é fase 4).

Conserto: `py-3 -my-3 px-2 -mx-2` nos links; avaliar esconder Pedidos/Conta enquanto o checkout não existir.

Comando: /impeccable adapt

### [P2] O momento do preço não tem reasseguração nenhuma

A parcela é `text-lg text-smoke` e no celular cai órfã numa linha própria. `CardProduto.tsx` mostra preço e zero parcela. A home não diz nada sobre entrega, retirada, pagamento ou estoque curto. O PRODUCT.md diz "parcelamento importa mais ainda".

Conserto: parcela dentro da folha do produto abaixo do carimbo, em `numeros` (`parcelamento()` já existe em lib/format.ts); linha honesta na home sobre retirada/entrega.

Comando: /impeccable clarify

### [P2] A foto do produto em destaque renderiza borrada no desktop

`CardProduto` declara `sizes="(min-width: 1024px) 30vw"`, servindo 432px num cartão que renderiza 756px (`lg:col-span-7` de 1360px). Escala 1,75×. No celular está certo (~1,1×).

Comando: /impeccable optimize

## Persona Red Flags

Rafa, 17, Android de entrada, 4G oscilante, veio de um story atrás de Juliet: toca em JULIET (138×40) e cai em catálogo vazio; rolando, encontra três Radar de lente rosa. `font-display: swap` nunca troca — vê Arial permanentemente.

Bia, 19, no ônibus: erra Carrinho (20×20, 12px de vão) e acerta Pedidos, ambos fluxo inexistente. O único carimbo grande sai da tela no primeiro scroll; sem ação primária até o rodapé.

Leitor de tela: nove links, três destinos, três nomes acessíveis diferentes — "Juliet" (hero), "Ver os Juliet" (parede), "Óculos Juliet" (rodapé). O Muro está corretamente aria-hidden.

O dono, barbeiro: desmarcando todos os destaques, o comprador lê "No painel, marque um produto como destaque pra ele aparecer aqui" — instrução de admin na vitrine. Hoje tem 3 Radar em destaque e zero Juliet, e nada avisa que a home anuncia três modelos inexistentes.

## Minor Observations

- Contraste passa em tudo que é conteúdo; todo `smoke` mede 5,74:1. Único FAIL é o muro a 1,08:1 — falso positivo (aria-hidden, decorativo, isento pela WCAG 1.4.3). Atenção: meta do cartão (ink/55, 14px) passa por 0,06 de margem (4,56:1).
- Header em 320px não corta: último ícone termina em 300px contra viewport de 320.
- `public/hard-zone-demo.ttf` (46KB) continua publicamente baixável do domínio do cliente. Apagar.
- Contrato de direção (FIRST VIEWPORT) e DESIGN.md ("A folha da hero e seu movimento") ainda descrevem a figura em contraluz, camadas z-0/z-10/z-20 e animação `colada` na folha da foto. Nada disso existe.
- No desktop, qual foto sai gigante (756px) e qual sai média é acidente da ordem no ciclo 7/5/6, não decisão de destaque.

## Questions to Consider

- A pessoa chega do Instagram e já sabe o nome da loja. O que 100svh dedicados a dizer "Mó Visão" dizem pra quem já sabe tudo o que eles dizem?
- Se uma fonte que não carrega transforma o ato de assinatura do sistema no seu próprio anti-padrão documentado, ele é a assinatura da marca ou uma dependência dela?
- Nove links, três destinos, todos vazios — e o código sabia no render. Por que repetir três vezes uma escolha que o sistema sabia que não podia honrar?

# Relatório da Etapa 3 — Integração Total, Compras e Relatórios

**Projeto:** Sistema ERP Industrial & MRP I
**Data:** 05/11/2026
**Repositório:** https://github.com/loitalo2-rgb/sistema-erp-industrial
**Responsável:** Italo Contabilidade

---

## 1. Contexto e ponto de partida

A Etapa 1 (fundação) e a Etapa 2 (autenticação, modelagem de dados e cadastros) já estavam concluídas. Entretanto, boa parte das telas operacionais ainda exibia **dados estáticos de demonstração** (mock), sem persistência real:

- Engenharia (BOM)
- PCP / MRP I
- Chão de Fábrica
- Estoque & Lotes
- Comercial
- Financeiro / DRE
- Dashboard

Além disso, não existiam os módulos de **Compras** e **Relatórios**, e vários fluxos não conversavam entre si (a produção não baixava insumos, o faturamento não dava baixa no estoque nem gerava contas a receber, o recebimento de compras não gerava lote nem contas a pagar).

O objetivo desta etapa foi **eliminar os mocks, integrar o fluxo ponta a ponta e entregar os módulos de Compras e Relatórios**.

---

## 2. O que foi entregue

### 2.1 Backend (NestJS + Prisma)

#### Novos módulos

| Módulo | Endpoints | Descrição |
| --- | --- | --- |
| `compras` | `GET /api/compras/pedidos`, `GET /api/compras/pedidos/:id`, `POST /api/compras/pedidos`, `PATCH /api/compras/pedidos/:id/status`, `POST /api/compras/pedidos/:id/receber` | Cotação/pedido de compra, aprovação, recebimento com entrada de lote FIFO, custo médio ponderado e geração de contas a pagar |
| `dashboard` | `GET /api/dashboard/resumo` | KPIs executivos consolidados (OPs ativas, estoque crítico, recebíveis, DRE, qualidade, aderência, vendas 30 dias, apontamentos e vencimentos) |
| `relatorios` | `GET /api/relatorios/consolidado`, `/dre`, `/estoque`, `/producao`, `/vendas`, `/financeiro` | Relatórios gerenciais por período, com filtro de datas local e consolidado |

#### Correções e integrações no que já existia

- **Estoque**
  - `common/inventory.ts`: convenção de sinal/efeito por tipo de movimentação (`stockEffect`).
  - `common/stock.helpers.ts`: consumo FIFO por lote, entrada de estoque e saldo por item.
  - Balanços, estoque crítico, Kardex e lotes calculados a partir dos dados reais.
- **Produção**
  - Criação de OP a partir do MRP.
  - Apontamento consome insumos pela BOM via FIFO, gera movimentações e dá entrada no produto acabado em lote próprio.
  - Atualiza quantidade produzida/refugada e status da OP.
- **Vendas**
  - Pedido com itens e formação de preço.
  - Faturamento dá baixa no estoque, gera movimentação de saída, título a receber e atualiza status.
- **Financeiro**
  - Resumo de contas a pagar/receber com vencidos.
  - DRE com receita bruta, deduções, CPV, despesas, outras receitas/despesas e resultado líquido.
  - Baixa de título com suporte a pagamento parcial.
- **MRP**
  - Cálculo de necessidade líquida considerando o saldo real de estoque.
- **Cadastros**
  - Atualização de itens/parceiros e desativação lógica.
- **Seed**
  - Reescrito com estoque inicial, roteiros, centros de trabalho, pedido de venda, OP e títulos financeiros de demonstração.

#### Novos utilitários

- `apps/api/src/common/dates.ts` — interpretação de datas `YYYY-MM-DD` no fuso local (correção do bug descrito na seção 5).

### 2.2 Frontend (Next.js 14 + Tailwind)

- `lib/api.ts` — cliente HTTP central com JWT, tratamento de 401 e `cache: 'no-store'`.
- `lib/format.ts` — formatação de moeda, datas, números e CSV.
- `components/ui.tsx` — biblioteca de UI (cards, badges, tabelas, estados vazios, loading).
- `components/AppShell.tsx` — guarda de autenticação e layout autenticado.
- `layout.tsx`, `Sidebar.tsx`, `Header.tsx` e `login` atualizados.

Telas reescritas/integradas:

| Rota | Tela |
| --- | --- |
| `/` | Dashboard executivo com dados reais |
| `/cadastros` | Itens e parceiros (CRUD + desativação) |
| `/engenharia` | Estruturas BOM, roteiros e centros de trabalho |
| `/pcp` | MRP I, necessidades líquidas e emissão de OP |
| `/chao-de-fabrica` | Terminal de apontamento de produção |
| `/estoque` | Saldos, lotes FIFO e Kardex |
| `/comercial` | Pedidos de venda, aprovação e faturamento |
| `/compras` | **Novo** — pedidos de compra, aprovação e recebimento |
| `/financeiro` | Contas a pagar/receber, baixa e DRE |
| `/relatorios` | **Novo** — relatórios consolidados com filtro de período, impressão e exportação CSV |
| `/login` | Autenticação |

---

## 3. Fluxos integrados validados

### 3.1 Compras → Estoque → Financeiro

1. Pedido de compra é criado.
2. Pedido é aprovado.
3. Recebimento gera:
   - lote de entrada FIFO;
   - movimentação de estoque;
   - atualização do custo médio ponderado;
   - título a pagar no financeiro.

### 3.2 Vendas → Estoque → Financeiro → DRE

1. Pedido de venda é criado.
2. Pedido é aprovado.
3. Faturamento gera:
   - baixa de estoque pelo lote FIFO;
   - movimentação de saída;
   - título a receber;
   - receita e CPV no DRE.

### 3.3 Produção → Estoque → DRE

1. MRP calcula a necessidade e o PCP emite a OP.
2. Apontamento consome insumos via FIFO.
3. Produto acabado entra em lote próprio.
4. Produção e qualidade aparecem no dashboard e nos relatórios.

---

## 4. Evidências de teste

### 4.1 Builds

```
npm run build:api   → sucesso (nest build)
npm run build:web   → sucesso (14 rotas geradas)
```

Rotas geradas no build do frontend: `/`, `/cadastros`, `/chao-de-fabrica`, `/comercial`, `/compras`, `/engenharia`, `/estoque`, `/financeiro`, `/login`, `/pcp`, `/relatorios` e `/_not-found`.

### 4.2 Smoke test da API

Autenticação: `admin@erp.local` / `admin123`.

Dados de demonstração utilizados:

- `OP-2026-002` — 2 planejadas, 1 produzida (50%).
- `COT-2026-001` — pedido de compra recebido.
- `PED-2026-105` — pedido de venda faturado.
- Títulos `PAG-COT-2026-001` e `REC-PED-2026-105`.

Resposta de `GET /api/relatorios/consolidado?from=2026-11-01&to=2026-11-05` após as correções:

```json
{
  "sales":     { "orders": 2, "revenue": 34680, "ticketMedio": 17340 },
  "production":{ "orders": 2, "planned": 52, "produced": 1,
                 "qualityRate": 100, "adherenceRate": 1.9231 },
  "dre":       { "receitaBruta": 34680, "resultadoLiquido": 4620,
                 "lancamentosConsiderados": 7 }
}
```

Dashboard (`GET /api/dashboard/resumo`):

- OPs ativas: **2** (1 em andamento)
- Estoque crítico: **4** itens
- Contas a receber: **R$ 34.680,00**
- Resultado líquido (DRE): **R$ 4.620,00** (margem 14,8%)
- Qualidade da produção: **100%**
- Vendas (30 dias): **R$ 34.680,00**

### 4.3 Validação no navegador

Todas as telas foram abertas no navegador integrado, com dados reais e **sem erros no console**:

- Dashboard — KPIs, OPs ativas, estoque crítico, vencimentos e apontamentos.
- Cadastros — 4 itens e 2 parceiros carregados.
- Engenharia — BOM do produto `PA-ARMARIO-01` e roteiros.
- PCP — seleção de produto e execução do MRP.
- Chão de Fábrica — posto, operador e OPs disponíveis.
- Estoque — 4 itens, R$ 2.979,05 em estoque, 3 lotes com saldo.
- Comercial — 2 pedidos, 1 aprovado e 1 faturado.
- Compras — 1 pedido recebido.
- Financeiro — receber R$ 34.680,00 / pagar R$ 30.060,00 / resultado R$ 4.620,00.
- Relatórios — DRE com receita líquida R$ 31.280,00 e resultado R$ 4.620,00.

---

## 5. Bugs encontrados e corrigidos durante a validação

### 5.1 Telas presas em “Carregando dados...”

**Sintoma:** algumas telas (ex.: Cadastros) permaneciam em loading mesmo com a API respondendo `200/304`.

**Causa:** o backend respondia `304 Not Modified` em requisições condicionais do navegador. O cliente `fetch` tratava `304` como erro (`res.ok === false`) e o estado nunca era atualizado.

**Correção:** `apps/web/src/lib/api.ts` passou a usar `cache: 'no-store'` em todas as chamadas, garantindo dados operacionais sempre atualizados.

### 5.2 Filtro de período excluía o dia final

**Sintoma:** relatório de 01/11 a 05/11 retornava zero, embora existissem registros em 05/11.

**Causa:** `new Date('2026-11-05')` cria meia-noite **UTC**. Em fuso do Brasil (UTC-3) isso corresponde a 04/11 21:00; ao aplicar `setHours(23,59,59,999)` o limite virava 04/11 23:59 local, excluindo o dia 05 inteiro.

**Correção:** novo helper `apps/api/src/common/dates.ts` interpreta datas `YYYY-MM-DD` como dia **local**, aplicado em `relatorios.service.ts` e `financeiro.service.ts`.

### 5.3 DRE por competência

O DRE passou a filtrar pela **data de lançamento** (`createdAt`), enquanto o vencimento (`dueDate`) continua sendo usado no fluxo de caixa. Isso alinha o DRE ao relatório de vendas do mesmo período.

---

## 6. Como executar

### Pré-requisitos

- Node.js 20+
- npm 10+

### Instalação

```bash
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
```

> O ambiente local usa **SQLite** (`apps/api/prisma/dev.db`), sem necessidade de Docker/PostgreSQL.

### Desenvolvimento

```bash
npm run dev:api   # API em http://localhost:3001/api
npm run dev:web   # Web em http://localhost:3000
```

### Produção local

```bash
npm run build
npm --workspace=apps/api run start:prod
npm --workspace=apps/web run start
```

### Acesso

- URL: http://localhost:3000
- E-mail: `admin@erp.local`
- Senha: `admin123`

---

## 7. Pendências e próximos passos sugeridos

- Substituir SQLite por PostgreSQL em produção (existe `schema.postgresql.prisma` de referência).
- Criar suíte de testes automatizados (unitários e e2e) para os fluxos de estoque/FIFO, produção e financeiro.
- Implementar controle de permissões por perfil nas telas (o backend já possui RBAC).
- Adicionar paginação e filtros avançados nas listagens.
- Implementar importação de XML de NF-e e integração fiscal.
- Adicionar trilha de auditoria (quem alterou cada registro).
- Evoluir o MRP para múltiplos níveis com calendário de produção e capacidade.
- Configurar deploy contínuo (CI já existe para build).

---

## 8. Conclusão

A Etapa 3 concluiu a **integração ponta a ponta** do ERP Industrial. Todas as telas principais operam com dados persistidos no banco, os módulos de **Compras** e **Relatórios** foram entregues, e os fluxos de compra, produção, venda, estoque e financeiro conversam entre si.

Os builds de API e frontend passaram, e a validação funcional no navegador não apresentou erros de console.

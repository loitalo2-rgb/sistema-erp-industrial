# Sistema ERP Industrial & Manufatura (MRP I)

Sistema Integrado de Gestão Industrial desenvolvido para controle de ponta a ponta: da Engenharia de Produto ao Faturamento e DRE Gerencial.

> **Etapa 3 concluída:** integração real de todas as telas, módulos de **Compras** e **Relatórios**, e correções de cache HTTP e de filtro de datas.
> **Etapa 4 concluída:** **RBAC** por perfil, gestão de **Usuários**, **Auditoria** automática de operações e **smoke test** automatizado.
> Detalhes em [`RELATORIO-ETAPA-3.md`](./RELATORIO-ETAPA-3.md) e [`RELATORIO-ETAPA-4.md`](./RELATORIO-ETAPA-4.md).

---

## 🏗️ Arquitetura do Sistema

* **Frontend (`apps/web`)**: Next.js 14 (App Router) + TailwindCSS + Lucide Icons
  * Painel Executivo de Operações Industriais
  * Visualizador de Estrutura de Produtos em Árvore (BOM)
  * Simulador de Cálculo MRP I e Emissão de OPs
  * Terminal Touch de Apontamento do Operador em Chão de Fábrica
  * Rastreabilidade por Lote e FIFO (PEPS)
  * Módulo Comercial & Formação de Preço Industrial
  * Módulo de Compras com recebimento e custo médio
  * Financeiro e DRE Gerencial integrado
  * Relatórios consolidados com exportação CSV
  * Gestão de usuários e governança de acessos (RBAC)
  * Trilha de auditoria de todas as operações de escrita
* **Backend (`apps/api`)**: Node.js + NestJS (TypeScript)
  * Arquitetura modular corporativa
  * Autenticação JWT com controle de perfis de acesso (RBAC) aplicado globalmente
  * Auditoria automática de criação, alteração, baixa e cancelamento
  * Motor de cálculo MRP I (explosão de necessidades de materiais)
  * Baixa automática de estoque e movimentações rastreadas (FIFO)
  * DRE dinâmico e relatórios por período
* **Banco de Dados**: **SQLite** local via Prisma ORM (`apps/api/prisma/dev.db`)
  * Há um schema de referência para PostgreSQL em `apps/api/prisma/schema.postgresql.prisma`

---

## 📁 Estrutura de Diretórios

```
sistema erp italo contabilidade/
├── apps/
│   ├── api/                          # Backend NestJS (TypeScript)
│   │   ├── prisma/
│   │   │   ├── schema.prisma         # Modelagem completa do ERP Industrial (SQLite)
│   │   │   ├── schema.postgresql.prisma # Referência para PostgreSQL
│   │   │   └── seed.ts               # Dados iniciais para homologação
│   │   └── src/
│   │       ├── common/
│   │       │   ├── inventory.ts       # Efeito de estoque por tipo de movimentação
│   │       │   ├── stock.helpers.ts   # Consumo/entrada FIFO e saldo por item
│   │       │   ├── dates.ts           # Filtro de datas por dia local
│   │       │   └── audit.interceptor.ts # Registro automático de auditoria
│   │       ├── modules/
│   │       │   ├── auth/              # JWT e permissões RBAC
│   │       │   ├── cadastros/         # Itens, Clientes e Fornecedores
│   │       │   ├── engenharia/        # BOM multinível e roteiros
│   │       │   ├── mrp/               # Algoritmo de cálculo de necessidades
│   │       │   ├── producao/          # OPs e apontamentos de chão de fábrica
│   │       │   ├── estoque/           # Saldos, lotes FIFO e Kardex
│   │       │   ├── vendas/            # Orçamentos, pedidos e faturamento
│   │       │   ├── compras/           # Cotações, pedidos e recebimento
│   │       │   ├── financeiro/        # Contas a pagar/receber e DRE
│   │       │   ├── dashboard/         # KPIs executivos
│   │       │   ├── relatorios/        # Relatórios consolidados
│   │       │   ├── usuarios/          # Gestão de usuários e perfis
│   │       │   └── auditoria/         # Trilha de auditoria
│   │       ├── prisma/               # Serviço de conexão Prisma
│   │       ├── app.module.ts
│   │       └── main.ts
│   │
│   └── web/                          # Frontend Next.js 14
│       └── src/
│           ├── app/                  # Rotas do sistema
│           │   ├── page.tsx          # Dashboard executivo
│           │   ├── cadastros/        # Itens e parceiros
│           │   ├── engenharia/       # Telas de BOM e roteiros
│           │   ├── pcp/              # Telas de MRP I e OPs
│           │   ├── chao-de-fabrica/  # Terminal Touch para operadores
│           │   ├── estoque/          # Rastreabilidade por Lote e FIFO
│           │   ├── comercial/        # Pedidos de venda
│           │   ├── compras/          # Pedidos de compra
│           │   ├── financeiro/       # DRE e financeiro
│           │   ├── relatorios/       # Relatórios consolidados
│           │   ├── usuarios/         # Usuários e perfis (admin)
│           │   └── auditoria/        # Auditoria (admin)
│           ├── components/           # AppShell, Sidebar, Header e UI
│           └── lib/                  # Cliente HTTP e formatação
│
├── package.json                      # Monorepo workspaces
├── .env.example                      # Variáveis de ambiente
├── RELATORIO-ETAPA-3.md              # Relatório da Etapa 3
├── RELATORIO-ETAPA-4.md              # Relatório da Etapa 4
└── Plano de Arquitetura e Módulos ERP Industrial.pdf
```

---

## 🚀 Como Executar o Projeto

### 1. Pré-requisitos

- Node.js 20+
- npm 10+

### 2. Instalar as Dependências

```bash
npm install
```

### 3. Preparar o Banco de Dados (SQLite)

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

> O banco local fica em `apps/api/prisma/dev.db` e é ignorado pelo Git.
> Não é necessário Docker nem PostgreSQL para rodar localmente.

### 4. Iniciar os Serviços em Modo Desenvolvimento

```bash
# API Backend (porta 3001):
npm run dev:api

# Frontend Web (porta 3000):
npm run dev:web
```

### 5. Build de Produção

```bash
npm run build
npm --workspace=apps/api run start:prod
npm --workspace=apps/web run start
```

### Acesso

* **Frontend Web**: [http://localhost:3000](http://localhost:3000)
* **Backend API**: [http://localhost:3001/api](http://localhost:3001/api)
* **E-mail**: `admin@erp.local`
* **Senha**: `admin123`

### Usuários de demonstração (RBAC)

| Perfil | E-mail | Senha |
| --- | --- | --- |
| Administrador | `admin@erp.local` | `admin123` |
| Engenharia | `engenharia@erp.local` | `engenharia123` |
| PCP | `pcp@erp.local` | `pcp123` |
| Operador | `operador@erp.local` | `operador123` |
| Compras | `compras@erp.local` | `compras123` |
| Vendas | `vendas@erp.local` | `vendas123` |
| Financeiro | `financeiro@erp.local` | `financeiro123` |

> Apenas o perfil **ADMIN** acessa as telas de Usuários e Auditoria e pode cadastrar novos usuários.
> As demais permissões são aplicadas no backend por módulo (ex.: Vendas só cria/fatura pedidos de venda).

---

## 🔌 Principais Endpoints

| Módulo | Endpoints |
| --- | --- |
| Auth | `POST /auth/login`, `POST /auth/register`, `GET /auth/me` |
| Cadastros | `GET/POST /cadastros/itens`, `PUT /cadastros/itens/:id`, `PATCH /cadastros/itens/:id/desativar`, equivalentes para `parceiros` |
| Engenharia | `GET/POST /engenharia/bom`, `GET /engenharia/bom/produto/:productId`, `GET/POST /engenharia/roteiros`, `GET/POST /engenharia/centros-trabalho` |
| MRP | `GET /mrp/calcular` |
| Produção | `GET/POST /producao/ordens`, `PATCH /producao/ordens/:id/status`, `POST /producao/apontamentos` |
| Estoque | `GET /estoque/saldos`, `GET /estoque/saldos/criticos`, `GET/POST /estoque/movimentacoes`, `GET/POST /estoque/lotes` |
| Vendas | `GET/POST /vendas/pedidos`, `POST /vendas/pedidos/:id/faturar`, `PATCH /vendas/pedidos/:id/status` |
| Compras | `GET/POST /compras/pedidos`, `POST /compras/pedidos/:id/receber`, `PATCH /compras/pedidos/:id/status` |
| Financeiro | `GET/POST /financeiro/titulos`, `PATCH /financeiro/titulos/:id/pagar`, `PATCH /financeiro/titulos/:id/cancelar`, `GET /financeiro/resumo`, `GET /financeiro/dre` |
| Dashboard | `GET /dashboard/resumo` |
| Relatórios | `GET /relatorios/consolidado`, `/relatorios/dre`, `/relatorios/estoque`, `/relatorios/producao`, `/relatorios/vendas`, `/relatorios/financeiro` |
| Usuários | `GET/POST /usuarios`, `GET /usuarios/perfis`, `PATCH /usuarios/:id` (somente ADMIN) |
| Auditoria | `GET /auditoria`, `GET /auditoria/filtros` (somente ADMIN) |
| Autenticação extra | `PATCH /auth/senha` (troca de senha do próprio usuário) |

---

## 🧪 Dados de Demonstração

O `npm run db:seed` cria:

- Usuário administrador (`admin@erp.local` / `admin123`)
- Itens de matéria-prima e produto acabado com estoque inicial e lotes FIFO
- Estrutura BOM e roteiro de fabricação
- Centro de trabalho e operador
- Pedido de venda, ordem de produção e títulos financeiros

Também é possível simular o fluxo completo pela interface:

1. **PCP** → calcular MRP e emitir OP
2. **Chão de Fábrica** → apontar produção (consome insumos FIFO)
3. **Compras** → criar pedido, aprovar e receber (gera lote e conta a pagar)
4. **Comercial** → criar pedido, aprovar e faturar (baixa estoque e gera conta a receber)
5. **Financeiro** → baixar títulos e consultar o DRE
6. **Relatórios** → consolidar o período e exportar CSV

---

## ✅ Testes

Com a API em execução e o seed aplicado:

```bash
npm run test:smoke
```

O script valida login, rotas protegidas, dashboard, relatórios, RBAC (403 para perfil sem permissão), auditoria e bloqueio de cadastro anônimo. Sai com código de erro se qualquer verificação falhar.

---

- [`RELATORIO-ETAPA-3.md`](./RELATORIO-ETAPA-3.md) — integração total, Compras e Relatórios.
- [`RELATORIO-ETAPA-4.md`](./RELATORIO-ETAPA-4.md) — RBAC, Usuários, Auditoria e testes automatizados.
- `Plano de Arquitetura e Módulos ERP Industrial.pdf` — visão de arquitetura.
- `Manual de Operação e Documentação Técnica - ERP Industrial.pdf` — manual de operação.

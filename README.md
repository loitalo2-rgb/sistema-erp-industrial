# Sistema ERP Industrial & Manufatura (MRP I)

Sistema Integrado de Gestão Industrial sob medida desenvolvido para controle de ponta a ponta: da Engenharia de Produto ao Faturamento e DRE Gerencial.

---

## 🏗️ Arquitetura do Sistema

* **Frontend (`apps/web`)**: Next.js 14 (App Router) + TailwindCSS + Lucide Icons
  * Painel Executivo de OEE e Produtividade
  * Visualizador de Estrutura de Produtos em Árvore (BOM)
  * Simulador de Cálculo MRP I e Emissão de OPs
  * Terminal Touch de Apontamento do Operador em Chão de Fábrica
  * Rastreabilidade por Lote e FIFO (com leitor XML de NF-e)
  * Módulo Comercial & Formação de Preço Industrial
  * Financeiro e DRE Gerencial integrado
* **Backend (`apps/api`)**: Node.js + NestJS (TypeScript)
  * Arquitetura modular corporativa
  * Autenticação JWT com controle de perfis de acesso (RBAC)
  * Motor de cálculo MRP I (explosão de necessidades de materiais)
  * Baixa automática de estoque e movimentações rastreadas
  * DRE dinâmico em tempo real
* **Banco de Dados**: PostgreSQL 16+ gerenciado com **Prisma ORM**
* **Infraestrutura**: Docker Compose para subida instantânea de PostgreSQL e pgAdmin

---

## 📁 Estrutura de Diretórios

```
sistema erp italo contabilidade/
├── apps/
│   ├── api/                          # Backend NestJS (TypeScript)
│   │   ├── prisma/
│   │   │   ├── schema.prisma         # Modelagem completa do ERP Industrial
│   │   │   └── seed.ts               # Dados iniciais para homologação
│   │   └── src/
│   │       ├── modules/
│   │       │   ├── auth/             # JWT e permissões RBAC
│   │       │   ├── cadastros/        # Itens, Clientes e Fornecedores
│   │       │   ├── engenharia/       # BOM multinível e roteiros
│   │       │   ├── mrp/              # Algoritmo de cálculo de necessidades
│   │       │   ├── producao/         # OPs e apontamentos de chão de fábrica
│   │       │   ├── estoque/          # Saldos, lotes FIFO e XML
│   │       │   ├── vendas/           # Orçamentos e pedidos de venda
│   │       │   └── financeiro/       # Contas a pagar/receber e DRE
│   │       ├── prisma/               # Serviço de conexão Prisma
│   │       ├── app.module.ts
│   │       └── main.ts
│   │
│   └── web/                          # Frontend Next.js 14
│       └── src/
│           ├── app/                  # Rotas do sistema
│           │   ├── page.tsx          # Painel Geral de Operações (Dashboard)
│           │   ├── engenharia/       # Telas de BOM
│           │   ├── pcp/              # Telas de MRP I e OPs
│           │   ├── chao-de-fabrica/  # Terminal Touch para operadores
│           │   ├── estoque/          # Rastreabilidade por Lote e FIFO
│           │   ├── comercial/        # Engenharia de vendas
│           │   └── financeiro/       # DRE e financeiro
│           ├── components/           # Sidebar, Header e Cards
│           └── lib/api.ts            # Cliente HTTP integrado ao backend
│
├── docker-compose.yml                # Configuração PostgreSQL + pgAdmin
├── package.json                      # Monorepo workspaces
├── .env.example                      # Variáveis de ambiente
└── Plano de Arquitetura e Módulos ERP Industrial.pdf
```

---

## 🚀 Como Executar o Projeto

### 1. Subir o Banco de Dados (PostgreSQL)
Se você utiliza Docker:
```bash
docker compose up -d
```
*(Caso use o PostgreSQL instalado localmente na máquina, verifique se o serviço está ativo na porta 5432 com a senha configurada no arquivo `.env`)*

### 2. Instalar as Dependências
```bash
npm install
```

### 3. Gerar o Cliente Prisma e Executar as Migrações
```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

### 4. Iniciar os Serviços em Modo Desenvolvimento
Para iniciar tanto a API (porta 3001) quanto o Frontend Web (porta 3000):
```bash
# Iniciar a API Backend:
npm run dev:api

# Iniciar o Frontend Web:
npm run dev:web
```

Acesse:
* **Frontend Web**: [http://localhost:3000](http://localhost:3000)
* **Backend API**: [http://localhost:3001/api](http://localhost:3001/api)

# Relatório da Etapa 4 — Segurança, Usuários e Auditoria

**Projeto:** Sistema ERP Industrial & MRP I
**Data:** 05/11/2026
**Repositório:** https://github.com/loitalo2-rgb/sistema-erp-industrial
**Responsável:** Italo Contabilidade

---

## 1. Contexto e objetivo

A Etapa 3 concluiu a integração operacional do ERP (compras, produção, vendas, estoque, financeiro e relatórios). A análise seguinte identificou lacunas de **governança e segurança**:

- O `RolesGuard` existia no código, mas **não estava registrado** em nenhum módulo — ou seja, o RBAC não era aplicado.
- O endpoint público `POST /auth/register` permitia que qualquer pessoa criasse um usuário, inclusive com perfil `ADMIN` (escalonamento de privilégio).
- Não existia **trilha de auditoria**: era impossível saber quem criou, alterou, faturou ou cancelou um registro.
- Não existia tela para administrar usuários e perfis.
- Não havia teste automatizado de fumaça (smoke test) para validar a API após mudanças.

A Etapa 4 teve como objetivo fechar essas lacunas com **RBAC efetivo, gestão de usuários, auditoria automática e testes de regressão**.

---

## 2. O que foi entregue

### 2.1 Segurança e RBAC

- `JwtAuthGuard` e `RolesGuard` passaram a ser aplicados **globalmente** (`APP_GUARD` no `AppModule`).
- Novo decorator `@Public()` para liberar apenas rotas realmente públicas (login).
- `POST /auth/register` deixou de ser público e passou a exigir perfil **ADMIN**.
- Regra de auto-proteção: administrador não consegue desativar o próprio usuário nem remover o próprio perfil `ADMIN`.
- Novo endpoint `PATCH /auth/senha` para o usuário trocar a própria senha (com validação da senha atual).
- Login atualiza o campo `lastLoginAt` do usuário.

#### Matriz de permissões aplicada no backend

| Módulo / Operação | Perfis autorizados |
| --- | --- |
| Itens (criar/editar/desativar) | ADMIN, ENGENHARIA, PCP, COMPRAS |
| Parceiros (criar/editar/desativar) | ADMIN, COMPRAS, VENDAS, FINANCEIRO |
| Engenharia (BOM, roteiros, centros) | ADMIN, ENGENHARIA, PCP |
| Produção (criar OP / alterar status) | ADMIN, PCP |
| Produção (apontamento) | ADMIN, PCP, OPERADOR |
| Estoque (movimentação / lote) | ADMIN, COMPRAS, PCP, OPERADOR |
| Vendas (criar / status) | ADMIN, VENDAS |
| Vendas (faturar) | ADMIN, VENDAS, FINANCEIRO |
| Compras (criar / receber / status) | ADMIN, COMPRAS |
| Financeiro (criar / baixar / cancelar) | ADMIN, FINANCEIRO |
| Usuários e Auditoria | ADMIN |
| Consultas (GET) dos módulos operacionais | Qualquer usuário autenticado |

### 2.2 Gestão de usuários

Novo módulo `usuarios`:

| Endpoint | Descrição |
| --- | --- |
| `GET /api/usuarios` | Lista usuários (sem senha), com perfil, situação e último acesso |
| `GET /api/usuarios/perfis` | Lista os perfis válidos |
| `POST /api/usuarios` | Cria usuário com perfil e senha inicial |
| `PATCH /api/usuarios/:id` | Altera nome, perfil, situação e/ou redefine senha |

Nova tela `/usuarios`:

- KPIs de usuários totais, ativos, administradores e perfis em uso;
- cadastro de usuário com perfil;
- troca de perfil diretamente na tabela;
- ativação/desativação;
- redefinição de senha;
- último acesso por usuário;
- bloqueio de acesso para quem não é ADMIN.

### 2.3 Auditoria

Novo modelo `AuditLog`:

```prisma
model AuditLog {
  id         String   @id @default(uuid())
  userId     String?
  userEmail  String?
  action     String
  entity     String
  entityId   String?
  method     String
  path       String
  statusCode Int?
  payload    String?
  ip         String?
  createdAt  DateTime @default(now())
}
```

Novo `AuditInterceptor` global que registra automaticamente **toda operação de escrita bem-sucedida** (`POST`, `PUT`, `PATCH`, `DELETE`):

- usuário responsável (id, nome, e-mail e perfil);
- ação classificada (`CRIAR`, `ATUALIZAR`, `DESATIVAR`, `FATURAR`, `RECEBER`, `PAGAR`, `CANCELAR`, `ALTERAR_STATUS`, `ALTERAR_SENHA`, `LOGIN`);
- módulo/entidade, id afetado, rota, método, status HTTP e IP;
- payload da requisição com **mascaramento de senhas e tokens** (`***`);
- a gravação da auditoria nunca derruba a operação principal.

Endpoints:

| Endpoint | Descrição |
| --- | --- |
| `GET /api/auditoria` | Consulta paginada com filtros de módulo, ação, usuário, período e busca |
| `GET /api/auditoria/filtros` | Opções distintas de módulos e ações para os filtros |

Nova tela `/auditoria`:

- KPIs de eventos, ações distintas, módulos afetados e paginação;
- filtros por texto, módulo, ação e período;
- tabela com data/hora, usuário, ação, módulo, rota e status;
- expansão da linha para visualizar o payload registrado;
- bloqueio de acesso para quem não é ADMIN.

### 2.4 Navegação

- Sidebar reorganizada em **Operação** e **Administração**.
- Itens “Usuários & Perfis” e “Auditoria” aparecem apenas para `ADMIN`.
- Rodapé da sidebar passa a exibir o perfil do usuário logado.

### 2.5 Testes automatizados

Novo script `apps/api/scripts/smoke-test.mjs`, executado por `npm run test:smoke`, sem dependências extras (usa `fetch` nativo do Node 20+).

Cobertura:

1. Login de ADMIN e OPERADOR.
2. Rejeição de senha inválida.
3. Rota protegida sem token retorna 401.
4. Dashboard e relatório consolidado respondem.
5. RBAC: OPERADOR recebe 403 em usuários, auditoria e criação de item.
6. Auditoria registra login e **não grava a senha**.
7. Cadastro anônimo bloqueado (401).

---

## 3. Evidências de teste

### 3.1 Builds

```
npm run build:api   → sucesso
npm run build:web   → sucesso (16 rotas geradas)
```

Novas rotas no build: `/usuarios` e `/auditoria`.

### 3.2 Smoke test

```
npm run test:smoke

ERP Industrial - Smoke Test (http://localhost:3001/api)

  PASS  login admin retorna 201
  PASS  login admin retorna token
  PASS  login admin retorna perfil ADMIN
  PASS  login operador retorna token
  PASS  login operador retorna perfil OPERADOR
  PASS  login com senha inválida é rejeitado
  PASS  rota protegida sem token retorna 401
  PASS  dashboard responde 200
  PASS  dashboard informa OPs ativas
  PASS  relatório consolidado responde 200
  PASS  relatório inclui DRE
  PASS  relatório inclui vendas
  PASS  ADMIN lista usuários
  PASS  lista contém ao menos 7 usuários
  PASS  OPERADOR não lista usuários (403)
  PASS  OPERADOR não acessa auditoria (403)
  PASS  OPERADOR não cria item (403)
  PASS  ADMIN consulta auditoria
  PASS  auditoria registrou login
  PASS  senha não é gravada na auditoria
  PASS  cadastro anônimo bloqueado (401)

Resultado: 21 passaram, 0 falharam.
```

### 3.3 Testes manuais via API

| Cenário | Resultado |
| --- | --- |
| `GET /usuarios` como ADMIN | 200 — 7 usuários |
| `GET /usuarios` como OPERADOR | 403 |
| `POST /cadastros/itens` como OPERADOR | 403 |
| `GET /auditoria` como OPERADOR | 403 |
| `POST /auth/register` sem token | 401 |
| Payload de login na auditoria | `{"password":"***","email":"admin@erp.local"}` |
| `PUT /cadastros/itens/:id` como ADMIN | 200 e evento `ATUALIZAR` registrado |

### 3.4 Validação no navegador

- `/usuarios` (ADMIN): 7 usuários, 7 ativos, 1 administrador e 7 perfis em uso; tabela com perfis e ações.
- `/auditoria` (ADMIN): eventos de `LOGIN` e `ATUALIZAR`, filtros e KPIs funcionando.
- Login como `operador@erp.local`: sidebar sem a seção Administração.
- `/usuarios` e `/auditoria` como OPERADOR: mensagem de acesso restrito, sem chamadas indevidas.
- Sem erros no console do navegador.

---

## 4. Arquivos principais alterados/criados

### Backend

- `apps/api/prisma/schema.prisma` — `AuditLog`, `User.lastLoginAt` e relação.
- `apps/api/src/modules/auth/guards.ts` — `@Public`, `JwtAuthGuard` global com skip, `RolesGuard`.
- `apps/api/src/modules/auth/auth.controller.ts` / `auth.service.ts` — login público, registro ADMIN, troca de senha, `lastLoginAt`.
- `apps/api/src/common/audit.interceptor.ts` — interceptor global de auditoria.
- `apps/api/src/modules/auditoria/*` — serviço, controller e módulo.
- `apps/api/src/modules/usuarios/*` — serviço, controller e módulo.
- `apps/api/src/app.module.ts` — guards globais, interceptor e novos módulos.
- Controllers de cadastros, engenharia, produção, estoque, vendas, compras e financeiro — decorators `@Roles`.
- `apps/api/prisma/seed.ts` — usuários de demonstração por perfil.
- `apps/api/scripts/smoke-test.mjs` — teste de fumaça.

### Frontend

- `apps/web/src/app/usuarios/page.tsx` — gestão de usuários.
- `apps/web/src/app/auditoria/page.tsx` — trilha de auditoria.
- `apps/web/src/components/Sidebar.tsx` — seção Administração e perfil do usuário.

### Documentação e scripts

- `RELATORIO-ETAPA-4.md`.
- `README.md` — RBAC, usuários de demonstração, endpoints e testes.
- `package.json` — script `test:smoke`.

---

## 5. Como executar

```bash
npm install
npm run db:generate
npm run db:migrate
npm run db:seed

npm run dev:api   # API em http://localhost:3001/api
npm run dev:web   # Web em http://localhost:3000

# Com a API rodando:
npm run test:smoke
```

> O schema foi alterado (nova tabela `audit_logs` e coluna `last_login_at`). Em bases existentes, execute `npx prisma db push` dentro de `apps/api` antes de subir a API.

---

## 6. Pendências e próximos passos sugeridos

- Ampliar a suíte para testes unitários/e2e com framework dedicado (Jest/Vitest + Supertest).
- Aplicar RBAC também nos botões e formulários do frontend (hoje o backend bloqueia com 403, mas a UI ainda exibe a ação).
- Criar política de senha forte e expiração/redefinição obrigatória.
- Adicionar autenticação de dois fatores (2FA) para ADMIN.
- Exportar a trilha de auditoria em CSV/PDF e definir retenção legal dos logs.
- Adicionar integração com SIEM/observabilidade (logs estruturados, métricas e alertas).
- Migrar de SQLite para PostgreSQL em produção.
- Implementar importação de XML de NF-e, integração fiscal e multiempresa.

---

## 7. Conclusão

A Etapa 4 entregou a camada de **governança** do ERP: o RBAC passou a ser efetivamente aplicado, o cadastro público de usuários foi fechado, os administradores ganharam uma tela de gestão de perfis e todas as operações de escrita passaram a gerar trilha de auditoria com dados sensíveis mascarados.

A entrega foi validada por build de produção, 21 verificações automatizadas e testes manuais no navegador com perfis ADMIN e OPERADOR, sem erros de console.

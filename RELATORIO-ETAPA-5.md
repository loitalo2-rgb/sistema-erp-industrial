# Relatório da Etapa 5 — Segurança, RPA e Acessibilidade

**Projeto:** Sistema ERP Industrial & MRP I
**Data:** 05/11/2026
**Repositório:** https://github.com/loitalo2-rgb/sistema-erp-industrial
**Responsável:** Italo Contabilidade

---

## 1. Contexto e objetivo

O diagnóstico técnico do site apontou cinco achados de segurança, automação (RPA) e acessibilidade:

| # | Severidade | Categoria | Achado |
| --- | --- | --- | --- |
| 1 | Crítico | Segurança | Ausência de Content Security Policy (CSP) |
| 2 | Crítico | RPA | Formulários com IDs dinâmicos (instabilidade de robôs) |
| 3 | Médio | Segurança | Cookie de sessão sem `SameSite`/`Secure` |
| 4 | Médio | RPA | iFrames sem `name`/`id` |
| 5 | Alerta | WCAG | Contraste insuficiente em botões secundários (3.2:1) |

A Etapa 5 teve como objetivo corrigir os achados, comprovar a correção com evidências técnicas e manter a compatibilidade com RBAC, auditoria e smoke test entregues na Etapa 4.

---

## 2. O que foi corrigido

### 2.1 CSP e headers de segurança (achado 1)

O `apps/web/next.config.js` passou a aplicar headers em **todas as rotas**:

```
Content-Security-Policy:
default-src 'self';
script-src 'self' 'unsafe-inline' [ 'unsafe-eval' apenas em dev ];
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob:;
font-src 'self' data:;
connect-src 'self' http://localhost:3001 ws: wss:;
frame-src 'none';
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
object-src 'none';
manifest-src 'self'
```

Headers adicionais:

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`
- `Cross-Origin-Opener-Policy: same-origin`
- `X-DNS-Prefetch-Control: off`
- `Strict-Transport-Security` em produção (HTTPS)

A API também recebeu headers de defesa em profundidade (`X-Frame-Options: DENY`, CSP `default-src 'none'`, `nosniff`, `Referrer-Policy` e `Permissions-Policy`).

> **Observação técnica:** o `'unsafe-inline'` em `script-src` é necessário porque o Next.js injeta scripts de hidratação inline. A evolução recomendada é migrar para _nonce_/hash por requisição. `'unsafe-eval'` é aplicado **somente em desenvolvimento**.

### 2.2 Sessão por cookie HttpOnly/SameSite/Secure (achado 3)

Antes, o JWT ficava no `localStorage` e era enviado manualmente via header `Authorization`. Agora:

- O login grava o JWT no cookie **`erp_token`** com:
  - `HttpOnly` — não acessível ao JavaScript (mitiga XSS);
  - `SameSite=Lax` — mitiga CSRF em requisições cross-site;
  - `Secure` — em HTTPS e em hosts locais (`localhost`/`127.0.0.1`);
  - `Path=/`, expiração de 7 dias.
- O backend lê o JWT prioritariamente do cookie e mantém o header `Authorization: Bearer` como compatibilidade para clientes de API e para o smoke test.
- Novo endpoint **`POST /auth/logout`** apaga o cookie.
- A troca de senha (`PATCH /auth/senha`) agora também invalida a sessão atual.
- O frontend usa `credentials: 'include'` em todas as chamadas e valida a sessão em `GET /auth/me`.
- O `localStorage` passou a guardar **apenas dados de exibição** do usuário (nome, e-mail e perfil), nunca o token.
- CORS da API deixou de ser `origin: '*'` e passou a aceitar apenas as origens do frontend, com `credentials: true`. Origens configuráveis via `CORS_ORIGINS`.

### 2.3 IDs estáveis para RPA (achado 2)

Todos os campos e botões principais receberam `id` e/ou `data-testid` estáticos, sem números de sessão. Exemplos:

| Tela | Seletores estáveis |
| --- | --- |
| Login | `input-email`, `input-password`, `btn-login`, `form-login` |
| Sidebar | `nav-painel`, `nav-cadastros`, `nav-compras`, `nav-usuarios`, `nav-auditoria`, `btn-logout` |
| Compras | `select-compra-fornecedor`, `input-compra-entrega`, `btn-aprovar-compra`, `form-compra` |
| Vendas | `select-venda-cliente`, `input-venda-numero`, `btn-aprovar-venda`, `form-venda` |
| Estoque | `form-movimentacao`, `form-lote`, `input-lote-numero`, `btn-salvar-lote` |
| Cadastros | `input-cadastros-busca`, `input-item-codigo`, `input-parceiro-codigo`, `btn-salvar-item` |
| Engenharia | `input-bom-codigo`, `btn-salvar-bom`, `form-bom` |
| Financeiro | `input-financeiro-descricao`, `btn-salvar-lancamento`, `form-financeiro` |
| Usuários | `input-usuario-nome`, `input-usuario-email`, `input-usuario-senha`, `select-usuario-perfil`, `btn-criar-usuario` |
| Auditoria | `input-auditoria-busca`, `btn-aplicar-filtros`, `btn-atualizar-auditoria` |

Nenhum `id` é gerado dinamicamente pelo React; os seletores permanecem iguais entre sessões.

### 2.4 iFrames (achado 4)

**Falso positivo.** A aplicação não embute nenhum `<iframe>` (verificado por busca em todo o código do frontend). Como medida preventiva:

- a CSP define `frame-src 'none'` (bloqueia qualquer iframe);
- a CSP define `frame-ancestors 'none'` e o header `X-Frame-Options: DENY` (impede que o ERP seja embutido por terceiros).

Caso um iframe seja adicionado no futuro, a política exigirá `id`/`name` e liberação explícita de origem.

### 2.5 Contraste WCAG (achado 5)

- Removido `opacity-70` do link "fechar" dos feedbacks; agora usa texto sólido, negrito e sublinhado.
- Rótulos e textos secundários escurecidos de `slate-400/500` para `slate-600` em fundos claros.
- Sidebar (fundo escuro): rótulos de seção e perfil passaram de `slate-500` para `slate-300/400`.
- Botões secundários ("Atualizar", "Cancelar") passaram a usar `text-slate-700/800` com borda visível, eliminando o tom de 3.2:1.
- Estados de foco receberam `focus:ring` para navegação por teclado.
- O login passou a exibir textos auxiliares em `slate-200/300`, com contraste adequado no fundo escuro.

---

## 3. Evidências de teste

### 3.1 Headers do frontend

```http
GET http://localhost:3000/login

Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:;
  connect-src 'self' http://localhost:3001 ws: wss:; frame-src 'none';
  frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none';
  manifest-src 'self'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

### 3.2 Cookie de sessão

```http
POST http://localhost:3001/api/auth/login

Set-Cookie: erp_token=<jwt>; Max-Age=604800; Path=/; Expires=...;
  HttpOnly; Secure; SameSite=Lax
```

```text
GET /api/auth/me com o cookie ......... 200 (usuário autenticado)
POST /api/auth/logout ................. 201
Set-Cookie no logout .................. erp_token=; Expires=Thu, 01 Jan 1970 ...; SameSite=Lax
GET /api/auth/me após logout .......... 401
```

### 3.3 CORS

```http
Origin: http://localhost:3000
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Credentials: true
```

### 3.4 Builds

```
npm run build:api   → sucesso
npm run build:web   → sucesso (14 rotas de aplicação + not-found)
```

### 3.5 Smoke test

```
npm run test:smoke

  PASS  login admin retorna 201
  PASS  login admin retorna token
  PASS  login admin retorna perfil ADMIN
  PASS  cookie de sessão é HttpOnly
  PASS  cookie de sessão usa SameSite=Lax
  PASS  cookie de sessão usa Secure
  PASS  login operador retorna token
  PASS  login operador retorna perfil OPERADOR
  PASS  login com senha inválida é rejeitado
  PASS  cookie de sessão autentica /auth/me
  PASS  /auth/me via cookie retorna ADMIN
  PASS  logout responde 201
  PASS  logout expira o cookie de sessão
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

Resultado: 28 passaram, 0 falharam.
```

### 3.6 Validação no navegador

- Login pela interface com `admin@erp.local` / `admin123` redireciona para o painel e cria a sessão por cookie.
- `GET /auth/me` autenticado pelo cookie retorna 200.
- Logout pela sidebar apaga o cookie, limpa os dados locais e redireciona para `/login`; chamadas seguintes a `/auth/me` retornam 401.
- Rotas `/usuarios` e `/auditoria` continuam acessíveis apenas para ADMIN.
- Seletores `data-testid` presentes e sem IDs numéricos dinâmicos.
- Nenhum erro novo no console do navegador.

---

## 4. Arquivos principais alterados/criados

### Backend

- `apps/api/src/main.ts` — CORS restrito, `credentials`, headers de segurança e `trust proxy`.
- `apps/api/src/modules/auth/auth.constants.ts` — nome do cookie, duração e regra de `Secure`.
- `apps/api/src/modules/auth/auth.controller.ts` — login com cookie, logout e invalidação na troca de senha.
- `apps/api/src/modules/auth/jwt.strategy.ts` — extração do JWT do cookie com fallback para Bearer.
- `apps/api/src/common/audit.interceptor.ts` — ação `LOGOUT` na auditoria.
- `apps/api/scripts/smoke-test.mjs` — validação de cookie, `/auth/me` e logout (28 verificações).
- `.env.example` — variável `CORS_ORIGINS`.

### Frontend

- `apps/web/next.config.js` — CSP e headers de segurança.
- `apps/web/src/lib/api.ts` — `credentials: 'include'`, sessão sem token no `localStorage`.
- `apps/web/src/app/login/page.tsx` — fluxo por cookie, IDs/testids estáveis e contraste.
- `apps/web/src/components/AppShell.tsx` — validação de sessão via `/auth/me`.
- `apps/web/src/components/Sidebar.tsx` — logout via API, testids de navegação e contraste.
- `apps/web/src/components/Header.tsx` e `ui.tsx` — contraste e foco.
- Páginas `cadastros`, `compras`, `comercial`, `estoque`, `engenharia`, `financeiro`, `usuarios` e `auditoria` — IDs/testids estáveis, bordas e contrastes.

### Documentação

- `RELATORIO-ETAPA-5.md` (este arquivo).
- `README.md` — seção de segurança, endpoints e testes.

---

## 5. Como validar

```bash
npm install
npm run db:generate
npm run db:migrate
npm run db:seed

npm run build
npm --workspace=apps/api run start:prod
npm --workspace=apps/web run start

# Em outro terminal:
npm run test:smoke
```

Verificação manual dos headers:

```bash
curl -I http://localhost:3000/login
```

Verificação manual do cookie:

```bash
curl -i -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@erp.local","password":"admin123"}'
```

---

## 6. Pendências e próximos passos

- Substituir `'unsafe-inline'` da CSP por _nonce_/hash por requisição.
- Adicionar proteção CSRF explícita (double-submit token) para operações sensíveis.
- Implementar rotação/revogação de JWT (denylist ou refresh token rotativo).
- Migrar o cookie para `SameSite=Strict` quando não houver necessidade de navegação externa.
- Ampliar a cobertura de testes e2e com Playwright usando os `data-testid` criados.
- Auditar contraste com ferramenta automatizada (axe/Lighthouse) em todas as rotas.
- Migrar de SQLite para PostgreSQL em produção e habilitar HTTPS/HSTS obrigatório.

---

## 7. Conclusão

Os cinco achados do diagnóstico foram tratados:

1. **CSP** aplicada no frontend e na API, com headers complementares.
2. **IDs estáveis** (`id`/`data-testid`) adicionados aos formulários e ações principais.
3. **Cookie de sessão** agora é `HttpOnly`, `SameSite=Lax` e `Secure`, com logout no servidor.
4. **iFrames** inexistentes; proteção preventiva via `frame-src 'none'` e `frame-ancestors 'none'`.
5. **Contraste** corrigido nos textos e botões secundários para atender WCAG 2.2 AA.

A entrega foi validada por builds de produção, inspeção de headers e cookie, teste no navegador e **28 verificações automatizadas**, todas aprovadas.

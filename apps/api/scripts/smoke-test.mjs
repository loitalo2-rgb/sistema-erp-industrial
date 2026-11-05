#!/usr/bin/env node
/**
 * Smoke test da API do ERP Industrial.
 * Uso: npm run test:smoke
 * Requer a API rodando (http://localhost:3001/api) e o seed aplicado.
 */

const API = process.env.API_URL || 'http://localhost:3001/api';

let passed = 0;
let failed = 0;

function check(name, condition, detail = '') {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    console.error(`  FAIL  ${name}${detail ? ` -> ${detail}` : ''}`);
  }
}

async function login(email, password) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  return { res, data };
}

async function get(path, token) {
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { res, data };
}

async function getWithCookie(path, cookie) {
  const res = await fetch(`${API}${path}`, { headers: { Cookie: cookie } });
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { res, data };
}

async function postWithCookie(path, cookie) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { Cookie: cookie },
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { res, data };
}

async function post(path, token, body) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body || {}),
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { res, data };
}

async function main() {
  console.log(`\nERP Industrial - Smoke Test (${API})\n`);

  // 1. Autenticação
  const admin = await login('admin@erp.local', 'admin123');
  check('login admin retorna 201', admin.res.status === 201, `status ${admin.res.status}`);
  check('login admin retorna token', Boolean(admin.data?.accessToken));
  check('login admin retorna perfil ADMIN', admin.data?.user?.role === 'ADMIN');

  const setCookie = admin.res.headers.get('set-cookie') || '';
  check('cookie de sessão é HttpOnly', /HttpOnly/i.test(setCookie), setCookie);
  check('cookie de sessão usa SameSite=Lax', /SameSite=Lax/i.test(setCookie), setCookie);
  check('cookie de sessão usa Secure', /Secure/i.test(setCookie), setCookie);

  const operator = await login('operador@erp.local', 'operador123');
  check('login operador retorna token', Boolean(operator.data?.accessToken));
  check('login operador retorna perfil OPERADOR', operator.data?.user?.role === 'OPERADOR');

  const invalid = await login('admin@erp.local', 'senha-errada');
  check('login com senha inválida é rejeitado', invalid.res.status === 401, `status ${invalid.res.status}`);

  const adminToken = admin.data.accessToken;
  const operatorToken = operator.data.accessToken;
  const sessionCookie = setCookie.split(';')[0];

  // 1.1 Sessão por cookie HttpOnly
  const meWithCookie = await getWithCookie('/auth/me', sessionCookie);
  check('cookie de sessão autentica /auth/me', meWithCookie.res.status === 200, `status ${meWithCookie.res.status}`);
  check('/auth/me via cookie retorna ADMIN', meWithCookie.data?.role === 'ADMIN');

  const logout = await postWithCookie('/auth/logout', sessionCookie);
  const clearCookie = logout.res.headers.get('set-cookie') || '';
  check('logout responde 201', logout.res.status === 201, `status ${logout.res.status}`);
  check('logout expira o cookie de sessão', /erp_token=;/.test(clearCookie) && /Expires=Thu, 01 Jan 1970/i.test(clearCookie), clearCookie);

  // 2. Rotas protegidas
  const anonymous = await get('/dashboard/resumo', '');
  check('rota protegida sem token retorna 401', anonymous.res.status === 401, `status ${anonymous.res.status}`);

  // 3. Dashboard e relatórios
  const dashboard = await get('/dashboard/resumo', adminToken);
  check('dashboard responde 200', dashboard.res.status === 200, `status ${dashboard.res.status}`);
  check('dashboard informa OPs ativas', Number(dashboard.data?.cards?.activeProductionOrders) >= 0);

  const report = await get('/relatorios/consolidado?from=2026-11-01&to=2026-11-05', adminToken);
  check('relatório consolidado responde 200', report.res.status === 200, `status ${report.res.status}`);
  check('relatório inclui DRE', Boolean(report.data?.dre));
  check('relatório inclui vendas', Boolean(report.data?.sales?.totals));

  // 4. RBAC
  const usersAsAdmin = await get('/usuarios', adminToken);
  check('ADMIN lista usuários', usersAsAdmin.res.status === 200, `status ${usersAsAdmin.res.status}`);
  check('lista contém ao menos 7 usuários', Number(usersAsAdmin.data?.length) >= 7);

  const usersAsOperator = await get('/usuarios', operatorToken);
  check('OPERADOR não lista usuários (403)', usersAsOperator.res.status === 403, `status ${usersAsOperator.res.status}`);

  const auditAsOperator = await get('/auditoria', operatorToken);
  check('OPERADOR não acessa auditoria (403)', auditAsOperator.res.status === 403, `status ${auditAsOperator.res.status}`);

  const createItemAsOperator = await post('/cadastros/itens', operatorToken, {
    code: `SMOKE-${Date.now()}`,
    name: 'Item de teste RBAC',
    type: 'MATERIA_PRIMA',
    unit: 'UN',
  });
  check('OPERADOR não cria item (403)', createItemAsOperator.res.status === 403, `status ${createItemAsOperator.res.status}`);

  // 5. Auditoria
  const auditAsAdmin = await get('/auditoria?limit=10', adminToken);
  check('ADMIN consulta auditoria', auditAsAdmin.res.status === 200, `status ${auditAsAdmin.res.status}`);
  check('auditoria registrou login', (auditAsAdmin.data?.items || []).some((item) => item.action === 'LOGIN'));
  const loginPayload = (auditAsAdmin.data?.items || []).find((item) => item.action === 'LOGIN')?.payload || '';
  check('senha não é gravada na auditoria', !loginPayload.includes('admin123'));

  // 6. Cadastro público bloqueado
  const anonymousRegister = await post('/auth/register', '', {
    name: 'Invasor',
    email: `invasor-${Date.now()}@teste.local`,
    password: '123456',
  });
  check('cadastro anônimo bloqueado (401)', anonymousRegister.res.status === 401, `status ${anonymousRegister.res.status}`);

  console.log(`\nResultado: ${passed} passaram, ${failed} falharam.\n`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('\nErro inesperado no smoke test:', err);
  process.exit(1);
});

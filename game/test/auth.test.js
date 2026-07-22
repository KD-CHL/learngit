// 认证 / 权限 API 端到端测试 —— 启动真实服务器（隔离数据目录），用 fetch 打真实 HTTP
// 运行：npm run test:auth  （或 node test/auth.test.js）
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// 隔离环境：临时数据目录 + 独立端口 + 不打开浏览器（必须在 import server.js 之前设置）
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gitgame-test-'));
process.env.GITGAME_DATA_DIR = tmpDir;
process.env.PORT = '5199';
process.env.GITGAME_NO_OPEN = '1';
const BASE = 'http://127.0.0.1:5199';

await import('../server.js');

// 等服务器就绪
async function waitReady(ms = 3000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    try { await fetch(BASE + '/api/auth/me'); return; } catch { await new Promise(r => setTimeout(r, 50)); }
  }
  throw new Error('服务器未在限定时间内就绪');
}
await waitReady();

async function req(method, p, { token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(BASE + p, { method, headers, body: body ? JSON.stringify(body) : undefined });
  let data = {}; try { data = await res.json(); } catch { /* ignore */ }
  return { status: res.status, data };
}

let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { console.log('✓ ' + name); pass++; }
  else { console.error('✗ ' + name); fail++; }
}

/* ---------- 注册 ---------- */
let r = await req('POST', '/api/auth/signup', { body: { username: 'alice', password: 'secret1' } });
check('注册新用户 → 201 且返回 token', r.status === 201 && !!r.data.token);
check('新用户默认角色为 player', r.data.user?.role === 'player');
const aliceToken = r.data.token;

r = await req('POST', '/api/auth/signup', { body: { username: 'alice', password: 'other123' } });
check('重复用户名 → 409', r.status === 409);

r = await req('POST', '/api/auth/signup', { body: { username: 'bob', password: '123' } });
check('过短密码 → 400', r.status === 400);

/* ---------- 登录 ---------- */
r = await req('POST', '/api/auth/login', { body: { username: 'alice', password: 'secret1' } });
check('正确密码登录 → 200 + token', r.status === 200 && !!r.data.token);

r = await req('POST', '/api/auth/login', { body: { username: 'alice', password: 'wrong' } });
check('错误密码 → 401', r.status === 401);

/* ---------- me / 未登录 ---------- */
r = await req('GET', '/api/auth/me', { token: aliceToken });
check('携带 token 获取 me → 200 + username', r.status === 200 && r.data.user?.username === 'alice');

r = await req('GET', '/api/auth/me');
check('未登录获取 me → 401', r.status === 401);

/* ---------- 进度 ---------- */
r = await req('POST', '/api/progress', { token: aliceToken, body: { levelStars: [3, 2, 1], totalCmds: 42 } });
check('保存进度 → 200', r.status === 200);

r = await req('GET', '/api/auth/me', { token: aliceToken });
check('进度已持久化到账号', r.data.user?.progress?.totalCmds === 42 && r.data.user?.progress?.levelStars?.[0] === 3);

/* ---------- 默认管理员 ---------- */
r = await req('POST', '/api/auth/login', { body: { username: 'admin', password: 'admin123' } });
check('默认管理员 admin/admin123 可登录', r.status === 200 && r.data.user?.role === 'admin');
const adminToken = r.data.token;

/* ---------- 权限控制 ---------- */
r = await req('GET', '/api/admin/users', { token: adminToken });
check('管理员获取用户列表 → 200', r.status === 200 && Array.isArray(r.data.users) && r.data.users.length >= 2);

r = await req('GET', '/api/admin/users', { token: aliceToken });
check('玩家访问管理接口 → 403', r.status === 403);

/* ---------- 角色管理 ---------- */
const aliceId = (await req('GET', '/api/auth/me', { token: aliceToken })).data.user.id;
r = await req('POST', `/api/admin/users/${aliceId}/role`, { token: adminToken, body: { role: 'admin' } });
check('管理员提升 alice 为 admin → 200', r.status === 200 && r.data.user?.role === 'admin');

r = await req('GET', '/api/admin/users', { token: aliceToken });
check('提权后 alice 可访问管理接口', r.status === 200);

// 改回 player 便于测试删除
await req('POST', `/api/admin/users/${aliceId}/role`, { token: adminToken, body: { role: 'player' } });

/* ---------- 删除用户 ---------- */
await req('POST', '/api/auth/signup', { body: { username: 'todelete', password: 'secret1' } });
const delId = (await req('POST', '/api/auth/login', { body: { username: 'todelete', password: 'secret1' } })).data.user.id;
r = await req('DELETE', `/api/admin/users/${delId}`, { token: adminToken });
check('管理员删除用户 → 200', r.status === 200);

r = await req('POST', '/api/auth/login', { body: { username: 'todelete', password: 'secret1' } });
check('被删除用户无法再登录 → 401', r.status === 401);

r = await req('DELETE', `/api/admin/users/${adminToken ? (await req('GET','/api/auth/me',{token:adminToken})).data.user.id : ''}`, { token: adminToken });
check('管理员不能删除自己 → 400', r.status === 400);

/* ---------- 登出 ---------- */
r = await req('POST', '/api/auth/logout', { token: aliceToken });
check('登出 → 200', r.status === 200);
r = await req('GET', '/api/auth/me', { token: aliceToken });
check('登出后 token 失效 → 401', r.status === 401);

/* ---------- 汇总 ---------- */
console.log(`\n${pass} 通过, ${fail} 失败`);
fs.rmSync(tmpDir, { recursive: true, force: true });
process.exit(fail ? 1 : 0);

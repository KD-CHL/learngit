// 认证客户端 —— 封装登录/注册/登出/当前用户 + 路由守卫
// token 存 localStorage，请求头带 Authorization: Bearer <token>
const TOKEN_KEY = 'gitgame_token';

export function getToken() {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}
export function setToken(t) {
  try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
}

async function api(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(path, {
    method, headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = {};
  try { data = await res.json(); } catch { /* ignore */ }
  if (!res.ok) throw new Error(data.error || ('请求失败 (' + res.status + ')'));
  return data;
}

export async function login(username, password) {
  const data = await api('/api/auth/login', { method: 'POST', body: { username, password } });
  setToken(data.token);
  return data.user;
}

export async function signup(username, password) {
  const data = await api('/api/auth/signup', { method: 'POST', body: { username, password } });
  setToken(data.token);
  return data.user;
}

export async function logout() {
  try { await api('/api/auth/logout', { method: 'POST' }); } catch { /* ignore */ }
  setToken(null);
}

// 返回当前登录用户；未登录返回 null
export async function getMe() {
  if (!getToken()) return null;
  try { const data = await api('/api/auth/me'); return data.user; }
  catch { setToken(null); return null; }
}

export async function saveRemoteProgress(levelStars, totalCmds, cmdUsage, achievements) {
  if (!getToken()) return;
  try { await api('/api/progress', { method: 'POST', body: { levelStars, totalCmds, cmdUsage, achievements } }); }
  catch { /* 离线/未登录时静默 */ }
}

/* ============ 路由守卫 ============ */
// 游戏页调用：未登录则跳转登录页；返回当前用户
export async function requireAuth() {
  const user = await getMe();
  if (!user) { location.href = './login.html'; return null; }
  return user;
}

// 管理页调用：非管理员跳转回游戏页
export async function requireAdmin() {
  const user = await requireAuth();
  if (!user) return null;
  if (user.role !== 'admin') { location.href = './index.html'; return null; }
  return user;
}

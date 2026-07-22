// API 层 —— 认证 / 进度 / 管理接口
// 约定：客户端把会话 token 放在 localStorage，请求头 Authorization: Bearer <token>
import {
  findUserByUsername, findUserById, findUserByGithubId, createUser, createGithubUser, updateUser, deleteUser,
  getUsers, publicUser, verifyPassword, createSession, getSession, destroySession,
} from './db.js';
import { githubEnabled, GITHUB_CLIENT_ID, exchangeCode, fetchGithubUser } from './github.js';

const VALID_ROLES = ['admin', 'player'];

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', c => { raw += c; if (raw.length > 1e6) req.destroy(); });
    req.on('end', () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch { resolve({}); } });
    req.on('error', reject);
  });
}

// 从 Authorization 头解析当前登录用户
function authUser(req) {
  const h = req.headers['authorization'] || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return null;
  const s = getSession(token);
  if (!s) return null;
  return findUserById(s.userId);
}

function requireAuth(req, res) {
  const user = authUser(req);
  if (!user) { sendJson(res, 401, { error: '未登录或登录已过期' }); return null; }
  return user;
}

function requireAdmin(req, res) {
  const user = requireAuth(req, res);
  if (!user) return null;
  if (user.role !== 'admin') { sendJson(res, 403, { error: '需要管理员权限' }); return null; }
  return user;
}

export async function handleApi(req, res, urlPath) {
  const method = req.method;

  /* ---------- 认证 ---------- */
  if (urlPath === '/api/auth/signup' && method === 'POST') {
    const { username, password } = await readBody(req);
    const name = String(username || '').trim();
    if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]{2,16}$/.test(name))
      return sendJson(res, 400, { error: '用户名需为 2-16 位字母/数字/中文/下划线' });
    if (!password || String(password).length < 6)
      return sendJson(res, 400, { error: '密码至少 6 位' });
    if (findUserByUsername(name))
      return sendJson(res, 409, { error: '用户名已存在' });
    const user = createUser(name, String(password), 'player');
    const token = createSession(user.id);
    return sendJson(res, 201, { token, user: publicUser(user) });
  }

  if (urlPath === '/api/auth/login' && method === 'POST') {
    const { username, password } = await readBody(req);
    const user = findUserByUsername(String(username || '').trim());
    if (!user || !verifyPassword(String(password || ''), user.salt, user.hash))
      return sendJson(res, 401, { error: '用户名或密码错误' });
    const token = createSession(user.id);
    return sendJson(res, 200, { token, user: publicUser(user) });
  }

  if (urlPath === '/api/auth/logout' && method === 'POST') {
    const h = req.headers['authorization'] || '';
    const token = h.startsWith('Bearer ') ? h.slice(7) : null;
    if (token) destroySession(token);
    return sendJson(res, 200, { ok: true });
  }

  if (urlPath === '/api/auth/me' && method === 'GET') {
    const user = requireAuth(req, res);
    if (!user) return;
    return sendJson(res, 200, { user: publicUser(user) });
  }

  /* ---------- GitHub OAuth ---------- */
  if (urlPath === '/api/auth/github/config' && method === 'GET') {
    return sendJson(res, 200, { enabled: githubEnabled(), clientId: GITHUB_CLIENT_ID });
  }

  if (urlPath === '/api/auth/github' && method === 'POST') {
    if (!githubEnabled())
      return sendJson(res, 503, { error: 'GitHub 登录未配置（需设置 GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET）' });
    const { code } = await readBody(req);
    if (!code) return sendJson(res, 400, { error: '缺少授权码 code' });
    try {
      const accessToken = await exchangeCode(String(code));
      const gh = await fetchGithubUser(accessToken);
      // 优先按 githubId 关联；找不到则新建（用户名冲突时自动加后缀）
      let user = findUserByGithubId(gh.id);
      if (!user) {
        let name = gh.login;
        while (findUserByUsername(name)) name += '_gh';
        user = createGithubUser(name, gh.id);
      }
      const token = createSession(user.id);
      return sendJson(res, 200, { token, user: publicUser(user) });
    } catch (e) {
      return sendJson(res, 502, { error: 'GitHub 登录失败：' + e.message });
    }
  }

  /* ---------- 进度（登录即可） ---------- */
  if (urlPath === '/api/progress' && method === 'POST') {
    const user = requireAuth(req, res);
    if (!user) return;
    const body = await readBody(req);
    const levelStars = Array.isArray(body.levelStars) ? body.levelStars.map(n => Math.max(0, Math.min(3, Number(n) || 0))) : [];
    const totalCmds = Math.max(0, Number(body.totalCmds) || 0);
    // 命令频次：只保留 {字符串: 非负整数}
    const cmdUsage = {};
    if (body.cmdUsage && typeof body.cmdUsage === 'object')
      for (const k in body.cmdUsage) cmdUsage[String(k).slice(0, 40)] = Math.max(0, Number(body.cmdUsage[k]) || 0);
    // 成就：去重后的 id 字符串数组
    const achievements = Array.isArray(body.achievements)
      ? [...new Set(body.achievements.map(a => String(a).slice(0, 40)))] : [];
    updateUser(user.id, { progress: { levelStars, totalCmds, cmdUsage, achievements } });
    return sendJson(res, 200, { ok: true });
  }

  /* ---------- 排行榜（登录即可） ---------- */
  if (urlPath === '/api/leaderboard' && method === 'GET') {
    const user = requireAuth(req, res);
    if (!user) return;
    const rows = getUsers().map(u => {
      const ls = u.progress?.levelStars || [];
      return {
        id: u.id, username: u.username,
        stars: ls.reduce((a, b) => a + b, 0),
        done: ls.filter(s => s > 0).length,
        totalCmds: u.progress?.totalCmds || 0,
      };
    }).sort((a, b) => b.stars - a.stars || a.totalCmds - b.totalCmds || b.done - a.done);
    const myRank = rows.findIndex(r => r.id === user.id) + 1;
    return sendJson(res, 200, { leaderboard: rows.slice(0, 10), myRank });
  }

  /* ---------- 管理（仅 admin） ---------- */
  if (urlPath === '/api/admin/users' && method === 'GET') {
    if (!requireAdmin(req, res)) return;
    return sendJson(res, 200, { users: getUsers().map(publicUser) });
  }

  const roleMatch = urlPath.match(/^\/api\/admin\/users\/([^/]+)\/role$/);
  if (roleMatch && method === 'POST') {
    if (!requireAdmin(req, res)) return;
    const { role } = await readBody(req);
    if (!VALID_ROLES.includes(role)) return sendJson(res, 400, { error: '无效角色' });
    const target = findUserById(roleMatch[1]);
    if (!target) return sendJson(res, 404, { error: '用户不存在' });
    updateUser(target.id, { role });
    return sendJson(res, 200, { user: publicUser(target) });
  }

  const delMatch = urlPath.match(/^\/api\/admin\/users\/([^/]+)$/);
  if (delMatch && method === 'DELETE') {
    const admin = requireAdmin(req, res);
    if (!admin) return;
    if (delMatch[1] === admin.id) return sendJson(res, 400, { error: '不能删除自己' });
    const ok = deleteUser(delMatch[1]);
    if (!ok) return sendJson(res, 404, { error: '用户不存在' });
    return sendJson(res, 200, { ok: true });
  }

  sendJson(res, 404, { error: '接口不存在: ' + method + ' ' + urlPath });
}

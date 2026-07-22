// 数据层 —— 用户 / 会话的 JSON 文件持久化（零依赖，仅用 Node 内置模块）
// 数据存放在 game/data/ 目录，首次启动自动创建并写入默认管理员账号。
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DATA_DIR = process.env.GITGAME_DATA_DIR || path.join(__dirname, '..', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');

// 内存缓存，启动时从磁盘加载
let users = [];
let sessions = {};

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}

function writeJson(file, data) {
  ensureDir();
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

/* ============ 密码哈希（scrypt + 随机盐） ============ */
export function hashPassword(password, salt) {
  salt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

export function verifyPassword(password, salt, hash) {
  const { hash: candidate } = hashPassword(password, salt);
  const a = Buffer.from(candidate, 'hex');
  const b = Buffer.from(hash, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/* ============ 用户 ============ */
export function loadUsers() {
  ensureDir();
  users = readJson(USERS_FILE, []);
  // 首次运行：写入默认管理员 admin / admin123
  if (!users.some(u => u.role === 'admin')) {
    const { salt, hash } = hashPassword('admin123');
    users.push({
      id: 'u_' + crypto.randomBytes(8).toString('hex'),
      username: 'admin', salt, hash, role: 'admin',
      createdAt: Date.now(),
      progress: { levelStars: [], totalCmds: 0 },
    });
    saveUsers();
    console.log('  ℹ️  已创建默认管理员账号: admin / admin123（请尽快修改）');
  }
  return users;
}

export function saveUsers() { writeJson(USERS_FILE, users); }
export function getUsers() { return users; }
export function findUserByUsername(username) {
  return users.find(u => u.username.toLowerCase() === String(username).toLowerCase());
}
export function findUserById(id) { return users.find(u => u.id === id); }

export function findUserByGithubId(githubId) { return users.find(u => u.githubId === githubId); }

// GitHub OAuth 用户：无密码（随机哈希占位），以 githubId 关联
export function createGithubUser(username, githubId) {
  const { salt, hash } = hashPassword(crypto.randomBytes(24).toString('hex'));
  const user = {
    id: 'u_' + crypto.randomBytes(8).toString('hex'),
    username, salt, hash, role: 'player',
    githubId, createdAt: Date.now(),
    progress: { levelStars: [], totalCmds: 0 },
  };
  users.push(user);
  saveUsers();
  return user;
}

export function createUser(username, password, role = 'player') {
  const { salt, hash } = hashPassword(password);
  const user = {
    id: 'u_' + crypto.randomBytes(8).toString('hex'),
    username, salt, hash, role,
    createdAt: Date.now(),
    progress: { levelStars: [], totalCmds: 0 },
  };
  users.push(user);
  saveUsers();
  return user;
}

export function updateUser(id, patch) {
  const u = findUserById(id);
  if (!u) return null;
  Object.assign(u, patch);
  saveUsers();
  return u;
}

export function deleteUser(id) {
  const i = users.findIndex(u => u.id === id);
  if (i === -1) return false;
  users.splice(i, 1);
  saveUsers();
  // 同时清理该用户的会话
  for (const t in sessions) if (sessions[t].userId === id) delete sessions[t];
  saveSessions();
  return true;
}

// 返回不含密码字段的用户对象
export function publicUser(u) {
  if (!u) return null;
  const { salt, hash, ...rest } = u;
  return rest;
}

/* ============ 会话 ============ */
export function loadSessions() {
  ensureDir();
  sessions = readJson(SESSIONS_FILE, {});
  pruneSessions();
  return sessions;
}

export function saveSessions() { writeJson(SESSIONS_FILE, sessions); }

function pruneSessions() {
  const now = Date.now();
  let changed = false;
  for (const t in sessions) if (sessions[t].expires < now) { delete sessions[t]; changed = true; }
  if (changed) saveSessions();
}

export function createSession(userId, ttlMs = 7 * 24 * 3600 * 1000) {
  const token = crypto.randomBytes(32).toString('hex');
  sessions[token] = { userId, expires: Date.now() + ttlMs };
  saveSessions();
  return token;
}

export function getSession(token) {
  const s = sessions[token];
  if (!s) return null;
  if (s.expires < Date.now()) { delete sessions[token]; saveSessions(); return null; }
  return s;
}

export function destroySession(token) {
  if (sessions[token]) { delete sessions[token]; saveSessions(); }
}

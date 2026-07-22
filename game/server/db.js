// 数据层 —— 用户 / 会话持久化
// 双存储模式：
//   - 本地开发：JSON 文件（game/data/，零依赖，仅用 Node 内置模块）
//   - 云端 Vercel：Upstash Redis（配置 UPSTASH_REDIS_REST_URL/TOKEN 后自动启用）
// serverless 环境下文件系统是临时的，因此每个请求先 hydrate()（读 Redis），
// 处理完后 persist()（写回 Redis）。本地文件模式则保持"改动即写盘"。
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { kvGet, kvSet } from './redis.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DATA_DIR = process.env.GITGAME_DATA_DIR || path.join(__dirname, '..', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');

// 是否启用 Redis（云端）存储
export const useRedis = Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
const R_USERS = 'gitgame:users';
const R_SESSIONS = 'gitgame:sessions';

// 内存缓存 + 脏标记（Redis 模式下延迟到 persist() 统一写回）
let users = [];
let sessions = {};
let usersDirty = false;
let sessionsDirty = false;

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

export function saveUsers() {
  if (useRedis) { usersDirty = true; return; } // 云端：延迟到 persist() 写回
  writeJson(USERS_FILE, users);
}
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

export function saveSessions() {
  if (useRedis) { sessionsDirty = true; return; } // 云端：延迟到 persist() 写回
  writeJson(SESSIONS_FILE, sessions);
}

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

/* ============ serverless 生命周期（Vercel） ============ */
// 每个请求开始时调用：把全量数据载入内存
export async function hydrate() {
  if (!useRedis) { loadUsers(); loadSessions(); return; }
  users = (await kvGet(R_USERS)) || [];
  sessions = (await kvGet(R_SESSIONS)) || {};
  // 首次运行：写入默认管理员 admin / admin123
  if (!users.some(u => u.role === 'admin')) {
    const { salt, hash } = hashPassword('admin123');
    users.push({
      id: 'u_' + crypto.randomBytes(8).toString('hex'),
      username: 'admin', salt, hash, role: 'admin',
      createdAt: Date.now(),
      progress: { levelStars: [], totalCmds: 0 },
    });
    usersDirty = true;
  }
  pruneSessions();
}

// 请求结束时调用：把脏数据写回存储（Redis 模式）
export async function persist() {
  if (!useRedis) return; // 文件模式已在每次改动时写盘
  if (usersDirty) { await kvSet(R_USERS, users); usersDirty = false; }
  if (sessionsDirty) { await kvSet(R_SESSIONS, sessions); sessionsDirty = false; }
}

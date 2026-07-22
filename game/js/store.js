// 进度持久化 —— 以后端为主、localStorage 为缓存
// 登录用户的进度与账号绑定（存服务器），未登录/离线时回退到 localStorage。
import { app } from './state.js';
import { LEVELS } from './levels.js';
import { saveRemoteProgress } from './auth.js';

const LS_KEY = 'gitgame';

export function saveProgress() {
  // 本地缓存（离线兜底）
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ levelStars: app.levelStars, totalCmds: app.totalCmds }));
  } catch (e) { /* 隐私模式等场景下忽略 */ }
  // 同步到后端（静默，失败不影响游戏）
  saveRemoteProgress(app.levelStars, app.totalCmds);
}

// user 为 /api/auth/me 返回的当前用户（含 progress）；优先用后端进度
export function loadProgress(user) {
  const remote = user && user.progress && Array.isArray(user.progress.levelStars) && user.progress.levelStars.length
    ? user.progress : null;
  if (remote) {
    app.levelStars = remote.levelStars.slice(0, LEVELS.length);
    app.totalCmds = remote.totalCmds || 0;
    return;
  }
  // 回退：本地缓存
  try {
    const d = JSON.parse(localStorage.getItem(LS_KEY));
    if (d) {
      app.levelStars = d.levelStars || app.levelStars;
      app.totalCmds = d.totalCmds || 0;
    }
  } catch (e) { /* 忽略 */ }
}

export function unlockedCount() {
  let n = 1;
  for (let i = 0; i < LEVELS.length - 1; i++) { if (app.levelStars[i] > 0) n = i + 2; else break; }
  return n;
}

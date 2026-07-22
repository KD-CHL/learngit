// 入口 —— 认证守卫 → 初始化状态 → 渲染首屏 → 暴露内联 onclick 函数
// （ES Module 有自己的作用域，index.html 里的 onclick="xxx()" 找不到模块内函数，
//  所以这里统一暴露到全局。）
import { app, isAdmin } from './state.js';
import { LEVELS } from './levels.js';
import { loadProgress } from './store.js';
import { toggleSound } from './effects.js';
import { requireAuth, logout } from './auth.js';
import {
  showScreen, goHome, renderHome, startLevel, startSandbox, restartLevel,
  toggleHint, closeModal, nextLevel, renderSheet, toggleSheet,
} from './ui.js';
import { initInput, applySuggest } from './input.js';

// 按关卡数初始化进度数组
app.levelStars = new Array(LEVELS.length).fill(0);
app.levelDoneFlags = new Array(LEVELS.length).fill(false);

// 渲染头部用户信息（用户名 + 管理入口 + 退出）
function renderUserBar(user) {
  const bar = document.getElementById('userBar');
  if (!bar) return;
  bar.innerHTML =
    `<span class="user-chip" title="角色：${user.role === 'admin' ? '管理员' : '玩家'}">👤 ${escapeHtml(user.username)}</span>` +
    (isAdmin() ? `<button class="icon-btn" title="管理面板" onclick="location.href='./admin.html'">🛡️</button>` : '') +
    `<button class="icon-btn" title="退出登录" onclick="gameLogout()">⏻</button>`;
}
function escapeHtml(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

async function gameLogout() {
  await logout();
  location.href = './login.html';
}

async function init() {
  // 认证守卫：未登录跳转登录页
  const user = await requireAuth();
  if (!user) return;
  app.currentUser = user;

  loadProgress(user);
  renderUserBar(user);
  renderSheet();
  renderHome();
  showScreen('home');
  initInput();
}

init();

// 暴露给 index.html 内联事件
Object.assign(window, {
  goHome, toggleSheet, toggleSound, restartLevel, toggleHint,
  closeModal, nextLevel, startLevel, startSandbox, applySuggest,
  gameLogout,
});

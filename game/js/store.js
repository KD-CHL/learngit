// 进度持久化 —— 星级 / 累计命令数存入 localStorage
import { app } from './state.js';
import { LEVELS } from './levels.js';

export function saveProgress() {
  try {
    localStorage.setItem('gitgame', JSON.stringify({ levelStars: app.levelStars, totalCmds: app.totalCmds }));
  } catch (e) { /* 隐私模式等场景下忽略 */ }
}

export function loadProgress() {
  try {
    const d = JSON.parse(localStorage.getItem('gitgame'));
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

// 入口 —— 初始化状态、渲染首屏、把内联 onclick 需要的函数挂到 window
// （ES Module 有自己的作用域，index.html 里的 onclick="xxx()" 找不到模块内函数，
//  所以这里统一暴露到全局。）
import { app } from './state.js';
import { LEVELS } from './levels.js';
import { loadProgress } from './store.js';
import { toggleSound } from './effects.js';
import {
  showScreen, goHome, renderHome, startLevel, startSandbox, restartLevel,
  toggleHint, closeModal, nextLevel, renderSheet, toggleSheet,
} from './ui.js';
import { initInput, applySuggest } from './input.js';

// 按关卡数初始化进度数组
app.levelStars = new Array(LEVELS.length).fill(0);
app.levelDoneFlags = new Array(LEVELS.length).fill(false);

loadProgress();
renderSheet();
renderHome();
showScreen('home');
initInput();

// 暴露给 index.html 内联事件
Object.assign(window, {
  goHome, toggleSheet, toggleSound, restartLevel, toggleHint,
  closeModal, nextLevel, startLevel, startSandbox, applySuggest,
});

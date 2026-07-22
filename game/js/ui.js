// 界面编排 —— 屏幕切换 / 关卡生命周期 / 过关弹窗 / 速查表 / 自由模式
// 这里注入 app.afterCommand 钩子，把"命令执行后该做什么"交给 ui 决定，
// 让 commands.js 保持对界面与关卡判定的零依赖。
import { G, app } from './state.js';
import { LEVELS } from './levels.js';
import { render, updateCmdCount } from './render.js';
import { print, esc, clearTerm } from './terminal.js';
import { sfxClick, sfxWin, confettiBurst } from './effects.js';
import { saveProgress, unlockedCount } from './store.js';

// 命令执行后的统一回调：渲染面板，必要时检查过关
app.afterCommand = (shouldCheck) => {
  render();
  if (shouldCheck) checkLevel();
};

export function showScreen(name) {
  document.getElementById('screen-home').hidden = name !== 'home';
  document.getElementById('screen-game').hidden = name !== 'game';
}

export function goHome() {
  sfxClick(); app.sandbox = false; showScreen('home'); renderHome();
}

export function renderHome() {
  const unlocked = unlockedCount();
  const done = app.levelStars.filter(s => s > 0).length;
  const stars = app.levelStars.reduce((a, b) => a + b, 0);
  document.getElementById('statDone').textContent = `${done}/${LEVELS.length}`;
  document.getElementById('statStars').textContent = stars;
  document.getElementById('statCmds').textContent = app.totalCmds;
  document.getElementById('totalStars').textContent = stars;
  document.getElementById('maxStars').textContent = LEVELS.length * 3;
  const stages = [...new Set(LEVELS.map(l => l.stage))];
  let html = '';
  stages.forEach(st => {
    html += `<div class="stage-block"><div class="stage-head"><span class="num">${st.split(' ')[0]}</span><h2>${st.split(' ')[1]}</h2><span class="line"></span></div><div class="level-grid">`;
    LEVELS.forEach((lv, i) => {
      if (lv.stage !== st) return;
      const locked = i >= unlocked;
      const s = app.levelStars[i];
      html += `<div class="level-card ${locked ? 'locked' : ''}" onclick="${locked ? '' : `startLevel(${i})`}">
        ${locked ? '<span class="lc-lock">🔒</span>' : ''}
        <div class="lc-top"><span class="lc-num">LEVEL ${String(i + 1).padStart(2, '0')}</span>
        <span class="lc-stars">${'<span class="star-on">★</span>'.repeat(s)}${'<span class="star-off">★</span>'.repeat(3 - s)}</span></div>
        <h3>${esc(lv.title)}</h3><p>${esc(lv.desc.replace(/<[^>]+>/g, '')).slice(0, 46)}…</p></div>`;
    });
    html += '</div></div>';
  });
  document.getElementById('levelList').innerHTML = html;
}

export function startLevel(i) {
  sfxClick(); app.sandbox = false; app.currentLevel = i; loadLevel(i); showScreen('game');
}

export function loadLevel(i) {
  app.currentLevel = i; const lv = LEVELS[i];
  lv.setup(G); G.used = new Set(); app.cmdCount = 0; app.levelDoneFlags[i] = false;
  document.getElementById('gbStage').textContent = lv.id;
  document.getElementById('gbTitle').textContent = `第 ${i + 1} 关 · ${lv.title}`;
  document.getElementById('missionTitle').textContent = lv.title;
  document.getElementById('missionDesc').innerHTML = lv.desc;
  document.getElementById('parCount').textContent = lv.par;
  document.getElementById('hintBox').style.display = 'none';
  document.getElementById('hintBox').innerHTML = lv.hints.map(h => '$ ' + esc(h)).join('<br>');
  updateCmdCount(); render();
  clearTerm();
  print(`═══ 第 ${i + 1} 关 · ${lv.title} ═══`, 'warn');
  print(`目标步数 par = ${lv.par}（用更少命令拿 3 星）`, 'head');
  print('输入 help 查看命令，Tab 自动补全', 'info');
}

// 自由模式：空仓库，随便玩，不计星级
export function startSandbox() {
  sfxClick();
  app.sandbox = true; app.cmdCount = 0;
  G.reset(); G.used = new Set();
  document.getElementById('gbStage').textContent = '🧪';
  document.getElementById('gbTitle').textContent = '自由模式';
  document.getElementById('missionTitle').textContent = '自由模式';
  document.getElementById('missionDesc').innerHTML =
    '一个空仓库，随意练习所有命令：<code>commit</code>、<code>branch</code>、<code>merge</code>、<code>rebase</code>、<code>cherry-pick</code>、<code>stash</code>……' +
    '右侧实时可视化你的操作。进度不计入星级，点左上角返回关卡列表。';
  document.getElementById('parCount').textContent = '—';
  document.getElementById('hintBox').style.display = 'none';
  document.getElementById('hintBox').innerHTML = '';
  updateCmdCount(); render();
  clearTerm();
  print('═══ 自由模式 ═══', 'warn');
  print('空仓库已就绪，输入 help 查看命令', 'head');
  showScreen('game');
}

export function restartLevel() {
  if (app.sandbox) { startSandbox(); print('已重置为空仓库', 'warn'); return; }
  loadLevel(app.currentLevel); print('本关已重置', 'warn');
}

export function toggleHint() {
  const b = document.getElementById('hintBox');
  b.style.display = b.style.display === 'none' ? 'block' : 'none'; sfxClick();
}

export function starsFor(count, par) {
  if (count <= par) return 3; if (count <= par + 2) return 2; return 1;
}

export function checkLevel() {
  if (app.sandbox) return;                    // 自由模式不判关
  const lv = LEVELS[app.currentLevel];
  if (app.levelDoneFlags[app.currentLevel]) return;
  if (lv.check(G)) {
    app.levelDoneFlags[app.currentLevel] = true;
    const s = starsFor(app.cmdCount, lv.par);
    app.levelStars[app.currentLevel] = Math.max(app.levelStars[app.currentLevel], s);
    app.totalCmds += app.cmdCount; saveProgress();
    setTimeout(() => showModal(lv, s), 380);
  }
}

export function showModal(lv, s) {
  const isLast = app.currentLevel === LEVELS.length - 1;
  document.getElementById('modalIcon').textContent = isLast ? '🏆' : '🎉';
  document.getElementById('modalTitle').textContent = isLast ? '恭喜全部通关！' : '过关！';
  document.getElementById('modalStars').innerHTML = '<span class="star-on">' + '★'.repeat(s) + '</span><span class="star-off">' + '★'.repeat(3 - s) + '</span>';
  document.getElementById('modalText').textContent = lv.done + `（本关用了 ${app.cmdCount} 步，par ${lv.par}）`;
  document.getElementById('modalBtn').textContent = isLast ? '🔁 重新挑战' : '下一关 →';
  document.getElementById('modal').classList.add('show');
  sfxWin(); confettiBurst();
}

export function closeModal() {
  document.getElementById('modal').classList.remove('show');
}

export function nextLevel() {
  closeModal();
  if (app.currentLevel === LEVELS.length - 1) { goHome(); return; }
  startLevel(app.currentLevel + 1);
}

/* ============ 速查表 ============ */
export const SHEET = [
  ['基础', ['git init', 'git status', 'git add .', 'git commit -m "msg"', 'git log --oneline', 'git diff']],
  ['撤销', ['git restore <f>', 'git restore --staged <f>', 'git commit --amend', 'git reset --hard HEAD~1', 'git revert <c>']],
  ['分支', ['git branch', 'git switch -c <b>', 'git merge <b>', 'git merge --no-ff <b>', 'git rebase <b>', 'git cherry-pick <c>']],
  ['远程', ['git clone <url>', 'git push -u origin <b>', 'git pull --rebase', 'git fetch --prune']],
  ['暂存/标签', ['git stash', 'git stash pop', 'git tag v1.0.0', 'git tag -a v1 -m "msg"']],
  ['高级', ['git reflog', 'git bisect', 'git worktree add', 'git blame <f>', 'git submodule add']],
];

export function renderSheet() {
  document.getElementById('sheetGrid').innerHTML = SHEET.map(([t, cmds]) =>
    `<div class="sh-group"><h4>${t}</h4>${cmds.map(c => {
      const sp = c.indexOf(' '); const name = sp > 0 ? c.slice(0, sp) : c; const arg = sp > 0 ? c.slice(sp) : '';
      return `<div class="sh-cmd"><span class="c">${esc(name)}</span><span class="d">${esc(arg)}</span></div>`;
    }).join('')}</div>`).join('');
}

export function toggleSheet() {
  const o = document.getElementById('sheetOverlay');
  o.classList.toggle('show'); sfxClick();
}

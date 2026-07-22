// 面板渲染 —— 分支列表 / 工作区文件状态 / 步数统计，统一 render() 入口
import { G, app } from './state.js';
import { esc, updatePrompt } from './terminal.js';
import { renderGraph, LANE_COLORS } from './graph.js';

export function renderBranches() {
  const el = document.getElementById('branchList');
  const branchIds = [...Object.values(G.branches)];
  let html = '';
  const names = Object.keys(G.branches);
  names.forEach(b => {
    const id = G.branches[b];
    const col = LANE_COLORS[branchIds.indexOf(id) % LANE_COLORS.length];
    const cur = b === G.headBranch;
    html += `<div class="branch-row ${cur ? 'cur' : ''}"><span class="bdot" style="background:${col}"></span>` +
      `<span>${cur ? '➜ ' : ''}${esc(b)}</span><span class="bhash">${id ? id.slice(0, 7) : '(空)'}</span></div>`;
  });
  el.innerHTML = html || '<div class="empty-note">无分支</div>';
}

export function renderFiles() {
  const el = document.getElementById('fileState');
  const ht = G.headTree();
  const all = new Set([...Object.keys(G.files), ...Object.keys(G.index)]);
  if (!all.size) { el.innerHTML = '<div class="empty-note">工作区是空的</div>'; return; }
  let html = '';
  for (const f of [...all].sort()) {
    const inHead = ht[f] !== undefined, inIdx = G.index[f] !== undefined, inWd = G.files[f] !== undefined;
    const isConflict = G.mergeInProgress && G.mergeInProgress.conflictFiles.has(f);
    let st, lb;
    if (isConflict) { st = 'conflict'; lb = '冲突!'; }
    else if (!inHead && !inIdx && inWd) { st = 'untracked'; lb = '未跟踪'; }
    else if (inIdx && G.index[f] !== ht[f] && (inWd ? G.files[f] === G.index[f] : true)) { st = 'staged'; lb = '已暂存'; }
    else if (inWd && inIdx && G.files[f] !== G.index[f]) { st = 'modified'; lb = '已修改'; }
    else if (inWd && !inIdx && inHead && G.files[f] !== ht[f]) { st = 'modified'; lb = '已修改'; }
    else { st = 'clean'; lb = '干净'; }
    html += `<div class="file-item"><span>📄</span><span>${esc(f)}</span><span class="fstatus ${st}">${lb}</span></div>`;
  }
  el.innerHTML = html;
}

export function render() {
  renderGraph(); renderBranches(); renderFiles(); updatePrompt();
}

export function updateCmdCount() {
  document.getElementById('cmdCount').textContent = app.cmdCount;
}

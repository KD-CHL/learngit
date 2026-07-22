// SVG 提交图谱 —— 按泳道算法把提交历史画成类似 git log --graph 的分支图
import { G } from './state.js';
import { esc } from './terminal.js';

export const LANE_COLORS = ['#3fb950', '#58a6ff', '#bc8cff', '#f0883e', '#f778ba', '#2dd4bf', '#d29922', '#f85149'];

export function buildGraph() {
  const seen = new Set(), ids = [];
  const heads = [...new Set([...Object.values(G.branches), ...Object.values(G.tags)])].filter(Boolean);
  const stack = [...heads];
  while (stack.length) {
    const id = stack.pop();
    if (!id || seen.has(id)) continue;
    seen.add(id); ids.push(id);
    G.commits[id].parents.forEach(p => stack.push(p));
  }
  ids.sort((a, b) => parseInt(b, 16) - parseInt(a, 16));
  const lanes = [], commitLane = {}, rowOf = {};
  ids.forEach((id, row) => {
    rowOf[id] = row;
    let lane = lanes.indexOf(id);
    if (lane === -1) { lane = lanes.indexOf(null); if (lane === -1) { lane = lanes.length; lanes.push(null); } }
    commitLane[id] = lane;
    for (let i = 0; i < lanes.length; i++) if (i !== lane && lanes[i] === id) lanes[i] = null;
    const c = G.commits[id];
    lanes[lane] = c.parents[0] || null;
    for (let i = 1; i < c.parents.length; i++) {
      const p = c.parents[i];
      let pl = lanes.indexOf(null); if (pl === -1) { pl = lanes.length; lanes.push(null); }
      lanes[pl] = p;
    }
  });
  return { ids, commitLane, rowOf, numLanes: Math.max(lanes.length, 1) };
}

export function renderGraph() {
  const box = document.getElementById('graphBox');
  const { ids, commitLane, rowOf, numLanes } = buildGraph();
  if (!ids.length) { box.innerHTML = '<div class="empty-note">还没有提交，完成第一关吧！</div>'; return; }
  const LW = 64, RH = 52, PAD_L = 26, PAD_T = 26, PAD_B = 20;
  const labelW = 190;
  const W = PAD_L + (numLanes - 1) * LW + labelW + 20;
  const H = PAD_T + ids.length * RH + PAD_B;
  const x = id => PAD_L + commitLane[id] * LW;
  const y = id => PAD_T + rowOf[id] * RH;
  let edges = '';
  for (const id of ids) {
    const c = G.commits[id];
    for (const p of c.parents) {
      if (!p || !commitLane.hasOwnProperty(p)) continue;
      const pc = LANE_COLORS[commitLane[p] % LANE_COLORS.length];
      if (commitLane[p] === commitLane[id])
        edges += `<line x1="${x(id)}" y1="${y(id)}" x2="${x(p)}" y2="${y(p)}" stroke="${pc}" stroke-width="2.5" opacity=".7"/>`;
      else {
        edges += `<path d="M ${x(id)} ${y(id)} C ${x(id)} ${(y(id) + y(p)) / 2}, ${x(p)} ${(y(id) + y(p)) / 2}, ${x(p)} ${y(p)}" fill="none" stroke="${pc}" stroke-width="2.5" opacity=".7"/>`;
      }
    }
  }
  let nodes = '';
  for (const id of ids) {
    const c = G.commits[id], col = LANE_COLORS[commitLane[id] % LANE_COLORS.length];
    const isHead = G.headCommit === id;
    const refs = [];
    if (isHead) refs.push(G.headBranch ? `HEAD→${G.headBranch}` : 'HEAD');
    for (const b in G.branches) if (G.branches[b] === id && b !== G.headBranch) refs.push(b);
    for (const tg in G.tags) if (G.tags[tg] === id) refs.push(`🏷${tg}`);
    const lx = PAD_L + (numLanes - 1) * LW + 22;
    nodes += `<circle cx="${x(id)}" cy="${y(id)}" r="${isHead ? 8 : 6.5}" fill="${isHead ? col : '#0d1117'}" stroke="${col}" stroke-width="2.5"/>`;
    if (isHead) nodes += `<circle cx="${x(id)}" cy="${y(id)}" r="12" fill="none" stroke="${col}" stroke-width="1.5" opacity=".4"/>`;
    nodes += `<text x="${lx}" y="${y(id) + 4}" font-size="12" fill="${refs.length ? '#e6edf3' : '#8b949e'}" font-family="monospace">` +
      `${refs.map(r => `<tspan fill="${col}" font-weight="bold">${esc(r)}</tspan>`).join(' ')}${refs.length ? ' ' : ''}${esc(c.msg).slice(0, 22)}</text>`;
  }
  box.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${edges}${nodes}</svg>`;
}

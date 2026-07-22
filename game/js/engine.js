// 迷你 git 引擎 —— 用对象模型模拟 git 的工作区/暂存区/提交/分支/HEAD
export class GitEngine {
  constructor() { this.reset(); }

  reset() {
    this.files = {};            // 工作区 {path: content}
    this.index = {};            // 暂存区
    this.commits = {};          // {id: {id, msg, parents:[], tree:{}}}
    this.branches = { main: null };
    this.HEAD = 'main';         // 分支名 或 {detached: commitId}
    this.stash = [];
    this.tags = {};
    this.used = new Set();      // 本关用过的子命令
    this.mergeInProgress = null;
    this.reflog = [];           // [{hash, action}] 最新在前，模拟 git reflog
    this._n = 0;
  }

  // 记录一次 HEAD 移动（reflog 最新在前）
  pushReflog(hash, action) {
    if (!hash) return;
    this.reflog.unshift({ hash, action });
    if (this.reflog.length > 100) this.reflog.length = 100;
  }

  get headCommit() {
    return typeof this.HEAD === 'string' ? this.branches[this.HEAD] : this.HEAD.detached;
  }
  get headBranch() {
    return typeof this.HEAD === 'string' ? this.HEAD : null;
  }
  headTree() {
    const c = this.commits[this.headCommit];
    return c ? c.tree : {};
  }
  newId() { return (++this._n).toString(16).padStart(7, '0'); }
  snap(o) { return JSON.parse(JSON.stringify(o)); }

  // a 是否为 b 的祖先（沿第一父提交回溯）
  isAncestor(a, b) {
    if (a === null || a === undefined) return true;
    let c = b;
    while (c) {
      if (c === a) return true;
      const n = this.commits[c];
      c = n ? n.parents[0] : null;
    }
    return false;
  }

  commonAncestor(a, b) {
    const s = new Set();
    let c = a;
    while (c) { s.add(c); c = this.commits[c].parents[0]; }
    let d = b;
    while (d) { if (s.has(d)) return d; d = this.commits[d].parents[0]; }
    return null;
  }

  // 解析引用：HEAD / 分支 / 标签 / hash 前缀 / <ref>~<n>
  resolve(ref) {
    if (!ref) return this.headCommit;
    const t = ref.match(/^(.+)~(\d+)$/);
    const base = t ? t[1] : ref;
    const n = t ? parseInt(t[2]) : 0;
    let cur;
    if (base === 'HEAD') cur = this.headCommit;
    else if (this.branches[base] !== undefined) cur = this.branches[base];
    else if (this.tags[base] !== undefined) cur = this.tags[base];
    else { for (const id in this.commits) if (id.startsWith(base)) { cur = id; break; } }
    for (let i = 0; i < n && cur; i++) cur = this.commits[cur].parents[0];
    return cur;
  }
}

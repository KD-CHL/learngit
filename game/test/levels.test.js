// Node 可解性测试 —— 在 Node 里模拟 DOM，逐关执行题解命令并断言 check() 通过
// 运行：npm test  （或 node test/levels.test.js）
// 说明：游戏模块本为浏览器设计，这里用最小 DOM mock 让其在 Node 中可被 import。

/* ============ 最小 DOM mock（必须在 import 游戏模块之前就位） ============ */
function makeCtx() {
  return new Proxy({}, {
    get: () => () => {},
    set: () => true,
  });
}
function makeEl() {
  return {
    innerHTML: '', textContent: '', value: '',
    style: {}, hidden: false, scrollTop: 0, scrollHeight: 0, width: 0, height: 0,
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    insertAdjacentHTML() {}, getContext: makeCtx,
    addEventListener() {}, focus() {},
  };
}
const els = {};
globalThis.document = {
  getElementById: id => els[id] || (els[id] = makeEl()),
  addEventListener() {},
  activeElement: null,
};
globalThis.addEventListener = () => {};
globalThis.innerWidth = 1280;
globalThis.innerHeight = 800;
globalThis.requestAnimationFrame = () => {};
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
globalThis.window = globalThis;

/* ============ 动态导入游戏模块 ============ */
const { G } = await import('../js/state.js');
const { LEVELS } = await import('../js/levels.js');
const { execute } = await import('../js/commands.js');
const { renderGraph } = await import('../js/graph.js');

/* ============ 每题的题解命令序列 ============ */
const SOLUTIONS = [
  ['echo "hello git" > hello.txt', 'git add hello.txt', 'git commit -m "first commit"'],
  ['echo "more" >> hello.txt', 'git status', 'git diff', 'git add .', 'git commit -m "update"'],
  ['echo "oops" >> hello.txt', 'git restore hello.txt'],
  ['echo "change" >> hello.txt', 'git add hello.txt', 'git restore --staged hello.txt'],
  ['echo "note" > note.txt', 'git add note.txt', 'git commit --amend --no-edit'],
  ['git reset --hard HEAD~1'],
  ['git switch -c feature-login'],
  ['echo "login page" > login.txt', 'git add login.txt', 'git commit -m "feat: login"'],
  ['git switch main', 'git merge feature-login'],
  ['git cherry-pick dev~1'],
  ['git rebase main'],
  ['git merge other', 'echo "resolved content" > story.txt', 'git add story.txt', 'git commit -m "merge: resolve conflict"'],
  ['echo "wip" >> hello.txt', 'git stash', 'git stash pop'],
  ['git tag v1.0.0'],
  ['git revert HEAD'],
  // reflog 关卡：丢失提交的 hash 是动态的，用函数从引擎状态里找出来
  G => ['git reflog', `git reset --hard ${Object.keys(G.commits).find(id => G.commits[id].msg === 'important work').slice(0, 7)}`],
  ['git reset --soft HEAD~2', 'git commit -m "feat: complete feature"'],
];

let pass = 0, fail = 0;
LEVELS.forEach((lv, i) => {
  const raw = SOLUTIONS[i];
  if (!raw) { console.error(`✗ 第 ${i + 1} 关 缺少题解`); fail++; return; }
  lv.setup(G);
  G.used = new Set();
  const sol = typeof raw === 'function' ? raw(G) : raw;
  for (const cmd of sol) execute(cmd);
  const ok = lv.check(G);
  // 顺带冒烟测试图谱渲染不抛错
  let graphOk = true;
  try { renderGraph(); } catch (e) { graphOk = false; }
  if (ok && graphOk) { console.log(`✓ 第 ${String(i + 1).padStart(2)} 关 「${lv.title}」 通过（${sol.length} 步）`); pass++; }
  else { console.error(`✗ 第 ${String(i + 1).padStart(2)} 关 「${lv.title}」 失败 check=${ok} graph=${graphOk}`); fail++; }
});

console.log(`\n${pass}/${LEVELS.length} 关通过${fail ? `，${fail} 关失败` : '，全部可解 🎉'}`);
process.exit(fail ? 1 : 0);

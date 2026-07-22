// 关卡数据 —— 纯数据模块，不依赖任何 DOM / UI
// 每个关卡：setup(g) 初始化引擎状态，check(g) 判定是否通关，
// par 是目标步数（越少星越多），hints 是提示命令。

export function seed(g) {
  g.index['hello.txt'] = 'hello git\n'; g.files['hello.txt'] = 'hello git\n';
  const id = g.newId();
  g.commits[id] = { id, msg: 'first commit', parents: [], tree: g.snap(g.index) };
  g.branches.main = id;
}

export function commitTo(g, branch, msg, tree) {
  g.index = g.snap(tree); g.files = g.snap(tree);
  const id = g.newId();
  g.commits[id] = { id, msg, parents: [g.branches[branch]], tree: g.snap(tree) };
  g.branches[branch] = id;
  return id;
}

export const LEVELS = [
  {
    stage: '01 基础', id: '01', title: '初次提交', par: 3,
    desc: '用 <code>echo "hello git" > hello.txt</code> 创建文件，<code>git add</code> 暂存，再 <code>git commit -m "..."</code> 提交。',
    hints: ['echo "hello git" > hello.txt', 'git add hello.txt', 'git commit -m "first commit"'],
    setup(g) { g.reset(); },
    check(g) { const c = g.commits[g.branches.main]; return c && c.tree['hello.txt'] !== undefined; },
    done: 'add 把文件放入暂存区，commit 把暂存区快照存入仓库——这是 git 的心跳。'
  },
  {
    stage: '01 基础', id: '01', title: '观察状态', par: 5,
    desc: '追加一行到 hello.txt，必须先用 <code>git status</code> 和 <code>git diff</code> 观察变化，再提交。',
    hints: ['echo "more" >> hello.txt', 'git status', 'git diff', 'git add .', 'git commit -m "update"'],
    setup(g) { g.reset(); seed(g); },
    check(g) { return g.used.has('status') && g.used.has('diff') && g.commits[g.branches.main] && g.commits[g.branches.main].tree['hello.txt'] !== 'hello git\n'; },
    done: 'status 告诉你"发生了什么"，diff 告诉你"改了什么"，是每天用得最多的两个命令。'
  },
  {
    stage: '02 撤销', id: '02', title: '撤销工作区修改', par: 2,
    desc: '追加一行到 hello.txt 后反悔了——用 <code>git restore hello.txt</code> 丢弃未暂存的修改（不要提交）。',
    hints: ['echo "oops" >> hello.txt', 'git restore hello.txt'],
    setup(g) { g.reset(); seed(g); },
    check(g) { const c = g.commits[g.branches.main]; return g.used.has('restore') && c && c.tree['hello.txt'] === 'hello git\n' && g.files['hello.txt'] === 'hello git\n'; },
    done: 'restore 把工作区文件恢复到暂存区/HEAD 版本。注意：未暂存的修改 restore 后不可恢复！'
  },
  {
    stage: '02 撤销', id: '02', title: '取消暂存', par: 3,
    desc: '修改 hello.txt 并 <code>git add</code>，再用 <code>git restore --staged hello.txt</code> 移出暂存区（修改保留）。',
    hints: ['echo "change" >> hello.txt', 'git add hello.txt', 'git restore --staged hello.txt'],
    setup(g) { g.reset(); seed(g); },
    check(g) { return g.used.has('add') && g.used.has('restore') && g.index['hello.txt'] === 'hello git\n' && g.files['hello.txt'] !== 'hello git\n'; },
    done: '--staged 只动暂存区不碰工作区，文件回到"已修改未暂存"状态。'
  },
  {
    stage: '02 撤销', id: '02', title: 'amend 补救', par: 3,
    desc: '上一个提交漏掉了 note.txt！创建 <code>note.txt</code> 并 add，然后用 <code>git commit --amend --no-edit</code> 把它补进上一次提交。',
    hints: ['echo "note" > note.txt', 'git add note.txt', 'git commit --amend --no-edit'],
    setup(g) { g.reset(); seed(g); },
    check(g) { const c = g.commits[g.branches.main]; return c && c.tree['note.txt'] !== undefined && c.tree['hello.txt'] !== undefined; },
    done: 'amend 会"重写"上一次提交（生成新 hash）。只用于还没 push 的提交。'
  },
  {
    stage: '02 撤销', id: '02', title: '时光倒流', par: 1,
    desc: '现在有 3 个提交，用 <code>git reset --hard HEAD~1</code> 回退一个提交，丢弃最新改动。',
    hints: ['git log --oneline', 'git reset --hard HEAD~1'],
    setup(g) {
      g.reset(); seed(g);
      commitTo(g, 'main', 'v2', { 'hello.txt': 'hello git\nv2\n' });
      commitTo(g, 'main', 'v3', { 'hello.txt': 'hello git\nv2\nv3\n' });
    },
    check(g) { const c = g.commits[g.branches.main]; return c && c.msg !== 'v3' && g.files['hello.txt'] === 'hello git\nv2\n'; },
    done: '--hard 同时重置暂存区和工作区，威力最大。误删提交可以用 git reflog 找回（见教程 08）。'
  },
  {
    stage: '03 分支', id: '03', title: '创建并切换分支', par: 1,
    desc: '用 <code>git switch -c feature-login</code> 创建并切换到新分支。',
    hints: ['git switch -c feature-login'],
    setup(g) { g.reset(); seed(g); },
    check(g) { return g.headBranch === 'feature-login'; },
    done: 'switch -c = 创建 + 切换。新分支从当前提交出发，改动互不影响。'
  },
  {
    stage: '03 分支', id: '03', title: '分支上开发', par: 3,
    desc: '在 feature-login 分支上创建 login.txt 并提交。main 分支不会受影响。',
    hints: ['echo "login page" > login.txt', 'git add login.txt', 'git commit -m "feat: login"'],
    setup(g) { g.reset(); seed(g); g.branches['feature-login'] = g.branches.main; g.HEAD = 'feature-login'; },
    check(g) {
      const c = g.commits[g.branches['feature-login']];
      return g.headBranch === 'feature-login' && c && c.tree['login.txt'] !== undefined && g.commits[g.branches.main].tree['login.txt'] === undefined;
    },
    done: '提交只属于 feature-login。切回 main 看看，login.txt 并不在那里。'
  },
  {
    stage: '03 分支', id: '03', title: '合并分支', par: 2,
    desc: '切回 main（<code>git switch main</code>），用 <code>git merge feature-login</code> 合并功能。',
    hints: ['git switch main', 'git merge feature-login'],
    setup(g) {
      g.reset(); seed(g);
      g.branches['feature-login'] = g.branches.main; g.HEAD = 'feature-login';
      commitTo(g, 'feature-login', 'feat: login', { 'hello.txt': 'hello git\n', 'login.txt': 'login page\n' });
      g.HEAD = 'main'; const tr = g.headTree(); g.files = g.snap(tr); g.index = g.snap(tr);
    },
    check(g) { const c = g.commits[g.branches.main]; return g.headBranch === 'main' && c && c.tree['login.txt'] !== undefined; },
    done: '这次是 Fast-forward：main 没有新提交，指针直接前移。两边都有新提交时会产生 merge commit。'
  },
  {
    stage: '03 分支', id: '03', title: '精准摘取 cherry-pick', par: 2,
    desc: 'dev 分支上有两个提交，只把添加 <code>fix.txt</code> 的那个（较早的）摘到 main，不要另一个。提示：<code>git log dev --oneline</code> 查看，用 <code>git cherry-pick dev~1</code>。',
    hints: ['git log dev --oneline', 'git cherry-pick dev~1'],
    setup(g) {
      g.reset(); seed(g);
      g.branches['dev'] = g.branches.main;
      commitTo(g, 'dev', 'fix: hotfix', { 'hello.txt': 'hello git\n', 'fix.txt': 'hotfix\n' });
      commitTo(g, 'dev', 'wip: experiment', { 'hello.txt': 'hello git\n', 'fix.txt': 'hotfix\n', 'exp.txt': 'wip\n' });
    },
    check(g) { const c = g.commits[g.branches.main]; return c && c.tree['fix.txt'] !== undefined && c.tree['exp.txt'] === undefined; },
    done: 'cherry-pick 只复制某个提交的"改动"，而不是合并整个分支，适合挑选 hotfix。'
  },
  {
    stage: '03 分支', id: '03', title: '变基 rebase', par: 1,
    desc: 'main 和 feat 各自有新提交。站在 feat 分支上用 <code>git rebase main</code>，把 feat 的提交"搬"到 main 最新提交之后，让历史变成一条直线。',
    hints: ['git rebase main'],
    setup(g) {
      g.reset(); seed(g);
      g.branches['feat'] = g.branches.main;
      commitTo(g, 'main', 'main work', { 'hello.txt': 'hello git\n', 'main.txt': 'main\n' });
      g.HEAD = 'feat'; commitTo(g, 'feat', 'feat work', { 'hello.txt': 'hello git\n', 'feat.txt': 'feat\n' });
    },
    check(g) { return g.headBranch === 'feat' && g.isAncestor(g.branches.main, g.branches['feat']) && g.commits[g.branches['feat']].tree['main.txt'] !== undefined; },
    done: 'rebase 重放了你的提交，历史变成直线且包含 main 的最新内容。记住：不要 rebase 已推送的公共分支。'
  },
  {
    stage: '04 冲突', id: '04', title: '解决合并冲突', par: 4,
    desc: 'main 和 other 分支修改了 story.txt 的同一行。执行 <code>git merge other</code> 会冲突——打开文件会看到 <code><<<<<<</code> 标记，用 <code>echo "..." > story.txt</code> 写入解决后的内容，然后 <code>git add</code> + <code>git commit</code>。',
    hints: ['git merge other', 'echo "resolved content" > story.txt', 'git add story.txt', 'git commit -m "merge: resolve conflict"'],
    setup(g) {
      g.reset();
      g.index['story.txt'] = 'line A\nline B\n'; g.files['story.txt'] = 'line A\nline B\n';
      const id = g.newId();
      g.commits[id] = { id, msg: 'base story', parents: [], tree: g.snap(g.index) }; g.branches.main = id;
      g.branches['other'] = id;
      commitTo(g, 'main', 'main edit', { 'story.txt': 'main change\nline B\n' });
      g.HEAD = 'other'; commitTo(g, 'other', 'other edit', { 'story.txt': 'other change\nline B\n' });
      g.HEAD = 'main'; const tr = g.headTree(); g.files = g.snap(tr); g.index = g.snap(tr);
    },
    check(g) {
      const c = g.commits[g.branches.main];
      return !g.mergeInProgress && c && c.parents.length === 2 && !g.files['story.txt'].includes('<<<<<<<');
    },
    done: '冲突不可怕：编辑文件去掉标记 → add → commit。解不了随时 git merge --abort 回到合并前。'
  },
  {
    stage: '05 暂存与标签', id: '05', title: '临时 stash', par: 3,
    desc: '改到一半（追加一行到 hello.txt）要切分支修 bug。用 <code>git stash</code> 保存现场，再 <code>git stash pop</code> 恢复。',
    hints: ['echo "wip" >> hello.txt', 'git stash', 'git stash pop'],
    setup(g) { g.reset(); seed(g); },
    check(g) { return g.used.has('stash') && g.stash.length === 0 && g.files['hello.txt'] !== 'hello git\n'; },
    done: 'stash 把工作区"收进抽屉"，pop 取出并删除记录，多任务切换的救命稻草。'
  },
  {
    stage: '05 暂存与标签', id: '05', title: '发布打标签', par: 1,
    desc: '项目稳定了，给当前提交打上版本标签 <code>git tag v1.0.0</code>，再用 <code>git tag</code> 确认。',
    hints: ['git tag v1.0.0', 'git tag'],
    setup(g) { g.reset(); seed(g); commitTo(g, 'main', 'release prep', { 'hello.txt': 'hello git\nfinal\n' }); },
    check(g) { return g.tags['v1.0.0'] !== undefined; },
    done: '🏆 全部通关！标签是不可变的版本快照点，真实项目用 git tag -a v1.0.0 -m "..." 创建附注标签。'
  },
];

# Learn Git — 从入门到精通

一个系统化的 Git 操作练习仓库，按难度递进编排，覆盖所有核心操作。

## 学习路线

| 阶段 | 目录 | 内容 | 难度 |
|------|------|------|------|
| 1 | `01-basics/` | init, config, add, commit, status, log, diff, show | ⭐ |
| 2 | `02-undo/` | restore, reset, revert, clean, amend | ⭐⭐ |
| 3 | `03-branching/` | branch, switch, merge, rebase, cherry-pick | ⭐⭐ |
| 4 | `04-remote/` | clone, remote, push, pull, fetch, tracking | ⭐⭐ |
| 5 | `05-stash-and-tags/` | stash, tag, release 管理 | ⭐⭐⭐ |
| 6 | `06-rewrite-history/` | interactive rebase, squash, fixup, reword, filter | ⭐⭐⭐⭐ |
| 7 | `07-conflicts/` | 冲突解决, merge 策略, rerere, ours/theirs | ⭐⭐⭐⭐ |
| 8 | `08-advanced/` | reflog, bisect, worktree, submodule, subtree, blame | ⭐⭐⭐⭐⭐ |
| 9 | `09-internals/` | 对象模型, plumbing 命令, refs, HEAD, packfile | ⭐⭐⭐⭐⭐ |

## 练习方法

每个目录下的 README 包含：
- **概念讲解** — 理解原理
- **命令速查** — 快速参考
- **动手练习** — 跟着做一遍

`exercises/` 目录提供场景脚本，运行后会自动构造特定的 git 状态供你练习解决。

## 建议

- 按顺序学习，每个阶段至少动手练两遍
- 遇到不确定的操作先 `git status` 确认状态
- 大胆实验，`git reflog` 是你的后悔药
- 练习分支操作时多画图理解指针移动

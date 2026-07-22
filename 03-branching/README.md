# 03 — 分支操作

## 核心概念

Git 分支本质上是指向某个 commit 的可移动指针。`HEAD` 指向当前所在分支。

合并方式：
- **Fast-forward**：目标分支没有新提交时，直接移动指针
- **Three-way merge**：两边都有新提交时，创建合并提交
- **Rebase**：把当前分支的提交"搬"到目标分支顶端，历史变成一条直线

## 命令速查

```bash
# 分支管理
git branch                      # 列出本地分支
git branch -a                   # 列出所有分支（含远程）
git branch -v                   # 显示每个分支最新提交
git branch <name>               # 创建分支
git branch -d <name>            # 删除已合并分支
git branch -D <name>            # 强制删除未合并分支
git branch -m <old> <new>       # 重命名分支

# 切换分支
git switch <branch>             # 切换分支（推荐）
git switch -c <new-branch>      # 创建并切换
git checkout <branch>           # 切换（旧写法）
git checkout -b <new-branch>    # 创建并切换（旧写法）

# 合并
git merge <branch>              # 将 branch 合并到当前分支
git merge --no-ff <branch>      # 强制创建合并提交（保留分支痕迹）
git merge --squash <branch>     # 压缩为一次提交
git merge --abort               # 放弃合并，回到合并前状态

# 变基
git rebase <branch>             # 将当前分支变基到 branch
git rebase --interactive HEAD~5 # 交互式变基（整理最近5次提交）
git rebase --abort              # 放弃变基
git rebase --continue           # 解决冲突后继续

# Cherry-pick
git cherry-pick <commit>        # 摘取某个提交到当前分支
git cherry-pick A B C           # 摘取多个
git cherry-pick --no-commit <c> # 只应用修改，不自动提交
```

## 动手练习

### 练习 1：创建与切换分支
```bash
git switch -c feature-a         # 创建并切换到 feature-a
echo "feature A work" > feature-a.txt
git add . && git commit -m "feat: add feature A"
git switch main                 # 切回 main
git branch -v                   # 查看各分支状态
```

### 练习 2：Fast-forward 合并
```bash
git switch -c hotfix
echo "fix" > hotfix.txt
git add . && git commit -m "fix: hotfix"
git switch main
git merge hotfix                # 观察 fast-forward
git log --oneline --graph
git branch -d hotfix            # 合并后删除
```

### 练习 3：Three-way 合并
```bash
git switch -c feature-b
echo "B" > b.txt && git add . && git commit -m "feat B"
git switch main
echo "main work" > main.txt && git add . && git commit -m "main progress"
git merge feature-b             # 观察 merge commit
git log --oneline --graph --all
```

### 练习 4：Rebase
```bash
git switch -c feature-c
echo "C1" > c.txt && git add . && git commit -m "C1"
echo "C2" >> c.txt && git add . && git commit -m "C2"
git switch main
echo "main2" >> main.txt && git add . && git commit -m "main2"
git switch feature-c
git rebase main                 # 把 C1、C2 搬到 main 最新提交之后
git log --oneline --graph --all # 观察：历史变成直线
```

### 练习 5：Cherry-pick
```bash
# 假设 feature-c 上有个提交想单独拿到 main
git switch main
git log --oneline feature-c     # 找到目标 commit hash
git cherry-pick <hash>          # 摘取到 main
git log --oneline
```

### 练习 6：--no-ff 保留分支痕迹
```bash
git switch -c feature-d
echo "D" > d.txt && git add . && git commit -m "feat D"
git switch main
git merge --no-ff feature-d -m "merge: feature-d"
git log --oneline --graph       # 能看到分支合并的菱形结构
```

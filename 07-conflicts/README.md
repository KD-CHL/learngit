# 07 — 冲突解决

## 核心概念

当两个分支修改了同一文件的同一区域，Git 无法自动合并，就会产生**冲突**。

冲突文件中的标记：
```
<<<<<<< HEAD
当前分支的内容
=======
要合并进来的内容
>>>>>>> feature-branch
```

解决冲突 = 手动编辑文件，选择保留什么，然后 `git add` + `git commit/rebase --continue`。

## 命令速查

```bash
# 冲突发生时
git status                      # 查看哪些文件冲突了
git diff                        # 查看冲突详情
git merge --abort               # 放弃合并，回到合并前
git rebase --abort              # 放弃变基

# 解决冲突后
git add <resolved-file>         # 标记为已解决
git commit                      # 完成合并（merge 时）
git rebase --continue           # 继续变基（rebase 时）

# 快速选择一方
git checkout --ours <file>      # 保留当前分支的版本
git checkout --theirs <file>    # 保留对方分支的版本

# 合并策略
git merge -s ours <branch>      # 完全忽略对方修改（保留我方）
git merge -X ours <branch>      # 冲突时优先我方（非冲突部分正常合并）
git merge -X theirs <branch>    # 冲突时优先对方

# rerere（记录冲突解决方案，下次自动应用）
git config --global rerere.enabled true
# 之后解决过的冲突再次出现时会自动应用上次的方案
git rerere status               # 查看 rerere 记录
git rerere diff                 # 查看记录的解决方案

# 使用合并工具
git mergetool                   # 打开图形化合并工具
git config merge.tool vscode    # 设置用 VS Code 作为合并工具
```

## 动手练习

### 练习 1：制造并解决合并冲突
```bash
# 在 main 上修改
git switch main
echo "main version" > conflict.txt
git add . && git commit -m "main: edit conflict.txt"

# 在分支上修改同一行
git switch -c conflict-branch
echo "branch version" > conflict.txt
git add . && git commit -m "branch: edit conflict.txt"

# 回到 main 合并
git switch main
git merge conflict-branch       # 冲突！
cat conflict.txt                # 看到 <<<< ==== >>>> 标记
# 手动编辑文件，选择保留内容
git add conflict.txt            # 标记已解决
git commit                      # 完成合并
```

### 练习 2：rebase 冲突
```bash
git switch -c rebase-conflict
echo "base" > r.txt && git add . && git commit -m "base"
echo "branch edit" >> r.txt && git add . && git commit -m "branch edit"

git switch main
echo "main edit" >> r.txt && git add . && git commit -m "main edit"

git switch rebase-conflict
git rebase main                 # 冲突！
# 解决冲突后：
git add r.txt
git rebase --continue           # 注意：不是 git commit
```

### 练习 3：ours / theirs 快速选择
```bash
# 冲突时，如果你确定要保留某一方的版本：
git checkout --ours conflict.txt    # 保留我方
git checkout --theirs conflict.txt  # 保留对方
git add conflict.txt
```

### 练习 4：merge -X 策略
```bash
git switch main
git merge -X theirs some-branch     # 冲突部分全部采用对方版本
```

### 练习 5：启用 rerere
```bash
git config --global rerere.enabled true
# 第一次解决冲突后，rerere 会记住你的方案
# 下次遇到相同冲突（比如 rebase 多个提交时），自动应用
git rerere status
```

### 练习 6：放弃合并
```bash
git merge some-branch           # 冲突太多，不想解了
git merge --abort               # 回到合并前的状态，一切如初
```

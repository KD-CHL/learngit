# 06 — 历史改写

## 核心概念

Git 允许你改写提交历史，让项目的 commit 记录更清晰。核心工具是 **interactive rebase**。

警告：只改写**尚未推送**的提交。已推送的历史改写需要 force push，会影响协作者。

## 命令速查

```bash
# 交互式变基（最强大的历史整理工具）
git rebase -i HEAD~N            # 整理最近 N 次提交
# 编辑器中可用的操作：
#   pick    — 保留提交（默认）
#   reword  — 保留提交但修改提交信息
#   edit    — 暂停，允许修改提交内容
#   squash  — 合并到上一个提交（保留 message 可编辑）
#   fixup   — 合并到上一个提交（丢弃 message）
#   drop    — 删除提交
#   reorder — 直接调整行的顺序即可改变提交顺序

# 修改提交
git commit --amend              # 修改最近一次提交
git commit --fixup=<commit>     # 创建 fixup 提交（后续自动合并）
git rebase -i --autosquash HEAD~N  # 自动排列 fixup 提交

# 拆分提交
git rebase -i HEAD~N            # 将目标提交标记为 edit
git reset HEAD~1                # 在暂停时取消提交（保留修改）
git add -p                      # 分块暂存
git commit -m "part 1"          # 分多次提交
git rebase --continue           # 继续

# 过滤历史（危险操作，会改写所有相关提交）
git filter-branch --tree-filter 'rm -f secrets.txt' HEAD  # 从所有提交中删除文件
git filter-repo --path secrets.txt --invert-paths          # 推荐替代方案（需安装）
```

## 动手练习

### 练习 1：squash 合并提交
```bash
# 先制造几个零碎提交
echo "1" > squash.txt && git add . && git commit -m "wip 1"
echo "2" >> squash.txt && git add . && git commit -m "wip 2"
echo "3" >> squash.txt && git add . && git commit -m "wip 3"

git rebase -i HEAD~3
# 编辑器中：第一行保持 pick，后两行改为 squash (或 s)
# 保存后编辑合并后的提交信息
git log --oneline               # 三个提交变成了一个
```

### 练习 2：reword 修改提交信息
```bash
git rebase -i HEAD~3
# 将想改信息的提交前改为 reword (或 r)
# 保存后会弹出编辑器让你修改信息
git log --oneline               # 确认信息已修改
```

### 练习 3：调整提交顺序
```bash
git rebase -i HEAD~5
# 直接在编辑器中拖动/剪切粘贴调整行的顺序
# 保存退出，提交顺序就变了
```

### 练习 4：fixup + autosquash 工作流
```bash
# 正常开发
echo "feature" > feat.txt && git add . && git commit -m "feat: add feature"

# 发现刚才的提交有 bug，用 fixup 修复
echo "fix" >> feat.txt && git add .
git commit --fixup=HEAD         # 创建 "fixup! feat: add feature" 提交

# 之后统一整理
git rebase -i --autosquash HEAD~3   # fixup 提交自动排到对应提交后面
git log --oneline               # 干净了
```

### 练习 5：拆分一个提交
```bash
git rebase -i HEAD~3
# 将想拆分的提交标记为 edit，保存退出
# Git 会暂停在那个提交
git reset HEAD~1                # 取消提交，修改回到工作区
git add -p                      # 交互式选择部分修改
git commit -m "part 1 of feature"
git add .                       # 剩余修改
git commit -m "part 2 of feature"
git rebase --continue           # 完成
```

### 练习 6：删除某个提交
```bash
git rebase -i HEAD~5
# 将不想要的提交前改为 drop (或直接删除那一行)
# 保存退出，该提交就消失了
```

# 02 — 撤销操作

## 核心概念

撤销是 Git 最实用也最容易搞混的部分。关键区分：

- **restore** — 撤销工作区/暂存区的修改（不动历史）
- **reset** — 移动 HEAD 指针（改变历史，本地用）
- **revert** — 创建新提交来抵消旧提交（安全，适合已推送的代码）

reset 的三种模式：
- `--soft`：只移动 HEAD，暂存区和工作区不变
- `--mixed`（默认）：移动 HEAD + 重置暂存区
- `--hard`：移动 HEAD + 重置暂存区 + 重置工作区（危险！）

## 命令速查

```bash
# 撤销工作区修改（未暂存）
git restore <file>              # 丢弃工作区修改
git restore --source=HEAD~2 <file>  # 恢复到指定版本

# 取消暂存
git restore --staged <file>     # 从暂存区移回工作区
git reset HEAD <file>           # 同上（旧写法）

# 修改上一次提交
git commit --amend              # 修改提交信息或追加文件
git commit --amend --no-edit    # 只追加文件，不改信息

# 回退提交
git reset --soft HEAD~1         # 撤销提交，保留修改在暂存区
git reset --mixed HEAD~1        # 撤销提交，保留修改在工作区
git reset --hard HEAD~1         # 彻底丢弃（慎用！）

# 安全撤销（已推送的代码）
git revert <commit>             # 创建一个"反向提交"
git revert HEAD~3..HEAD         # 撤销最近3次提交
git revert --no-commit <c1> <c2> # 合并多个 revert 为一次提交

# 清理未跟踪文件
git clean -n                    # 预览会删除哪些文件（dry-run）
git clean -f                    # 删除未跟踪文件
git clean -fd                   # 连未跟踪目录一起删
```

## 动手练习

### 练习 1：撤销工作区修改
```bash
echo "oops wrong change" >> file1.txt
git diff            # 确认修改
git restore file1.txt   # 丢弃修改
git status          # 干净了
```

### 练习 2：取消暂存
```bash
echo "change" >> file1.txt
git add file1.txt
git restore --staged file1.txt  # 取消暂存，修改还在
git status          # 文件回到 modified 状态
```

### 练习 3：amend 追加文件
```bash
echo "new" > forgotten.txt
git add forgotten.txt
git commit --amend --no-edit    # 把遗漏文件塞进上一次提交
git log --oneline -1            # 确认只有一个提交
```

### 练习 4：reset 三种模式对比
```bash
# 先做几次提交
echo "v1" > test.txt && git add . && git commit -m "v1"
echo "v2" > test.txt && git add . && git commit -m "v2"
echo "v3" > test.txt && git add . && git commit -m "v3"

git reset --soft HEAD~1     # 回到 v2，v3 的修改在暂存区
git status                  # 观察
git reset --mixed HEAD~1    # 回到 v1，修改在工作区
git status                  # 观察
git reset --hard HEAD~1     # 彻底回到 v1 之前
git log --oneline           # v1/v2/v3 都没了
```

### 练习 5：revert 安全撤销
```bash
git revert HEAD --no-edit   # 创建一个反向提交
git log --oneline           # 看到多了一条 "Revert ..." 提交
```

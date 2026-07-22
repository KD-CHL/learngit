# 05 — Stash 与 Tag

## 核心概念

**Stash**：临时保存工作区和暂存区的修改，让你切换到干净状态去做别的事，之后再恢复。

**Tag**：给某个提交打上不可变的标记，通常用于标记发布版本（v1.0.0）。
- Lightweight tag：只是一个指向 commit 的引用
- Annotated tag：包含打标签者、日期、消息，存储为完整对象

## 命令速查

```bash
# Stash 基本操作
git stash                       # 保存当前修改（工作区变干净）
git stash save "message"        # 带描述保存
git stash list                  # 列出所有 stash
git stash show                  # 查看最新 stash 的修改概要
git stash show -p               # 查看具体 diff
git stash pop                   # 恢复最新 stash 并删除它
git stash apply                 # 恢复但不删除（可反复 apply）
git stash apply stash@{2}      # 恢复指定的 stash
git stash drop stash@{0}       # 删除指定 stash
git stash clear                 # 清空所有 stash

# Stash 高级
git stash -u                    # 包含未跟踪文件
git stash --keep-index          # 只 stash 未暂存的部分
git stash branch <name>         # 从 stash 创建新分支

# Tag 操作
git tag                         # 列出所有标签
git tag -l "v1.*"              # 按模式过滤
git tag v1.0.0                  # 轻量标签
git tag -a v1.0.0 -m "msg"     # 附注标签（推荐）
git tag -a v0.9.0 <commit>     # 给历史提交打标签
git tag -d v1.0.0              # 删除本地标签
git push origin v1.0.0         # 推送标签到远程
git push origin --tags         # 推送所有标签
git push origin --delete v1.0  # 删除远程标签
git show v1.0.0                # 查看标签信息
```

## 动手练习

### 练习 1：基本 stash 流程
```bash
# 正在开发到一半，突然要修 bug
echo "half-done work" > wip.txt
git status                      # 有未提交的修改
git stash                       # 暂存起来
git status                      # 干净了，可以去修 bug

# 修完 bug 回来
git stash list                  # 查看 stash 列表
git stash pop                   # 恢复之前的工作
cat wip.txt                     # 修改回来了
```

### 练习 2：多个 stash 管理
```bash
echo "task A" > a.txt && git stash save "task A in progress"
echo "task B" > b.txt && git stash save "task B in progress"
git stash list                  # 看到两条记录
git stash show stash@{1}       # 查看 task A 的内容
git stash apply stash@{1}      # 只恢复 task A
git stash drop stash@{1}       # 用完后删除
```

### 练习 3：stash 包含未跟踪文件
```bash
echo "new file" > untracked.txt
git stash -u                    # -u 包含 untracked 文件
ls                              # untracked.txt 消失了
git stash pop                   # 恢复
ls                              # 回来了
```

### 练习 4：创建标签
```bash
git tag -a v0.1.0 -m "first practice release"
git tag                         # 查看
git show v0.1.0                # 查看标签详情
git push origin v0.1.0         # 推送到远程
```

### 练习 5：给历史提交打标签
```bash
git log --oneline               # 找到某个 commit hash
git tag -a v0.0.1 <hash> -m "retroactive tag"
git tag -l                      # 确认
```

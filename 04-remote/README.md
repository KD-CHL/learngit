# 04 — 远程操作

## 核心概念

远程仓库是协作的基础。关键概念：

- **remote**：远程仓库的别名（默认 `origin`）
- **tracking branch**：本地分支与远程分支的关联关系
- **push**：本地 → 远程
- **pull** = fetch + merge（拉取并合并）
- **fetch**：只下载，不合并（更安全）

## 命令速查

```bash
# 远程仓库管理
git remote -v                   # 查看所有远程仓库及 URL
git remote add <name> <url>     # 添加远程仓库
git remote remove <name>        # 移除远程仓库
git remote rename <old> <new>   # 重命名
git remote set-url <name> <url> # 修改 URL

# 推送
git push <remote> <branch>      # 推送指定分支
git push -u origin <branch>     # 推送并设置上游跟踪
git push --all                  # 推送所有分支
git push --tags                 # 推送所有标签
git push --delete origin <br>   # 删除远程分支
git push --force-with-lease     # 安全强推（比 --force 安全）

# 拉取
git fetch                       # 下载远程更新（不合并）
git fetch --all                 # 下载所有远程仓库
git fetch --prune               # 下载并清理已删除的远程分支
git pull                        # fetch + merge
git pull --rebase               # fetch + rebase（更干净的历史）
git pull origin <branch>        # 拉取指定分支

# 跟踪关系
git branch -vv                  # 查看本地分支的跟踪关系
git branch --set-upstream-to=origin/<br>  # 手动设置跟踪
```

## 动手练习

### 练习 1：查看远程信息
```bash
git remote -v                   # 查看 origin 的 fetch/push URL
git branch -vv                  # 查看跟踪关系
git fetch                       # 拉取远程更新
git log origin/main --oneline   # 查看远程分支的提交
```

### 练习 2：推送新分支
```bash
git switch -c experiment
echo "exp" > exp.txt && git add . && git commit -m "experiment"
git push -u origin experiment   # 推送并建立跟踪
git branch -vv                  # 确认跟踪关系
```

### 练习 3：fetch vs pull
```bash
# 在 GitHub 网页上直接编辑一个文件（模拟他人提交）
git fetch                       # 只下载，本地不变
git diff main origin/main       # 查看远程多了什么
git merge origin/main           # 手动合并
# 或者一步到位：
git pull                        # = fetch + merge
```

### 练习 4：pull --rebase
```bash
# 本地有新提交，远程也有新提交时：
git pull --rebase               # 把你的提交放到远程最新之后
git log --oneline --graph       # 历史是直线，没有 merge commit
```

### 练习 5：删除远程分支
```bash
git push --delete origin experiment   # 删除远程分支
git fetch --prune                     # 清理本地对已删远程分支的引用
```

### 练习 6：安全强推
```bash
# 场景：rebase 后需要强推
git push --force-with-lease     # 如果远程有别人的新提交会拒绝（比 --force 安全）
```

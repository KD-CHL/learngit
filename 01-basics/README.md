# 01 — 基础操作

## 核心概念

Git 有三个工作区域：**工作区**（Working Directory）→ **暂存区**（Staging Area / Index）→ **仓库**（Repository / .git）。

文件状态流转：`untracked → staged → committed`

## 命令速查

```bash
# 初始化与配置
git init                        # 初始化仓库
git config user.name "Name"     # 设置用户名
git config user.email "e@x.com" # 设置邮箱
git config --list               # 查看所有配置

# 日常三板斧
git status                      # 查看当前状态
git add <file>                  # 暂存指定文件
git add .                       # 暂存所有更改
git add -p                      # 交互式暂存（逐块选择）
git commit -m "message"         # 提交暂存区内容
git commit -am "message"        # 跳过 add，直接提交已跟踪文件的修改

# 查看历史
git log                         # 完整提交历史
git log --oneline               # 精简模式（一行一条）
git log --oneline --graph       # 带分支图
git log -p <file>               # 查看某文件的修改历史
git log --author="name"         # 按作者过滤
git log --since="2024-01-01"    # 按时间过滤
git show <commit>               # 查看某次提交的详细内容
git diff                        # 工作区 vs 暂存区
git diff --staged               # 暂存区 vs 最新提交
git diff <commit1> <commit2>    # 两次提交之间的差异
```

## 动手练习

### 练习 1：初始化与首次提交
```bash
cd 01-basics
echo "my first file" > file1.txt
git status          # 观察：file1.txt 是 untracked
git add file1.txt
git status          # 观察：变为 staged (绿色)
git commit -m "add file1"
git status          # 观察：nothing to commit, working tree clean
```

### 练习 2：修改与查看差异
```bash
echo "second line" >> file1.txt
git diff            # 查看改了什么
git add file1.txt
git diff --staged   # 暂存后再看，差异移到了 staged
git commit -m "update file1"
```

### 练习 3：查看历史
```bash
git log --oneline --graph --all
git show HEAD       # 查看最新提交
git show HEAD~1     # 查看上一次提交
```

### 练习 4：交互式暂存
```bash
# 对文件做多处修改
echo "change A" >> file1.txt
echo "change B" >> file1.txt
git add -p          # 逐块选择要暂存哪些修改
```

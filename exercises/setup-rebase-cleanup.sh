#!/bin/bash
# 练习场景：交互式 rebase 整理提交历史
# 运行此脚本会创建一组零碎的提交供你整理

set -e

echo "=== 构造零碎提交场景 ==="

git switch main 2>/dev/null || true
git switch -c exercise-rebase 2>/dev/null || git switch exercise-rebase

# 模拟一个混乱的开发过程
echo "# My Project" > project.md
git add project.md
git commit -m "start"

echo "" >> project.md
echo "## Features" >> project.md
git add project.md
git commit -m "add features header"

echo "- Login" >> project.md
git add project.md
git commit -m "add login feature"

echo "fix typo" > /dev/null
sed -i '' 's/Login/Login system/' project.md
git add project.md
git commit -m "fix typo"

echo "- Dashboard" >> project.md
git add project.md
git commit -m "add dashboard"

echo "wip" >> project.md
git add project.md
git commit -m "wip"

echo "- Settings page" >> project.md
sed -i '' '/^wip$/d' project.md
git add project.md
git commit -m "add settings, remove wip"

echo ""
echo "--- 当前历史（很乱）---"
git log --oneline
echo ""
echo "=== 你的任务 ==="
echo "用 git rebase -i 整理这些提交，目标："
echo "  1. 把 'fix typo' squash 到 'add login feature'"
echo "  2. 把 'wip' 和 'add settings, remove wip' 合并为一个有意义的提交"
echo "  3. 把 'start' 和 'add features header' 合并"
echo "  4. 最终只保留 3-4 个清晰的提交"
echo ""
echo "运行: git rebase -i HEAD~7"
echo ""
echo "提示：在编辑器中用 s(squash)/f(fixup) 合并，可以调整行的顺序"

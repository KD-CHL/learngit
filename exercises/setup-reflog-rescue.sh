#!/bin/bash
# 练习场景：用 reflog 找回丢失的提交
# 运行此脚本会模拟"误删提交"的场景

set -e

echo "=== 构造丢失提交场景 ==="

git switch main 2>/dev/null || true
git switch -c exercise-reflog 2>/dev/null || git switch exercise-reflog

# 创建几个提交
echo "feature part 1" > feature.txt
git add feature.txt
git commit -m "feat: part 1"

echo "feature part 2" >> feature.txt
git add feature.txt
git commit -m "feat: part 2"

echo "feature part 3" >> feature.txt
git add feature.txt
git commit -m "feat: part 3 - final"

echo ""
echo "--- 当前历史 ---"
git log --oneline

# 模拟误操作：reset 掉最近两个提交
git reset --hard HEAD~2

echo ""
echo "--- 误操作后 ---"
git log --oneline
echo ""
echo "糟糕！最近两个提交'消失'了！"
echo ""
echo "=== 你的任务 ==="
echo "用 git reflog 找回丢失的提交。"
echo ""
echo "提示："
echo "  1. git reflog 查看所有操作记录"
echo "  2. 找到 'feat: part 3 - final' 对应的 HEAD@{n}"
echo "  3. git reset --hard HEAD@{n} 或 git branch recovery HEAD@{n}"

#!/bin/bash
# 练习场景：解决合并冲突
# 运行此脚本会自动构造一个有冲突的合并场景

set -e

echo "=== 构造合并冲突场景 ==="

# 创建练习分支
git switch -c exercise-conflict 2>/dev/null || git switch exercise-conflict

# 基础提交
cat > story.txt << 'EOF'
第一章：开始
从前有一座山。
山上有一座庙。
EOF
git add story.txt
git commit -m "init: story base"

# 在分支上修改
sed -i '' 's/从前有一座山。/从前有一座很高的山。/' story.txt
echo "第二章：分支的发展" >> story.txt
git add story.txt
git commit -m "branch: expand chapter 1, add chapter 2"

# 回到 main 修改同一区域
git switch main
sed -i '' 's/从前有一座山。/从前有一座美丽的山。/' story.txt
echo "第二章：主线的发展" >> story.txt
git add story.txt
git commit -m "main: modify chapter 1, add chapter 2"

# 切回分支尝试合并
git switch exercise-conflict

echo ""
echo "=== 场景已就绪 ==="
echo "现在运行: git merge main"
echo "你会看到冲突，试着解决它！"
echo ""
echo "提示："
echo "  1. 打开 story.txt 查看冲突标记"
echo "  2. 手动编辑选择保留的内容"
echo "  3. git add story.txt"
echo "  4. git commit"

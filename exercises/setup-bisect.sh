#!/bin/bash
# 练习场景：bisect 定位引入 bug 的提交
# 运行此脚本会创建一系列提交，其中某个引入了"bug"

set -e

echo "=== 构造 bisect 练习场景 ==="

git switch main 2>/dev/null || true
git switch -c exercise-bisect 2>/dev/null || git switch exercise-bisect

# 创建计算脚本，逐步修改
cat > calc.sh << 'EOF'
#!/bin/bash
# 计算 1+2+...+10
result=0
for i in $(seq 1 10); do
  result=$((result + i))
done
echo $result
EOF
chmod +x calc.sh
git add calc.sh
git commit -m "init: correct calculator (output: 55)"

# 一系列"正常"的修改（添加注释等）
for i in 1 2 3 4 5; do
  echo "# update $i" >> calc.sh
  git add calc.sh
  git commit -m "chore: update $i"
done

# 引入 bug：把 + 改成 -
sed -i '' 's/result + i/result - i/' calc.sh
git add calc.sh
git commit -m "refactor: optimize calculation"

# 之后又有几个提交
for i in 6 7 8; do
  echo "# update $i" >> calc.sh
  git add calc.sh
  git commit -m "chore: update $i"
done

echo ""
echo "--- 当前状态 ---"
echo "运行 ./calc.sh 输出: $(bash calc.sh)"
echo "正确输出应该是: 55"
echo ""
echo "=== 你的任务 ==="
echo "用 git bisect 找到引入 bug 的提交。"
echo ""
echo "步骤："
echo "  1. git bisect start"
echo "  2. git bisect bad              # 当前版本有 bug"
echo "  3. git bisect good HEAD~14     # 第一个提交是好的"
echo "  4. 每次 Git 检出一个版本，运行 ./calc.sh"
echo "     - 输出 55 → git bisect good"
echo "     - 输出不是 55 → git bisect bad"
echo "  5. 重复 3-4 次，Git 会告诉你哪个提交引入了 bug"
echo "  6. git bisect reset            # 结束"

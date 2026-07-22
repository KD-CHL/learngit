# Exercises — 场景练习

运行脚本会自动构造特定的 git 状态，然后你按照提示完成练习。

## 可用场景

| 脚本 | 练习内容 | 难度 |
|------|----------|------|
| `setup-conflict.sh` | 制造合并冲突并解决 | ⭐⭐⭐ |
| `setup-reflog-rescue.sh` | 用 reflog 找回误删的提交 | ⭐⭐⭐ |
| `setup-rebase-cleanup.sh` | 交互式 rebase 整理零碎提交 | ⭐⭐⭐⭐ |
| `setup-bisect.sh` | 二分查找定位引入 bug 的提交 | ⭐⭐⭐⭐ |

## 使用方法

```bash
cd exercises
chmod +x *.sh
./setup-conflict.sh     # 运行后按提示操作
```

## 注意事项

- 每个脚本会创建独立的练习分支（`exercise-*`），不影响 main
- 练习完成后可以删除分支：`git branch -D exercise-xxx`
- 如果搞乱了，直接删掉分支重来：`git switch main && git branch -D exercise-xxx`

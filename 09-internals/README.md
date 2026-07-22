# 09 — Git 内部原理

## 核心概念

理解 Git 的内部模型能让你真正"通透"地使用它。

Git 是一个**内容寻址文件系统**，核心是四种对象：
- **blob**：文件内容（不含文件名）
- **tree**：目录结构（文件名 → blob 的映射）
- **commit**：指向 tree + 作者 + 消息 + 父提交
- **tag**：附注标签对象（指向 commit）

所有对象以 SHA-1 哈希存储在 `.git/objects/` 中。

引用（refs）是指向 commit 的指针：
- `HEAD` → 当前分支（或直接指向 commit = detached 状态）
- `refs/heads/<branch>` → 本地分支
- `refs/remotes/origin/<branch>` → 远程跟踪分支
- `refs/tags/<tag>` → 标签

## 命令速查

```bash
# 查看内部结构
ls .git/                        # 查看 .git 目录结构
cat .git/HEAD                   # HEAD 指向哪里
cat .git/refs/heads/main        # main 分支指向哪个 commit
git cat-file -t <hash>          # 查看对象类型（blob/tree/commit/tag）
git cat-file -p <hash>          # 查看对象内容
git cat-file -p HEAD^{tree}     # 查看 HEAD 提交的 tree 对象
git ls-tree HEAD                # 列出当前提交的 tree 内容
git ls-tree -r HEAD             # 递归列出所有文件

# Plumbing 命令（底层命令）
git hash-object <file>          # 计算文件的 blob hash
git hash-object -w <file>       # 写入对象到 .git/objects
git mktree                      # 手动创建 tree 对象
git commit-tree <tree> -m "msg" # 手动创建 commit 对象
git update-ref refs/heads/test <commit>  # 手动创建/移动分支引用

# 索引（暂存区）
git ls-files                    # 列出暂存区所有文件
git ls-files -s                 # 显示文件的 blob hash 和权限
git read-tree HEAD              # 将 tree 读入暂存区
git write-tree                  # 将暂存区写为 tree 对象

# 打包与垃圾回收
git count-objects -v            # 查看对象数量和大小
git gc                          # 垃圾回收，打包松散对象
git verify-pack -v .git/objects/pack/*.idx  # 查看 pack 文件内容
git prune                       # 删除不可达的松散对象

# 底层查看
git rev-parse HEAD              # 将引用解析为完整 hash
git rev-parse --git-dir         # .git 目录位置
git rev-parse --show-toplevel   # 仓库根目录
git name-rev <hash>             # 将 hash 转为可读名称
git describe --tags             # 用最近的标签描述当前提交
```

## 动手练习

### 练习 1：观察对象创建
```bash
echo "hello git internals" > internal.txt
git hash-object internal.txt            # 计算 hash（不写入）
git hash-object -w internal.txt         # 写入 .git/objects
git cat-file -t <hash>                  # 类型是 blob
git cat-file -p <hash>                  # 内容是文件内容
```

### 练习 2：解剖一个 commit
```bash
git cat-file -p HEAD                    # 查看 commit 对象
# 输出：tree, parent, author, committer, message
git cat-file -p HEAD^{tree}             # 查看 tree
# 输出：每个文件/目录的权限、类型、hash、名称
git ls-tree -r HEAD                     # 递归看所有文件
```

### 练习 3：手动构建提交（理解本质）
```bash
echo "manual" > manual.txt
BLOB=$(git hash-object -w manual.txt)   # 1. 创建 blob
echo "100644 blob $BLOB\tmanual.txt" | git mktree  # 2. 创建 tree
TREE=$(echo "100644 blob $BLOB	manual.txt" | git mktree)
COMMIT=$(echo "manual commit" | git commit-tree $TREE -p HEAD)  # 3. 创建 commit
git cat-file -p $COMMIT                 # 查看你手动创建的提交
git update-ref refs/heads/manual-test $COMMIT  # 4. 创建分支指向它
git log manual-test --oneline           # 看到了！
```

### 练习 4：理解 refs
```bash
cat .git/HEAD                           # ref: refs/heads/main
cat .git/refs/heads/main                # 一个 40 位的 hash
git rev-parse HEAD                      # 和上面一样
git rev-parse main                      # 也一样

# detached HEAD 状态
git checkout HEAD~1                     # HEAD 直接指向 commit
cat .git/HEAD                           # 不再是 ref:，而是直接 hash
git switch main                         # 回到正常状态
```

### 练习 5：打包与 GC
```bash
git count-objects -v                    # 查看松散对象数量
git gc                                  # 打包压缩
git count-objects -v                    # 松散对象变少了，pack 变大了
ls .git/objects/pack/                   # 看到 .pack 和 .idx 文件
```

### 练习 6：describe 版本描述
```bash
git tag -a v1.0 -m "release 1.0" HEAD~3  # 给历史提交打标签
# 做几次新提交
git describe --tags                     # 输出类似 v1.0-3-gabcdef
# 含义：v1.0 标签之后第 3 个提交，hash 前缀 gabcdef
```

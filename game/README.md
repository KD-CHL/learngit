# 🎮 Git 闯关练习

在浏览器里通过**模拟终端**学习 git——敲真实的 git 命令完成 14 个关卡，右侧实时可视化分支图谱，从第一次提交一路练到变基与冲突解决。

## 快速开始

```bash
cd game
node server.js        # 零依赖，启动后自动打开浏览器
```

或：

```bash
npm start             # 等价于 node server.js
```

> 因为使用了 ES Modules，请通过本地服务器访问（`http://localhost:5173`），不要直接双击 `index.html`。

## 玩法

- **14 个关卡**，按 5 个阶段递进：基础 → 撤销 → 分支 → 冲突 → 暂存与标签
- **par 星级系统**：用更少的命令拿 3 星
- **自由模式**：首页点「🧪 自由模式」，没有目标，随便折腾
- 右侧面板实时渲染 **SVG 提交图谱**、分支列表、工作区/暂存区状态
- 命令支持 **Tab 自动补全**、`↑↓` 历史、`help` 速查、`?` 打开命令速查表
- 进度与星星自动保存在浏览器本地

## 项目结构

```
game/
├── index.html          # 页面骨架（仅标记，不含逻辑）
├── server.js           # 零依赖静态服务器
├── package.json
├── css/
│   └── style.css       # 全部样式
├── js/
│   ├── main.js         # 入口：初始化、键盘、屏幕路由
│   ├── engine.js       # 迷你 git 引擎（对象/分支/HEAD 模型）
│   ├── state.js        # 共享状态（引擎实例 + 应用状态）
│   ├── commands.js     # 命令解析与实现（add/commit/merge/rebase...）
│   ├── levels.js       # 14 个关卡定义（setup/check/提示）
│   ├── graph.js        # SVG 提交图谱（泳道算法）
│   ├── render.js       # 分支/文件面板渲染
│   ├── terminal.js     # 终端输出
│   ├── ui.js           # 屏幕、关卡流程、弹窗、速查表
│   ├── input.js        # 命令输入、自动补全、历史
│   ├── effects.js      # 音效 + 彩带
│   └── store.js        # 进度持久化（localStorage）
└── test/
    └── levels.test.js  # 关卡可通关性测试（node 运行）
```

## 测试

```bash
npm test              # 用 Node 模拟每关解法，验证全部可通关
```

## 支持的 git 命令

`status` `add` `commit (--amend --no-edit)` `log` `diff` `branch` `switch/checkout` `merge (--abort)` `rebase` `cherry-pick` `reset` `restore (--staged)` `stash` `tag` `show`，以及 `echo > / >>`、`ls`、`cat`、`rm`、`clear`。

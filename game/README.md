# 🎮 Git 闯关练习

在浏览器里通过**模拟终端**学习 git——敲真实的 git 命令完成 14 个关卡，右侧实时可视化分支图谱，从第一次提交一路练到变基与冲突解决。

内置**用户登录 + 角色权限**系统：玩家进度云端保存，管理员可在后台查看所有人的闯关情况并管理角色。

## 快速开始

```bash
cd game
node server.js        # 零依赖，启动后自动打开浏览器 http://localhost:5188
```

或：

```bash
npm start             # 等价于 node server.js
```

> 因为使用了 ES Modules + 后端接口，请通过本地服务器访问，不要直接双击 `index.html`。
> 端口默认为 `5188`（避开 Vite 常用的 5173），可用 `PORT=xxxx node server.js` 覆盖。

## 登录与角色

首次启动会自动创建默认管理员：**`admin` / `admin123`**（数据存放在 `game/data/`，建议尽快修改）。

| 角色 | 权限 |
|------|------|
| **玩家 player** | 注册即得。正常闯关、自由模式，进度与星星绑定账号云端保存 |
| **管理员 admin** | 玩家的全部功能 + 顶栏 🛡️ 进入**管理面板**：查看每位用户的通关数/星星/命令数、提升/降级角色、删除用户 |

- 未登录访问游戏页会自动跳转到登录页
- 登录页 / 注册页采用左右分屏设计，左侧提交链会随你的密码输入实时变化（致敬 careercompass）
- 非管理员访问 `admin.html` 会被重定向回游戏

## 玩法

- **14 个关卡**，按 5 个阶段递进：基础 → 撤销 → 分支 → 冲突 → 暂存与标签
- **par 星级系统**：用更少的命令拿 3 星
- **自由模式**：首页点「🧪 自由模式」，没有目标，随便折腾
- 右侧面板实时渲染 **SVG 提交图谱**、分支列表、工作区/暂存区状态
- 命令支持 **Tab 自动补全**、`↑↓` 历史、`help` 速查、`?` 打开命令速查表

## 项目结构

```
game/
├── index.html          # 游戏页（需登录）
├── login.html          # 登录页（分屏式）
├── signup.html         # 注册页（分屏式）
├── admin.html          # 管理面板（仅 admin）
├── server.js           # 零依赖服务器：静态文件 + /api/* 接口
├── server/
│   ├── db.js           # 用户/会话持久化 + scrypt 密码哈希
│   └── api.js          # 认证/进度/管理 REST 接口
├── package.json
├── data/               # 运行时数据（users.json/sessions.json，已 gitignore）
├── css/
│   ├── style.css       # 游戏样式
│   └── auth.css        # 登录/注册/管理面板样式
├── js/
│   ├── main.js         # 游戏入口：认证守卫、初始化、屏幕路由
│   ├── auth.js         # 认证客户端 + 路由守卫
│   ├── authpage.js     # 登录/注册页逻辑 + 交互式提交链
│   ├── admin.js        # 管理面板逻辑
│   ├── engine.js       # 迷你 git 引擎（对象/分支/HEAD 模型）
│   ├── state.js        # 共享状态（引擎实例 + 应用状态 + 当前用户）
│   ├── commands.js     # 命令解析与实现（add/commit/merge/rebase...）
│   ├── levels.js       # 14 个关卡定义（setup/check/提示）
│   ├── graph.js        # SVG 提交图谱（泳道算法）
│   ├── render.js       # 分支/文件面板渲染
│   ├── terminal.js     # 终端输出
│   ├── ui.js           # 屏幕、关卡流程、弹窗、速查表
│   ├── input.js        # 命令输入、自动补全、历史
│   ├── effects.js      # 音效 + 彩带
│   └── store.js        # 进度持久化（后端为主，localStorage 兜底）
└── test/
    ├── levels.test.js  # 关卡可通关性测试
    └── auth.test.js    # 认证/权限 API 端到端测试
```

## API 一览

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| POST | `/api/auth/signup` | 公开 | 注册（默认 player） |
| POST | `/api/auth/login` | 公开 | 登录，返回 token |
| POST | `/api/auth/logout` | 登录 | 登出 |
| GET | `/api/auth/me` | 登录 | 当前用户 + 进度 |
| POST | `/api/progress` | 登录 | 保存进度 |
| GET | `/api/admin/users` | admin | 用户列表 + 进度 |
| POST | `/api/admin/users/:id/role` | admin | 修改角色 |
| DELETE | `/api/admin/users/:id` | admin | 删除用户 |

## 测试

```bash
npm test              # 关卡可通关性 + 认证/权限 API 全部测试
npm run test:levels   # 只跑关卡
npm run test:auth     # 只跑认证 API（自动用隔离的临时数据目录）
```

## 支持的 git 命令

`status` `add` `commit (--amend --no-edit)` `log` `diff` `branch` `switch/checkout` `merge (--abort)` `rebase` `cherry-pick` `reset` `restore (--staged)` `stash` `tag` `show`，以及 `echo > / >>`、`ls`、`cat`、`rm`、`clear`。

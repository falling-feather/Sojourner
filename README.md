# Sojourner

桌面端叙事网页游戏《人的一生》的源码仓库。项目代号 **Sojourner**（过客 / 旅居者），强调人生旅途中的选择与后果。

## 功能概览

- **数据驱动剧情**：主内容位于 [`content/story.json`](content/story.json)，由 Zod 校验（`npm run validate:story`）。
- **引擎**：全局属性、标签与标志位、可复现随机检定（高考等节点）。
- **界面**：标题 → 游玩（叙事 + HUD + 选项）→ 检定反馈 → 结局；支持数字键 `1`–`9` 快捷选肢。

详细需求、数据契约与 Pencil 协作说明见 [`docs/DEVELOPER.md`](docs/DEVELOPER.md)。**剧情分支与随机检定说明**（含路线图）见 [`docs/STORY_ROUTES.md`](docs/STORY_ROUTES.md)，机器可读摘要见 [`docs/story-routes.json`](docs/story-routes.json)。设计稿若使用 Pencil，可维护仓库内 `UI.pen`（仅作视觉参考，运行时不依赖）。

## 环境要求

- Node.js 18+（推荐当前 LTS）
- npm 10+

## 常用命令

| 命令 | 说明 |
|------|------|
| `npm install` | 安装依赖 |
| `npm run dev` | 启动开发服务器（Vite HMR） |
| `npm run build` | 类型检查并产出 `dist/` |
| `npm run preview` | 本地预览生产构建 |
| `npm run validate:story` | 校验 `content/story.json` |
| `npm test` | 运行 Vitest 单元测试 |
| `npm run lint` | ESLint |

开发服务器默认地址：<http://localhost:5173>（端口以终端输出为准）。

## 目录结构（摘要）

```
content/story.json       # 剧情数据
docs/DEVELOPER.md        # 开发者文档
docs/STORY_ROUTES.md     # 事件路线与随机说明（策划向）
docs/story-routes.json   # 同上（结构化摘要）
scripts/              # 校验脚本等
src/engine/           # RNG、效果、检定、图校验
src/store/            # Zustand 状态
src/ui/               # 页面与组件
```

## 技术栈

React 19 · TypeScript · Vite · Zod · Zustand · Vitest

## 许可证

私有项目；如需开源请自行补充 LICENSE。

# 启旋游戏工作室 (Spinward Game) 官网

本仓库为 *启旋游戏工作室* 官方网站的源代码。

网站地址：[https://spinward.pages.dev/](https://spinward.pages.dev/)

## 关于工作室

启旋游戏工作室是一个**非商业、非营利、以未成年人为主的线上游戏开发兴趣团体**，创立于2025年7月15日。成员以12至18周岁在校中学生为主，所有活动以技术学习与协作实践为目的，不涉及商业经营。

工作室拥有完整的制度体系，包括《启旋游戏工作室公约》《成员结构》《成员行为守则》《人事管理办法》等配套文件。详情可查阅官网相关页面。

## 技术栈

- **构建与前端框架**：VitePress（基于 Vite + Vue 3 + Markdown）
- **配置与脚本**：TypeScript
- **包管理**：Bun（含 `bun.lock`） / npm 兼容
- **托管平台**：Cloudflare Pages
- **域名**：`spinward.pages.dev`

## 开发与部署

本网站通过 Cloudflare Pages 自动部署（关联 GitHub `main` 分支）。

### 本地开发

```bash
# 推荐使用 Bun
bun install
bun run docs:dev

# 或使用 npm
npm install
npm run docs:dev
```

### 生产构建

- **构建命令**：`bun run docs:build` 或 `npm run docs:build`
- **输出目录**：`.vitepress/dist`

Cloudflare Pages 会自动检测 `main` 分支推送并执行构建部署。

> **注意**：内容源文件位于仓库根目录（`index.md`、`about.md` 等），`README.md` 已被配置排除在站点构建之外（`srcExclude`）。

## 网站维护

本网站由工作室管理部维护。如有内容更新需求，请联系：

- **工作室网站管理员**：*LuminaYF*
- **室长**：*驱星赫赫*

外部贡献者请先通过工作室官方渠道联系管理部。欢迎通过 GitHub Issues 或 Pull Request 提出改进建议（请遵循项目规范）。

## 许可证

- **网站内容**（文字、图片、设计、文档等）：归启旋游戏工作室所有，未经授权不得转载或用于商业用途。
- **源代码**：采用 [MIT 许可证](LICENSE)。
- **内容文档**：可能采用 [CC-BY-SA 许可证](LICENSE-CC-BY-SA)（详见仓库内许可证文件）。

---

© 2026 启旋游戏工作室 | [spinward.pages.dev](https://spinward.pages.dev/)
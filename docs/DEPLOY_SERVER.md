# 服务器部署说明（阿里云 · Windows 10 图形化 · 端口 909）

本文说明如何将本仓库构建为静态站点，在 **Windows 10/11 图形化服务器** 上对外提供 **HTTP/HTTPS**，监听 **909** 端口；并与 **GitHub Pages**（子路径 `VITE_BASE`）共存注意事项一并列出。

## 一、构建产物说明

- 执行 `npm run build` 后，产物在 **`dist/`** 目录：HTML、JS、CSS、`manifest.webmanifest`、Service Worker（`sw.js`）及 `workbox-*.js` 等。
- **根路径部署**（如 `http://服务器:909/`）：本地与默认 CI 使用 `VITE_BASE=/` 即可。
- **GitHub Pages 项目页**（如 `https://用户名.github.io/Sojourner/`）：构建前设置环境变量 **`VITE_BASE=/Sojourner/`**（末尾斜杠与仓库名一致），否则静态资源路径会错位。

## 二、Service Worker / 离线缓存与 HTTP(S)

- 本工程使用 **vite-plugin-pwa**：安装后会在支持的浏览器里注册 **Service Worker**，对核心静态资源做预缓存；**音频（.mp3）** 体积较大，采用 **运行时 CacheFirst** 策略单独缓存，避免超出 Workbox 默认预缓存体积限制。
- **HTTPS**：在公网域名或 IP 上，Chrome/Edge 等通常 **仅在安全上下文（HTTPS 或 localhost）** 下注册 Service Worker；HTTPS 部署时可获得完整离线/更新体验。
- **HTTP（如内网 `http://内网IP:909`）**：在非 localhost 的纯 HTTP 下，浏览器 **可能不注册 SW**，此时仍依赖浏览器 **普通 HTTP 缓存** 与 CDN/服务器 **`Cache-Control`**；站点功能与路由不受影响，仅「可安装 PWA / SW 预缓存」能力可能受限。若需完整 PWA，请为域名配置 TLS（IIS/反向代理均可）。

## 三、阿里云安全组与 Windows 防火墙

1. **阿里云 ECS 安全组**：入方向放行 **TCP 909**（来源按需求设为 `0.0.0.0/0` 或办公网段）。
2. **Windows 防火墙**：
   - 控制面板 → Windows Defender 防火墙 → 高级设置 → **入站规则** → 新建规则 → 端口 → TCP → 特定本地端口 **909** → 允许连接 → 勾选域/专用/公用（按环境选择）→ 命名如 `Sojourner-909`。

## 四、服务器环境准备

1. 安装 **Node.js LTS**（建议 20.x 或 22.x），安装时勾选 **npm**。
2. 将本仓库克隆或拷贝到服务器目录，例如 `D:\apps\A-life`。
3. 在项目根目录执行一次依赖安装：  
   `npm ci`（有 `package-lock.json` 时）或 `npm install`。  
   仓库根目录含 **`.npmrc`**（`legacy-peer-deps=true`），用于在 **Vite 8** 下安装 `vite-plugin-pwa`（上游尚未更新 peer 范围）；与 GitHub Actions 行为一致。

## 五、一键构建并启动（推荐）

项目内提供脚本 **`scripts/deploy-windows-909.ps1`**：

1. 以 **PowerShell** 打开项目根目录。
2. 若首次运行脚本被策略拦截，可在当前用户范围放宽（按需）：  
   `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`
3. 执行：  
   `.\scripts\deploy-windows-909.ps1`  
   可选指定端口：  
   `.\scripts\deploy-windows-909.ps1 -Port 909`

脚本会：`npm ci`（或 `npm install`）→ `npm run build` → 使用 **`serve`** 以 **SPA 模式** 托管 `dist`，并监听 **`0.0.0.0:端口`**，便于公网访问。

停止服务：在运行脚本的窗口中 **Ctrl+C**。

## 六、手动命令（与脚本等价）

```powershell
cd D:\apps\A-life   # 改为你的项目路径
npm ci
npm run build
npx --yes serve@14 dist -l tcp://0.0.0.0:909 --no-clipboard -s
```

- **`-s` / `--single`**：所有未匹配路径回退到 `index.html`，保证前端路由与刷新可用。

## 七、HTTPS 的两种常见做法（可选）

1. **IIS 反向代理**：IIS 站点绑定 443 与证书，将请求 **反向代理** 到本机 `http://127.0.0.1:909`（需安装 **URL Rewrite + ARR** 等组件）。
2. **Caddy / Nginx**：对公网暴露 443，上游指向 `127.0.0.1:909`；由反向代理处理证书（Let’s Encrypt 等）。

具体证书申请与绑定以阿里云文档为准。

## 八、GitHub Actions / Pages 与自建服并存

- **GitHub Pages**：在 Workflow 中设置 `env: VITE_BASE: /Sojourner/`（与仓库名一致），再执行 `npm run build`，将 `dist` 部署到 `gh-pages` 分支或 Actions Pages artifact。
- **自建 Windows 服务器**：若站点在域名根路径，**不要**设置 `VITE_BASE`（或设为 `/`）。同一套代码通过 **不同构建命令/环境变量** 产出两种产物即可。

## 九、GM 调试入口（预留）

- 在浏览器地址栏为站点 URL 增加查询参数 **`?gm=1`** 并打开（或刷新），可进入 **GM 世界树调试页**（不依赖起名流程）。
- 正式环境若不希望公开，可在反向代理层拦截带 `gm=1` 的请求，或通过内网访问控制。

## 十、故障排查简表

| 现象 | 可能原因 |
|------|----------|
| 外网无法访问 909 | 安全组/防火墙未放行；`serve` 未监听 `0.0.0.0` |
| 白屏、资源 404 | 子路径部署但未设置 `VITE_BASE` |
| 刷新子路径 404 | 静态服务器未开启 SPA fallback（未使用 `-s`） |
| SW 不生效 | 非 HTTPS 且非 localhost；属浏览器策略 |

---

更多开发命令见仓库根目录 `package.json` 的 `scripts` 字段。

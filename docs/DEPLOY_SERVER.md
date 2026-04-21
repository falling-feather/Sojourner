# 服务器部署全流程说明

本文面向 **阿里云 ECS + Windows 10/11 图形界面**，说明从 **抓取 Git 仓库** 到 **在 909 端口对外提供站点** 的完整步骤；并说明与 **GitHub Pages** 的差异，便于同一仓库两套发布方式并存。

**默认示例仓库地址**（请按需替换为你自己的 fork 或私有库）：

`https://github.com/falling-feather/Sojourner.git`

---

## 〇、你将得到什么

| 环节 | 说明 |
|------|------|
| 交付物 | 静态文件目录 **`dist/`**（由 `npm run build` 生成） |
| 运行方式 | 用 **`serve`** 以 **SPA 单页回退** 模式托管 `dist`，监听 **TCP 909** |
| 访问形态 | 根路径部署：`http://<公网IP或域名>:909/` |
| 与 GitHub Pages 区别 | Pages 多为 **子路径** `/Sojourner/`，需 **`VITE_BASE=/Sojourner/`** 构建；自建根路径部署 **不要** 设置该变量（或显式 `VITE_BASE=/`） |

---

## 一、上架前概念：两种「站点根路径」

本前端用 Vite 的 **`base`**（环境变量 **`VITE_BASE`**）决定静态资源 URL 前缀。

1. **自建 Windows 服务器（本文主流程）**  
   - 希望地址形如：`http://服务器:909/`（资源路径以 `/assets/...` 开头）  
   - **构建时不要设置 `VITE_BASE`**，或设为 **`/`**。  
   - 若误用 `/Sojourner/` 构建，会出现 **白屏、JS/CSS 404**。

2. **GitHub Pages 项目页**  
   - 地址形如：`https://<用户>.github.io/Sojourner/`  
   - **必须在构建时** 设置 **`VITE_BASE=/Sojourner/`**（与仓库名一致，**建议保留末尾斜杠**）。  
   - 本仓库 CI 已在 `.github/workflows/pages.yml` 里写好，**与服务器手工部署是两套命令**，勿混用。

---

## 二、阿里云侧准备（ECS + 网络）

1. **购买 / 选用 ECS**  
   - 系统镜像：**Windows Server 2019/2022** 或带图形桌面的 **Windows 10/11 云电脑**（以你实际产品为准）。  
   - 规格：纯静态站点 + Node 构建，**2 vCPU / 4 GB 内存** 通常足够；构建阶段短时占用略高可接受。

2. **公网 IP**  
   - 分配 **弹性公网 IP** 并绑定到 ECS，记下 IPv4（下文记为 `<公网IP>`）。

3. **安全组（必做）**  
   - 进入 **云控制台 → ECS → 安全组 → 入方向规则**。  
   - 新增：**允许 TCP，端口 909**，授权对象按需求填写（例如先 `0.0.0.0/0` 做联调，再收窄到办公网）。  
   - 若后续用 **HTTPS 443**，需另放行 **TCP 443**（由 IIS / 反向代理机器承担时再配）。

4. **远程登录**  
   - 使用 **远程桌面（RDP）** 连接 ECS；首次登录完成 Windows 初始化、时区与系统更新（按需）。

---

## 三、Windows 服务器环境：Git 与 Node.js

### 3.1 安装 Git（用于 clone / pull）

1. 打开浏览器，进入 **Git for Windows** 官网下载安装包并安装。  
2. 安装时保持默认选项即可（勾选 **Git from the command line and also from 3rd-party software** 便于 PowerShell 使用）。  
3. **新开**一个 **PowerShell** 窗口，验证：

```powershell
git --version
```

### 3.2 安装 Node.js LTS（含 npm）

1. 打开 **Node.js** 官网，下载 **LTS** 版本（建议 **20.x 或 22.x**）的 **Windows 安装包（.msi）**。  
2. 安装向导中勾选 **Add to PATH**，完成安装。  
3. **新开** PowerShell，验证：

```powershell
node -v
npm -v
```

### 3.3 PowerShell 脚本执行策略（运行一键脚本时需要）

若执行 `.\scripts\deploy-windows-909.ps1` 提示无法加载，可在 **当前用户** 范围放宽（按需）：

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

---

## 四、从 Git 抓取代码到本机目录

### 4.1 选择存放目录

示例使用 **`D:\apps\Sojourner`**（可自行改为 `D:\apps\A-life` 等，**路径中尽量避免仅中文**，减少个别工具编码问题）。

在 PowerShell 中：

```powershell
New-Item -ItemType Directory -Force -Path 'D:\apps' | Out-Null
Set-Location 'D:\apps'
```

### 4.2 克隆仓库（HTTPS，适合先有仓库再配 SSH）

```powershell
git clone https://github.com/falling-feather/Sojourner.git
Set-Location '.\Sojourner'
```

若仓库为 **私有**，GitHub 会提示登录；可使用 **Personal Access Token（PAT）** 作为密码，或改用 **SSH**（需先在服务器生成 SSH 公钥并添加到 GitHub 账户）。

### 4.3 克隆仓库（SSH，适合已配置密钥）

```powershell
git clone git@github.com:falling-feather/Sojourner.git
Set-Location '.\Sojourner'
```

### 4.4 确认分支与最新提交

默认跟踪 **`main`**：

```powershell
git status
git branch -a
git log -1 --oneline
```

以后更新站点代码：

```powershell
Set-Location 'D:\apps\Sojourner'   # 你的仓库根目录
git pull origin main
```

---

## 五、Windows 防火墙放行 909

否则本机监听正常，但 **公网仍连不上**。

1. **控制面板** → **Windows Defender 防火墙** → **高级设置**。  
2. **入站规则** → **新建规则** → **端口** → **TCP** → **特定本地端口**：`909`。  
3. **允许连接** → 勾选 **域 / 专用 / 公用**（按你网络环境选择，云主机常需勾选 **公用**）。  
4. 名称示例：`Sojourner HTTP 909`。

（阿里云安全组已在第二节配置；**安全组 + 本机防火墙** 两处都要放行。）

---

## 六、安装依赖（npm ci）与仓库约定

在项目根目录（含 **`package.json`**、**`package-lock.json`**、**`.npmrc`**）执行：

```powershell
Set-Location 'D:\apps\Sojourner'
npm ci
```

说明：

- 本仓库根目录包含 **`.npmrc`**，其中 **`legacy-peer-deps=true`** 用于在 **Vite 8** 下安装 **`vite-plugin-pwa`**（上游尚未在 `peerDependencies` 中声明 Vite 8）。**不要删除**，否则 `npm ci` 可能再次 **ERESOLVE** 失败。  
- 若极个别环境没有 `package-lock.json`，可改用 **`npm install`**（生产服务器仍建议以锁文件为准并纳入版本控制）。

---

## 七、构建静态站点（自建服：不要设 GitHub 的 VITE_BASE）

在 **同一 PowerShell**、**仓库根目录**：

```powershell
# 自建根路径部署：不要带 GitHub Pages 的子路径变量
Remove-Item Env:VITE_BASE -ErrorAction SilentlyContinue
npm run build
```

构建成功后应出现 **`dist`** 目录，内含 `index.html`、`assets`、`sw.js`、`manifest.webmanifest` 等。

**可选质量检查（上架前建议跑）**：

```powershell
npm run validate:story
npm test
```

---

## 八、启动对外服务（端口 909，监听 0.0.0.0）

### 8.1 方式 A：一键脚本（推荐）

仍在仓库根目录：

```powershell
.\scripts\deploy-windows-909.ps1
# 或指定端口
.\scripts\deploy-windows-909.ps1 -Port 909
```

脚本顺序：**`npm ci`**（无锁则 `npm install`）→ **`npm run build`** → **`npx serve@14`** 监听 **`tcp://0.0.0.0:909`**，并带 **`-s`**（SPA：未匹配路径回退到 `index.html`）。

停止服务：在该窗口按 **Ctrl+C**。

### 8.2 方式 B：与脚本等价的手动命令

```powershell
Set-Location 'D:\apps\Sojourner'
npm ci
npm run build
npx --yes serve@14 dist -l tcp://0.0.0.0:909 --no-clipboard -s
```

- **必须** 使用 **`-s`（`--single`）**，否则刷新或直接打开深层路径时可能 **404**。  
- **`tcp://0.0.0.0:909`** 表示对所有网卡监听，便于通过 **公网 IP** 访问；若只写 `909` 有时仅绑定 localhost，外网无法访问。

### 8.3 验收（浏览器）

在能访问公网的电脑上打开：

`http://<公网IP>:909/`

检查：

- 标题页、进入游戏、终局是否正常；  
- **硬刷新**（Ctrl+F5）后是否仍正常；  
- 若使用 **HTTPS + 域名**，再验证证书与 **PWA / Service Worker**（见第十节）。

---

## 九、长期运行（可选，概念级）

当前 **`serve`** 占用 **当前 RDP 会话里的一个 PowerShell 窗口**；注销或关窗可能结束进程。

若需 **开机自启 / 后台常驻**，常见做法（任选其一，需自行查阅细节）：

- **Windows 任务计划程序**：触发器「登录时」或「启动时」，操作启动 `powershell.exe`，参数里执行 `Set-Location` + `npx serve ...`。  
- **NSSM** 将 `npx` 或 `node` 包装为 Windows 服务。  
- **IIS** 将 **`dist`** 作为静态站点根目录（需自行配置 **默认文档 `index.html`** 与 **URL 重写** 实现 SPA 回退）。

生产环境更常见的是 **前面 Nginx/Caddy/IIS 终结 TLS**，后端仍 **`127.0.0.1:909`** 提供静态文件。

---

## 十、HTTPS、Service Worker 与 HTTP 兼容说明

- 工程使用 **vite-plugin-pwa**：构建产物含 **Service Worker**，并对核心资源预缓存；**`.mp3`** 走运行时缓存策略。  
- **HTTPS**：公网域名下，Chrome/Edge 等通常在 **安全上下文** 下才完整启用 **Service Worker** 与「可安装 PWA」。  
- **纯 HTTP（如 `http://公网IP:909`）**：在非 `localhost` 的 HTTP 上，浏览器 **可能不注册 SW**；**页面与游戏逻辑仍可用**，主要影响「离线安装 / SW 预缓存」类能力。若必须 HTTP 内网访问，可接受此限制；若要对公网提供完整 PWA，请配置 **HTTPS**（见第十一节）。

---

## 十一、HTTPS 的两种常见做法（可选）

1. **IIS 反向代理**  
   - IIS 绑定 **443** 与证书，通过 **URL Rewrite + ARR** 将流量转发到 **`http://127.0.0.1:909`**。  
   - 用户访问 `https://你的域名/`，由 IIS 处理 TLS。

2. **Caddy / Nginx**  
   - 在 Linux 或 Windows 上安装反向代理，监听 443，证书可用 **Let’s Encrypt**；`proxy_pass` 或等价配置指向上游 **`127.0.0.1:909`**。

证书申请与阿里云负载均衡（SLB）绑定步骤以 **阿里云官方文档** 为准。

---

## 十二、与 GitHub Pages 的对照（同一仓库、两套构建）

| 场景 | `VITE_BASE` | 构建命令 | 谁来做 |
|------|-------------|----------|--------|
| **自建 Windows，根路径** | 不设置或 `/` | 服务器上 `npm run build` | 你手工或脚本 |
| **GitHub Pages 项目页** | `/Sojourner/` | CI 里已写 `env: VITE_BASE: /Sojourner/` | push `main` 触发 Actions |

**切勿** 把服务器上为 GitHub 构建出来的 **`dist`**（带 `/Sojourner/` 前缀）直接拷到根路径站点使用，反之亦然。

---

## 十三、GM 调试入口（预留）

- 浏览器访问时在 URL 后加 **`?gm=1`** 并打开（或刷新），可进入 **GM 世界树调试页**。  
- 若正式环境不希望公开，可在 **反向代理** 或 **WAF** 拦截带 `gm=` 的请求，或仅内网开放。

---

## 十四、故障排查

| 现象 | 排查方向 |
|------|----------|
| 公网无法打开 `:909` | 阿里云 **安全组** 是否放行；Windows **防火墙** 入站是否放行；`serve` 是否监听 **`0.0.0.0`** 而非仅 localhost |
| 白屏、控制台大量 **404（/Sojourner/...）** | 是否误用 **GitHub Pages 专用** 构建产物；自建应 **不设 `VITE_BASE`** 后重新 `npm run build` |
| 刷新后 **404** | 静态服务未启用 SPA 回退；确认 **`serve -s`** |
| `npm ci` 报 **ERESOLVE** | 确认仓库根目录存在 **`.npmrc`**（`legacy-peer-deps=true`），且为 **完整 clone**，未删掉锁文件 |
| **PWA / SW** 不生效 | 非 HTTPS 且非 localhost 时属浏览器策略；换 HTTPS 或接受 HTTP 下无 SW |

---

## 十五、更新部署的推荐流程（发版循环）

```powershell
Set-Location 'D:\apps\Sojourner'
git pull origin main
npm ci
npm run build
# 若 serve 已在跑：先结束旧进程（原窗口 Ctrl+C 或结束对应进程），再启动：
npx --yes serve@14 dist -l tcp://0.0.0.0:909 --no-clipboard -s
```

或再次执行 **`.\scripts\deploy-windows-909.ps1`**（会重新安装依赖并构建，再启动服务）。

---

更多开发命令见仓库根目录 **`package.json`** 的 **`scripts`** 字段；GitHub Pages 工作流见 **`.github/workflows/pages.yml`**。

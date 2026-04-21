#requires -Version 5.1
<#
.SYNOPSIS
  一键：安装依赖、构建静态站点，并在本机 0.0.0.0 指定端口托管 dist（SPA）。

.DESCRIPTION
  适用于阿里云 Windows 图形化服务器等环境；默认端口 909。
  需已安装 Node.js LTS 与 npm。

.EXAMPLE
  .\scripts\deploy-windows-909.ps1
  .\scripts\deploy-windows-909.ps1 -Port 909
#>
param(
  [int]$Port = 909
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Error '未检测到 Node.js，请先安装 LTS 版本并确保 node 在 PATH 中。'
}

Write-Host ">>> 项目目录: $root"
Write-Host '>>> 安装依赖...'
if (Test-Path (Join-Path $root 'package-lock.json')) {
  npm ci
} else {
  npm install
}

Write-Host '>>> 构建 (tsc + vite build)...'
npm run build

Write-Host ">>> 启动静态服务（监听 0.0.0.0:$Port ，SPA 模式）。按 Ctrl+C 结束。"
Write-Host ">>> 本机浏览: http://127.0.0.1:$Port/"
npx --yes serve@14 dist -l "tcp://0.0.0.0:$Port" --no-clipboard -s

---
title: MShell Linux 版本支持
status: in-progress
created: 2026-02-01
---

# MShell Linux 版本支持

## 概述

为 MShell SSH 客户端添加完整的 Linux 平台支持，确保所有功能在 Linux 系统上正常运行。

## 用户故事

### US-1: Linux 用户安装
作为 Linux 用户，我希望能够通过 AppImage 或 deb 包安装 MShell，以便在我的系统上使用这个 SSH 客户端。

**验收标准：**
- [ ] 提供 AppImage 格式（通用 Linux 发行版）
- [ ] 提供 deb 格式（Debian/Ubuntu 系列）
- [ ] 安装后能正常启动应用
- [ ] 应用图标正确显示
- [ ] 桌面快捷方式正常工作

### US-2: 终端功能兼容
作为 Linux 用户，我希望终端功能与 Windows 版本一致，包括颜色显示、快捷键等。

**验收标准：**
- [ ] xterm.js 在 Linux 上正确渲染
- [ ] 终端颜色主题正常显示
- [ ] 复制粘贴功能正常（Ctrl+Shift+C/V）
- [ ] 终端字体正确加载
- [ ] 终端大小自适应

### US-3: SSH 连接功能
作为 Linux 用户，我希望所有 SSH 连接功能正常工作。

**验收标准：**
- [ ] 密码认证正常
- [ ] SSH 密钥认证正常（支持 ~/.ssh/ 目录）
- [ ] 端口转发功能正常
- [ ] 代理跳板功能正常
- [ ] 连接保持和重连正常

### US-4: SFTP 文件管理
作为 Linux 用户，我希望 SFTP 文件管理功能正常工作。

**验收标准：**
- [ ] 本地文件浏览正确显示 Linux 文件系统（根目录 `/` 而非盘符）
- [ ] 隐藏盘符选择器（Linux 没有盘符概念）
- [ ] 文件上传/下载正常
- [ ] 文件权限显示正确（Unix 权限格式）
- [ ] 拖拽上传功能正常
- [ ] 路径分隔符正确处理（`/`）

**⚠️ 重要发现：**
`SFTPPanel.vue` 中硬编码了 Windows 盘符逻辑：
```typescript
const currentDrive = ref('C:')
const availableDrives = ref<string[]>(['C:', 'D:', 'E:', 'F:', 'G:'])
```
需要根据平台动态处理。

### US-5: 数据存储和配置
作为 Linux 用户，我希望应用数据存储在标准 Linux 位置。

**验收标准：**
- [ ] 配置文件存储在 ~/.config/mshell/ 或 XDG 标准目录
- [ ] 会话数据正确保存和加载
- [ ] 备份/恢复功能正常
- [ ] 导入/导出功能正常

### US-6: AI 功能兼容
作为 Linux 用户，我希望 AI 辅助功能正常工作。

**验收标准：**
- [ ] AI 模型配置正常
- [ ] 命令解释功能正常
- [ ] 智能补全功能正常
- [ ] AI 聊天面板正常

## 技术要求

### 平台检测
- 使用 `process.platform` 检测操作系统
- 根据平台调整路径分隔符
- 根据平台调整默认配置

### 文件路径处理
- Windows: `C:\Users\xxx\AppData\Roaming\mshell`
- Linux: `~/.config/mshell` 或 `$XDG_CONFIG_HOME/mshell`

### 终端配置
- Windows: `windowsMode: true`
- Linux: `windowsMode: false`

### 构建配置
- AppImage: 通用 Linux 格式，无需安装
- deb: Debian/Ubuntu 系列
- 可选: rpm (Fedora/RHEL 系列)

## 已完成的工作

### 1. 终端管理器 (src/utils/terminal-manager.ts)
- ✅ 动态检测平台设置 `windowsMode`

### 2. 构建配置 (electron-builder.json)
- ✅ 添加 Linux 构建目标（AppImage, deb）
- ✅ 配置 Linux 图标和元数据

### 3. 构建脚本 (package.json)
- ✅ `npm run build:linux` - 构建 Linux 版本
- ✅ `npm run build:all` - 构建所有平台

## 待完成的工作

### 高优先级
1. [ ] 验证 Electron 主进程的平台兼容性
2. [ ] 检查文件路径处理（app-settings.ts）
3. [ ] 测试 SSH 连接在 Linux 上的表现
4. [ ] **修复 SFTP 本地文件浏览器的盘符逻辑** ⚠️ 重要
5. [ ] 验证默认字体设置（Linux 可能没有 Consolas）

### 中优先级
5. [ ] 检查快捷键绑定（Linux 通常使用 Ctrl+Shift+C/V）
6. [ ] 验证系统托盘功能
7. [ ] 检查自动更新功能
8. [ ] 测试备份/恢复功能

### 低优先级
9. [ ] 添加 rpm 构建支持
10. [ ] 优化 Linux 特定的 UI 细节
11. [ ] 添加 Linux 安装文档

## 测试环境

### 推荐测试发行版
- Ubuntu 22.04 LTS / 24.04 LTS
- Debian 12
- Fedora 39/40
- Linux Mint 21

### 测试方法
1. 在 Linux 虚拟机中测试
2. 使用 WSL2 进行初步测试（有限制）
3. 使用 GitHub Actions 进行 CI/CD 构建

## 注意事项

1. **跨平台构建限制**：在 Windows 上构建 Linux 版本可能需要 Docker 或 WSL2
2. **原生依赖**：`cpu-features` 等原生模块需要在目标平台编译
3. **图标格式**：Linux 需要 PNG 格式图标，Windows 需要 ICO 格式

## 参考资源

- [Electron 跨平台指南](https://www.electronjs.org/docs/latest/tutorial/support#supported-platforms)
- [electron-builder Linux 配置](https://www.electron.build/configuration/linux)
- [XDG Base Directory 规范](https://specifications.freedesktop.org/basedir-spec/basedir-spec-latest.html)

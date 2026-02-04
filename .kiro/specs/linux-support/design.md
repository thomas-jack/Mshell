---
title: MShell Linux 版本支持 - 设计文档
status: in-progress
created: 2026-02-01
---

# MShell Linux 版本支持 - 设计文档

## 1. 架构概述

MShell 基于 Electron 框架，天然支持跨平台。主要需要处理的是平台特定的差异：

```
┌─────────────────────────────────────────────────────────────┐
│                      MShell Application                      │
├─────────────────────────────────────────────────────────────┤
│  渲染进程 (Vue 3)                                            │
│  ├── 终端组件 (xterm.js) ← 需要平台适配                       │
│  ├── SFTP 组件 ← 路径分隔符处理                              │
│  └── 设置组件                                                │
├─────────────────────────────────────────────────────────────┤
│  主进程 (Electron)                                           │
│  ├── app-settings.ts ← 使用 Electron API，已兼容             │
│  ├── BackupManager.ts ← 使用 Electron API，已兼容            │
│  ├── 托盘图标 ← 需要平台适配                                  │
│  └── 快捷键 ← 需要平台适配                                    │
├─────────────────────────────────────────────────────────────┤
│  Electron APIs                                               │
│  ├── app.getPath('userData') → 自动处理平台差异               │
│  ├── process.platform → 平台检测                             │
│  └── path.join() → 自动处理路径分隔符                         │
└─────────────────────────────────────────────────────────────┘
```

## 2. 平台差异分析

### 2.1 文件路径

| 项目 | Windows | Linux |
|------|---------|-------|
| 用户数据目录 | `%APPDATA%\mshell` | `~/.config/mshell` |
| 下载目录 | `C:\Users\xxx\Downloads` | `~/Downloads` |
| SSH 密钥目录 | `C:\Users\xxx\.ssh` | `~/.ssh` |
| 路径分隔符 | `\` | `/` |

**解决方案**：Electron 的 `app.getPath()` 已自动处理，无需修改。

### 2.2 终端配置

| 项目 | Windows | Linux |
|------|---------|-------|
| xterm windowsMode | `true` | `false` |
| 换行符 | `\r\n` | `\n` |
| 默认字体 | `Consolas` | `monospace` |

**已完成**：`terminal-manager.ts` 已动态检测平台。

### 2.3 快捷键

| 功能 | Windows | Linux |
|------|---------|-------|
| 复制 | `Ctrl+C` | `Ctrl+Shift+C` |
| 粘贴 | `Ctrl+V` | `Ctrl+Shift+V` |
| 其他快捷键 | `Ctrl+X` | `Ctrl+X` |

**需要处理**：终端内的复制粘贴快捷键。

### 2.4 托盘图标

| 项目 | Windows | Linux |
|------|---------|-------|
| 图标格式 | `.ico` | `.png` |
| 图标大小 | 原始大小 | 16x16 或 22x22 |
| 行为 | 单击切换显示 | 单击显示菜单 |

**已处理**：`main.ts` 已根据平台选择图标格式。

### 2.5 原生依赖

| 依赖 | 说明 | Linux 兼容性 |
|------|------|-------------|
| `ssh2` | SSH 连接 | ✅ 纯 JS |
| `cpu-features` | CPU 检测 | ⚠️ 需要编译 |

**注意**：`cpu-features` 是 `ssh2` 的可选依赖，用于优化加密性能。

## 3. 需要修改的文件

### 3.1 高优先级

#### electron/main.ts
- [x] 托盘图标路径已处理
- [ ] 检查菜单栏行为（Linux 可能需要显示）
- [ ] 验证窗口关闭行为

#### src/utils/terminal-manager.ts
- [x] windowsMode 已动态检测
- [x] 复制粘贴快捷键已统一处理（Ctrl+Shift+C/V）

#### src/components/Terminal/TerminalView.vue
- [x] 复制粘贴快捷键已在 terminal-manager.ts 中统一处理

#### src/components/SFTP/SFTPPanel.vue ⚠️ 需要修改
- [ ] 盘符选择器需要根据平台显示/隐藏
- [ ] 默认路径需要根据平台设置
- [ ] 路径分隔符处理

### 3.2 中优先级

#### electron/utils/app-settings.ts
- [x] 使用 `app.getPath('userData')`，已兼容
- [ ] 检查默认字体设置（Linux 可能没有 Consolas）

#### src/components/SFTP/SFTPPanel.vue
- [ ] 验证本地文件浏览器路径显示
- [ ] 检查拖拽上传功能

### 3.3 低优先级

#### electron-builder.json
- [x] 已添加 Linux 构建配置
- [ ] 可选：添加 rpm 支持

#### package.json
- [x] 已添加构建脚本

## 4. 详细设计

### 4.1 平台检测工具

创建统一的平台检测工具：

```typescript
// electron/utils/platform.ts
export const platform = {
  isWindows: process.platform === 'win32',
  isLinux: process.platform === 'linux',
  isMac: process.platform === 'darwin',
  
  // 获取默认终端字体
  getDefaultFont(): string {
    if (this.isWindows) return 'Consolas, monospace'
    if (this.isMac) return 'Menlo, monospace'
    return 'monospace'
  },
  
  // 获取 SSH 密钥默认目录
  getSSHKeyDir(): string {
    return join(app.getPath('home'), '.ssh')
  }
}
```

### 4.2 终端复制粘贴

在 TerminalView.vue 中添加 Linux 快捷键支持：

```typescript
// 检测平台
const isLinux = navigator.platform.indexOf('Linux') > -1

// 注册快捷键
terminal.attachCustomKeyEventHandler((event) => {
  if (isLinux) {
    // Linux: Ctrl+Shift+C 复制, Ctrl+Shift+V 粘贴
    if (event.ctrlKey && event.shiftKey) {
      if (event.key === 'C') {
        document.execCommand('copy')
        return false
      }
      if (event.key === 'V') {
        navigator.clipboard.readText().then(text => {
          terminal.paste(text)
        })
        return false
      }
    }
  }
  return true
})
```

### 4.3 默认字体回退

修改 app-settings.ts 的默认字体：

```typescript
terminal: {
  fontSize: 14,
  fontFamily: process.platform === 'win32' 
    ? 'Consolas, monospace' 
    : 'monospace',
  // ...
}
```

## 5. 构建和测试

### 5.1 本地构建

```bash
# Windows 上构建 Windows 版本
npm run build:win

# Linux 上构建 Linux 版本
npm run build:linux

# 构建所有平台（需要对应环境）
npm run build:all
```

### 5.2 CI/CD 构建（推荐）

使用 GitHub Actions 进行跨平台构建：

```yaml
# .github/workflows/build.yml
name: Build
on: [push, pull_request]

jobs:
  build:
    strategy:
      matrix:
        os: [windows-latest, ubuntu-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
```

### 5.3 测试清单

- [ ] 应用启动和关闭
- [ ] SSH 密码连接
- [ ] SSH 密钥连接
- [ ] 终端输入输出
- [ ] 终端复制粘贴
- [ ] SFTP 文件浏览
- [ ] SFTP 上传下载
- [ ] 设置保存和加载
- [ ] 备份和恢复
- [ ] 托盘图标功能
- [ ] AI 功能

## 6. 风险和缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 原生依赖编译失败 | 构建失败 | 使用 prebuild 或移除可选依赖 |
| 字体显示问题 | UI 异常 | 使用通用字体回退 |
| 快捷键冲突 | 功能异常 | 平台特定快捷键配置 |
| 托盘行为差异 | 用户体验 | 遵循平台惯例 |

## 7. 参考资源

- [Electron 跨平台最佳实践](https://www.electronjs.org/docs/latest/tutorial/support)
- [xterm.js 配置文档](https://xtermjs.org/docs/api/terminal/interfaces/iterminaloptions/)
- [electron-builder Linux 配置](https://www.electron.build/configuration/linux)

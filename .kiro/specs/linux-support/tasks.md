---
title: MShell Linux 版本支持 - 任务清单
status: in-progress
created: 2026-02-01
---

# MShell Linux 版本支持 - 任务清单

## 已完成 ✅

### Task 1: 终端平台适配
- [x] 修改 `src/utils/terminal-manager.ts`
- [x] 动态检测平台设置 `windowsMode`
- [x] Windows: `true`, Linux/macOS: `false`

### Task 2: 构建配置
- [x] 修改 `electron-builder.json`
- [x] 添加 Linux 构建目标 (AppImage, deb)
- [x] 配置 Linux 图标和元数据

### Task 3: 构建脚本
- [x] 修改 `package.json`
- [x] 添加 `build:win` 脚本
- [x] 添加 `build:linux` 脚本
- [x] 添加 `build:all` 脚本

---

## 待完成 📋

### Task 4: 平台检测工具 [高优先级]
创建统一的平台检测工具模块。

**文件**: `electron/utils/platform.ts`

**内容**:
```typescript
import { app } from 'electron'
import { join } from 'path'

export const platform = {
  isWindows: process.platform === 'win32',
  isLinux: process.platform === 'linux',
  isMac: process.platform === 'darwin',
  
  getDefaultFont(): string {
    if (this.isWindows) return 'Consolas, monospace'
    if (this.isMac) return 'Menlo, monospace'
    return 'monospace'
  },
  
  getSSHKeyDir(): string {
    return join(app.getPath('home'), '.ssh')
  }
}
```

**验收标准**:
- [ ] 文件创建成功
- [ ] 导出平台检测函数
- [ ] 无 TypeScript 错误

---

### Task 5: 默认字体适配 [高优先级]
修改默认终端字体，确保 Linux 上有合适的回退字体。

**文件**: `electron/utils/app-settings.ts`

**修改**:
```typescript
// 修改 getDefaultSettings() 中的 terminal.fontFamily
fontFamily: process.platform === 'win32' 
  ? 'Consolas, "Courier New", monospace' 
  : process.platform === 'darwin'
    ? 'Menlo, Monaco, monospace'
    : '"DejaVu Sans Mono", "Liberation Mono", monospace',
```

**验收标准**:
- [ ] Windows 使用 Consolas
- [ ] macOS 使用 Menlo
- [ ] Linux 使用 DejaVu Sans Mono 或 Liberation Mono

---

### Task 6: 终端复制粘贴快捷键 [已完成] ✅
终端复制粘贴快捷键已在 `terminal-manager.ts` 中统一处理。

**文件**: `src/utils/terminal-manager.ts`

**已实现代码**:
```typescript
// 注册自定义按键处理器 (Ctrl+Shift+C/V/A)
terminal.attachCustomKeyEventHandler((event) => {
  if (event.type !== 'keydown') return true

  // Ctrl+Shift+C: Copy
  if (event.ctrlKey && event.shiftKey && (event.key === 'C' || event.code === 'KeyC')) {
    const selection = terminal.getSelection()
    if (selection) {
      navigator.clipboard.writeText(selection)
      return false
    }
    return false
  }

  // Ctrl+Shift+V: Paste
  if (event.ctrlKey && event.shiftKey && (event.key === 'V' || event.code === 'KeyV')) {
    // ...
  }
  // ...
})
```

**验收标准**:
- [x] Ctrl+Shift+C 复制选中文本
- [x] Ctrl+Shift+V 粘贴剪贴板内容
- [x] Ctrl+Shift+A 全选
- [x] Windows 和 Linux 行为一致

---

### Task 7: 修复 SFTP 本地文件浏览器 [高优先级] ⚠️ 重要
SFTP 面板中硬编码了 Windows 盘符逻辑，需要根据平台动态处理。

**文件**: `src/components/SFTP/SFTPPanel.vue`

**问题代码**:
```typescript
const currentDrive = ref('C:')
const availableDrives = ref<string[]>(['C:', 'D:', 'E:', 'F:', 'G:'])
```

**修改方案**:
```typescript
// 检测平台
const isWindows = navigator.platform.indexOf('Win') > -1

// 盘符相关（仅 Windows）
const currentDrive = ref(isWindows ? 'C:' : '')
const availableDrives = ref<string[]>(isWindows ? ['C:', 'D:', 'E:', 'F:', 'G:'] : [])
const showDriveSelector = computed(() => isWindows)

// 修改 onMounted 中的路径初始化
onMounted(async () => {
  if (isWindows) {
    const userProfile = (window as any).electronAPI.process?.env?.USERPROFILE || 'C:\\'
    localPath.value = userProfile
    if (userProfile.match(/^[A-Z]:/i)) {
      currentDrive.value = userProfile.substring(0, 2).toUpperCase()
    }
  } else {
    const home = (window as any).electronAPI.process?.env?.HOME || '/'
    localPath.value = home
  }
  // ...
})
```

**模板修改**:
```vue
<!-- 盘符选择 - 仅 Windows 显示 -->
<div v-if="showDriveSelector" class="drive-selector">
  <el-select v-model="currentDrive" @change="changeDrive" size="small">
    <!-- ... -->
  </el-select>
</div>
```

**验收标准**:
- [ ] Windows 上显示盘符选择器
- [ ] Linux 上隐藏盘符选择器
- [ ] Linux 上默认显示用户主目录
- [ ] 路径导航正常工作

---

### Task 8: 验证 SFTP 本地文件浏览 [中优先级]
确保 SFTP 本地文件浏览器在 Linux 上正确显示。

**文件**: `src/components/SFTP/SFTPPanel.vue`

**检查项**:
- [ ] 根目录显示正确 (`/` 而非 `C:\`)
- [ ] 路径分隔符正确 (`/`)
- [ ] 隐藏文件显示正确 (`.` 开头的文件)
- [ ] 文件权限显示正确 (Unix 格式)

**可能需要修改**:
- 本地文件浏览器的根目录检测
- 路径拼接逻辑

---

### Task 8: 验证托盘图标行为 [中优先级]
确保托盘图标在 Linux 上正常工作。

**文件**: `electron/main.ts`

**检查项**:
- [ ] 托盘图标正确显示
- [ ] 右键菜单正常弹出
- [ ] 单击行为符合 Linux 惯例

**可能需要修改**:
```typescript
// Linux 上单击显示菜单而非切换窗口
if (process.platform === 'linux') {
  tray.on('click', () => {
    tray?.popUpContextMenu()
  })
} else {
  tray.on('click', () => {
    // Windows 行为：切换窗口显示
  })
}
```

---

### Task 9: 添加 GitHub Actions CI/CD [低优先级]
创建自动化构建工作流。

**文件**: `.github/workflows/build.yml`

**内容**:
```yaml
name: Build

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    strategy:
      matrix:
        os: [windows-latest, ubuntu-latest]
    runs-on: ${{ matrix.os }}
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: release-${{ matrix.os }}
          path: release/*.{exe,AppImage,deb}
```

**验收标准**:
- [ ] Windows 构建成功
- [ ] Linux 构建成功
- [ ] 构建产物正确上传

---

### Task 10: 添加 rpm 构建支持 [低优先级]
为 Fedora/RHEL 系列添加 rpm 包支持。

**文件**: `electron-builder.json`

**修改**:
```json
"linux": {
  "target": [
    { "target": "AppImage", "arch": ["x64"] },
    { "target": "deb", "arch": ["x64"] },
    { "target": "rpm", "arch": ["x64"] }
  ]
}
```

**验收标准**:
- [ ] rpm 包构建成功
- [ ] 可在 Fedora 上安装

---

### Task 11: 编写 Linux 安装文档 [低优先级]
创建 Linux 安装和使用指南。

**文件**: `docs/linux-installation.md`

**内容**:
- AppImage 使用方法
- deb 包安装方法
- 常见问题解答
- 已知限制

---

## 测试任务 🧪

### Test 1: 基础功能测试
- [ ] 应用启动
- [ ] 应用关闭
- [ ] 窗口最小化/最大化
- [ ] 托盘图标

### Test 2: SSH 连接测试
- [ ] 密码认证
- [ ] 密钥认证
- [ ] 连接保持
- [ ] 断线重连

### Test 3: 终端功能测试
- [ ] 命令输入输出
- [ ] 颜色显示
- [ ] 复制粘贴
- [ ] 滚动历史

### Test 4: SFTP 功能测试
- [ ] 本地文件浏览
- [ ] 远程文件浏览
- [ ] 文件上传
- [ ] 文件下载
- [ ] 拖拽上传

### Test 5: 数据持久化测试
- [ ] 设置保存/加载
- [ ] 会话保存/加载
- [ ] 备份/恢复
- [ ] 导入/导出

### Test 6: AI 功能测试
- [ ] AI 配置
- [ ] 命令解释
- [ ] 智能补全
- [ ] AI 聊天

---

## 进度跟踪

| 任务 | 状态 | 优先级 | 预计时间 |
|------|------|--------|----------|
| Task 1-3 | ✅ 完成 | - | - |
| Task 4 | 📋 待做 | 高 | 15 分钟 |
| Task 5 | 📋 待做 | 高 | 10 分钟 |
| Task 6 | ✅ 完成 | 高 | - |
| Task 7 | 📋 待做 | 高 ⚠️ | 30 分钟 |
| Task 8 | 📋 待做 | 中 | 20 分钟 |
| Task 9 | 📋 待做 | 中 | 15 分钟 |
| Task 10 | 📋 待做 | 低 | 30 分钟 |
| Task 11 | 📋 待做 | 低 | 10 分钟 |
| Task 12 | 📋 待做 | 低 | 30 分钟 |

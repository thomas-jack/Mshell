# 终端按键映射完整修复方案

## 问题描述
在SSH会话终端中，某些编辑模式下按删除键会出现ANSI转义序列（如 `^[[D`、`^[[3~`、`^?` 等），而不是正常的删除操作。

## 根本原因分析
1. **xterm.js配置不完整** - 缺少Windows环境特定配置
2. **SSH终端模式未正确设置** - 缺少必要的终端模式标志
3. **环境变量缺失** - 未设置正确的TERM和编码环境变量
4. **按键处理逻辑不当** - 某些特殊按键被错误拦截
5. **IME支持缺失** - 中文输入法等组合输入未正确处理

## 完整修复清单

### ✅ 1. TerminalView.vue - Terminal初始化增强
**文件**: `src/components/Terminal/TerminalView.vue`

```typescript
terminal = new Terminal({
  fontSize: props.options.fontSize,
  fontFamily: props.options.fontFamily,
  cursorStyle: props.options.cursorStyle,
  cursorBlink: props.options.cursorBlink,
  scrollback: props.options.scrollback,
  theme: theme,
  allowProposedApi: true,
  convertEol: true,
  
  // 新增：Windows环境优化
  windowsMode: true,              // 启用Windows按键处理
  altClickMovesCursor: true,      // Alt+点击移动光标
  rightClickSelectsWord: false,   // 右键不选择单词
  macOptionIsMeta: false,         // 确保Option键不作为Meta
  disableStdin: false             // 启用标准输入
})
```

### ✅ 2. TerminalView.vue - 按键处理逻辑增强
**文件**: `src/components/Terminal/TerminalView.vue`

```typescript
terminal.attachCustomKeyEventHandler((event) => {
  if (event.type !== 'keydown') return true
  
  // 应用快捷键（保持不变）
  if (event.ctrlKey && event.shiftKey && event.key === 'C') { ... }
  if (event.ctrlKey && event.shiftKey && event.key === 'V') { ... }
  if (event.ctrlKey && event.shiftKey && event.key === 'A') { ... }
  
  // 新增：Ctrl+L清屏支持
  if (event.ctrlKey && event.key === 'l') {
    return true  // 让xterm.js处理
  }
  
  // 新增：确保特殊按键正确传递
  const specialKeys = [
    'Delete', 'Backspace', 'Home', 'End', 
    'PageUp', 'PageDown', 'Insert', 'Tab', 
    'Enter', 'Escape',
    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'
  ]
  
  if (specialKeys.includes(event.key)) {
    return true  // 让xterm.js处理
  }
  
  // 新增：功能键 F1-F12
  if (event.key.match(/^F([1-9]|1[0-2])$/)) {
    return true
  }
  
  return true
})
```

### ✅ 3. TerminalView.vue - IME输入支持
**文件**: `src/components/Terminal/TerminalView.vue`

```typescript
// 新增：IME状态跟踪
let isComposing = ref(false)

// 新增：IME事件监听
terminalContainer.value.addEventListener('compositionstart', () => {
  isComposing.value = true
})

terminalContainer.value.addEventListener('compositionend', (e: CompositionEvent) => {
  isComposing.value = false
  if (e.data && terminal) {
    window.electronAPI.ssh.write(props.connectionId, e.data)
  }
})

// 修改：onData中检查IME状态
terminal.onData((data) => {
  if (isComposing.value) return  // IME输入时不发送
  
  // ... 其他逻辑
  window.electronAPI.ssh.write(props.connectionId, data)
})
```

### ✅ 4. TerminalView.vue - 按键调试功能
**文件**: `src/components/Terminal/TerminalView.vue`

```typescript
terminal.onData((data) => {
  if (isComposing.value) return
  
  // 新增：开发模式调试
  if (import.meta.env.DEV) {
    const hasSpecialChars = /[\x00-\x1F\x7F-\xFF]/.test(data)
    if (hasSpecialChars) {
      const hex = Array.from(data)
        .map(c => '0x' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(' ')
      console.debug('[Terminal Key]', { raw: data, hex, length: data.length })
    }
  }
  
  emit('data', data)
  window.electronAPI.ssh.write(props.connectionId, data)
})
```

### ✅ 5. SSHConnectionManager.ts - Shell初始化增强
**文件**: `electron/managers/SSHConnectionManager.ts`

```typescript
client.shell({
  term: 'xterm-256color',
  cols: 80,
  rows: 24,
  
  // 新增：终端模式配置
  modes: {
    ECHO: 1,      // 启用回显
    ICANON: 0,    // 禁用规范模式（逐字符处理）
    ISIG: 1,      // 启用信号处理（Ctrl+C等）
    ICRNL: 1,     // CR转NL
    ONLCR: 1,     // NL转CRNL
    OPOST: 1,     // 启用输出后处理
    IUTF8: 1      // UTF-8支持
  },
  
  // 新增：环境变量配置
  env: {
    TERM: 'xterm-256color',
    COLORTERM: 'truecolor',
    LANG: 'en_US.UTF-8',
    LC_ALL: 'en_US.UTF-8'
  }
}, ...)
```

### ✅ 6. SSHConnectionManager.ts - Write方法增强
**文件**: `electron/managers/SSHConnectionManager.ts`

```typescript
// 修改：支持Buffer类型和明确编码
write(id: string, data: string | Buffer): void {
  const connection = this.connections.get(id)
  if (!connection || !connection.stream) {
    throw new Error(`Connection not ready: ${id}`)
  }

  // 支持字符串和Buffer，明确指定编码
  if (typeof data === 'string') {
    connection.stream.write(data, 'utf8')
  } else {
    connection.stream.write(data)
  }
  
  connection.lastActivity = new Date()
}
```

## 配置说明

### xterm.js关键配置
| 配置项 | 值 | 说明 |
|--------|-----|------|
| windowsMode | true | Windows环境按键处理 |
| altClickMovesCursor | true | Alt+点击移动光标 |
| rightClickSelectsWord | false | 右键不选择单词 |
| macOptionIsMeta | false | Option键不作为Meta |
| disableStdin | false | 启用标准输入 |
| convertEol | true | 自动转换行尾 |

### SSH终端模式
| 模式 | 值 | 说明 |
|------|-----|------|
| ECHO | 1 | 启用回显 |
| ICANON | 0 | 禁用规范模式（逐字符） |
| ISIG | 1 | 启用信号处理 |
| ICRNL | 1 | CR转NL |
| ONLCR | 1 | NL转CRNL |
| OPOST | 1 | 输出后处理 |
| IUTF8 | 1 | UTF-8支持 |

### 环境变量
| 变量 | 值 | 说明 |
|------|-----|------|
| TERM | xterm-256color | 终端类型 |
| COLORTERM | truecolor | 真彩色支持 |
| LANG | en_US.UTF-8 | 语言编码 |
| LC_ALL | en_US.UTF-8 | 全局编码 |

## 测试清单

### 基础按键测试
- [ ] **Backspace** - 删除光标前字符
- [ ] **Delete** - 删除光标后字符
- [ ] **Enter** - 执行命令/换行
- [ ] **Tab** - 自动补全
- [ ] **Escape** - 退出当前操作

### 导航按键测试
- [ ] **Arrow Up/Down** - 历史命令导航
- [ ] **Arrow Left/Right** - 光标左右移动
- [ ] **Home** - 移到行首
- [ ] **End** - 移到行尾
- [ ] **Page Up/Down** - 滚动屏幕

### 控制键测试
- [ ] **Ctrl+C** - 中断当前命令
- [ ] **Ctrl+D** - 退出/EOF
- [ ] **Ctrl+Z** - 挂起进程
- [ ] **Ctrl+L** - 清屏

### 编辑器测试
- [ ] **vim** - 方向键导航正常
- [ ] **vim** - Delete/Backspace删除正常
- [ ] **vim** - Insert切换模式正常
- [ ] **nano** - 所有按键正常工作

### 功能键测试
- [ ] **F1-F12** - 在支持的应用中正常工作

### 复制粘贴测试
- [ ] **Ctrl+Shift+C** - 复制选中文本
- [ ] **Ctrl+Shift+V** - 粘贴文本
- [ ] **右键菜单** - 复制粘贴正常
- [ ] **多行文本粘贴** - 正常工作

### 中文输入测试
- [ ] **中文输入法** - 正常输入中文
- [ ] **IME候选窗口** - 正常显示
- [ ] **组合输入** - 完成后正确发送

## 调试方法

### 1. 查看按键调试信息
在开发模式下，打开浏览器控制台（F12），按特殊按键会看到：
```
[Terminal Key] { raw: '\x1B[3~', hex: '0x1b 0x5b 0x33 0x7e', length: 4 }
```

### 2. 服务器端检查
```bash
# 检查TERM变量
echo $TERM
# 应该输出: xterm-256color

# 检查编码设置
echo $LANG
# 应该输出: en_US.UTF-8

# 测试按键（按Ctrl+C退出）
cat -v
# 按各种按键查看输出

# 查看终端设置
stty -a
```

### 3. 常见ANSI序列对照
| 按键 | ANSI序列 | 十六进制 |
|------|----------|----------|
| Delete | `\x1B[3~` | 0x1B 0x5B 0x33 0x7E |
| Home | `\x1B[H` | 0x1B 0x5B 0x48 |
| End | `\x1B[F` | 0x1B 0x5B 0x46 |
| Arrow Up | `\x1B[A` | 0x1B 0x5B 0x41 |
| Arrow Down | `\x1B[B` | 0x1B 0x5B 0x42 |
| Arrow Right | `\x1B[C` | 0x1B 0x5B 0x43 |
| Arrow Left | `\x1B[D` | 0x1B 0x5B 0x44 |

## 常见问题排查

### Q1: Delete键仍然显示 ^[[3~
**可能原因**: 终端模式未生效
**解决方法**: 
1. 检查SSH连接是否成功建立
2. 重新连接SSH会话
3. 在服务器端运行 `stty -a` 检查设置

### Q2: 方向键显示 ^[[A ^[[B 等
**可能原因**: TERM环境变量不正确
**解决方法**:
1. 检查服务器端 `echo $TERM`
2. 如果不是xterm-256color，手动设置: `export TERM=xterm-256color`

### Q3: Backspace显示 ^?
**可能原因**: erase字符设置不正确
**解决方法**: 在服务器端运行 `stty erase ^?`

### Q4: 中文输入显示乱码
**可能原因**: 编码设置不正确
**解决方法**:
1. 检查 `echo $LANG`
2. 设置编码: `export LANG=en_US.UTF-8`

### Q5: vim中按键不响应
**可能原因**: vim的终端兼容性问题
**解决方法**:
1. 在vim中运行 `:set term?` 检查终端类型
2. 添加到 ~/.vimrc: `set term=xterm-256color`

## 性能优化建议

1. **生产环境关闭调试日志** - 避免性能开销
2. **大文本粘贴优化** - 考虑分批发送
3. **使用Buffer传输** - 二进制数据更高效

## 后续改进方向

1. **自适应终端类型** - 根据服务器自动选择最佳TERM
2. **按键映射自定义** - 允许用户自定义按键
3. **剪贴板同步** - 支持OSC 52序列
4. **鼠标支持** - 支持终端鼠标模式
5. **更好的IME集成** - 改善中文输入体验

## 相关文件

- `src/components/Terminal/TerminalView.vue` - 终端视图组件（主要修改）
- `electron/managers/SSHConnectionManager.ts` - SSH连接管理器（主要修改）
- `electron/ipc/ssh-handlers.ts` - SSH IPC处理器
- `electron/preload.ts` - Electron预加载脚本
- `TERMINAL_KEY_ENHANCEMENT.md` - 详细技术文档

## 总结

本次修复涵盖了终端按键处理的所有关键环节：
1. ✅ xterm.js配置优化
2. ✅ 按键处理逻辑增强
3. ✅ SSH终端模式配置
4. ✅ 环境变量设置
5. ✅ IME输入支持
6. ✅ 调试功能添加

所有修改都已完成，重新编译后应该能解决按键映射问题。

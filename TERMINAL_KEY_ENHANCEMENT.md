# 终端按键数据传输全面增强方案

## 问题分析

### 1. 原始问题
在SSH终端中，某些按键（Delete、Backspace、方向键等）显示为ANSI转义序列而不是执行相应操作。

### 2. 根本原因
- **xterm.js配置不完整**：缺少Windows环境特定配置
- **SSH终端模式未正确设置**：缺少必要的终端模式标志
- **环境变量缺失**：未设置正确的TERM和编码环境变量
- **按键处理逻辑不当**：某些特殊按键被错误拦截

## 完整增强方案

### 1. TerminalView.vue 增强

#### 1.1 Terminal初始化配置
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
  
  // Windows环境优化
  windowsMode: true,              // 启用Windows按键处理
  altClickMovesCursor: true,      // Alt+点击移动光标
  rightClickSelectsWord: false,   // 右键不选择单词
  macOptionIsMeta: false,         // 确保Option键不作为Meta
  disableStdin: false             // 启用标准输入
})
```

#### 1.2 按键处理增强
```typescript
terminal.attachCustomKeyEventHandler((event) => {
  if (event.type !== 'keydown') return true
  
  // 应用快捷键（Ctrl+Shift+C/V/A）
  // ... 保持现有快捷键处理
  
  // 确保特殊按键正确传递
  const specialKeys = [
    'Delete', 'Backspace', 'Home', 'End', 
    'PageUp', 'PageDown', 'Insert', 'Tab', 
    'Enter', 'Escape',
    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'
  ]
  
  if (specialKeys.includes(event.key)) {
    return true  // 让xterm.js处理
  }
  
  // 功能键 F1-F12
  if (event.key.match(/^F([1-9]|1[0-2])$/)) {
    return true  // 让xterm.js处理
  }
  
  return true
})
```

#### 1.3 按键调试功能
```typescript
terminal.onData((data) => {
  // 开发模式下记录特殊按键
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

### 2. SSHConnectionManager.ts 增强

#### 2.1 Shell初始化配置
```typescript
client.shell({
  term: 'xterm-256color',
  cols: 80,
  rows: 24,
  
  // 终端模式配置
  modes: {
    ECHO: 1,      // 启用回显
    ICANON: 0,    // 禁用规范模式（逐字符处理）
    ISIG: 1,      // 启用信号处理（Ctrl+C等）
    ICRNL: 1,     // CR转NL
    ONLCR: 1,     // NL转CRNL
    OPOST: 1,     // 启用输出后处理
    IUTF8: 1      // UTF-8支持
  },
  
  // 环境变量配置
  env: {
    TERM: 'xterm-256color',
    COLORTERM: 'truecolor',
    LANG: 'en_US.UTF-8',
    LC_ALL: 'en_US.UTF-8'
  }
}, ...)
```

#### 2.2 Write方法增强
```typescript
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

## 按键映射参考

### 常见按键的ANSI序列

| 按键 | ANSI序列 | 十六进制 | 说明 |
|------|----------|----------|------|
| Backspace | `\x7F` | 0x7F | 删除光标前字符 |
| Delete | `\x1B[3~` | 0x1B 0x5B 0x33 0x7E | 删除光标后字符 |
| Home | `\x1B[H` | 0x1B 0x5B 0x48 | 移到行首 |
| End | `\x1B[F` | 0x1B 0x5B 0x46 | 移到行尾 |
| Arrow Up | `\x1B[A` | 0x1B 0x5B 0x41 | 上移 |
| Arrow Down | `\x1B[B` | 0x1B 0x5B 0x42 | 下移 |
| Arrow Right | `\x1B[C` | 0x1B 0x5B 0x43 | 右移 |
| Arrow Left | `\x1B[D` | 0x1B 0x5B 0x44 | 左移 |
| Page Up | `\x1B[5~` | 0x1B 0x5B 0x35 0x7E | 上翻页 |
| Page Down | `\x1B[6~` | 0x1B 0x5B 0x36 0x7E | 下翻页 |
| Insert | `\x1B[2~` | 0x1B 0x5B 0x32 0x7E | 插入模式 |
| Tab | `\x09` | 0x09 | 制表符 |
| Enter | `\r` | 0x0D | 回车 |
| Escape | `\x1B` | 0x1B | 转义 |
| Ctrl+C | `\x03` | 0x03 | 中断信号 |
| Ctrl+D | `\x04` | 0x04 | EOF |
| Ctrl+Z | `\x1A` | 0x1A | 挂起 |

### 功能键映射

| 按键 | ANSI序列 | 说明 |
|------|----------|------|
| F1 | `\x1BOP` | 功能键1 |
| F2 | `\x1BOQ` | 功能键2 |
| F3 | `\x1BOR` | 功能键3 |
| F4 | `\x1BOS` | 功能键4 |
| F5 | `\x1B[15~` | 功能键5 |
| F6 | `\x1B[17~` | 功能键6 |
| F7 | `\x1B[18~` | 功能键7 |
| F8 | `\x1B[19~` | 功能键8 |
| F9 | `\x1B[20~` | 功能键9 |
| F10 | `\x1B[21~` | 功能键10 |
| F11 | `\x1B[23~` | 功能键11 |
| F12 | `\x1B[24~` | 功能键12 |

## 测试清单

### 基础按键测试
- [ ] Backspace - 删除光标前字符
- [ ] Delete - 删除光标后字符
- [ ] Enter - 执行命令
- [ ] Tab - 自动补全
- [ ] Escape - 退出当前操作

### 导航按键测试
- [ ] Arrow Up/Down - 历史命令导航
- [ ] Arrow Left/Right - 光标移动
- [ ] Home - 移到行首
- [ ] End - 移到行尾
- [ ] Page Up/Down - 滚动屏幕

### 编辑器测试（vim/nano）
- [ ] 在vim中使用方向键导航
- [ ] 在vim中使用Delete/Backspace删除
- [ ] 在vim中使用Insert切换模式
- [ ] 在nano中正常编辑

### 控制键测试
- [ ] Ctrl+C - 中断当前命令
- [ ] Ctrl+D - 退出/EOF
- [ ] Ctrl+Z - 挂起进程
- [ ] Ctrl+L - 清屏

### 功能键测试
- [ ] F1-F12在支持的应用中正常工作

### 复制粘贴测试
- [ ] Ctrl+Shift+C - 复制选中文本
- [ ] Ctrl+Shift+V - 粘贴文本
- [ ] 右键菜单复制粘贴
- [ ] 多行文本粘贴

## 调试方法

### 1. 启用按键调试
在开发模式下，终端会自动记录特殊按键的十六进制表示：
```
[Terminal Key] { raw: '\x1B[3~', hex: '0x1b 0x5b 0x33 0x7e', length: 4 }
```

### 2. 检查SSH连接
```bash
# 在服务器端检查TERM变量
echo $TERM  # 应该显示 xterm-256color

# 检查编码设置
echo $LANG  # 应该显示 en_US.UTF-8

# 测试按键
cat -v  # 然后按各种按键查看输出
```

### 3. 使用stty检查终端设置
```bash
stty -a  # 查看所有终端设置
```

## 常见问题排查

### 问题1：Delete键显示为 ^[[3~
**原因**：终端模式未正确设置
**解决**：确保SSH shell配置了正确的modes

### 问题2：方向键显示为 ^[[A ^[[B 等
**原因**：TERM环境变量不正确
**解决**：确保env配置中设置了TERM='xterm-256color'

### 问题3：Backspace显示为 ^?
**原因**：终端的erase字符设置不正确
**解决**：在服务器端运行 `stty erase ^?`

### 问题4：中文输入显示乱码
**原因**：编码设置不正确
**解决**：确保LANG和LC_ALL设置为UTF-8

## 性能优化

### 1. 减少不必要的日志
生产环境关闭按键调试日志

### 2. 批量处理粘贴
大量文本粘贴时，考虑分批发送

### 3. 优化数据传输
使用Buffer而不是字符串可以提高性能

## 兼容性说明

### 支持的终端类型
- xterm-256color（推荐）
- xterm
- vt100
- linux

### 支持的编辑器
- vim/vi
- nano
- emacs
- less/more

### 支持的Shell
- bash
- zsh
- sh
- fish

## 后续改进方向

1. **自适应终端类型检测**：根据服务器支持自动选择最佳TERM
2. **按键映射自定义**：允许用户自定义按键映射
3. **IME支持增强**：更好地支持中文输入法
4. **剪贴板同步**：支持OSC 52序列实现服务器到客户端的复制
5. **鼠标支持**：支持终端鼠标模式（如vim中的鼠标操作）

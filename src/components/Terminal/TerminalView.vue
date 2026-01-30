<template>
  <div ref="terminalContainer" class="terminal-container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import { getTheme } from '@/utils/terminal-themes'
import { terminalManager } from '@/utils/terminal-manager'
import { useAIStore } from '@/stores/ai'
import { ElMessage } from 'element-plus'
import 'xterm/css/xterm.css'

interface TerminalOptions {
  theme?: any
  fontSize?: number
  fontFamily?: string
  cursorStyle?: 'block' | 'underline' | 'bar'
  cursorBlink?: boolean
  scrollback?: number
  rendererType?: 'dom' | 'canvas' | 'webgl'
}

interface Props {
  connectionId: string
  sessionName?: string
  options?: TerminalOptions
}

const props = withDefaults(defineProps<Props>(), {
  sessionName: 'Unknown Session',
  options: () => ({
    fontSize: 14,
    fontFamily: 'Consolas, "Courier New", monospace',
    cursorStyle: 'block',
    cursorBlink: true,
    scrollback: 10000,
    rendererType: 'webgl'
  })
})

const emit = defineEmits<{
  data: [data: string]
  resize: [cols: number, rows: number]
  input: [input: string]
  cursorPosition: [position: { x: number; y: number }]
  'ai-request': [text: string]
}>()

const aiStore = useAIStore()

// 计算属性：检查是否有默认模型
const hasDefaultModel = computed(() => aiStore.hasDefaultModel)

const terminalContainer = ref<HTMLElement>()
let terminal: Terminal | null = null
let fitAddon: FitAddon | null = null
let searchAddon: any = null
let resizeObserver: ResizeObserver | null = null
let currentLineBuffer = '' // 当前行的输入缓冲
let currentCommand = ''
let commandStartTime: number | null = null

onMounted(() => {
  if (!terminalContainer.value) return

  // 加载 AI 配置
  aiStore.loadConfig().catch(err => {
    console.error('Failed to load AI config:', err)
  })

  const theme = typeof props.options.theme === 'string'
    ? getTheme(props.options.theme)
    : (props.options.theme || getTheme('dark'))

  // 使用全局管理器获取或创建终端实例
  const instance = terminalManager.getOrCreate(
    props.connectionId,
    terminalContainer.value,
    {
      ...props.options,
      theme
    }
  )

  terminal = instance.terminal
  fitAddon = instance.fitAddon
  searchAddon = instance.searchAddon

  // 这里的事件监听是累加的，所以必须放在 handlersRegistered 检查内
  // 只在第一次创建时注册事件处理器
  if (!instance.handlersRegistered) {
    instance.handlersRegistered = true
    console.log(`[TerminalView] Registering event handlers for ${props.connectionId}`)

    // Handle terminal input
    terminal.onData((data) => {
      // 更新当前行缓冲（用于自动补全）
      if (data === '\r' || data === '\n') {
        // 回车键 - 命令执行
        if (currentCommand.trim()) {
          commandStartTime = Date.now()
          // 记录命令到历史
          recordCommand(currentCommand.trim())
        }
        currentCommand = ''
        currentLineBuffer = ''
      } else if (data === '\x7F' || data === '\b') {
        // 退格键
        currentCommand = currentCommand.slice(0, -1)
        currentLineBuffer = currentLineBuffer.slice(0, -1)
      } else if (data === '\x03') {
        // Ctrl+C - 取消命令
        currentCommand = ''
        currentLineBuffer = ''
        commandStartTime = null
      } else if (data === '\x15') {
        // Ctrl+U - 清除整行
        currentCommand = ''
        currentLineBuffer = ''
      } else if (data.charCodeAt(0) >= 32 && data.charCodeAt(0) < 127) {
        // 可打印字符
        currentCommand += data
        currentLineBuffer += data
      }
      
      // 发射输入事件（用于自动补全）
      if (currentLineBuffer) {
        emit('input', currentLineBuffer)
        
        // 发射光标位置（用于定位补全弹窗）
        if (terminal && terminalContainer.value) {
          const cursorX = terminal.buffer.active.cursorX
          const cursorY = terminal.buffer.active.cursorY
          const rect = terminalContainer.value.getBoundingClientRect()
          
          const charWidth = 9 
          const lineHeight = 20
          
          emit('cursorPosition', {
            x: rect.left + cursorX * charWidth,
            y: rect.top + cursorY * lineHeight
          })
        }
      }
      
      emit('data', data)
      window.electronAPI.ssh.write(props.connectionId, data)
      
      try {
        const bytesOut = new Blob([data]).size
        window.electronAPI.connectionStats?.updateTraffic?.(props.connectionId, 0, bytesOut)
      } catch (error) {
        // 忽略统计错误
      }
    })

    // Handle terminal resize
    terminal.onResize(({ cols, rows }) => {
      emit('resize', cols, rows)
      window.electronAPI.ssh.resize(props.connectionId, cols, rows)
    })
  }

  // Right-click context menu for copy/paste and AI features
  if (terminalContainer.value) {
    terminalContainer.value.addEventListener('contextmenu', async (e) => {
      e.preventDefault()
      const selection = terminal?.getSelection()
      
      // Show context menu via Electron
      const menuItems = []
      
      // 基础操作
      if (selection) {
        menuItems.push({
          label: '复制',
          accelerator: 'Ctrl+Shift+C',
          action: 'copy'
        })
      }
      
      menuItems.push({
        label: '粘贴',
        accelerator: 'Ctrl+Shift+V',
        action: 'paste'
      })
      
      menuItems.push({ type: 'separator' })
      
      menuItems.push({
        label: '全选',
        accelerator: 'Ctrl+Shift+A',
        action: 'selectAll'
      })
      
      menuItems.push({
        label: '清屏',
        accelerator: 'Ctrl+L',
        action: 'clear'
      })
      
      // AI 功能菜单
      menuItems.push({ type: 'separator' })
      
      const aiEnabled = hasDefaultModel.value
      const aiLabel = aiEnabled ? 'AI 助手' : 'AI 助手 (未配置)'
      
      menuItems.push({
        label: aiLabel,
        enabled: aiEnabled,
        submenu: [
          {
            label: 'AI 撰写代码',
            action: 'ai-write',
            enabled: aiEnabled
          },
          {
            label: selection ? 'AI 解释代码' : 'AI 解释代码 (需要选中代码)',
            action: 'ai-explain',
            enabled: aiEnabled && !!selection
          },
          {
            label: selection ? 'AI 优化代码' : 'AI 优化代码 (需要选中代码)',
            action: 'ai-optimize',
            enabled: aiEnabled && !!selection
          }
        ]
      })
      
      // Request context menu from main process
      const result = await window.electronAPI.dialog.showContextMenu(menuItems)
      
      // 处理基础操作
      if (result === 'copy' && selection) {
        await navigator.clipboard.writeText(selection)
      } else if (result === 'paste') {
        const text = await navigator.clipboard.readText()
        if (text) {
          window.electronAPI.ssh.write(props.connectionId, text)
          recordPastedCommands(text)
        }
      } else if (result === 'selectAll') {
        terminal?.selectAll()
      } else if (result === 'clear') {
        terminal?.clear()
      }
      // 处理 AI 操作
      else if (result === 'ai-write') {
        await handleAIWrite(selection || '')
      } else if (result === 'ai-explain') {
        if (selection) {
          await handleAIExplain(selection)
        }
      } else if (result === 'ai-optimize') {
        if (selection) {
          await handleAIOptimize(selection)
        }
      }
    })
  }

  // Setup resize observer
  resizeObserver = new ResizeObserver((entries) => {
    if (!fitAddon || !terminal || !terminalContainer.value) return
    
    for (const entry of entries) {
        const { width, height } = entry.contentRect
        if (width <= 0 || height <= 0) return
    }

    requestAnimationFrame(() => {
        try {
            fitAddon?.fit()
        } catch (e) {
            console.error('Fit error:', e)
        }
    })
  })
  
  if (terminalContainer.value) {
    resizeObserver.observe(terminalContainer.value)
  }

  setTimeout(() => {
    try {
        console.log(`[TerminalView] Delayed initial fit for ${props.connectionId}`)
        fitAddon?.fit()
        terminal?.focus() // 自动聚焦
    } catch (e) {
        console.error('Initial fit error:', e)
    }
  }, 300)
})

onUnmounted(() => {
  console.log(`[TerminalView] Unmounting terminal view for ${props.connectionId}`)
  
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  
  terminal = null
  fitAddon = null
  searchAddon = null
  
  console.log(`[TerminalView] Unmount completed for ${props.connectionId}`)
})

// 记录命令到历史
const recordCommand = async (command: string) => {
  try {
    const duration = commandStartTime ? Date.now() - commandStartTime : undefined
    
    await window.electronAPI.commandHistory?.add?.({
      command,
      sessionId: props.connectionId,
      sessionName: props.sessionName || 'Unknown Session',
      duration
    })
    
    try {
      await window.electronAPI.connectionStats?.incrementCommand?.(props.connectionId)
    } catch (error) {
      // 忽略统计错误
    }
  } catch (error) {
    console.error('Failed to record command:', error)
  }
}

// 记录粘贴的命令到历史
const recordPastedCommands = async (text: string) => {
  try {
    // 按换行符分割命令
    const lines = text.split(/\r?\n/)
    
    for (const line of lines) {
      const command = line.trim()
      
      // 只记录非空命令
      if (command) {
        await window.electronAPI.commandHistory?.add?.({
          command,
          sessionId: props.connectionId,
          sessionName: props.sessionName || 'Unknown Session',
          duration: undefined 
        })
      }
    }
  } catch (error) {
    console.error('Failed to record pasted commands:', error)
  }
}

// AI 操作处理函数
const handleAIWrite = async (description: string) => {
  if (!hasDefaultModel.value) {
    ElMessage.warning('请先在设置中配置 AI 默认模型')
    return
  }

  if (!description) {
    ElMessage.warning('请输入描述')
    return
  }

  emit('ai-request', `请根据以下描述编写代码。代码应遵循最佳实践，包含必要的注释，并处理可能的异常情况：\n\n需求描述：${description}`)
}

const handleAIExplain = async (code: string) => {
  if (!hasDefaultModel.value) {
    ElMessage.warning('请先在设置中配置 AI 默认模型')
    return
  }

  if (!code) {
    ElMessage.warning('请先选中要解释的代码')
    return
  }

  emit('ai-request', `请作为一名资深开发人员，详细分析并解释以下代码片段。请涵盖以下几点：\n1. 代码的主要功能和目的。\n2. 逐行或逐块解释关键逻辑。\n3. 指出可能存在的潜在错误、安全风险或边界情况。\n\n代码内容：\n${code}`)
}

const handleAIOptimize = async (code: string) => {
  if (!hasDefaultModel.value) {
    ElMessage.warning('请先在设置中配置 AI 默认模型')
    return
  }

  if (!code) {
    ElMessage.warning('请先选中要优化的代码')
    return
  }

  emit('ai-request', `请作为一名资深开发人员，审查并优化以下代码片段。优化目标包括性能提升、可读性增强、安全性加固及遵循遵循最佳实践。请提供优化后的代码并说明改进点：\n\n原始代码：\n${code}`)
}

// Watch for option changes
watch(
  () => props.options,
  (newOptions) => {
    if (!terminal) return

    if (newOptions.fontSize) {
      terminal.options.fontSize = newOptions.fontSize
    }
    if (newOptions.fontFamily) {
      terminal.options.fontFamily = newOptions.fontFamily
    }
    if (newOptions.cursorStyle) {
      terminal.options.cursorStyle = newOptions.cursorStyle
    }
    if (newOptions.cursorBlink !== undefined) {
      terminal.options.cursorBlink = newOptions.cursorBlink
    }
    if (newOptions.theme) {
      terminal.options.theme = typeof newOptions.theme === 'string'
        ? getTheme(newOptions.theme)
        : newOptions.theme
    }

    // Refit after options change
    if (fitAddon) {
      fitAddon.fit()
    }
  },
  { deep: true }
)

// Expose methods for parent components
defineExpose({
  write: (data: string) => {
    if (terminal) {
      terminal.write(data)
    }
  },
  clear: () => {
    if (terminal) {
      terminal.clear()
    }
  },
  focus: () => {
    if (terminal) {
      terminal.focus()
    }
  },
  // 更新当前命令缓冲（用于自动补全后同步状态）
  updateCommandBuffer: (newCommand: string) => {
    currentCommand = newCommand
    currentLineBuffer = newCommand
  },
  // 获取当前命令
  getCurrentCommand: () => {
    return currentCommand
  },
  search: (term: string, options?: { caseSensitive?: boolean; regex?: boolean }) => {
    console.log(`[TerminalView] Searching for: "${term}"`, options)
    if (searchAddon) {
      try {
        // 清除之前的搜索高亮
        searchAddon.clearDecorations()
        
        if (!term) return

        // 从头开始搜索
        const found = searchAddon.findNext(term, {
            caseSensitive: options?.caseSensitive,
            regex: options?.regex,
            incremental: false
        })
        console.log(`[TerminalView] Search result found: ${found}`)
      } catch (e) {
        console.error('[TerminalView] Search error:', e)
      }
    } else {
        console.warn('[TerminalView] SearchAddon not initialized')
    }
  },
  findNext: (term: string, options?: { caseSensitive?: boolean; regex?: boolean }) => {
    if (searchAddon) {
      searchAddon.findNext(term, {
        caseSensitive: options?.caseSensitive,
        regex: options?.regex
      })
    }
  },
  findPrevious: (term: string, options?: { caseSensitive?: boolean; regex?: boolean }) => {
    if (searchAddon) {
      searchAddon.findPrevious(term, {
        caseSensitive: options?.caseSensitive,
        regex: options?.regex
      })
    }
  },
  fit: () => {
    if (fitAddon) {
      fitAddon.fit()
    }
  }
})
</script>

<style scoped>
.terminal-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.terminal-container :deep(.xterm) {
  height: 100%;
  padding: 8px;
}

.terminal-container :deep(.xterm-viewport) {
  overflow-y: auto;
}

/* 搜索高亮样式 */
.terminal-container :deep(.xterm-search-result) {
  background-color: rgba(255, 255, 0, 0.8) !important;
  color: #000 !important;
  border-bottom: 2px solid yellow !important;
}

.terminal-container :deep(.xterm-search-result-active) {
  background-color: rgba(255, 140, 0, 1) !important;
  color: #fff !important;
  border: 2px solid red !important;
  font-weight: bold;
}
</style>

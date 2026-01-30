<template>
  <div class="terminal-ai-panel">
    <div class="chat-header">
      <div class="header-left">
        <span class="title">终端 AI 助手</span>
        <span class="session-badge" v-if="sessionName">{{ sessionName }}</span>
        <span class="model-badge" v-if="currentModel">{{ currentModel.displayName }}</span>
      </div>
      <div class="header-actions">
        <el-tooltip content="清空对话" placement="bottom">
          <el-button link :icon="Delete" @click="handleClear" />
        </el-tooltip>
        <el-button link :icon="Close" @click="$emit('close')" />
      </div>
    </div>

    <div class="chat-messages" ref="scrollContainer">
      <template v-if="messages.length > 0">
        <div 
          v-for="msg in messages" 
          :key="msg.id" 
          class="message-item"
          :class="msg.role"
        >
          <div class="message-avatar">
            <el-icon v-if="msg.role === 'user'"><User /></el-icon>
            <el-icon v-else><ChatDotRound /></el-icon>
          </div>
          <div class="message-content-wrapper">
            <div class="message-meta">
              <span class="time">{{ formatTime(msg.timestamp) }}</span>
              <span v-if="msg.role === 'assistant' && msg.modelId" class="model-tag">{{ msg.modelId }}</span>
            </div>
            <div class="message-bubble">
              <div 
                class="markdown-body" 
                v-html="renderMarkdown(msg.content)"
              ></div>
              <div v-if="msg.status === 'error'" class="error-hint">
                <el-icon><Warning /></el-icon>
                <span>{{ msg.error }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>
      
      <div v-if="isLoading" class="message-item assistant loading">
        <div class="message-avatar">
          <el-icon><ChatDotRound /></el-icon>
        </div>
        <div class="message-bubble">
          <div class="typing-indicator">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>
      
      <div v-if="messages.length === 0" class="empty-state">
        <el-icon :size="48"><ChatDotRound /></el-icon>
        <p>终端专属 AI 助手</p>
        <p class="hint">针对当前终端会话的智能助手</p>
        <div class="quick-actions">
          <el-button size="small" @click="setInput('帮我检查系统状态')">检查系统</el-button>
          <el-button size="small" @click="setInput('帮我写一个部署脚本')">编写脚本</el-button>
        </div>
      </div>
    </div>

    <div class="chat-footer">
      <div class="input-wrapper">
        <el-input
          v-model="inputValue"
          type="textarea"
          :rows="3"
          placeholder="输入你的问题... (Shift+Enter 换行)"
          @keydown.enter.exact.prevent="sendMessage"
          resize="none"
        />
        <div class="footer-actions">
          <el-button type="primary" size="small" :loading="isLoading" @click="sendMessage">
            发送
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch, onMounted, onUnmounted } from 'vue'
import { useAIStore } from '@/stores/ai'
import { marked } from 'marked'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Delete, Close, User, Warning, 
  ChatDotRound
} from '@element-plus/icons-vue'
import { v4 as uuidv4 } from 'uuid'

interface Props {
  connectionId: string
  sessionName?: string
  storageId?: string // 用于存储历史记录的 ID (通常是 session.id)
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  modelId?: string
  status: 'success' | 'error'
  error?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
}>()

const aiStore = useAIStore()

const messages = ref<ChatMessage[]>([])
const inputValue = ref('')
const isLoading = ref(false)
const isHistoryReady = ref(false)
const scrollContainer = ref<HTMLElement>()



const currentModel = computed(() => aiStore.defaultModel)

// 格式化时间
const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

// 渲染 Markdown
const renderMarkdown = (content: string) => {
  try {
    let html = marked.parse(content) as string
    // 为代码块添加按钮
    html = html.replace(
      /<pre><code(.*?)>([\s\S]*?)<\/code><\/pre>/g,
      (_match, attrs, code) => {
        const escapedCode = code.replace(/"/g, '&quot;')
        return `<div class="code-block-wrapper">
          <div class="code-toolbar">
            <button class="code-btn copy-btn" data-code="${escapedCode}">复制</button>
            <button class="code-btn insert-btn" data-code="${escapedCode}">插入终端</button>
          </div>
          <pre><code${attrs}>${code}</code></pre>
        </div>`
      }
    )
    return html
  } catch (e) {
    return content
  }
}

// 处理代码块按钮点击
const handleCodeBlockClick = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (target.classList.contains('copy-btn')) {
    const code = target.getAttribute('data-code') || ''
    const decodedCode = code.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    navigator.clipboard.writeText(decodedCode)
    ElMessage.success('已复制到剪贴板')
  } else if (target.classList.contains('insert-btn')) {
    const code = target.getAttribute('data-code') || ''
    const decodedCode = code.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    // 插入到当前终端
    window.electronAPI?.ssh?.write(props.connectionId, decodedCode)
    ElMessage.success('已插入到终端')
  }
}

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (scrollContainer.value) {
      scrollContainer.value.scrollTop = scrollContainer.value.scrollHeight
    }
  })
}

// 设置输入
const setInput = (text: string) => {
  inputValue.value = text
}

// 加载聊天历史
// 获取有效的存储 ID
const getStorageId = () => props.storageId || props.connectionId

// 加载聊天历史
const loadChatHistory = async () => {
  try {
    const id = getStorageId()
    console.log(`[TerminalAI] Loading history for ID: ${id}`)
    const result = await window.electronAPI.ai?.getTerminalChatHistory(id)
    if (result?.success && result?.data) {
      console.log(`[TerminalAI] Loaded ${result.data.length} messages`)
      messages.value = result.data
      await nextTick()
      scrollToBottom()
    } else {
      console.log('[TerminalAI] No history found or failed to load')
    }
  } catch (error) {
    console.error('Failed to load terminal chat history:', error)
  } finally {
    isHistoryReady.value = true
  }
}

watch(() => props.storageId, (newId) => {
  if (newId) {
    console.log(`[TerminalAI] Storage ID changed to: ${newId}`)
    isHistoryReady.value = false
    loadChatHistory()
  }
})

// 保存聊天历史
// 保存聊天历史
const saveChatHistory = async () => {
  try {
    const id = getStorageId()
    // 必须转为普通对象，通过 IPC 发送 Vue Proxy 对象会导致 "An object could not be cloned" 错误
    const plainMessages = JSON.parse(JSON.stringify(messages.value))
    await window.electronAPI.ai?.saveTerminalChatHistory(id, plainMessages)
  } catch (error) {
    console.error('Failed to save terminal chat history:', error)
  }
}

// 发送消息
const sendMessage = async () => {
  const content = inputValue.value.trim()
  if (!content || isLoading.value) return

  if (!aiStore.hasDefaultModel) {
    ElMessage.warning('请先在设置中配置 AI 模型')
    return
  }

  inputValue.value = ''
  isLoading.value = true

  // 添加用户消息
  const userMsg: ChatMessage = {
    id: uuidv4(),
    role: 'user',
    content,
    timestamp: Date.now(),
    status: 'success'
  }
  messages.value.push(userMsg)
  saveChatHistory()
  scrollToBottom()

  try {
    // 构建上下文：包含终端会话信息
    const contextPrompt = props.sessionName 
      ? `[当前终端会话: ${props.sessionName}]\n\n用户问题: ${content}`
      : content

    // 调用 AI 接口
    const response = await aiStore.sendRequest('chat', contextPrompt)
    
    // 添加 AI 回复
    const aiMsg: ChatMessage = {
      id: uuidv4(),
      role: 'assistant',
      content: response,
      timestamp: Date.now(),
      modelId: currentModel.value?.displayName,
      status: 'success'
    }
    messages.value.push(aiMsg)
  } catch (error: any) {
    const errorMsg: ChatMessage = {
      id: uuidv4(),
      role: 'assistant',
      content: `错误: ${error.message}`,
      timestamp: Date.now(),
      status: 'error',
      error: error.message
    }
    messages.value.push(errorMsg)
  } finally {
    isLoading.value = false
    saveChatHistory()
    scrollToBottom()
  }
}

// 清空对话
const handleClear = async () => {
  try {
    await ElMessageBox.confirm('确定要清空当前终端的对话记录吗？', '确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    messages.value = []
    const id = getStorageId()
    await window.electronAPI.ai?.clearTerminalChatHistory(id)
    ElMessage.success('对话已清空')
  } catch {
    // 用户取消
  }
}

// 监听消息变化滚动到底部
watch(() => messages.value.length, () => {
  scrollToBottom()
})

// 执行特定操作（从外部调用）
const performAction = async (text: string) => {
  // 等待历史记录加载完成，防止覆盖或丢失
  if (!isHistoryReady.value) {
    console.log('[TerminalAI] Waiting for history to load...')
    let checks = 0
    while (!isHistoryReady.value && checks < 50) { // 最多等待 5 秒
      await new Promise(r => setTimeout(r, 100))
      checks++
    }
  }
  
  inputValue.value = text
  await sendMessage()
}

onMounted(() => {
  loadChatHistory()
  document.addEventListener('click', handleCodeBlockClick)
})

onUnmounted(() => {
  document.removeEventListener('click', handleCodeBlockClick)
})

defineExpose({
  performAction,
  setInput
})
</script>

<style scoped>
.terminal-ai-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-secondary);
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title {
  font-weight: 600;
  font-size: 14px;
}

.session-badge {
  font-size: 10px;
  background: var(--success-color);
  color: #fff;
  padding: 2px 6px;
  border-radius: 4px;
}

.model-badge {
  font-size: 10px;
  background: var(--primary-bg-light);
  color: var(--primary-color);
  padding: 2px 6px;
  border-radius: 4px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message-item {
  display: flex;
  gap: 8px;
  max-width: 100%;
  min-width: 0;
}

.message-item.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 12px;
}

.message-content-wrapper {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.message-bubble {
  background: var(--bg-tertiary);
  padding: 10px 12px;
  border-radius: 12px;
  border-top-left-radius: 2px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-primary);
  word-break: break-word;
  overflow-wrap: break-word;
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.user .message-bubble {
  background: var(--primary-color);
  color: #fff;
  border-top-left-radius: 12px;
  border-top-right-radius: 2px;
}

.message-meta {
  display: flex;
  gap: 8px;
  font-size: 10px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.user .message-meta {
  justify-content: flex-end;
}

/* Markdown Styles */
.markdown-body {
  overflow: hidden;
  word-break: break-word;
  overflow-wrap: break-word;
}

.markdown-body :deep(pre) {
  background: var(--bg-primary);
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 8px 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.markdown-body :deep(code) {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
}

.markdown-body :deep(p) {
  margin: 0 0 8px 0;
  word-break: break-word;
}

.markdown-body :deep(p:last-child) {
  margin-bottom: 0;
}

.markdown-body :deep(.code-block-wrapper) {
  position: relative;
  margin: 8px 0;
}

.markdown-body :deep(.code-toolbar) {
  display: flex;
  gap: 4px;
  margin-bottom: 4px;
}

.markdown-body :deep(.code-btn) {
  padding: 2px 8px;
  font-size: 11px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.markdown-body :deep(.code-btn:hover) {
  background: var(--primary-color);
  color: #fff;
  border-color: var(--primary-color);
}

.error-hint {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  color: var(--danger-color);
  font-size: 12px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: var(--text-secondary);
  text-align: center;
  padding: 40px;
}

.empty-state p {
  margin: 12px 0 4px;
}

.empty-state .hint {
  font-size: 12px;
  opacity: 0.7;
  margin: 0 0 16px;
}

.quick-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.chat-footer {
  padding: 12px;
  background: var(--bg-primary);
  border-top: 1px solid var(--border-color);
}

.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.footer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 4px 0;
}

.typing-indicator span {
  width: 6px;
  height: 6px;
  background: var(--text-secondary);
  border-radius: 50%;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(1) { animation-delay: 0s; }
.typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
.typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
  40% { transform: scale(1); opacity: 1; }
}
</style>

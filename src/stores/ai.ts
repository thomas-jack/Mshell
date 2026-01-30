/**
 * AI Store
 * 管理 AI 渠道、模型和配置的状态
 */

import { defineStore } from 'pinia'
import type { AIChannel, AIModel, AIConfig, AIAction, AIChatMessage } from '@/types/ai'
import { v4 as uuidv4 } from 'uuid'

interface AIState {
  channels: AIChannel[]
  models: AIModel[]
  config: AIConfig
  loading: boolean
  error: string | null

  // 聊天状态
  messages: AIChatMessage[]
  chatLoading: boolean
}

export const useAIStore = defineStore('ai', {
  state: (): AIState => ({
    channels: [],
    models: [],
    config: {
      temperature: 0.7,
      maxTokens: 4000,
      timeout: 60000
    },
    loading: false,
    error: null,

    messages: [],
    chatLoading: false
  }),

  getters: {
    /**
     * 获取默认模型
     */
    defaultModel: (state): AIModel | null => {
      if (!state.config.defaultModelId) return null
      return state.models.find(m => m.id === state.config.defaultModelId) || null
    },

    /**
     * 获取启用的渠道
     */
    enabledChannels: (state): AIChannel[] => {
      return state.channels.filter(c => c.enabled)
    },

    /**
     * 根据渠道 ID 获取模型
     */
    modelsByChannel: (state) => (channelId: string): AIModel[] => {
      return state.models.filter(m => m.channelId === channelId)
    },

    /**
     * 是否有默认模型
     */
    hasDefaultModel: (state): boolean => {
      return !!state.config.defaultModelId &&
        !!state.models.find(m => m.id === state.config.defaultModelId)
    },

    /**
     * 获取渠道的显示名称
     */
    getChannelName: (state) => (channelId: string): string => {
      const channel = state.channels.find(c => c.id === channelId)
      return channel?.name || 'Unknown Channel'
    }
  },

  actions: {
    /**
     * 加载所有渠道
     */
    async loadChannels() {
      this.loading = true
      this.error = null
      try {
        const result = await window.electronAPI.ai?.getAllChannels()
        if (result?.success) {
          this.channels = result.data || []
        } else {
          this.error = result?.error || '加载渠道失败'
        }
      } catch (error: any) {
        this.error = error.message || '加载渠道失败'
        console.error('Failed to load channels:', error)
      } finally {
        this.loading = false
      }
    },

    /**
     * 加载所有模型
     */
    async loadModels() {
      this.loading = true
      this.error = null
      try {
        const result = await window.electronAPI.ai?.getAllModels()
        if (result?.success) {
          this.models = result.data || []
        } else {
          this.error = result?.error || '加载模型失败'
        }
      } catch (error: any) {
        this.error = error.message || '加载模型失败'
        console.error('Failed to load models:', error)
      } finally {
        this.loading = false
      }
    },

    /**
     * 加载配置
     */
    async loadConfig() {
      this.error = null
      try {
        const result = await window.electronAPI.ai?.getConfig()
        if (result?.success) {
          this.config = result.data || this.config
        } else {
          this.error = result?.error || '加载配置失败'
        }
      } catch (error: any) {
        this.error = error.message || '加载配置失败'
        console.error('Failed to load config:', error)
      }
    },

    /**
     * 加载所有数据
     */
    async loadAll() {
      await Promise.all([
        this.loadChannels(),
        this.loadModels(),
        this.loadConfig()
      ])
    },

    /**
     * 添加渠道
     */
    async addChannel(data: Omit<AIChannel, 'id' | 'createdAt' | 'updatedAt'>) {
      this.loading = true
      this.error = null
      try {
        const result = await window.electronAPI.ai?.addChannel(data)
        if (result?.success && result.data) {
          this.channels.push(result.data)
          return result.data
        } else {
          this.error = result?.error || '添加渠道失败'
          throw new Error(this.error)
        }
      } catch (error: any) {
        this.error = error.message || '添加渠道失败'
        console.error('Failed to add channel:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * 更新渠道
     */
    async updateChannel(id: string, updates: Partial<AIChannel>) {
      this.loading = true
      this.error = null
      try {
        const result = await window.electronAPI.ai?.updateChannel(id, updates)
        if (result?.success) {
          const index = this.channels.findIndex(c => c.id === id)
          if (index !== -1) {
            this.channels[index] = { ...this.channels[index], ...updates }
          }
        } else {
          this.error = result?.error || '更新渠道失败'
          throw new Error(this.error)
        }
      } catch (error: any) {
        this.error = error.message || '更新渠道失败'
        console.error('Failed to update channel:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * 删除渠道
     */
    async deleteChannel(id: string) {
      this.loading = true
      this.error = null
      try {
        const result = await window.electronAPI.ai?.deleteChannel(id)
        if (result?.success) {
          this.channels = this.channels.filter(c => c.id !== id)
          this.models = this.models.filter(m => m.channelId !== id)
        } else {
          this.error = result?.error || '删除渠道失败'
          throw new Error(this.error)
        }
      } catch (error: any) {
        this.error = error.message || '删除渠道失败'
        console.error('Failed to delete channel:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * 验证渠道
     */
    async verifyChannel(id: string): Promise<boolean> {
      this.loading = true
      this.error = null
      try {
        const result = await window.electronAPI.ai?.verifyChannel(id)
        if (result?.success) {
          return result.data || false
        } else {
          this.error = result?.error || '验证渠道失败'
          return false
        }
      } catch (error: any) {
        this.error = error.message || '验证渠道失败'
        console.error('Failed to verify channel:', error)
        return false
      } finally {
        this.loading = false
      }
    },

    /**
     * 获取模型列表
     */
    async fetchModels(channelId: string) {
      this.loading = true
      this.error = null
      try {
        const result = await window.electronAPI.ai?.fetchModels(channelId)
        if (result?.success && result.data) {
          // 更新或添加模型
          for (const model of result.data) {
            const index = this.models.findIndex(m => m.id === model.id)
            if (index !== -1) {
              this.models[index] = model
            } else {
              this.models.push(model)
            }
          }
          return result.data
        } else {
          this.error = result?.error || '获取模型失败'
          throw new Error(this.error)
        }
      } catch (error: any) {
        this.error = error.message || '获取模型失败'
        console.error('Failed to fetch models:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * 添加模型
     */
    async addModel(data: Omit<AIModel, 'id' | 'createdAt'>) {
      this.loading = true
      this.error = null
      try {
        const result = await window.electronAPI.ai?.addModel(data)
        if (result?.success && result.data) {
          this.models.push(result.data)
          return result.data
        } else {
          this.error = result?.error || '添加模型失败'
          throw new Error(this.error)
        }
      } catch (error: any) {
        this.error = error.message || '添加模型失败'
        console.error('Failed to add model:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * 删除模型
     */
    async deleteModel(id: string) {
      this.loading = true
      this.error = null
      try {
        const result = await window.electronAPI.ai?.deleteModel(id)
        if (result?.success) {
          this.models = this.models.filter(m => m.id !== id)
        } else {
          this.error = result?.error || '删除模型失败'
          throw new Error(this.error)
        }
      } catch (error: any) {
        this.error = error.message || '删除模型失败'
        console.error('Failed to delete model:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * 设置默认模型
     */
    async setDefaultModel(modelId: string) {
      this.loading = true
      this.error = null
      try {
        const result = await window.electronAPI.ai?.setDefaultModel(modelId)
        if (result?.success) {
          this.config.defaultModelId = modelId
        } else {
          this.error = result?.error || '设置默认模型失败'
          throw new Error(this.error)
        }
      } catch (error: any) {
        this.error = error.message || '设置默认模型失败'
        console.error('Failed to set default model:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * 发送 AI 请求
     */
    async sendRequest(action: AIAction, content: string, language?: string): Promise<string> {
      this.error = null
      try {
        const result = await window.electronAPI.ai?.request(action, content, language)
        if (result?.success && result.data) {
          return result.data
        } else {
          this.error = result?.error || 'AI 请求失败'
          throw new Error(this.error)
        }
      } catch (error: any) {
        this.error = error.message || 'AI 请求失败'
        console.error('Failed to send AI request:', error)
        throw error
      }
    },

    /**
     * 更新配置
     */
    async updateConfig(updates: Partial<AIConfig>) {
      this.loading = true
      this.error = null
      try {
        // 将 Proxy 对象转换为普通对象，避免 IPC 传递时的克隆错误
        const plainUpdates = JSON.parse(JSON.stringify(updates))

        const result = await window.electronAPI.ai?.updateConfig(plainUpdates)
        if (result?.success) {
          this.config = { ...this.config, ...updates }
        } else {
          this.error = result?.error || '更新配置失败'
          throw new Error(this.error)
        }
      } catch (error: any) {
        this.error = error.message || '更新配置失败'
        console.error('Failed to update config:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * 清除错误
     */
    clearError() {
      this.error = null
    },

    // ==================== 聊天管理 ====================

    /**
     * 加载聊天记录
     */
    async loadChatHistory() {
      try {
        const result = await window.electronAPI?.ai?.getChatHistory?.()
        if (result?.success && result.data) {
          this.messages = result.data
        }
      } catch (error) {
        console.error('Failed to load chat history:', error)
      }
    },

    /**
     * 保存聊天记录
     */
    async saveChatHistory() {
      try {
        // 修复: 转换为普通对象以避免 Electron IPC 克隆错误
        const plainMessages = JSON.parse(JSON.stringify(this.messages))
        await window.electronAPI?.ai?.saveChatHistory?.(plainMessages)
      } catch (error) {
        console.error('Failed to save chat history:', error)
      }
    },

    /**
     * 发送聊天消息
     */
    async sendChatMessage(content: string) {
      if (!this.hasDefaultModel) {
        throw new Error('请先配置默认模型')
      }

      this.chatLoading = true

      // 添加用户消息
      const userMsg: AIChatMessage = {
        id: uuidv4(),
        role: 'user',
        content,
        timestamp: Date.now(),
        status: 'success'
      }
      this.messages.push(userMsg)
      await this.saveChatHistory()

      try {
        // 调用 AI 接口 (这里的 request action 复用，虽然它目前设计的是单次任务)
        // 注意：目前的 request 方法不支持上下文对话 (`messages` array)，只支持 single text prompt。
        // 为了支持上下文，我们需要修改 request 接口或者在这里拼接 prompt。
        // 暂时简单拼接上下文：

        // 调用接口
        const responseContent = await this.sendRequest('chat', content)
        // 或者是 'write', 'optimize'。其实 action 只是影响 System Prompt。
        // 对于通用聊天，我们可以加一个 'chat' action 或者复用 'explain' (它通常比较通用)。
        // 既然要做通用聊天，最好加一个 'chat' action 到后端。
        // 但现在后端只支持 write/explain/optimize。
        // 暂时用 'explain'，因为它通常返回解释性文本。

        // 添加 AI 回复
        const aiMsg: AIChatMessage = {
          id: uuidv4(),
          role: 'assistant',
          content: responseContent,
          timestamp: Date.now(),
          modelId: this.config.defaultModelId,
          status: 'success'
        }
        this.messages.push(aiMsg)

      } catch (error: any) {
        // 添加错误消息或标记上一条消息失败？
        // 这里添加一个系统/错误消息，或者直接把错误显示在 UI 上
        const errorMsg: AIChatMessage = {
          id: uuidv4(),
          role: 'assistant',
          content: `错误: ${error.message}`,
          timestamp: Date.now(),
          status: 'error',
          error: error.message
        }
        this.messages.push(errorMsg)
        throw error
      } finally {
        this.chatLoading = false
        await this.saveChatHistory()
      }
    },

    /**
     * 清空消息
     */
    async clearMessages() {
      this.messages = []
      try {
        await window.electronAPI?.ai?.clearChatHistory?.()
      } catch (error) {
        console.error('Failed to clear chat history:', error)
      }
    }
  }
})

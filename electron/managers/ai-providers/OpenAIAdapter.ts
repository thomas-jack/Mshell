/**
 * OpenAI Provider Adapter
 */

import OpenAI from 'openai'
import type { AIProviderAdapter, AIRequestParams, AIModel } from '../../../src/types/ai'

export class OpenAIAdapter implements AIProviderAdapter {
  private clients: Map<string, OpenAI> = new Map()
  private abortControllers: Map<string, AbortController> = new Map()

  /**
   * 获取或创建 OpenAI 客户端
   */
  private getClient(apiKey: string): OpenAI {
    if (!this.clients.has(apiKey)) {
      this.clients.set(apiKey, new OpenAI({ apiKey }))
    }
    return this.clients.get(apiKey)!
  }

  /**
   * 验证 API Key
   */
  async verifyApiKey(apiKey: string): Promise<boolean> {
    try {
      const client = this.getClient(apiKey)
      // 调用 models.list() 验证 API Key
      await client.models.list()
      return true
    } catch (error: any) {
      console.error('[OpenAIAdapter] API Key verification failed:', error.message)
      return false
    }
  }

  /**
   * 获取模型列表
   */
  async fetchModels(apiKey: string): Promise<AIModel[]> {
    try {
      const client = this.getClient(apiKey)
      const response = await client.models.list()

      const models: AIModel[] = []

      for (const model of response.data) {
        // 不进行过滤，返回所有模型
        models.push({
          id: `openai-${model.id}`,
          modelId: model.id,
          displayName: this.getDisplayName(model.id),
          channelId: '', // 将在 AIManager 中设置
          contextWindow: this.getContextWindow(model.id),
          type: 'auto',
          createdAt: new Date()
        })
      }

      return models
    } catch (error: any) {
      console.error('[OpenAIAdapter] Failed to fetch models:', error.message)
      throw new Error(`获取模型列表失败: ${error.message}`)
    }
  }

  /**
   * 发送请求
   */
  async sendRequest(params: AIRequestParams): Promise<string> {
    const requestId = `openai-${Date.now()}`

    try {
      const client = this.getClient(params.apiKey)
      const abortController = new AbortController()
      this.abortControllers.set(requestId, abortController)

      // 构建请求参数
      const requestParams: any = {
        model: params.modelId,
        messages: [
          {
            role: 'user',
            content: params.prompt
          }
        ]
      }

      // 针对 o1 系列模型的特殊处理
      if (params.modelId.startsWith('o1')) {
        requestParams.max_completion_tokens = params.maxTokens
        requestParams.temperature = 1
      } else {
        requestParams.max_tokens = params.maxTokens
        requestParams.temperature = params.temperature
      }

      const response = await client.chat.completions.create(
        requestParams,
        {
          signal: abortController.signal,
          timeout: params.timeout
        }
      )

      this.abortControllers.delete(requestId)

      const content = response.choices[0]?.message?.content
      if (!content) {
        console.error('[OpenAIAdapter] Empty content. Full response:', JSON.stringify(response, null, 2))
        throw new Error(`AI 返回了空响应。ID: ${response.id}, FinishReason: ${response.choices[0]?.finish_reason}`)
      }

      return content
    } catch (error: any) {
      this.abortControllers.delete(requestId)

      if (error.name === 'AbortError') {
        throw new Error('请求已取消')
      }

      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        throw new Error('请求超时，请检查网络连接')
      }

      if (error.status === 401) {
        throw new Error('API Key 无效，请检查配置')
      }

      if (error.status === 429) {
        throw new Error('请求过于频繁，请稍后再试')
      }

      if (error.status === 400 && error.message.includes('context_length_exceeded')) {
        throw new Error('内容过长，请减少选中的文本')
      }

      console.error('[OpenAIAdapter] Request failed:', error)
      throw new Error(`请求失败: ${error.message}`)
    }
  }

  /**
   * 取消请求
   */
  async cancelRequest(requestId: string): Promise<void> {
    const abortController = this.abortControllers.get(requestId)
    if (abortController) {
      abortController.abort()
      this.abortControllers.delete(requestId)
    }
  }

  /**
   * 获取模型显示名称
   */
  private getDisplayName(modelId: string): string {
    const nameMap: Record<string, string> = {
      'gpt-4': 'GPT-4',
      'gpt-4-turbo': 'GPT-4 Turbo',
      'gpt-4-turbo-preview': 'GPT-4 Turbo Preview',
      'gpt-4-0125-preview': 'GPT-4 Turbo (0125)',
      'gpt-4-1106-preview': 'GPT-4 Turbo (1106)',
      'gpt-3.5-turbo': 'GPT-3.5 Turbo',
      'gpt-3.5-turbo-16k': 'GPT-3.5 Turbo 16K'
    }

    return nameMap[modelId] || modelId
  }

  /**
   * 获取模型上下文窗口大小
   */
  private getContextWindow(modelId: string): number {
    const windowMap: Record<string, number> = {
      'gpt-4': 8192,
      'gpt-4-32k': 32768,
      'gpt-4-turbo': 128000,
      'gpt-4-turbo-preview': 128000,
      'gpt-4-0125-preview': 128000,
      'gpt-4-1106-preview': 128000,
      'gpt-3.5-turbo': 4096,
      'gpt-3.5-turbo-16k': 16384
    }

    return windowMap[modelId] || 4096
  }
}

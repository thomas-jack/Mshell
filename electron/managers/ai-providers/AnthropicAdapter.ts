/**
 * Anthropic Provider Adapter
 */

import Anthropic from '@anthropic-ai/sdk'
import axios from 'axios'
import type { AIProviderAdapter, AIRequestParams, AIModel } from '../../../src/types/ai'

export class AnthropicAdapter implements AIProviderAdapter {
  private clients: Map<string, Anthropic> = new Map()
  private abortControllers: Map<string, AbortController> = new Map()

  /**
   * 获取或创建 Anthropic 客户端
   */
  private getClient(apiKey: string): Anthropic {
    if (!this.clients.has(apiKey)) {
      this.clients.set(apiKey, new Anthropic({ apiKey }))
    }
    return this.clients.get(apiKey)!
  }

  /**
   * 验证 API Key
   */
  async verifyApiKey(apiKey: string): Promise<boolean> {
    try {
      const client = this.getClient(apiKey)
      // 发送一个简单的测试请求
      await client.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 10,
        messages: [
          {
            role: 'user',
            content: 'test'
          }
        ]
      })
      return true
    } catch (error: any) {
      console.error('[AnthropicAdapter] API Key verification failed:', error.message)
      return false
    }
  }

  /**
   * 获取模型列表
   */
  async fetchModels(apiKey: string): Promise<AIModel[]> {
    try {
      // 使用 axios 直接调用 API 获取模型列表
      const response = await axios.get('https://api.anthropic.com/v1/models', {
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        }
      })

      const models: AIModel[] = []

      if (response.data && Array.isArray(response.data.data)) {
        for (const model of response.data.data) {
          models.push({
            id: `anthropic-${model.id}`,
            modelId: model.id,
            displayName: model.display_name || model.id,
            channelId: '', // 将在 AIManager 中设置
            contextWindow: 200000, // API 可能不返回 context window，使用默认值
            type: 'auto',
            createdAt: new Date(model.created_at || Date.now())
          })
        }
      }

      return models
    } catch (error: any) {
      console.error('[AnthropicAdapter] Failed to fetch models:', error.message)
      throw new Error(`获取模型列表失败: ${error.message}`)
    }
  }

  /**
   * 发送请求
   */
  async sendRequest(params: AIRequestParams): Promise<string> {
    const requestId = `anthropic-${Date.now()}`

    try {
      const client = this.getClient(params.apiKey)
      const abortController = new AbortController()
      this.abortControllers.set(requestId, abortController)

      const response = await client.messages.create(
        {
          model: params.modelId,
          max_tokens: params.maxTokens,
          temperature: params.temperature,
          messages: [
            {
              role: 'user',
              content: params.prompt
            }
          ]
        },
        {
          signal: abortController.signal,
          timeout: params.timeout
        }
      )

      this.abortControllers.delete(requestId)

      const content = response.content[0]
      if (content.type !== 'text') {
        throw new Error('AI 返回了非文本响应')
      }

      return content.text
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

      if (error.status === 400 && error.message.includes('max_tokens')) {
        throw new Error('内容过长，请减少选中的文本')
      }

      console.error('[AnthropicAdapter] Request failed:', error)
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
}

/**
 * OpenAI Compatible API Provider Adapter
 * 支持任何兼容 OpenAI API 格式的服务
 */

import axios, { type AxiosInstance } from 'axios'
import type { AIProviderAdapter, AIRequestParams, AIModel } from '../../../src/types/ai'

export class OpenAICompatibleAdapter implements AIProviderAdapter {
  private clients: Map<string, AxiosInstance> = new Map()
  private abortControllers: Map<string, AbortController> = new Map()

  /**
   * 获取或创建 Axios 客户端
   */
  private getClient(apiKey: string, endpoint: string): AxiosInstance {
    const key = `${endpoint}:${apiKey}`

    if (!this.clients.has(key)) {
      this.clients.set(key, axios.create({
        baseURL: endpoint,
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }))
    }

    return this.clients.get(key)!
  }

  /**
   * 验证 API Key
   */
  async verifyApiKey(apiKey: string, endpoint?: string): Promise<boolean> {
    if (!endpoint) {
      throw new Error('OpenAI 兼容 API 需要提供端点地址')
    }

    try {
      const client = this.getClient(apiKey, endpoint)
      // 尝试调用 /v1/models 端点
      await client.get('/v1/models')
      return true
    } catch (error: any) {
      console.error('[OpenAICompatibleAdapter] API Key verification failed:', error.message)
      return false
    }
  }

  /**
   * 获取模型列表
   */
  async fetchModels(apiKey: string, endpoint?: string): Promise<AIModel[]> {
    if (!endpoint) {
      throw new Error('OpenAI 兼容 API 需要提供端点地址')
    }

    try {
      const client = this.getClient(apiKey, endpoint)
      const response = await client.get('/v1/models')

      const models: AIModel[] = []

      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        for (const model of response.data.data) {
          models.push({
            id: `compatible-${model.id}`,
            modelId: model.id,
            displayName: model.id,
            channelId: '', // 将在 AIManager 中设置
            contextWindow: model.context_length || 4096,
            type: 'auto',
            createdAt: new Date()
          })
        }
      }

      return models
    } catch (error: any) {
      console.error('[OpenAICompatibleAdapter] Failed to fetch models:', error.message)
      // 如果获取失败，返回空数组（允许用户手动添加）
      return []
    }
  }

  /**
   * 发送请求
   */
  async sendRequest(params: AIRequestParams): Promise<string> {
    if (!params.endpoint) {
      throw new Error('OpenAI 兼容 API 需要提供端点地址')
    }

    const requestId = `compatible-${Date.now()}`

    try {
      const client = this.getClient(params.apiKey, params.endpoint)
      const abortController = new AbortController()
      this.abortControllers.set(requestId, abortController)

      const response = await client.post(
        '/v1/chat/completions',
        {
          model: params.modelId,
          messages: [
            {
              role: 'user',
              content: params.prompt
            }
          ],
          temperature: params.temperature,
          max_tokens: params.maxTokens
        },
        {
          signal: abortController.signal,
          timeout: params.timeout
        }
      )

      this.abortControllers.delete(requestId)

      const content = response.data?.choices?.[0]?.message?.content
      if (!content) {
        const errorMsg = `AI 返回了空响应。Response: ${JSON.stringify(response.data || {}).substring(0, 200)}...`
        console.error('[OpenAICompatibleAdapter] Empty content. Full response data:', JSON.stringify(response.data, null, 2))
        throw new Error(errorMsg)
      }

      return content
    } catch (error: any) {
      this.abortControllers.delete(requestId)

      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        throw new Error('请求已取消')
      }

      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        throw new Error('请求超时，请检查网络连接')
      }

      if (error.response?.status === 401) {
        throw new Error('API Key 无效，请检查配置')
      }

      if (error.response?.status === 429) {
        throw new Error('请求过于频繁，请稍后再试')
      }

      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.error?.message || error.message
        if (errorMessage.includes('context_length') || errorMessage.includes('token')) {
          throw new Error('内容过长，请减少选中的文本')
        }
        throw new Error(`请求参数错误: ${errorMessage}`)
      }

      if (error.code === 'ECONNREFUSED') {
        throw new Error('无法连接到 API 端点，请检查地址是否正确')
      }

      console.error('[OpenAICompatibleAdapter] Request failed:', error)
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

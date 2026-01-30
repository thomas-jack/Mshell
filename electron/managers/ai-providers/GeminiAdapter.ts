/**
 * Google Gemini Provider Adapter
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import axios from 'axios'
import type { AIProviderAdapter, AIRequestParams, AIModel } from '../../../src/types/ai'

export class GeminiAdapter implements AIProviderAdapter {
  private clients: Map<string, GoogleGenerativeAI> = new Map()
  private abortControllers: Map<string, AbortController> = new Map()

  /**
   * 获取或创建 Gemini 客户端
   */
  private getClient(apiKey: string): GoogleGenerativeAI {
    if (!this.clients.has(apiKey)) {
      this.clients.set(apiKey, new GoogleGenerativeAI(apiKey))
    }
    return this.clients.get(apiKey)!
  }

  /**
   * 验证 API Key
   */
  async verifyApiKey(apiKey: string): Promise<boolean> {
    try {
      const client = this.getClient(apiKey)
      const model = client.getGenerativeModel({ model: 'gemini-pro' })

      // 发送一个简单的测试请求
      const result = await model.generateContent('test')
      const response = await result.response

      // 如果能获取到响应，说明 API Key 有效
      return !!response
    } catch (error: any) {
      console.error('[GeminiAdapter] API Key verification failed:', error.message)
      return false
    }
  }

  /**
   * 获取模型列表
   */
  async fetchModels(apiKey: string): Promise<AIModel[]> {
    try {
      // 使用 axios 直接调用 API 获取模型列表
      const response = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)

      const models: AIModel[] = []

      if (response.data && Array.isArray(response.data.models)) {
        for (const model of response.data.models) {
          // 只保留 Gemini 模型
          if (model.name.includes('gemini') || model.name.includes('vision')) {
            // model.name 格式通常为 "models/gemini-pro"
            const modelId = model.name.replace('models/', '')

            models.push({
              id: `gemini-${modelId}`,
              modelId: modelId,
              displayName: model.displayName || modelId,
              channelId: '', // 将在 AIManager 中设置
              contextWindow: model.inputTokenLimit || 32768,
              type: 'auto',
              createdAt: new Date()
            })
          }
        }
      }

      return models
    } catch (error: any) {
      console.error('[GeminiAdapter] Failed to fetch models:', error.message)
      throw new Error(`获取模型列表失败: ${error.message}`)
    }
  }

  /**
   * 发送请求
   */
  async sendRequest(params: AIRequestParams): Promise<string> {
    const requestId = `gemini-${Date.now()}`

    try {
      const client = this.getClient(params.apiKey)
      const model = client.getGenerativeModel({
        model: params.modelId,
        generationConfig: {
          temperature: params.temperature,
          maxOutputTokens: params.maxTokens
        }
      })

      const abortController = new AbortController()
      this.abortControllers.set(requestId, abortController)

      // 设置超时
      const timeoutId = setTimeout(() => {
        abortController.abort()
      }, params.timeout)

      try {
        const result = await model.generateContent(params.prompt)
        clearTimeout(timeoutId)
        this.abortControllers.delete(requestId)

        const response = await result.response
        const text = response.text()

        if (!text) {
          throw new Error('AI 返回了空响应')
        }

        return text
      } catch (error) {
        clearTimeout(timeoutId)
        throw error
      }
    } catch (error: any) {
      this.abortControllers.delete(requestId)

      if (error.name === 'AbortError') {
        throw new Error('请求已取消')
      }

      if (error.message.includes('timeout')) {
        throw new Error('请求超时，请检查网络连接')
      }

      if (error.message.includes('API_KEY_INVALID') || error.message.includes('401')) {
        throw new Error('API Key 无效，请检查配置')
      }

      if (error.message.includes('RATE_LIMIT_EXCEEDED') || error.message.includes('429')) {
        throw new Error('请求过于频繁，请稍后再试')
      }

      if (error.message.includes('INVALID_ARGUMENT') && error.message.includes('token')) {
        throw new Error('内容过长，请减少选中的文本')
      }

      console.error('[GeminiAdapter] Request failed:', error)
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

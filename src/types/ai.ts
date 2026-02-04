/**
 * AI 类型定义
 */

/**
 * AI 提供商类型
 */
export type AIProviderType = 'openai' | 'anthropic' | 'gemini' | 'openai-compatible'

/**
 * AI 渠道配置
 */
export interface AIChannel {
  id: string
  name: string
  type: AIProviderType
  apiKey: string // 加密存储
  apiEndpoint?: string // OpenAI 兼容 API 的自定义端点
  enabled: boolean
  createdAt: Date
  updatedAt: Date
}

/**
 * AI 模型配置
 */
export interface AIModel {
  id: string
  modelId: string // API 中的模型 ID (如 "gpt-4")
  displayName: string
  channelId: string
  contextWindow: number // 上下文窗口大小
  type: 'auto' | 'manual' // 自动获取或手动添加
  createdAt: Date
}

/**
 * AI 配置
 */
export interface AIConfig {
  defaultModelId?: string
  temperature: number // 0.0 - 2.0
  maxTokens: number // 100 - 8000
  timeout: number // 5000 - 120000 ms
  prompts?: {
    explain?: string
    optimize?: string
    write?: string
  }
}

/**
 * AI 操作类型
 */
export type AIAction = 'write' | 'explain' | 'optimize' | 'chat'

/**
 * AI 请求状态
 */
export type AIRequestStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'

/**
 * AI 请求
 */
export interface AIRequest {
  id: string
  action: AIAction
  content: string
  language?: string
  modelId: string
  status: AIRequestStatus
  response?: string
  error?: string
  createdAt: Date
  completedAt?: Date
}

/**
 * 缓存条目
 */
export interface CacheEntry {
  key: string // hash(action + content + modelId)
  response: string
  timestamp: Date
}

/**
 * AI Provider Adapter 请求参数
 */
export interface AIRequestParams {
  apiKey: string
  endpoint?: string
  modelId: string
  prompt: string
  temperature: number
  maxTokens: number
  timeout: number
}

/**
 * AI Provider Adapter 接口
 */
export interface AIProviderAdapter {
  /**
   * 验证 API Key
   */
  verifyApiKey(apiKey: string, endpoint?: string): Promise<boolean>

  /**
   * 获取模型列表
   */
  fetchModels(apiKey: string, endpoint?: string): Promise<AIModel[]>

  /**
   * 发送请求
   */
  sendRequest(params: AIRequestParams): Promise<string>

  /**
   * 发送流式请求
   */
  streamRequest?(params: AIRequestParams, onChunk: (chunk: string) => void): Promise<string>

  /**
   * 取消请求
   */
  cancelRequest(requestId: string): Promise<void>
}

/**
 * 语言检测结果
 */
export interface AIChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  modelId?: string
  status?: 'sending' | 'success' | 'error'
  error?: string
}

export interface LanguageDetectionResult {
  language: string
  confidence: number
}

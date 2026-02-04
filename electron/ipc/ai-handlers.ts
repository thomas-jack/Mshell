/**
 * AI IPC Handlers
 * 处理渲染进程的 AI 相关请求
 */

import { type IpcMain } from 'electron'
import type { AIManager } from '../managers/AIManager'

/**
 * 注册 AI IPC 处理器
 */
export function registerAIHandlers(ipc: IpcMain, aiManager: AIManager) {
  // ==================== 渠道管理 ====================

  ipc.handle('ai:addChannel', async (_event, data) => {
    try {
      const channel = await aiManager.addChannel(data)
      return { success: true, data: channel }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipc.handle('ai:updateChannel', async (_event, id: string, updates) => {
    try {
      await aiManager.updateChannel(id, updates)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipc.handle('ai:deleteChannel', async (_event, id: string) => {
    try {
      await aiManager.deleteChannel(id)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipc.handle('ai:verifyChannel', async (_event, id: string) => {
    try {
      const isValid = await aiManager.verifyChannel(id)
      return { success: true, data: isValid }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipc.handle('ai:getAllChannels', async () => {
    try {
      const channels = aiManager.getAllChannels()
      return { success: true, data: channels }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  // ==================== 模型管理 ====================

  ipc.handle('ai:fetchModels', async (_event, channelId: string) => {
    try {
      const models = await aiManager.fetchModels(channelId)
      return { success: true, data: models }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipc.handle('ai:addModel', async (_event, data) => {
    try {
      const model = await aiManager.addModel(data)
      return { success: true, data: model }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipc.handle('ai:deleteModel', async (_event, id: string) => {
    try {
      await aiManager.deleteModel(id)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipc.handle('ai:getAllModels', async () => {
    try {
      const models = aiManager.getAllModels()
      return { success: true, data: models }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipc.handle('ai:setDefaultModel', async (_event, modelId: string) => {
    try {
      await aiManager.setDefaultModel(modelId)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  // ==================== AI 请求 ====================

  ipc.handle('ai:request', async (_event, action: string, content: string, language?: string) => {
    try {
      const response = await aiManager.request(action as any, content, language)
      return { success: true, data: response }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  // 支持指定模型的请求
  ipc.handle('ai:requestWithModel', async (_event, action: string, content: string, modelId: string, language?: string) => {
    try {
      const response = await aiManager.requestWithModel(action as any, content, modelId, language)
      return { success: true, data: response }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipc.handle('ai:cancelRequest', async (_event, requestId: string) => {
    try {
      await aiManager.cancelRequest(requestId)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  // ==================== 配置管理 ====================

  ipc.handle('ai:updateConfig', async (_event, updates) => {
    try {
      await aiManager.updateConfig(updates)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipc.handle('ai:getConfig', async () => {
    try {
      const config = aiManager.getConfig()
      return { success: true, data: config }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })


  // ==================== 聊天历史管理 ====================

  ipc.handle('ai:getChatHistory', async () => {
    try {
      const history = await aiManager.getChatHistory()
      return { success: true, data: history }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipc.handle('ai:saveChatHistory', async (_event, messages: any[]) => {
    try {
      await aiManager.saveChatHistory(messages)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipc.handle('ai:clearChatHistory', async () => {
    try {
      await aiManager.clearChatHistory()
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipc.handle('ai:getTerminalChatHistory', async (_event, connectionId: string) => {
    try {
      const history = await aiManager.getTerminalChatHistory(connectionId)
      return { success: true, data: history }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipc.handle('ai:saveTerminalChatHistory', async (_event, connectionId: string, messages: any[]) => {
    try {
      await aiManager.saveTerminalChatHistory(connectionId, messages)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipc.handle('ai:clearTerminalChatHistory', async (_event, connectionId: string) => {
    try {
      await aiManager.clearTerminalChatHistory(connectionId)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
}

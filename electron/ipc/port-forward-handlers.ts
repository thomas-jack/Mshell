import { ipcMain } from 'electron'
import { portForwardManager } from '../managers/PortForwardManager'
import { sshConnectionManager } from '../managers/SSHConnectionManager'
import { v4 as uuidv4 } from 'uuid'

interface PortForwardConfig {
  type: 'local' | 'remote' | 'dynamic'
  localHost: string
  localPort: number
  remoteHost: string
  remotePort: number
  description?: string
  autoStart?: boolean
}

/**
 * 注册端口转发 IPC 处理器
 */
export function registerPortForwardHandlers() {
  // 获取所有转发
  ipcMain.handle('portForward:getAll', async (_event, connectionId: string) => {
    try {
      const forwards = portForwardManager.getAllForwards()
      return { success: true, forwards }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  // 添加转发
  ipcMain.handle(
    'portForward:add',
    async (_event, connectionId: string, config: PortForwardConfig) => {
      try {
        const connection = sshConnectionManager.getConnection(connectionId)
        if (!connection) {
          return { success: false, error: 'Connection not found' }
        }

        const id = uuidv4()

        // 不自动启动，只添加配置
        const forward = {
          id,
          type: config.type,
          localHost: config.localHost,
          localPort: config.localPort,
          remoteHost: config.remoteHost,
          remotePort: config.remotePort,
          status: 'inactive' as const,
          description: config.description
        }

        // 存储转发配置（这里简化处理，实际应该持久化）
        portForwardManager['forwards'].set(id, forward)

        return { success: true, id }
      } catch (error: any) {
        return { success: false, error: error.message }
      }
    }
  )

  // 启动转发
  ipcMain.handle('portForward:start', async (_event, connectionId: string, forwardId: string) => {
    try {
      const connection = sshConnectionManager.getConnection(connectionId)
      if (!connection) {
        return { success: false, error: 'Connection not found' }
      }

      const forward = portForwardManager.getForward(forwardId)
      if (!forward) {
        return { success: false, error: 'Forward not found' }
      }

      if (forward.type === 'local') {
        await portForwardManager.setupLocalForward(
          forwardId,
          connectionId,
          connection.client,
          forward.localHost,
          forward.localPort,
          forward.remoteHost,
          forward.remotePort
        )
      } else if (forward.type === 'remote') {
        await portForwardManager.setupRemoteForward(
          forwardId,
          connectionId,
          connection.client,
          forward.remoteHost,
          forward.remotePort,
          forward.localHost,
          forward.localPort
        )
      } else if (forward.type === 'dynamic') {
        await portForwardManager.setupDynamicForward(
          forwardId,
          connectionId,
          connection.client,
          forward.localHost,
          forward.localPort
        )
      }

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  // 停止转发
  ipcMain.handle('portForward:stop', async (_event, _connectionId: string, forwardId: string) => {
    try {
      await portForwardManager.stopForward(forwardId)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  // 删除转发
  ipcMain.handle(
    'portForward:delete',
    async (_event, _connectionId: string, forwardId: string) => {
      try {
        await portForwardManager.deleteForward(forwardId)
        return { success: true }
      } catch (error: any) {
        return { success: false, error: error.message }
      }
    }
  )
}

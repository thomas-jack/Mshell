import { ipcMain, BrowserWindow } from 'electron'
import { sftpManager } from '../managers/SFTPManager'
import { sshConnectionManager } from '../managers/SSHConnectionManager'
import { v4 as uuidv4 } from 'uuid'

/**
 * 注册 SFTP IPC 处理器
 */
export function registerSFTPHandlers() {
  // 初始化 SFTP
  ipcMain.handle('sftp:init', async (_event, connectionId: string) => {
    try {
      const connection = sshConnectionManager.getConnection(connectionId)
      if (!connection) {
        return { success: false, error: 'Connection not found' }
      }

      await sftpManager.initSFTP(connectionId, connection.client)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  // 列出目录
  ipcMain.handle('sftp:listDirectory', async (_event, connectionId: string, path: string) => {
    try {
      const files = await sftpManager.listDirectory(connectionId, path)
      return { success: true, files }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  // 上传文件
  ipcMain.handle(
    'sftp:uploadFile',
    async (_event, connectionId: string, localPath: string, remotePath: string) => {
      try {
        const taskId = uuidv4()
        await sftpManager.uploadFile(connectionId, localPath, remotePath, taskId)
        return { success: true, taskId }
      } catch (error: any) {
        return { success: false, error: error.message }
      }
    }
  )

  // 下载文件
  ipcMain.handle(
    'sftp:downloadFile',
    async (_event, connectionId: string, remotePath: string, localPath: string) => {
      try {
        const taskId = uuidv4()
        await sftpManager.downloadFile(connectionId, remotePath, localPath, taskId)
        return { success: true, taskId }
      } catch (error: any) {
        return { success: false, error: error.message }
      }
    }
  )

  // 创建目录
  ipcMain.handle('sftp:createDirectory', async (_event, connectionId: string, path: string) => {
    try {
      await sftpManager.createDirectory(connectionId, path)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  // 删除文件
  ipcMain.handle('sftp:deleteFile', async (_event, connectionId: string, path: string) => {
    try {
      await sftpManager.deleteFile(connectionId, path)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  // 重命名文件
  ipcMain.handle(
    'sftp:renameFile',
    async (_event, connectionId: string, oldPath: string, newPath: string) => {
      try {
        await sftpManager.renameFile(connectionId, oldPath, newPath)
        return { success: true }
      } catch (error: any) {
        return { success: false, error: error.message }
      }
    }
  )

  // 修改权限
  ipcMain.handle(
    'sftp:changePermissions',
    async (_event, connectionId: string, path: string, mode: number) => {
      try {
        await sftpManager.changePermissions(connectionId, path, mode)
        return { success: true }
      } catch (error: any) {
        return { success: false, error: error.message }
      }
    }
  )

  // 获取所有传输任务
  ipcMain.handle('sftp:getAllTasks', async () => {
    const tasks = sftpManager.getAllTasks()
    return { success: true, tasks }
  })

  // 取消传输任务
  ipcMain.handle('sftp:cancelTask', async (_event, taskId: string) => {
    try {
      sftpManager.cancelTask(taskId)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  // 转发 SFTP 事件到渲染进程
  sftpManager.on('progress', (taskId: string, progress: any) => {
    const windows = BrowserWindow.getAllWindows()
    windows.forEach((win) => {
      win.webContents.send('sftp:progress', taskId, progress)
    })
  })

  sftpManager.on('complete', (taskId: string) => {
    const windows = BrowserWindow.getAllWindows()
    windows.forEach((win) => {
      win.webContents.send('sftp:complete', taskId)
    })
  })

  sftpManager.on('error', (taskId: string, error: string) => {
    const windows = BrowserWindow.getAllWindows()
    windows.forEach((win) => {
      win.webContents.send('sftp:error', taskId, error)
    })
  })
}

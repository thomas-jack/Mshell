import { ipcMain } from 'electron'
import { promises as fs } from 'fs'
import { join, dirname } from 'path'

/**
 * 注册本地文件系统 IPC 处理器
 */
export function registerFsHandlers() {
  // 读取目录
  ipcMain.handle('fs:readDirectory', async (_event, dirPath: string) => {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true })
      const files = await Promise.all(
        entries.map(async (entry) => {
          const fullPath = join(dirPath, entry.name)
          let stats
          try {
            stats = await fs.stat(fullPath)
          } catch {
            stats = { size: 0, mtime: new Date() }
          }
          
          return {
            name: entry.name,
            isDirectory: entry.isDirectory(),
            size: stats.size || 0,
            mtime: stats.mtime || new Date()
          }
        })
      )
      
      return { success: true, files }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  // 创建目录
  ipcMain.handle('fs:createDirectory', async (_event, dirPath: string) => {
    try {
      await fs.mkdir(dirPath, { recursive: true })
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  // 删除文件或目录
  ipcMain.handle('fs:deleteFile', async (_event, filePath: string) => {
    try {
      const stats = await fs.stat(filePath)
      if (stats.isDirectory()) {
        await fs.rm(filePath, { recursive: true, force: true })
      } else {
        await fs.unlink(filePath)
      }
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  // 重命名文件或目录
  ipcMain.handle('fs:rename', async (_event, oldPath: string, newPath: string) => {
    try {
      await fs.rename(oldPath, newPath)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  // 获取文件信息
  ipcMain.handle('fs:stat', async (_event, filePath: string) => {
    try {
      const stats = await fs.stat(filePath)
      return {
        success: true,
        stats: {
          size: stats.size,
          isDirectory: stats.isDirectory(),
          isFile: stats.isFile(),
          mtime: stats.mtime,
          ctime: stats.ctime
        }
      }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
}

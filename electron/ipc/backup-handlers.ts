import { ipcMain, dialog } from 'electron'
import { backupManager } from '../managers/BackupManager'
import { logger } from '../utils/logger'
import { auditLogManager, AuditAction } from '../managers/AuditLogManager'

export function registerBackupHandlers() {
  // 获取备份配置
  ipcMain.handle('backup:getConfig', async () => {
    try {
      const config = backupManager.getConfig()
      return { success: true, data: config }
    } catch (error: any) {
      logger.logError('system', 'Failed to get backup config', error)
      return { success: false, error: error.message }
    }
  })

  // 更新备份配置
  ipcMain.handle('backup:updateConfig', async (_event, updates) => {
    try {
      await backupManager.updateConfig(updates)
      return { success: true }
    } catch (error: any) {
      logger.logError('system', 'Failed to update backup config', error)
      return { success: false, error: error.message }
    }
  })

  // 创建备份
  ipcMain.handle('backup:create', async (_event, password: string, filePath?: string) => {
    try {
      const path = await backupManager.createBackup(password, filePath)
      
      // 记录审计日志
      auditLogManager.log(AuditAction.BACKUP_CREATE, {
        resource: path,
        details: { filePath: path },
        success: true
      })
      
      return { success: true, data: path }
    } catch (error: any) {
      logger.logError('system', 'Failed to create backup', error)
      auditLogManager.log(AuditAction.BACKUP_CREATE, {
        resource: filePath,
        success: false,
        errorMessage: error.message
      })
      return { success: false, error: error.message }
    }
  })

  // 恢复备份
  ipcMain.handle('backup:restore', async (_event, filePath: string, password: string) => {
    try {
      const backupData = await backupManager.restoreBackup(filePath, password)
      
      // 记录审计日志
      auditLogManager.log(AuditAction.BACKUP_RESTORE, {
        resource: filePath,
        details: { filePath },
        success: true
      })
      
      return { success: true, data: backupData }
    } catch (error: any) {
      logger.logError('system', 'Failed to restore backup', error)
      auditLogManager.log(AuditAction.BACKUP_RESTORE, {
        resource: filePath,
        success: false,
        errorMessage: error.message
      })
      return { success: false, error: error.message }
    }
  })

  // 应用备份数据
  ipcMain.handle('backup:apply', async (_event, backupData, options) => {
    try {
      await backupManager.applyBackup(backupData, options)
      return { success: true }
    } catch (error: any) {
      logger.logError('system', 'Failed to apply backup', error)
      return { success: false, error: error.message }
    }
  })

  // 列出所有备份
  ipcMain.handle('backup:list', async () => {
    try {
      const backups = await backupManager.listBackups()
      return { success: true, data: backups }
    } catch (error: any) {
      logger.logError('system', 'Failed to list backups', error)
      return { success: false, error: error.message }
    }
  })

  // 删除备份
  ipcMain.handle('backup:delete', async (_event, filePath: string) => {
    try {
      await backupManager.deleteBackup(filePath)
      return { success: true }
    } catch (error: any) {
      logger.logError('system', 'Failed to delete backup', error)
      return { success: false, error: error.message }
    }
  })

  // 选择备份文件保存位置
  ipcMain.handle('backup:selectSavePath', async (_event, defaultPath?: string) => {
    try {
      const { join } = await import('path')
      const fileName = `backup-${Date.now()}.mshell`
      const finalDefaultPath = defaultPath ? join(defaultPath, fileName) : fileName

      const result = await dialog.showSaveDialog({
        title: '保存备份文件',
        defaultPath: finalDefaultPath,
        filters: [
          { name: 'MShell Backup', extensions: ['mshell'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      })

      if (result.canceled || !result.filePath) {
        return { success: false, error: 'Cancelled' }
      }

      return { success: true, data: result.filePath }
    } catch (error: any) {
      logger.logError('system', 'Failed to select save path', error)
      return { success: false, error: error.message }
    }
  })

  // 选择备份文件打开位置
  ipcMain.handle('backup:selectOpenPath', async () => {
    try {
      const result = await dialog.showOpenDialog({
        title: '选择备份文件',
        filters: [
          { name: 'MShell Backup', extensions: ['mshell'] },
          { name: 'All Files', extensions: ['*'] }
        ],
        properties: ['openFile']
      })

      if (result.canceled || result.filePaths.length === 0) {
        return { success: false, error: 'Cancelled' }
      }

      return { success: true, data: result.filePaths[0] }
    } catch (error: any) {
      logger.logError('system', 'Failed to select open path', error)
      return { success: false, error: error.message }
    }
  })

  // 选择备份目录
  ipcMain.handle('backup:selectDirectory', async () => {
    try {
      const result = await dialog.showOpenDialog({
        title: '选择备份目录',
        properties: ['openDirectory', 'createDirectory']
      })

      if (result.canceled || result.filePaths.length === 0) {
        return { success: false, error: 'Cancelled' }
      }

      return { success: true, data: result.filePaths[0] }
    } catch (error: any) {
      logger.logError('system', 'Failed to select directory', error)
      return { success: false, error: error.message }
    }
  })
}

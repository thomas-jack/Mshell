import { ipcMain } from 'electron'
import { logger, LogEntry } from '../utils/logger'

export function registerLogHandlers() {
  ipcMain.handle('logs:get', async (_event, filter?: { startDate?: string; endDate?: string; host?: string; level?: string }) => {
    const parsedFilter = filter ? {
      ...filter,
      startDate: filter.startDate ? new Date(filter.startDate) : undefined,
      endDate: filter.endDate ? new Date(filter.endDate) : undefined
    } : undefined
    
    return logger.getLogs(parsedFilter)
  })

  ipcMain.handle('logs:enableSession', async (_event, sessionId: string) => {
    logger.enableSessionLogging(sessionId)
    return { success: true }
  })

  ipcMain.handle('logs:disableSession', async (_event, sessionId: string) => {
    logger.disableSessionLogging(sessionId)
    return { success: true }
  })
}

import { ipcMain, BrowserWindow } from 'electron'
import { appSettingsManager, AppSettings } from '../utils/app-settings'

export function registerSettingsHandlers() {
  ipcMain.handle('settings:get', async () => {
    return appSettingsManager.getSettings()
  })

  ipcMain.handle('settings:update', async (_event, updates: Partial<AppSettings>) => {
    appSettingsManager.updateSettings(updates)

    // Broadcast change to all windows
    const settings = appSettingsManager.getSettings()
    BrowserWindow.getAllWindows().forEach(win => {
      win.webContents.send('settings:changed', settings)
    })

    return { success: true }
  })

  ipcMain.handle('settings:reset', async () => {
    appSettingsManager.resetToDefaults()
    return { success: true }
  })
}

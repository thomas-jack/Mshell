import { ipcMain } from 'electron'
import { appSettingsManager, AppSettings } from '../utils/app-settings'

export function registerSettingsHandlers() {
  ipcMain.handle('settings:get', async () => {
    return appSettingsManager.getSettings()
  })

  ipcMain.handle('settings:update', async (_event, updates: Partial<AppSettings>) => {
    appSettingsManager.updateSettings(updates)
    return { success: true }
  })

  ipcMain.handle('settings:reset', async () => {
    appSettingsManager.resetToDefaults()
    return { success: true }
  })
}

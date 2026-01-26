import * as fs from 'fs'
import * as path from 'path'
import { app } from 'electron'

export interface AppSettings {
  general: {
    language: 'zh-CN' | 'en-US'
    theme: 'light' | 'dark' | 'auto'
    startWithSystem: boolean
    minimizeToTray: boolean
  }
  terminal: {
    defaultFontSize: number
    defaultFontFamily: string
    defaultTheme: string
    scrollback: number
    cursorStyle: 'block' | 'underline' | 'bar'
    cursorBlink: boolean
    rendererType: 'auto' | 'webgl' | 'canvas' | 'dom'
  }
  sftp: {
    maxConcurrentTransfers: number
    defaultLocalPath: string
    confirmBeforeDelete: boolean
    showHiddenFiles: boolean
  }
  security: {
    savePasswords: boolean
    sessionTimeout: number
    verifyHostKey: boolean
  }
  updates: {
    autoCheck: boolean
    autoDownload: boolean
  }
}

class AppSettingsManager {
  private settingsFile: string
  private settings: AppSettings

  constructor() {
    const userDataPath = app.getPath('userData')
    this.settingsFile = path.join(userDataPath, 'settings.json')
    this.settings = this.getDefaultSettings()
    this.load()
  }

  private getDefaultSettings(): AppSettings {
    return {
      general: {
        language: 'zh-CN',
        theme: 'dark',
        startWithSystem: false,
        minimizeToTray: true
      },
      terminal: {
        defaultFontSize: 14,
        defaultFontFamily: 'Consolas, monospace',
        defaultTheme: 'dark',
        scrollback: 10000,
        cursorStyle: 'block',
        cursorBlink: true,
        rendererType: 'auto'
      },
      sftp: {
        maxConcurrentTransfers: 3,
        defaultLocalPath: app.getPath('downloads'),
        confirmBeforeDelete: true,
        showHiddenFiles: false
      },
      security: {
        savePasswords: true,
        sessionTimeout: 0,
        verifyHostKey: true
      },
      updates: {
        autoCheck: true,
        autoDownload: false
      }
    }
  }

  private load(): void {
    try {
      if (fs.existsSync(this.settingsFile)) {
        const data = fs.readFileSync(this.settingsFile, 'utf-8')
        const loaded = JSON.parse(data)
        this.settings = { ...this.settings, ...loaded }
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
  }

  private save(): void {
    try {
      const data = JSON.stringify(this.settings, null, 2)
      fs.writeFileSync(this.settingsFile, data)
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  }

  getSettings(): AppSettings {
    return { ...this.settings }
  }

  updateSettings(updates: Partial<AppSettings>): void {
    this.settings = {
      ...this.settings,
      ...updates,
      general: { ...this.settings.general, ...updates.general },
      terminal: { ...this.settings.terminal, ...updates.terminal },
      sftp: { ...this.settings.sftp, ...updates.sftp },
      security: { ...this.settings.security, ...updates.security },
      updates: { ...this.settings.updates, ...updates.updates }
    }
    this.save()
  }

  resetToDefaults(): void {
    this.settings = this.getDefaultSettings()
    this.save()
  }
}

export const appSettingsManager = new AppSettingsManager()

import * as fs from 'fs'
import * as path from 'path'
import { app } from 'electron'

interface AppState {
  openSessions: string[]
  activeTab: string
  lastSaved: Date
  crashed: boolean
}

class CrashRecoveryManager {
  private stateFile: string
  private saveInterval: NodeJS.Timeout | null = null

  constructor() {
    const userDataPath = app.getPath('userData')
    this.stateFile = path.join(userDataPath, 'app-state.json')
  }

  start(): void {
    this.markAsRunning()
    
    this.saveInterval = setInterval(() => {
      this.saveState()
    }, 30000)
  }

  stop(): void {
    if (this.saveInterval) {
      clearInterval(this.saveInterval)
    }
    this.markAsCleanExit()
  }

  private markAsRunning(): void {
    try {
      const state = this.loadState()
      state.crashed = true
      this.writeState(state)
    } catch (error) {
      console.error('Failed to mark as running:', error)
    }
  }

  private markAsCleanExit(): void {
    try {
      const state = this.loadState()
      state.crashed = false
      this.writeState(state)
    } catch (error) {
      console.error('Failed to mark clean exit:', error)
    }
  }

  private loadState(): AppState {
    try {
      if (fs.existsSync(this.stateFile)) {
        const data = fs.readFileSync(this.stateFile, 'utf-8')
        const state = JSON.parse(data)
        state.lastSaved = new Date(state.lastSaved)
        return state
      }
    } catch (error) {
      console.error('Failed to load state:', error)
    }
    
    return {
      openSessions: [],
      activeTab: '',
      lastSaved: new Date(),
      crashed: false
    }
  }

  private writeState(state: AppState): void {
    try {
      const data = JSON.stringify(state, null, 2)
      fs.writeFileSync(this.stateFile, data)
    } catch (error) {
      console.error('Failed to write state:', error)
    }
  }

  saveState(openSessions?: string[], activeTab?: string): void {
    const state = this.loadState()
    
    if (openSessions !== undefined) {
      state.openSessions = openSessions
    }
    
    if (activeTab !== undefined) {
      state.activeTab = activeTab
    }
    
    state.lastSaved = new Date()
    this.writeState(state)
  }

  checkForCrash(): { crashed: boolean; state?: AppState } {
    const state = this.loadState()
    
    if (state.crashed) {
      return { crashed: true, state }
    }
    
    return { crashed: false }
  }

  getRecoveryState(): AppState | null {
    const state = this.loadState()
    return state.crashed ? state : null
  }
}

export const crashRecoveryManager = new CrashRecoveryManager()

import * as fs from 'fs'
import * as path from 'path'
import { app } from 'electron'

export interface LogEntry {
  id: string
  timestamp: Date
  level: 'info' | 'warn' | 'error'
  category: 'connection' | 'sftp' | 'system' | 'session'
  sessionId?: string
  sessionName?: string
  host?: string
  username?: string
  message: string
  details?: string
  error?: string
}

class Logger {
  private logDir: string
  private currentLogFile: string
  private sessionLogging: Map<string, boolean>
  private sessionLogFiles: Map<string, string>

  constructor() {
    const userDataPath = app.getPath('userData')
    this.logDir = path.join(userDataPath, 'logs')
    this.sessionLogging = new Map()
    this.sessionLogFiles = new Map()

    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true })
    }

    const date = new Date().toISOString().split('T')[0]
    this.currentLogFile = path.join(this.logDir, `mshell-${date}.log`)
  }

  private sanitize(text: string): string {
    return text
      .replace(/password[=:]\s*[^\s&]+/gi, 'password=***')
      .replace(/passphrase[=:]\s*[^\s&]+/gi, 'passphrase=***')
      .replace(/-----BEGIN.*PRIVATE KEY-----[\s\S]*?-----END.*PRIVATE KEY-----/gi, '***PRIVATE KEY***')
  }

  private writeLog(entry: LogEntry): void {
    const sanitizedEntry = {
      ...entry,
      message: this.sanitize(entry.message),
      details: entry.details ? this.sanitize(entry.details) : undefined,
      error: entry.error ? this.sanitize(entry.error) : undefined
    }

    const logLine = JSON.stringify(sanitizedEntry) + '\n'
    fs.appendFileSync(this.currentLogFile, logLine)
  }

  logConnection(sessionId: string, sessionName: string, host: string, username: string, action: 'connect' | 'disconnect', error?: string): void {
    const { v4: uuidv4 } = require('uuid')
    this.writeLog({
      id: uuidv4(),
      timestamp: new Date(),
      level: error ? 'error' : 'info',
      category: 'connection',
      sessionId,
      sessionName,
      host,
      username,
      message: `${action} ${username}@${host}`,
      error
    })
  }

  logInfo(category: 'connection' | 'sftp' | 'system' | 'session', message: string, details?: string): void {
    const { v4: uuidv4 } = require('uuid')
    this.writeLog({
      id: uuidv4(),
      timestamp: new Date(),
      level: 'info',
      category,
      message,
      details
    })
  }

  logError(category: 'connection' | 'sftp' | 'system' | 'session', message: string, error: Error): void {
    const { v4: uuidv4 } = require('uuid')
    this.writeLog({
      id: uuidv4(),
      timestamp: new Date(),
      level: 'error',
      category,
      message,
      error: error.message,
      details: error.stack
    })
  }

  enableSessionLogging(sessionId: string): void {
    this.sessionLogging.set(sessionId, true)
    const date = new Date().toISOString().split('T')[0]
    const logFile = path.join(this.logDir, `session-${sessionId}-${date}.log`)
    this.sessionLogFiles.set(sessionId, logFile)
  }

  disableSessionLogging(sessionId: string): void {
    this.sessionLogging.delete(sessionId)
    this.sessionLogFiles.delete(sessionId)
  }

  logSessionData(sessionId: string, direction: 'input' | 'output', data: string): void {
    if (!this.sessionLogging.get(sessionId)) return

    const logFile = this.sessionLogFiles.get(sessionId)
    if (!logFile) return

    const sanitizedData = this.sanitize(data)
    const timestamp = new Date().toISOString()
    const logLine = `[${timestamp}] ${direction}: ${sanitizedData}\n`

    fs.appendFileSync(logFile, logLine)
  }

  getLogs(filter?: { startDate?: Date; endDate?: Date; host?: string; level?: string }): LogEntry[] {
    const logs: LogEntry[] = []
    const files = fs.readdirSync(this.logDir).filter(f => f.startsWith('mshell-') && f.endsWith('.log'))

    for (const file of files) {
      const content = fs.readFileSync(path.join(this.logDir, file), 'utf-8')
      const lines = content.split('\n').filter(l => l.trim())

      for (const line of lines) {
        try {
          const entry: LogEntry = JSON.parse(line)
          entry.timestamp = new Date(entry.timestamp)

          if (filter) {
            if (filter.startDate && entry.timestamp < filter.startDate) continue
            if (filter.endDate && entry.timestamp > filter.endDate) continue
            if (filter.host && entry.host !== filter.host) continue
            if (filter.level && entry.level !== filter.level) continue
          }

          logs.push(entry)
        } catch (e) {
          // Skip invalid lines
        }
      }
    }

    return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }
}

export const logger = new Logger()

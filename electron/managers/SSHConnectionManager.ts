import { Client, ClientChannel } from 'ssh2'
import { EventEmitter } from 'node:events'
import * as net from 'net'
import { appSettingsManager } from '../utils/app-settings'

export interface SSHConnectionOptions {
  host: string
  port: number
  username: string
  password?: string
  privateKey?: Buffer
  passphrase?: string
  keepaliveInterval?: number
  keepaliveCountMax?: number
  readyTimeout?: number
  sessionName?: string
}

export interface SSHConnection {
  id: string
  options: SSHConnectionOptions
  status: 'connecting' | 'connected' | 'disconnected' | 'error'
  client: Client
  socket?: net.Socket
  stream?: ClientChannel
  lastActivity: Date
  monitorTimer?: NodeJS.Timeout
}

/**
 * SSHConnectionManager - 管理 SSH 连接的生命周期
 */
export class SSHConnectionManager extends EventEmitter {
  private connections: Map<string, SSHConnection>

  constructor() {
    super()
    this.connections = new Map()
  }

  /**
   * 建立 SSH 连接
   */
  async connect(id: string, options: SSHConnectionOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      const client = new Client()
      const settings = appSettingsManager.getSettings()

      // Explicitly create socket to enable TCP_NODELAY for lower latency
      const socket = new net.Socket()
      socket.setNoDelay(true)

      const connection: SSHConnection = {
        id,
        options,
        status: 'connecting',
        client,
        socket,
        lastActivity: new Date()
      }

      this.connections.set(id, connection)

      // Handle socket errors
      socket.on('error', (err) => {
        if (connection.status === 'connecting') {
          reject(err)
        }
        this.emit('error', id, `Socket error: ${err.message}`)
      })

      // Setup SSH Client events
      client.on('ready', () => {
        connection.status = 'connected'
        connection.lastActivity = new Date()

        // 打开 shell，设置终端类型和环境变量
        // Open shell with window and options
        const window = {
          term: 'xterm-256color',
          cols: 80,
          rows: 24,
          modes: {
            ECHO: 1,
            ICANON: 0,
            ISIG: 1,
            ICRNL: 1,
            ONLCR: 1,
            OPOST: 1
          }
        }

        const shellOptions = {
          env: {
            TERM: 'xterm-256color',
            COLORTERM: 'truecolor',
            LANG: 'en_US.UTF-8',
            LC_ALL: 'en_US.UTF-8'
          }
        }

        client.shell(window as any, shellOptions, (err, stream) => {
          if (err) {
            connection.status = 'error'
            this.emit('error', id, err.message)
            reject(err)
            return
          }

          connection.stream = stream

          // 监听数据 - Pass Buffer directly to avoid string conversion overhead and encoding issues
          stream.on('data', (data: Buffer) => {
            connection.lastActivity = new Date()
            this.emit('data', id, data)
          })

          stream.on('close', () => {
            connection.status = 'disconnected'
            this.stopSessionMonitor(id)
            this.emit('close', id)
          })

          stream.stderr.on('data', (data: Buffer) => {
            this.emit('error', id, data.toString())
          })

          // 启动会话监控（超时检测）
          this.startSessionMonitor(id)

          resolve()
        })
      })

      client.on('error', (err) => {
        connection.status = 'error'
        this.emit('error', id, err.message)
        if (connection.status === 'connecting') {
          reject(err)
        }
      })

      client.on('close', () => {
        connection.status = 'disconnected'
        this.stopSessionMonitor(id)
        this.emit('close', id)
      })

      // 使用全局设置作为默认值
      // 如果 options 中有值则优先使用 options (通常来自会话特定的配置)
      // 但 currently frontend might not pass keepalive correctly via options if it relies on global settings
      // So we merge logic: Priority: Options > Settings > Defaults

      const keepaliveInterval = options.keepaliveInterval ??
        (settings.ssh.keepalive ? settings.ssh.keepaliveInterval * 1000 : 0)

      const readyTimeout = options.readyTimeout ?? (settings.ssh.timeout * 1000)

      // 连接配置
      const connectConfig: any = {
        sock: socket, // Use our custom socket
        username: options.username,
        readyTimeout: readyTimeout || 20000,
        keepaliveInterval: keepaliveInterval,
        keepaliveCountMax: options.keepaliveCountMax || 3
      }

      if (options.password) {
        connectConfig.password = options.password
      }

      if (options.privateKey) {
        connectConfig.privateKey = options.privateKey
        if (options.passphrase) {
          connectConfig.passphrase = options.passphrase
        }
      }

      // Connect the socket first
      socket.connect(options.port, options.host, () => {
        client.connect(connectConfig)
      })
    })
  }

  /**
   * 断开 SSH 连接
   */
  async disconnect(id: string): Promise<void> {
    const connection = this.connections.get(id)
    if (!connection) {
      // 这里的Error可能会导致前端收到多余的错误提示，改为静默返回或warning
      // throw new Error(`Connection not found: ${id}`)
      console.warn(`Attempted to disconnect non-existent session: ${id}`)
      return
    }

    this.stopSessionMonitor(id)

    if (connection.stream) {
      connection.stream.end()
    }

    connection.client.end()
    if (connection.socket) {
      connection.socket.destroy() // Ensure socket is destroyed
    }
    this.connections.delete(id)
  }

  /**
   * 写入数据到 SSH 连接
   */
  write(id: string, data: string | Buffer): void {
    const connection = this.connections.get(id)
    if (!connection || !connection.stream) {
      // throw new Error(`Connection not ready: ${id}`)
      // Log warning instead of throwing to prevent app crash on race conditions
      console.warn(`Attempted to write to non-ready session: ${id}`)
      return
    }

    if (typeof data === 'string') {
      connection.stream.write(data, 'utf8')
    } else {
      connection.stream.write(data)
    }

    connection.lastActivity = new Date()
  }

  /**
   * 调整终端大小
   */
  resize(id: string, cols: number, rows: number): void {
    const connection = this.connections.get(id)
    if (!connection || !connection.stream) {
      return
    }

    connection.stream.setWindow(rows, cols, 0, 0)
  }

  /**
   * 获取连接
   */
  getConnection(id: string): SSHConnection | undefined {
    return this.connections.get(id)
  }

  /**
   * 启动会话监控 (Session Timeout Monitor)
   */
  startSessionMonitor(id: string): void {
    const connection = this.connections.get(id)
    if (!connection) return

    this.stopSessionMonitor(id)

    // Check every minute
    const checkInterval = 60000

    connection.monitorTimer = setInterval(() => {
      try {
        const settings = appSettingsManager.getSettings()
        const timeoutMinutes = settings.security.sessionTimeout

        // 0 means no timeout
        if (timeoutMinutes > 0) {
          const idleTime = new Date().getTime() - connection.lastActivity.getTime()
          const timeoutMs = timeoutMinutes * 60 * 1000

          if (idleTime > timeoutMs) {
            console.log(`Session ${id} timed out after ${timeoutMinutes} minutes of inactivity`)
            this.emit('error', id, `会话已超时 (闲置超过 ${timeoutMinutes} 分钟)`)
            this.disconnect(id).catch(console.error)
          }
        }
      } catch (error) {
        console.error(`Session monitor error for ${id}:`, error)
      }
    }, checkInterval)
  }

  /**
   * 停止会话监控
   */
  stopSessionMonitor(id: string): void {
    const connection = this.connections.get(id)
    if (connection && connection.monitorTimer) {
      clearInterval(connection.monitorTimer)
      connection.monitorTimer = undefined
    }
  }

  /**
   * 获取所有连接
   */
  getAllConnections(): SSHConnection[] {
    return Array.from(this.connections.values())
  }
}

// 导出单例实例
export const sshConnectionManager = new SSHConnectionManager()

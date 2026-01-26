import { Client, ClientChannel } from 'ssh2'
import { EventEmitter } from 'node:events'

export interface SSHConnectionOptions {
  host: string
  port: number
  username: string
  password?: string
  privateKey?: Buffer
  passphrase?: string
  keepaliveInterval?: number
  keepaliveCountMax?: number // Add missing count option
  readyTimeout?: number
  sessionName?: string
}

export interface SSHConnection {
  id: string
  options: SSHConnectionOptions
  status: 'connecting' | 'connected' | 'disconnected' | 'error'
  client: Client
  stream?: ClientChannel
  lastActivity: Date
  keepaliveTimer?: NodeJS.Timeout
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

      const connection: SSHConnection = {
        id,
        options,
        status: 'connecting',
        client,
        lastActivity: new Date()
      }

      this.connections.set(id, connection)

      client.on('ready', () => {
        connection.status = 'connected'
        connection.lastActivity = new Date()

        // 打开 shell，设置终端类型和环境变量
        client.shell({
          term: 'xterm-256color',
          cols: 80,
          rows: 24
        }, (err, stream) => {
          if (err) {
            connection.status = 'error'
            this.emit('error', id, err.message)
            reject(err)
            return
          }

          connection.stream = stream

          // 监听数据
          stream.on('data', (data: Buffer) => {
            connection.lastActivity = new Date()
            this.emit('data', id, data.toString())
          })

          stream.on('close', () => {
            connection.status = 'disconnected'
            this.stopKeepalive(id)
            this.emit('close', id)
          })

          stream.stderr.on('data', (data: Buffer) => {
            this.emit('error', id, data.toString())
          })

          // 启动心跳
          this.startKeepalive(id)

          resolve()
        })
      })

      client.on('error', (err) => {
        connection.status = 'error'
        this.emit('error', id, err.message)
        reject(err)
      })

      client.on('close', () => {
        connection.status = 'disconnected'
        this.stopKeepalive(id)
        this.emit('close', id)
      })

      // 连接配置
      const connectConfig: any = {
        host: options.host,
        port: options.port,
        username: options.username,
        readyTimeout: options.readyTimeout || 20000,
        keepaliveInterval: options.keepaliveInterval || 10000, // Default to 10s
        keepaliveCountMax: options.keepaliveCountMax || 3 // Default to 3 retries
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

      client.connect(connectConfig)
    })
  }

  /**
   * 断开 SSH 连接
   */
  async disconnect(id: string): Promise<void> {
    const connection = this.connections.get(id)
    if (!connection) {
      throw new Error(`Connection not found: ${id}`)
    }

    this.stopKeepalive(id)

    if (connection.stream) {
      connection.stream.end()
    }

    connection.client.end()
    this.connections.delete(id)
  }

  /**
   * 写入数据到 SSH 连接
   */
  write(id: string, data: string): void {
    const connection = this.connections.get(id)
    if (!connection || !connection.stream) {
      throw new Error(`Connection not ready: ${id}`)
    }

    connection.stream.write(data)
    connection.lastActivity = new Date()
  }

  /**
   * 调整终端大小
   */
  resize(id: string, cols: number, rows: number): void {
    const connection = this.connections.get(id)
    if (!connection || !connection.stream) {
      throw new Error(`Connection not ready: ${id}`)
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
   * 启动心跳 (Manual echo as backup)
   */
  startKeepalive(id: string): void {
    const connection = this.connections.get(id)
    if (!connection) return

    // Clear existing timer if any
    this.stopKeepalive(id)

    // Manual echo interval (longer than SSH level keepalive)
    const interval = 60000

    connection.keepaliveTimer = setInterval(() => {
      try {
        // Simple echo to keep channel active if idle
        if (new Date().getTime() - connection.lastActivity.getTime() > interval) {
          // We are not using exec here because it opens a new channel. 
          // Best practice for keepalive is mainly handled by transport layer options above.
          // However, if we need app-level activity:
          // connection.stream?.write('\x00') // null byte ignored by many shells but keeps traffic flowing? Risk of side effects.
          // Safe option: Do nothing at app level if transport keepalive is configured.
          // Current implementation was opening `exec`, which is heavy. 
          // Let's rely on the transport layer keepalive added in previous step.
          // But if we must, we can check status.
        }
      } catch (error) {
        console.error(`Keepalive error for ${id}:`, error)
      }
    }, interval)
  }

  /**
   * 停止心跳
   */
  stopKeepalive(id: string): void {
    const connection = this.connections.get(id)
    if (connection && connection.keepaliveTimer) {
      clearInterval(connection.keepaliveTimer)
      connection.keepaliveTimer = undefined
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

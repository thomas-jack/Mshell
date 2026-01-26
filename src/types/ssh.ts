export interface SSHConnectionOptions {
  host: string
  port: number
  username: string
  password?: string
  privateKey?: Buffer
  passphrase?: string
  keepaliveInterval?: number
  readyTimeout?: number
}

export interface SSHConnection {
  id: string
  options: SSHConnectionOptions
  status: 'connecting' | 'connected' | 'disconnected' | 'error'
  connectedAt?: Date
  lastActivity: Date
  error?: string
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

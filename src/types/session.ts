export interface SessionConfig {
  id: string
  name: string
  group?: string
  host: string
  port: number
  username: string
  authType: 'password' | 'privateKey'
  password?: string
  privateKeyPath?: string
  privateKey?: string // For runtime connection use
  passphrase?: string
  portForwards?: any[]
  color?: string
  createdAt: Date
  updatedAt: Date
}

export interface SessionGroup {
  id: string
  name: string
  sessions: string[] // For compatibility, populated dynamically
}

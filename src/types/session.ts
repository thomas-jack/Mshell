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
  // Server Management Info
  description?: string
  provider?: string
  region?: string
  expiryDate?: Date
  billingCycle?: 'monthly' | 'quarterly' | 'semi-annually' | 'annually' | 'biennially' | 'triennially' | 'custom'
  billingAmount?: number
  billingCurrency?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
  usageCount?: number
  lastConnected?: Date
}

export interface SessionGroup {
  id: string
  name: string
  sessions: string[] // For compatibility, populated dynamically
}

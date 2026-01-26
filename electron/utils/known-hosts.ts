import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'
import { app } from 'electron'

export interface HostKey {
  host: string
  port: number
  keyType: string
  key: string
  fingerprint: string
  addedAt: Date
}

class KnownHostsManager {
  private knownHostsFile: string
  private hosts: Map<string, HostKey>

  constructor() {
    const userDataPath = app.getPath('userData')
    this.knownHostsFile = path.join(userDataPath, 'known_hosts')
    this.hosts = new Map()
    this.load()
  }

  private load(): void {
    if (!fs.existsSync(this.knownHostsFile)) return
    
    try {
      const content = fs.readFileSync(this.knownHostsFile, 'utf-8')
      const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('#'))
      
      for (const line of lines) {
        const parts = line.split(' ')
        if (parts.length >= 3) {
          const [hostPort, keyType, key] = parts
          const [host, port] = hostPort.split(':')
          
          const hostKey: HostKey = {
            host,
            port: parseInt(port) || 22,
            keyType,
            key,
            fingerprint: this.calculateFingerprint(key),
            addedAt: new Date()
          }
          
          this.hosts.set(this.getHostKey(host, parseInt(port) || 22), hostKey)
        }
      }
    } catch (error) {
      console.error('Failed to load known hosts:', error)
    }
  }

  private save(): void {
    try {
      const lines: string[] = ['# MShell Known Hosts File']
      
      for (const hostKey of this.hosts.values()) {
        lines.push(`${hostKey.host}:${hostKey.port} ${hostKey.keyType} ${hostKey.key}`)
      }
      
      fs.writeFileSync(this.knownHostsFile, lines.join('\n') + '\n')
    } catch (error) {
      console.error('Failed to save known hosts:', error)
    }
  }

  private getHostKey(host: string, port: number): string {
    return `${host}:${port}`
  }

  private calculateFingerprint(key: string): string {
    const hash = crypto.createHash('sha256')
    hash.update(Buffer.from(key, 'base64'))
    return hash.digest('hex')
  }

  verifyHost(host: string, port: number, keyType: string, key: Buffer): 'trusted' | 'changed' | 'unknown' {
    const keyStr = key.toString('base64')
    const hostKey = this.getHostKey(host, port)
    const existing = this.hosts.get(hostKey)
    
    if (!existing) {
      return 'unknown'
    }
    
    if (existing.key === keyStr && existing.keyType === keyType) {
      return 'trusted'
    }
    
    return 'changed'
  }

  addHost(host: string, port: number, keyType: string, key: Buffer): void {
    const keyStr = key.toString('base64')
    const hostKey: HostKey = {
      host,
      port,
      keyType,
      key: keyStr,
      fingerprint: this.calculateFingerprint(keyStr),
      addedAt: new Date()
    }
    
    this.hosts.set(this.getHostKey(host, port), hostKey)
    this.save()
  }

  removeHost(host: string, port: number): void {
    this.hosts.delete(this.getHostKey(host, port))
    this.save()
  }

  getHost(host: string, port: number): HostKey | undefined {
    return this.hosts.get(this.getHostKey(host, port))
  }

  getAllHosts(): HostKey[] {
    return Array.from(this.hosts.values())
  }
}

export const knownHostsManager = new KnownHostsManager()

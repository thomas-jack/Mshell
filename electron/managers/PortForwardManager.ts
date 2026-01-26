import { EventEmitter } from 'node:events'
import { Client } from 'ssh2'
import * as net from 'net'

export interface PortForward {
  id: string
  type: 'local' | 'remote' | 'dynamic'
  localHost: string
  localPort: number
  remoteHost: string
  remotePort: number
  status: 'active' | 'inactive' | 'error'
  error?: string
}

/**
 * PortForwardManager - 管理端口转发
 */
export class PortForwardManager extends EventEmitter {
  private forwards: Map<string, PortForward>
  private servers: Map<string, net.Server>
  private sshClients: Map<string, Client>

  constructor() {
    super()
    this.forwards = new Map()
    this.servers = new Map()
    this.sshClients = new Map()
  }

  /**
   * 设置本地端口转发
   */
  async setupLocalForward(
    id: string,
    _connectionId: string,
    sshClient: Client,
    localHost: string,
    localPort: number,
    remoteHost: string,
    remotePort: number
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const forward: PortForward = {
        id,
        type: 'local',
        localHost,
        localPort,
        remoteHost,
        remotePort,
        status: 'inactive'
      }

      const server = net.createServer((socket) => {
        sshClient.forwardOut(
          socket.remoteAddress || '127.0.0.1',
          socket.remotePort || 0,
          remoteHost,
          remotePort,
          (err, stream) => {
            if (err) {
              socket.end()
              this.emit('error', id, err.message)
              return
            }

            socket.pipe(stream).pipe(socket)

            socket.on('error', (err: Error) => {
              console.error('Socket error:', err)
            })

            stream.on('error', (err: Error) => {
              console.error('Stream error:', err)
            })
          }
        )
      })

      server.on('error', (err: Error) => {
        forward.status = 'error'
        forward.error = err.message
        this.emit('error', id, err.message)
        reject(err)
      })

      server.listen(localPort, localHost, () => {
        forward.status = 'active'
        this.forwards.set(id, forward)
        this.servers.set(id, server)
        this.sshClients.set(id, sshClient)
        this.emit('active', id)
        resolve()
      })
    })
  }

  /**
   * 设置远程端口转发
   */
  async setupRemoteForward(
    id: string,
    _connectionId: string,
    sshClient: Client,
    remoteHost: string,
    remotePort: number,
    localHost: string,
    localPort: number
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const forward: PortForward = {
        id,
        type: 'remote',
        localHost,
        localPort,
        remoteHost,
        remotePort,
        status: 'inactive'
      }

      sshClient.forwardIn(remoteHost, remotePort, (err) => {
        if (err) {
          forward.status = 'error'
          forward.error = err.message
          this.emit('error', id, err.message)
          reject(err)
          return
        }

        forward.status = 'active'
        this.forwards.set(id, forward)
        this.sshClients.set(id, sshClient)
        this.emit('active', id)
        resolve()
      })

      sshClient.on('tcp connection', (_info, accept) => {
        const stream = accept()
        const socket = net.connect(localPort, localHost)

        socket.pipe(stream).pipe(socket)

        socket.on('error', (err: Error) => {
          console.error('Socket error:', err)
        })

        stream.on('error', (err: Error) => {
          console.error('Stream error:', err)
        })
      })
    })
  }

  /**
   * 设置动态端口转发 (SOCKS5)
   */
  async setupDynamicForward(
    id: string,
    _connectionId: string,
    sshClient: Client,
    localHost: string,
    localPort: number
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const forward: PortForward = {
        id,
        type: 'dynamic',
        localHost,
        localPort,
        remoteHost: '',
        remotePort: 0,
        status: 'inactive'
      }

      const server = net.createServer((socket) => {
        // Simple SOCKS5 implementation
        socket.once('data', (data) => {
          // SOCKS5 handshake
          if (data[0] === 0x05) {
            socket.write(Buffer.from([0x05, 0x00]))

            socket.once('data', (data) => {
              const cmd = data[1]
              const atyp = data[3]

              let remoteHost: string
              let remotePort: number

              if (atyp === 0x01) {
                // IPv4
                remoteHost = `${data[4]}.${data[5]}.${data[6]}.${data[7]}`
                remotePort = data.readUInt16BE(8)
              } else if (atyp === 0x03) {
                // Domain name
                const len = data[4]
                remoteHost = data.slice(5, 5 + len).toString()
                remotePort = data.readUInt16BE(5 + len)
              } else {
                socket.end()
                return
              }

              if (cmd === 0x01) {
                // CONNECT
                sshClient.forwardOut(
                  socket.remoteAddress || '127.0.0.1',
                  socket.remotePort || 0,
                  remoteHost,
                  remotePort,
                  (err, stream) => {
                    if (err) {
                      socket.write(Buffer.from([0x05, 0x01, 0x00, 0x01, 0, 0, 0, 0, 0, 0]))
                      socket.end()
                      return
                    }

                    socket.write(Buffer.from([0x05, 0x00, 0x00, 0x01, 0, 0, 0, 0, 0, 0]))
                    socket.pipe(stream).pipe(socket)
                  }
                )
              }
            })
          }
        })
      })

      server.on('error', (err: Error) => {
        forward.status = 'error'
        forward.error = err.message
        this.emit('error', id, err.message)
        reject(err)
      })

      server.listen(localPort, localHost, () => {
        forward.status = 'active'
        this.forwards.set(id, forward)
        this.servers.set(id, server)
        this.sshClients.set(id, sshClient)
        this.emit('active', id)
        resolve()
      })
    })
  }

  /**
   * 停止端口转发
   */
  async stopForward(id: string): Promise<void> {
    const forward = this.forwards.get(id)
    if (!forward) {
      throw new Error(`Forward not found: ${id}`)
    }

    const server = this.servers.get(id)
    if (server) {
      server.close()
      this.servers.delete(id)
    }

    forward.status = 'inactive'
    this.sshClients.delete(id)
    this.emit('inactive', id)
  }

  /**
   * 获取端口转发
   */
  getForward(id: string): PortForward | undefined {
    return this.forwards.get(id)
  }

  /**
   * 获取所有端口转发
   */
  getAllForwards(): PortForward[] {
    return Array.from(this.forwards.values())
  }

  /**
   * 删除端口转发
   */
  async deleteForward(id: string): Promise<void> {
    await this.stopForward(id)
    this.forwards.delete(id)
  }
}

// 导出单例实例
export const portForwardManager = new PortForwardManager()

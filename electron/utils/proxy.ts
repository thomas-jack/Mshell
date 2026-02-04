
import * as net from 'net'
import { ProxyConfig } from '../../src/types/session'

export class ProxyHelper {
    /**
     * 通过代理建立连接
     */
    static async connect(
        proxy: ProxyConfig,
        targetHost: string,
        targetPort: number
    ): Promise<net.Socket> {
        if (proxy.type === 'socks5') {
            return this.connectSocks5(proxy, targetHost, targetPort)
        } else if (proxy.type === 'http') {
            return this.connectHttp(proxy, targetHost, targetPort)
        }
        throw new Error(`Unsupported proxy type: ${proxy.type}`)
    }

    /**
     * SOCKS5 代理连接
     */
    private static connectSocks5(
        proxy: ProxyConfig,
        targetHost: string,
        targetPort: number
    ): Promise<net.Socket> {
        return new Promise((resolve, reject) => {
            const socket = new net.Socket()

            socket.on('error', (err) => {
                reject(new Error(`SOCKS5 connection failed: ${err.message}`))
            })

            socket.connect(proxy.port, proxy.host, () => {
                // 1. 发送握手请求
                // Version 5, 2 authentication methods supported: No Auth (0x00), Username/Password (0x02)
                const methods = [0x00]
                if (proxy.username && proxy.password) {
                    methods.push(0x02)
                }

                const handshake = Buffer.from([0x05, methods.length, ...methods])
                socket.write(handshake)
            })

            let step = 0 // 0: handshake, 1: auth, 2: connect

            socket.on('data', (data) => {
                try {
                    if (step === 0) {
                        // 处理握手响应
                        if (data[0] !== 0x05) {
                            throw new Error('Invalid SOCKS5 version')
                        }

                        const method = data[1]
                        if (method === 0xff) {
                            throw new Error('No acceptable authentication methods')
                        }

                        if (method === 0x02) {
                            // 需要用户名/密码认证
                            if (!proxy.username || !proxy.password) {
                                throw new Error('Proxy authentication required but credentials missing')
                            }

                            // 发送认证请求
                            // Version 1, Username len, Username, Password len, Password
                            const usernameBuf = Buffer.from(proxy.username)
                            const passwordBuf = Buffer.from(proxy.password)

                            const authReq = Buffer.concat([
                                Buffer.from([0x01, usernameBuf.length]),
                                usernameBuf,
                                Buffer.from([passwordBuf.length]),
                                passwordBuf
                            ])

                            socket.write(authReq)
                            step = 1
                        } else {
                            // 无需认证，直接发送连接请求
                            this.sendSocks5Connect(socket, targetHost, targetPort)
                            step = 2
                        }
                    } else if (step === 1) {
                        // 处理认证响应
                        if (data[0] !== 0x01 || data[1] !== 0x00) {
                            throw new Error('SOCKS5 authentication failed')
                        }
                        // 认证成功，发送连接请求
                        this.sendSocks5Connect(socket, targetHost, targetPort)
                        step = 2
                    } else if (step === 2) {
                        // 处理连接响应
                        if (data[0] !== 0x05 || data[1] !== 0x00) {
                            throw new Error(`SOCKS5 connection failed with status: ${data[1]}`)
                        }

                        // 连接成功，移除所有监听器并返回 socket
                        socket.removeAllListeners('data')
                        socket.removeAllListeners('error')
                        resolve(socket)
                    }
                } catch (err: any) {
                    socket.destroy()
                    reject(err)
                }
            })
        })
    }

    /**
     * 发送 SOCKS5 连接请求
     */
    private static sendSocks5Connect(socket: net.Socket, host: string, port: number) {
        // Version 5, Command 1 (Connect), Reserved 0, Address Type, Address, Port
        // Address Type: 0x01 (IPv4), 0x03 (Domain), 0x04 (IPv6)

        let addrType = 0x03 // Default to Domain
        let addrBuf: Buffer

        if (net.isIPv4(host)) {
            addrType = 0x01
            addrBuf = Buffer.from(host.split('.').map(Number))
        } else if (net.isIPv6(host)) {
            addrType = 0x04
            // 简化处理，这里假设是 Domain，因为解析 IPv6 比较麻烦，如果不被 net.isIPv6 识别为 Buffer，就当域名
            // 但实际上 net.isIPv6 只验证字符串。要转 Buffer 比较麻烦。
            // 为了安全起见，这里统一先支持 Domain 和 IPv4。IPv6 用户通常直接填域名。
            // 如果必须支持 IPv6 IP直连，需要额外的转换逻辑。
            // 暂时回退到 Domain 模式处理 IPv6 字符串（大多数 SOCKS5 服务器支持）
            addrType = 0x03
            addrBuf = Buffer.concat([Buffer.from([host.length]), Buffer.from(host)])
        } else {
            // Domain
            addrBuf = Buffer.concat([Buffer.from([host.length]), Buffer.from(host)])
        }

        const portBuf = Buffer.alloc(2)
        portBuf.writeUInt16BE(port)

        const request = Buffer.concat([
            Buffer.from([0x05, 0x01, 0x00, addrType]),
            addrBuf,
            portBuf
        ])

        socket.write(request)
    }

    /**
     * HTTP 代理连接 (CONNECT 方法)
     */
    private static connectHttp(
        proxy: ProxyConfig,
        targetHost: string,
        targetPort: number
    ): Promise<net.Socket> {
        return new Promise((resolve, reject) => {
            const socket = new net.Socket()

            socket.on('error', (err) => {
                reject(new Error(`HTTP proxy connection failed: ${err.message}`))
            })

            socket.connect(proxy.port, proxy.host, () => {
                // 构建 CONNECT 请求
                let req = `CONNECT ${targetHost}:${targetPort} HTTP/1.1\r\n`
                req += `Host: ${targetHost}:${targetPort}\r\n`

                if (proxy.username && proxy.password) {
                    const auth = Buffer.from(`${proxy.username}:${proxy.password}`).toString('base64')
                    req += `Proxy-Authorization: Basic ${auth}\r\n`
                }

                req += '\r\n'
                socket.write(req)
            })

            let buffer = ''

            const onData = (data: Buffer) => {
                buffer += data.toString()
                if (buffer.includes('\r\n\r\n')) {
                    // 收到响应头结束
                    const lines = buffer.split('\r\n')
                    const statusLine = lines[0]

                    if (statusLine.includes('200')) {
                        // 连接成功
                        // 可能有多余的数据属于随后传输的内容，需要回退回去（Emit）或者重新触发
                        // 但对于 CONNECT 握手，通常这就完成了。如果有剩余数据，需要 careful。
                        // 简单实现：移除监听器，resolve socket
                        socket.removeListener('data', onData)
                        socket.removeAllListeners('error')
                        resolve(socket)
                    } else {
                        socket.destroy()
                        reject(new Error(`HTTP proxy returned error: ${statusLine}`))
                    }
                }
            }

            socket.on('data', onData)
        })
    }
}

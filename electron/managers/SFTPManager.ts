import { EventEmitter } from 'node:events'
import { Client } from 'ssh2'
import * as fs from 'fs'

export interface SFTPFileInfo {
  name: string
  type: 'file' | 'directory' | 'symlink'
  size: number
  modifyTime: Date
  accessTime: Date
  permissions: number
  owner: number
  group: number
}

export interface TransferProgress {
  transferred: number
  total: number
  percentage: number
  speed: number
  eta: number
}

export interface TransferTask {
  id: string
  type: 'upload' | 'download'
  localPath: string
  remotePath: string
  status: 'pending' | 'active' | 'paused' | 'completed' | 'failed' | 'cancelled'
  progress: TransferProgress
  error?: string
}

/**
 * SFTPManager - 管理 SFTP 文件操作
 */
export class SFTPManager extends EventEmitter {
  private sftpClients: Map<string, any>
  private sshClients: Map<string, Client>
  private transferTasks: Map<string, TransferTask>

  constructor() {
    super()
    this.sftpClients = new Map()
    this.sshClients = new Map()
    this.transferTasks = new Map()
  }

  /**
   * 初始�?SFTP 会话
   */
  async initSFTP(connectionId: string, sshClient: Client): Promise<void> {
    return new Promise((resolve, reject) => {
      sshClient.sftp((err, sftp) => {
        if (err) {
          reject(err)
          return
        }

        this.sftpClients.set(connectionId, sftp)
        this.sshClients.set(connectionId, sshClient)
        resolve()
      })
    })
  }

  /**
   * 列出目录内容
   */
  async listDirectory(connectionId: string, dirPath: string): Promise<SFTPFileInfo[]> {
    const sftp = this.sftpClients.get(connectionId)
    if (!sftp) {
      throw new Error(`SFTP client not found for connection: ${connectionId}`)
    }

    return new Promise((resolve, reject) => {
      sftp.readdir(dirPath, (err: Error, list: any[]) => {
        if (err) {
          reject(err)
          return
        }

        const files: SFTPFileInfo[] = list.map((item) => ({
          name: item.filename,
          type: this.getFileType(item.attrs.mode),
          size: item.attrs.size,
          modifyTime: new Date(item.attrs.mtime * 1000),
          accessTime: new Date(item.attrs.atime * 1000),
          permissions: item.attrs.mode & 0o777,
          owner: item.attrs.uid,
          group: item.attrs.gid
        }))

        resolve(files)
      })
    })
  }

  /**
   * 上传文件
   */
  async uploadFile(
    connectionId: string,
    localPath: string,
    remotePath: string,
    taskId: string,
    onProgress?: (progress: TransferProgress) => void
  ): Promise<void> {
    const sftp = this.sftpClients.get(connectionId)
    if (!sftp) {
      throw new Error(`SFTP client not found for connection: ${connectionId}`)
    }

    // 获取文件大小
    const stats = fs.statSync(localPath)
    const totalSize = stats.size

    // 创建传输任务
    const task: TransferTask = {
      id: taskId,
      type: 'upload',
      localPath,
      remotePath,
      status: 'active',
      progress: {
        transferred: 0,
        total: totalSize,
        percentage: 0,
        speed: 0,
        eta: 0
      }
    }
    this.transferTasks.set(taskId, task)

    return new Promise((resolve, reject) => {
      const readStream = fs.createReadStream(localPath)
      const writeStream = sftp.createWriteStream(remotePath)

      let transferred = 0
      let lastTransferred = 0
      let lastTime = Date.now()

      const progressInterval = setInterval(() => {
        const now = Date.now()
        const timeDiff = (now - lastTime) / 1000
        const bytesDiff = transferred - lastTransferred

        const speed = bytesDiff / timeDiff
        const remaining = totalSize - transferred
        const eta = speed > 0 ? remaining / speed : 0

        task.progress = {
          transferred,
          total: totalSize,
          percentage: (transferred / totalSize) * 100,
          speed,
          eta
        }

        if (onProgress) {
          onProgress(task.progress)
        }

        this.emit('progress', taskId, task.progress)

        lastTransferred = transferred
        lastTime = now
      }, 100)

      readStream.on('data', (chunk: Buffer | string) => {
        transferred += Buffer.isBuffer(chunk) ? chunk.length : Buffer.byteLength(chunk)
      })

      writeStream.on('close', () => {
        clearInterval(progressInterval)
        task.status = 'completed'
        task.progress.percentage = 100
        this.emit('complete', taskId)
        resolve()
      })

      writeStream.on('error', (err: Error) => {
        clearInterval(progressInterval)
        task.status = 'failed'
        task.error = err.message
        this.emit('error', taskId, err.message)
        reject(err)
      })

      readStream.pipe(writeStream)
    })
  }

  /**
   * 下载文件
   */
  async downloadFile(
    connectionId: string,
    remotePath: string,
    localPath: string,
    taskId: string,
    onProgress?: (progress: TransferProgress) => void
  ): Promise<void> {
    const sftp = this.sftpClients.get(connectionId)
    if (!sftp) {
      throw new Error(`SFTP client not found for connection: ${connectionId}`)
    }

    // 获取远程文件大小
    const stats: any = await new Promise((resolve, reject) => {
      sftp.stat(remotePath, (err: Error, stats: any) => {
        if (err) reject(err)
        else resolve(stats)
      })
    })

    const totalSize = stats.size

    // 创建传输任务
    const task: TransferTask = {
      id: taskId,
      type: 'download',
      localPath,
      remotePath,
      status: 'active',
      progress: {
        transferred: 0,
        total: totalSize,
        percentage: 0,
        speed: 0,
        eta: 0
      }
    }
    this.transferTasks.set(taskId, task)

    return new Promise((resolve, reject) => {
      const readStream = sftp.createReadStream(remotePath)
      const writeStream = fs.createWriteStream(localPath)

      let transferred = 0
      let lastTransferred = 0
      let lastTime = Date.now()

      const progressInterval = setInterval(() => {
        const now = Date.now()
        const timeDiff = (now - lastTime) / 1000
        const bytesDiff = transferred - lastTransferred

        const speed = bytesDiff / timeDiff
        const remaining = totalSize - transferred
        const eta = speed > 0 ? remaining / speed : 0

        task.progress = {
          transferred,
          total: totalSize,
          percentage: (transferred / totalSize) * 100,
          speed,
          eta
        }

        if (onProgress) {
          onProgress(task.progress)
        }

        this.emit('progress', taskId, task.progress)

        lastTransferred = transferred
        lastTime = now
      }, 100)

      readStream.on('data', (chunk: Buffer | string) => {
        transferred += Buffer.isBuffer(chunk) ? chunk.length : Buffer.byteLength(chunk)
      })

      writeStream.on('close', () => {
        clearInterval(progressInterval)
        task.status = 'completed'
        task.progress.percentage = 100
        this.emit('complete', taskId)
        resolve()
      })

      writeStream.on('error', (err: Error) => {
        clearInterval(progressInterval)
        task.status = 'failed'
        task.error = err.message
        this.emit('error', taskId, err.message)
        reject(err)
      })

      readStream.pipe(writeStream)
    })
  }

  /**
   * 创建目录
   */
  async createDirectory(connectionId: string, dirPath: string): Promise<void> {
    const sftp = this.sftpClients.get(connectionId)
    if (!sftp) {
      throw new Error(`SFTP client not found for connection: ${connectionId}`)
    }

    return new Promise((resolve, reject) => {
      sftp.mkdir(dirPath, (err: Error) => {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  /**
   * 删除文件
   */
  async deleteFile(connectionId: string, filePath: string): Promise<void> {
    const sftp = this.sftpClients.get(connectionId)
    if (!sftp) {
      throw new Error(`SFTP client not found for connection: ${connectionId}`)
    }

    return new Promise((resolve, reject) => {
      sftp.unlink(filePath, (err: Error) => {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  /**
   * 删除目录
   */
  async deleteDirectory(connectionId: string, dirPath: string): Promise<void> {
    const sftp = this.sftpClients.get(connectionId)
    if (!sftp) {
      throw new Error(`SFTP client not found for connection: ${connectionId}`)
    }

    return new Promise((resolve, reject) => {
      sftp.rmdir(dirPath, (err: Error) => {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  /**
   * 重命名文�?
   */
  async renameFile(
    connectionId: string,
    oldPath: string,
    newPath: string
  ): Promise<void> {
    const sftp = this.sftpClients.get(connectionId)
    if (!sftp) {
      throw new Error(`SFTP client not found for connection: ${connectionId}`)
    }

    return new Promise((resolve, reject) => {
      sftp.rename(oldPath, newPath, (err: Error) => {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  /**
   * 修改文件权限
   */
  async changePermissions(
    connectionId: string,
    filePath: string,
    mode: number
  ): Promise<void> {
    const sftp = this.sftpClients.get(connectionId)
    if (!sftp) {
      throw new Error(`SFTP client not found for connection: ${connectionId}`)
    }

    return new Promise((resolve, reject) => {
      sftp.chmod(filePath, mode, (err: Error) => {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  /**
   * 获取传输任务
   */
  getTask(taskId: string): TransferTask | undefined {
    return this.transferTasks.get(taskId)
  }

  /**
   * 获取所有传输任�?
   */
  getAllTasks(): TransferTask[] {
    return Array.from(this.transferTasks.values())
  }

  /**
   * 取消传输任务
   */
  cancelTask(taskId: string): void {
    const task = this.transferTasks.get(taskId)
    if (task) {
      task.status = 'cancelled'
      this.emit('cancelled', taskId)
    }
  }

  /**
   * 关闭 SFTP 连接
   */
  closeSFTP(connectionId: string): void {
    const sftp = this.sftpClients.get(connectionId)
    if (sftp) {
      sftp.end()
      this.sftpClients.delete(connectionId)
    }
    this.sshClients.delete(connectionId)
  }

  /**
   * 获取文件类型
   */
  private getFileType(mode: number): 'file' | 'directory' | 'symlink' {
    const S_IFMT = 0o170000
    const S_IFREG = 0o100000
    const S_IFDIR = 0o040000
    const S_IFLNK = 0o120000

    const type = mode & S_IFMT

    if (type === S_IFREG) return 'file'
    if (type === S_IFDIR) return 'directory'
    if (type === S_IFLNK) return 'symlink'

    return 'file'
  }
}

// 导出单例实例
export const sftpManager = new SFTPManager()

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
  connectionId: string
  type: 'upload' | 'download'
  localPath: string
  remotePath: string
  fileName: string
  size: number
  status: 'pending' | 'active' | 'paused' | 'completed' | 'failed'
  progress: TransferProgress
  error?: string
  priority: number
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
}

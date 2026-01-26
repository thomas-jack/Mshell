import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // SSH operations
  ssh: {
    connect: (id: string, options: any) => ipcRenderer.invoke('ssh:connect', id, options),
    disconnect: (id: string) => ipcRenderer.invoke('ssh:disconnect', id),
    write: (id: string, data: string) => ipcRenderer.send('ssh:write', id, data),
    resize: (id: string, cols: number, rows: number) =>
      ipcRenderer.send('ssh:resize', id, cols, rows),
    getConnection: (id: string) => ipcRenderer.invoke('ssh:getConnection', id),
    getAllConnections: () => ipcRenderer.invoke('ssh:getAllConnections'),
    onData: (callback: (id: string, data: string) => void) => {
      ipcRenderer.on('ssh:data', (_event, id, data) => callback(id, data))
    },
    onError: (callback: (id: string, error: string) => void) => {
      ipcRenderer.on('ssh:error', (_event, id, error) => callback(id, error))
    },
    onClose: (callback: (id: string) => void) => {
      ipcRenderer.on('ssh:close', (_event, id) => callback(id))
    }
  },

  // Session operations
  session: {
    getAll: () => ipcRenderer.invoke('session:getAll'),
    get: (id: string) => ipcRenderer.invoke('session:get', id),
    create: (config: any) => ipcRenderer.invoke('session:create', config),
    update: (id: string, updates: any) => ipcRenderer.invoke('session:update', id, updates),
    delete: (id: string) => ipcRenderer.invoke('session:delete', id),
    export: (filePath: string) => ipcRenderer.invoke('session:export', filePath),
    import: (filePath: string) => ipcRenderer.invoke('session:import', filePath),
    createGroup: (name: string, description?: string) => ipcRenderer.invoke('session:createGroup', name, description),
    getAllGroups: () => ipcRenderer.invoke('session:getAllGroups'),
    addToGroup: (sessionId: string, groupId: string) => ipcRenderer.invoke('session:addToGroup', sessionId, groupId),
    renameGroup: (groupId: string, newName: string) => ipcRenderer.invoke('session:renameGroup', groupId, newName),
    deleteGroup: (groupId: string) => ipcRenderer.invoke('session:deleteGroup', groupId)
  },

  // SFTP operations
  sftp: {
    init: (connectionId: string) => ipcRenderer.invoke('sftp:init', connectionId),
    listDirectory: (connectionId: string, path: string) =>
      ipcRenderer.invoke('sftp:listDirectory', connectionId, path),
    uploadFile: (connectionId: string, localPath: string, remotePath: string) =>
      ipcRenderer.invoke('sftp:uploadFile', connectionId, localPath, remotePath),
    downloadFile: (connectionId: string, remotePath: string, localPath: string) =>
      ipcRenderer.invoke('sftp:downloadFile', connectionId, remotePath, localPath),
    createDirectory: (connectionId: string, path: string) =>
      ipcRenderer.invoke('sftp:createDirectory', connectionId, path),
    deleteFile: (connectionId: string, path: string) =>
      ipcRenderer.invoke('sftp:deleteFile', connectionId, path),
    renameFile: (connectionId: string, oldPath: string, newPath: string) =>
      ipcRenderer.invoke('sftp:renameFile', connectionId, oldPath, newPath),
    changePermissions: (connectionId: string, path: string, mode: number) =>
      ipcRenderer.invoke('sftp:changePermissions', connectionId, path, mode),
    getAllTasks: () => ipcRenderer.invoke('sftp:getAllTasks'),
    cancelTask: (taskId: string) => ipcRenderer.invoke('sftp:cancelTask', taskId),
    onProgress: (callback: (taskId: string, progress: any) => void) => {
      ipcRenderer.on('sftp:progress', (_event, taskId, progress) => callback(taskId, progress))
    },
    onComplete: (callback: (taskId: string) => void) => {
      ipcRenderer.on('sftp:complete', (_event, taskId) => callback(taskId))
    },
    onError: (callback: (taskId: string, error: string) => void) => {
      ipcRenderer.on('sftp:error', (_event, taskId, error) => callback(taskId, error))
    }
  },

  // Settings operations
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    update: (updates: any) => ipcRenderer.invoke('settings:update', updates),
    reset: () => ipcRenderer.invoke('settings:reset')
  },

  // Log operations
  logs: {
    get: (filter?: any) => ipcRenderer.invoke('logs:get', filter),
    enableSession: (sessionId: string) => ipcRenderer.invoke('logs:enableSession', sessionId),
    disableSession: (sessionId: string) => ipcRenderer.invoke('logs:disableSession', sessionId)
  },

  // Known hosts operations
  knownHosts: {
    verify: (host: string, port: number, keyType: string, key: string) =>
      ipcRenderer.invoke('ssh:verifyHost', host, port, keyType, key),
    add: (host: string, port: number, keyType: string, key: string) =>
      ipcRenderer.invoke('ssh:addHost', host, port, keyType, key),
    getAll: () => ipcRenderer.invoke('ssh:getKnownHosts'),
    remove: (host: string, port: number) => ipcRenderer.invoke('ssh:removeHost', host, port)
  },

  // Shortcut events
  onShortcut: (event: string, callback: () => void) => {
    ipcRenderer.on(`shortcut:${event}`, callback)
  },

  // Dialog operations
  dialog: {
    openFile: (options?: any) => ipcRenderer.invoke('dialog:openFile', options),
    saveFile: (options?: any) => ipcRenderer.invoke('dialog:saveFile', options),
    openDirectory: (options?: any) => ipcRenderer.invoke('dialog:openDirectory', options),
    showContextMenu: (menuItems: any[]) => ipcRenderer.invoke('dialog:showContextMenu', menuItems)
  },

  // Local file system operations
  fs: {
    readDirectory: (dirPath: string) => ipcRenderer.invoke('fs:readDirectory', dirPath),
    createDirectory: (dirPath: string) => ipcRenderer.invoke('fs:createDirectory', dirPath),
    deleteFile: (filePath: string) => ipcRenderer.invoke('fs:deleteFile', filePath),
    rename: (oldPath: string, newPath: string) => ipcRenderer.invoke('fs:rename', oldPath, newPath),
    stat: (filePath: string) => ipcRenderer.invoke('fs:stat', filePath)
  },

  // Port forward operations
  portForward: {
    getAll: (connectionId: string) => ipcRenderer.invoke('portForward:getAll', connectionId),
    add: (connectionId: string, config: any) =>
      ipcRenderer.invoke('portForward:add', connectionId, config),
    start: (connectionId: string, forwardId: string) =>
      ipcRenderer.invoke('portForward:start', connectionId, forwardId),
    stop: (connectionId: string, forwardId: string) =>
      ipcRenderer.invoke('portForward:stop', connectionId, forwardId),
    delete: (connectionId: string, forwardId: string) =>
      ipcRenderer.invoke('portForward:delete', connectionId, forwardId)
  },

  // Snippet operations
  snippet: {
    getAll: () => ipcRenderer.invoke('snippet:getAll'),
    get: (id: string) => ipcRenderer.invoke('snippet:get', id),
    create: (data: any) => ipcRenderer.invoke('snippet:create', data),
    update: (id: string, updates: any) => ipcRenderer.invoke('snippet:update', id, updates),
    delete: (id: string) => ipcRenderer.invoke('snippet:delete', id),
    incrementUsage: (id: string) => ipcRenderer.invoke('snippet:incrementUsage', id),
    getByCategory: (category: string) => ipcRenderer.invoke('snippet:getByCategory', category),
    getByTag: (tag: string) => ipcRenderer.invoke('snippet:getByTag', tag),
    export: (filePath: string) => ipcRenderer.invoke('snippet:export', filePath),
    import: (filePath: string) => ipcRenderer.invoke('snippet:import', filePath)
  }
})

// Type definitions for the exposed API
export interface ElectronAPI {
  ssh: {
    connect: (id: string, options: any) => Promise<void>
    disconnect: (id: string) => Promise<void>
    write: (id: string, data: string) => void
    resize: (id: string, cols: number, rows: number) => void
    getConnection: (id: string) => Promise<any>
    getAllConnections: () => Promise<any[]>
    onData: (callback: (id: string, data: string) => void) => void
    onError: (callback: (id: string, error: string) => void) => void
    onClose: (callback: (id: string) => void) => void
  }
  session: {
    getAll: () => Promise<any[]>
    get: (id: string) => Promise<any>
    create: (config: any) => Promise<any>
    update: (id: string, updates: any) => Promise<void>
    delete: (id: string) => Promise<void>
    export: (filePath: string) => Promise<void>
    import: (filePath: string) => Promise<any[]>
  }
  sftp: {
    init: (connectionId: string) => Promise<void>
    listDirectory: (connectionId: string, path: string) => Promise<any[]>
    uploadFile: (connectionId: string, localPath: string, remotePath: string) => Promise<void>
    downloadFile: (connectionId: string, remotePath: string, localPath: string) => Promise<void>
    onProgress: (callback: (taskId: string, progress: any) => void) => void
  }
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

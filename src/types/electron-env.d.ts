
export interface ElectronAPI {
    session: {
        getAll: () => Promise<import('./session').SessionConfig[]>
        get: (id: string) => Promise<import('./session').SessionConfig>
        create: (config: Omit<import('./session').SessionConfig, 'id' | 'createdAt' | 'updatedAt'>) => Promise<import('./session').SessionConfig>
        update: (id: string, updates: Partial<import('./session').SessionConfig>) => Promise<void>
        delete: (id: string) => Promise<void>
        getAllGroups: () => Promise<import('./session').SessionGroup[]>
        createGroup: (name: string, description?: string) => Promise<import('./session').SessionGroup>
        renameGroup: (id: string, name: string) => Promise<void>
        deleteGroup: (id: string) => Promise<void>
    }
    ssh: {
        connect: (id: string, config: any) => Promise<{ success: boolean; error?: string }>
        disconnect: (id: string) => Promise<void>
        write: (id: string, data: string) => Promise<void>
        resize: (id: string, cols: number, rows: number) => Promise<void>
        onData: (callback: (id: string, data: string) => void) => void
        onError: (callback: (id: string, error: string) => void) => void
        onClose: (callback: (id: string) => void) => void
    }
    sftp: {
        init: (connectionId: string) => Promise<{ success: boolean; error?: string }>
        listDirectory: (connectionId: string, path: string) => Promise<{ success: boolean; files?: any[]; error?: string }>
        createDirectory: (connectionId: string, path: string) => Promise<{ success: boolean; error?: string }>
        deleteFile: (connectionId: string, path: string) => Promise<{ success: boolean; error?: string }>
        renameFile: (connectionId: string, oldPath: string, newPath: string) => Promise<{ success: boolean; error?: string }>
        uploadFile: (connectionId: string, localPath: string, remotePath: string) => Promise<{ success: boolean; error?: string }>
        downloadFile: (connectionId: string, remotePath: string, localPath: string) => Promise<{ success: boolean; error?: string }>
        connect: (config: any) => Promise<{ success: boolean; error?: string }>
        list: (path: string) => Promise<any[]>
        getHomeDir: () => Promise<string>
    }
    fs: {
        readDirectory: (path: string) => Promise<{ success: boolean; files?: any[]; error?: string }>
        createDirectory: (path: string) => Promise<{ success: boolean; error?: string }>
        deleteFile: (path: string) => Promise<{ success: boolean; error?: string }>
        rename: (oldPath: string, newPath: string) => Promise<{ success: boolean; error?: string }>
    }
    settings: {
        get: () => Promise<any>
        update: (updates: any) => Promise<void>
        reset: () => Promise<void>
        onChange: (callback: (settings: any) => void) => void
    }
    backup: {
        getConfig: () => Promise<any>
        updateConfig: (updates: any) => Promise<any>
        create: (password: string, filePath?: string) => Promise<any>
        restore: (filePath: string, password: string) => Promise<any>
        apply: (backupData: any, options: any) => Promise<any>
        list: () => Promise<any>
        delete: (filePath: string) => Promise<any>
        selectSavePath: (defaultPath?: string) => Promise<any>
        selectOpenPath: () => Promise<any>
        selectDirectory: () => Promise<any>
    }
    snippet: {
        getAll: () => Promise<{ success: boolean; snippets: any[] }>
        create: (data: any) => Promise<{ success: boolean; snippet?: any; error?: string }>
        incrementUsage: (id: string) => Promise<void>
    }
    dialog: {
        showContextMenu: (items: any[]) => Promise<string>
        openFile: (options: any) => Promise<string | null>
        openDirectory: (options?: any) => Promise<string | null>
        saveFile: (options?: any) => Promise<string | null>
    }
    process?: {
        env: {
            USERPROFILE?: string
            HOME?: string
        }
    }
    onShortcut: (name: string, callback: () => void) => void
}

declare global {
    interface Window {
        electronAPI: ElectronAPI
    }
}

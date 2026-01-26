import { ipcMain, dialog, Menu } from 'electron'

export function registerDialogHandlers() {
  // Open file dialog
  ipcMain.handle('dialog:openFile', async (_event, options) => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: options?.filters || [],
      ...options
    })
    
    if (result.canceled) {
      return null
    }
    
    return result.filePaths[0]
  })

  // Save file dialog
  ipcMain.handle('dialog:saveFile', async (_event, options) => {
    const result = await dialog.showSaveDialog({
      filters: options?.filters || [],
      ...options
    })
    
    if (result.canceled) {
      return null
    }
    
    return result.filePath
  })

  // Open directory dialog
  ipcMain.handle('dialog:openDirectory', async (_event, options) => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      ...options
    })
    
    if (result.canceled) {
      return null
    }
    
    return result.filePaths[0]
  })

  // Show context menu
  ipcMain.handle('dialog:showContextMenu', async (_event, menuItems) => {
    return new Promise((resolve) => {
      const template = menuItems.map((item: any) => {
        if (item.type === 'separator') {
          return { type: 'separator' }
        }
        
        return {
          label: item.label,
          accelerator: item.accelerator,
          click: () => resolve(item.action)
        }
      })
      
      const menu = Menu.buildFromTemplate(template as any)
      menu.popup({
        callback: () => resolve(null)
      })
    })
  })
}

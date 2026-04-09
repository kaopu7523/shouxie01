import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  showSaveDialog: (options: { defaultPath?: string; filters?: Array<{ name: string; extensions: string[] }> }) =>
    ipcRenderer.invoke('show-save-dialog', options),
  showPrintDialog: () => ipcRenderer.invoke('show-print-dialog'),
  platform: process.platform,
})

import { ipcMain, dialog } from 'electron'
import fs from 'fs'
import type { SaveFileRequest } from '../../shared/types'

export function registerExportHandlers(): void {
  ipcMain.handle('export:save-file', async (_, req: SaveFileRequest) => {
    const ext = req.format === 'xlsx' ? 'xlsx' : 'pdf'
    const { filePath, canceled } = await dialog.showSaveDialog({
      defaultPath: req.defaultFileName,
      filters: [{ name: ext.toUpperCase(), extensions: [ext] }],
    })
    if (canceled || !filePath) return { success: false }
    await fs.promises.writeFile(filePath, Buffer.from(req.buffer))
    return { success: true, filePath }
  })
}

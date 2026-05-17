import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('desktopPetApi', {
  isDesktopMode: () => true,
  getMetrics: () => ipcRenderer.invoke('desktop:get-metrics'),
  updateWindow: (bounds: { x: number; y: number; width: number; height: number }) =>
    ipcRenderer.invoke('desktop:update-window', bounds),
  showWindow: () => ipcRenderer.invoke('desktop:show-window'),
  setIgnoreMouseEvents: (ignore: boolean, options?: { forward?: boolean }) =>
    ipcRenderer.invoke('desktop:set-ignore-mouse-events', ignore, options),
  setInteractiveRegions: (regions: Array<{ x: number; y: number; width: number; height: number }>) =>
    ipcRenderer.invoke('desktop:set-interactive-regions', regions),
  setDragging: (dragging: boolean) => ipcRenderer.invoke('desktop:set-dragging', dragging),
  readSaveData: () => ipcRenderer.sendSync('desktop:read-save-data'),
  writeSaveData: (saveData: unknown) => ipcRenderer.sendSync('desktop:write-save-data', saveData),
  readDesktopPreferences: () => ipcRenderer.sendSync('desktop:read-desktop-preferences'),
  writeDesktopPreferences: (preferences: unknown) =>
    ipcRenderer.sendSync('desktop:write-desktop-preferences', preferences),
  onQuickAction: (listener: (action: string) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, action: string) => {
      listener(action);
    };

    ipcRenderer.on('desktop:quick-action', handler);

    return () => {
      ipcRenderer.removeListener('desktop:quick-action', handler);
    };
  }
});

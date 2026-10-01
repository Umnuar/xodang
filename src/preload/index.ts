/**
 * Electron Preload Script
 * Secure ContextBridge exposing strictly scoped methods to the renderer window.
 */

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    fetchSheetsData: (range: string) => ipcRenderer.invoke('sheets:fetch', range),
    isOffline: () => !navigator.onLine,
    getPlatform: () => process.platform,
    isElectron: true
});

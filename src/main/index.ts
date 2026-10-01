/**
 * Electron Main Process Entry Point
 * Configures secure window, grants microphone permissions, registers IPC handlers,
 * and manages desktop window lifecycle.
 */

import { app, BrowserWindow, session } from 'electron';
import path from 'path';
import { registerIpcFetcher } from './ipc-fetcher';

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 850,
        minWidth: 900,
        minHeight: 650,
        title: 'Từ Điển Xơ Đăng - Tiếng Việt',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
            preload: path.join(__dirname, '../preload/index.js')
        }
    });

    // Automatically grant media/microphone permission for voice search & pronunciation recording
    session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
        if (permission === 'media') {
            return callback(true);
        }
        callback(false);
    });

    // Register IPC channels
    registerIpcFetcher();

    // In development mode, load Vite dev server; in production, load dist/index.html
    const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
    if (isDev) {
        mainWindow.loadURL('http://localhost:3000').catch(() => {
            mainWindow?.loadFile(path.join(__dirname, '../../dist/index.html'));
        });
    } else {
        mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.length === 0 || !mainWindow) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

import { app, BrowserWindow, session, shell } from 'electron';
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
            preload: path.join(__dirname, '../preload/index.cjs')
        }
    });

    mainWindow.webContents.setWindowOpenHandler(({ url }: { url: string }) => {
        if (url.startsWith('https:') || url.startsWith('http:')) {
            shell.openExternal(url);
        }
        return { action: 'deny' };
    });

    mainWindow.webContents.on('will-navigate', (event: any, navigationUrl: string) => {
        try {
            const parsedUrl = new URL(navigationUrl);
            const isDevServer = parsedUrl.origin === 'http://localhost:3000';
            const isFileProtocol = parsedUrl.protocol === 'file:';

            if (!isDevServer && !isFileProtocol) {
                event.preventDefault();
                shell.openExternal(navigationUrl);
            }
        } catch {
            event.preventDefault();
        }
    });

    session.defaultSession.setPermissionRequestHandler((webContents, permission, callback, details) => {
        if (permission === 'media') {
            const requestingUrl = (details && details.requestingUrl) || (webContents && webContents.getURL && webContents.getURL()) || '';
            const isLocalDev = requestingUrl.startsWith('http://localhost:3000');
            const isLocalFile = requestingUrl.startsWith('file:');

            if (isLocalDev || isLocalFile) {
                return callback(true);
            }
        }
        callback(false);
    });

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
    registerIpcFetcher();
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0 || !mainWindow) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

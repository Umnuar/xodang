/**
 * Ambient module declarations for Electron and Node.js APIs
 * Prevents compiler errors without requiring heavy node packages.
 */

declare module 'electron' {
    export interface BrowserWindowOptions {
        width?: number;
        height?: number;
        minWidth?: number;
        minHeight?: number;
        title?: string;
        webPreferences?: {
            nodeIntegration?: boolean;
            contextIsolation?: boolean;
            sandbox?: boolean;
            preload?: string;
        };
    }

    export class BrowserWindow {
        constructor(options?: BrowserWindowOptions);
        loadURL(url: string): Promise<void>;
        loadFile(filePath: string): Promise<void>;
        on(event: string, listener: (...args: any[]) => void): this;
        webContents: any;
    }

    export const app: {
        whenReady(): Promise<void>;
        on(event: string, listener: (...args: any[]) => void): void;
        quit(): void;
        isPackaged: boolean;
    };

    export const session: {
        defaultSession: {
            setPermissionRequestHandler(
                handler: (webContents: any, permission: string, callback: (permissionGranted: boolean) => void, details?: any) => void
            ): void;
        };
    };

    export const ipcMain: {
        handle(channel: string, listener: (event: any, ...args: any[]) => Promise<any> | any): void;
        on(channel: string, listener: (event: any, ...args: any[]) => void): void;
    };

    export const ipcRenderer: {
        invoke(channel: string, ...args: any[]): Promise<any>;
        on(channel: string, listener: (event: any, ...args: any[]) => void): void;
    };

    export const contextBridge: {
        exposeInMainWorld(apiKey: string, api: any): void;
    };

    export const shell: {
        openExternal(url: string): Promise<void>;
    };
}

declare module 'fs' {
    export function existsSync(path: string): boolean;
    export function mkdirSync(path: string, options?: { recursive?: boolean }): void;
    export function readFileSync(path: string, encoding: string): string;
    export function writeFileSync(path: string, data: string, encoding: string): void;
    export function statSync(path: string): { size: number };
}

declare module 'path' {
    export function resolve(...paths: string[]): string;
    export function join(...paths: string[]): string;
    export function dirname(p: string): string;
    export function basename(p: string): string;
}

declare module 'url' {
    export function fileURLToPath(url: string): string;
}

declare const __dirname: string;
declare const __filename: string;

declare namespace NodeJS {
    interface ProcessEnv {
        [key: string]: string | undefined;
    }
}

declare const process: {
    env: Record<string, string | undefined>;
    platform: string;
    exit(code?: number): never;
};

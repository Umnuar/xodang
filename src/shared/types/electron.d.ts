/**
 * Ambient type declarations for Electron modules and Window bridge.
 * Allows type-safe compilation with zero forced package installations.
 */

export interface ElectronAPI {
    fetchSheetsData(range: string): Promise<any>;
    isOffline(): boolean;
    getPlatform(): string;
    isElectron: boolean;
}

declare global {
    interface Window {
        electronAPI?: ElectronAPI;
    }
}

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

declare module 'crypto' {
    export interface Hash {
        update(data: string | Uint8Array): this;
        digest(encoding: 'hex' | 'base64'): string;
    }

    export function createHash(algorithm: string): Hash;
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
    argv: string[];
    platform: string;
    exit(code?: number): never;
};

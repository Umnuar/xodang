import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    resolvePreferredSpeechTier,
    startSmartVietnameseSpeech,
    setWasmSpeechCached
} from '@/services/speech.service';
import * as whisperSttService from '@/services/whisper-stt.service';

describe('3-Tier Vietnamese Speech Recognition Waterfall', () => {
    let storageMap: Map<string, string>;

    beforeEach(() => {
        storageMap = new Map<string, string>();
        Object.defineProperty(window, 'localStorage', {
            configurable: true,
            writable: true,
            value: {
                getItem: (k: string) => storageMap.get(k) ?? null,
                setItem: (k: string, v: string) => storageMap.set(k, String(v)),
                removeItem: (k: string) => storageMap.delete(k),
                clear: () => storageMap.clear(),
                get length() {
                    return storageMap.size;
                },
                key: (i: number) => Array.from(storageMap.keys())[i] ?? null
            }
        });
        Object.defineProperty(window.navigator, 'onLine', {
            configurable: true,
            value: true
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
        delete (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition;
        delete (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
    });

    it('resolves speech tiers in strict lightest-first priority order', () => {
        expect(resolvePreferredSpeechTier({
            hasWebSpeech: true,
            onDeviceStatus: 'available',
            isOnline: false,
            hasWasmCached: true,
            canUseWasm: true
        })).toBe('on-device');

        expect(resolvePreferredSpeechTier({
            hasWebSpeech: true,
            onDeviceStatus: 'downloadable',
            isOnline: true,
            hasWasmCached: false,
            canUseWasm: true
        })).toBe('on-device');

        expect(resolvePreferredSpeechTier({
            hasWebSpeech: true,
            onDeviceStatus: 'unavailable',
            isOnline: true,
            hasWasmCached: true,
            canUseWasm: true
        })).toBe('cloud');

        expect(resolvePreferredSpeechTier({
            hasWebSpeech: false,
            onDeviceStatus: 'unavailable',
            isOnline: false,
            hasWasmCached: false,
            canUseWasm: true
        })).toBe('keyboard');

        expect(resolvePreferredSpeechTier({
            hasWebSpeech: false,
            onDeviceStatus: 'unavailable',
            isOnline: false,
            hasWasmCached: true,
            canUseWasm: true
        })).toBe('wasm');
    });

    it('uses Tier 1A on-device Web Speech and installs vi-VN pack when downloadable', async () => {
        const instances: Array<{ processLocally: boolean; lang: string }> = [];
        const availableMock = vi.fn().mockResolvedValue('downloadable');
        const installMock = vi.fn().mockResolvedValue(true);

        class MockSpeechRecognition {
            lang = '';
            continuous = false;
            interimResults = false;
            processLocally = false;
            onstart?: () => void;
            onresult?: (e: any) => void;
            onend?: () => void;
            onerror?: (e: any) => void;
            start = vi.fn(() => {
                this.onstart?.();
                this.onresult?.({ results: [[{ transcript: 'rừng già.' }]] });
                this.onend?.();
            });
            stop = vi.fn();
            constructor() {
                instances.push(this);
            }
        }
        (MockSpeechRecognition as unknown as { available: typeof availableMock }).available = availableMock;
        (MockSpeechRecognition as unknown as { install: typeof installMock }).install = installMock;
        (window as unknown as { SpeechRecognition: unknown }).SpeechRecognition = MockSpeechRecognition;

        const wasmSpy = vi.spyOn(whisperSttService, 'startWasmVoiceCapture');
        const onStatus = vi.fn();
        const onResult = vi.fn();
        const onFallbackKeyboard = vi.fn();

        const handle = await startSmartVietnameseSpeech({
            onStatus,
            onResult,
            onFallbackKeyboard
        });

        expect(handle.tier).toBe('on-device');
        expect(availableMock).toHaveBeenCalledWith({ langs: ['vi-VN'], processLocally: true });
        expect(installMock).toHaveBeenCalledWith({ langs: ['vi-VN'] });
        expect(onStatus).toHaveBeenCalledTimes(1);
        expect(instances[0]?.processLocally).toBe(true);
        expect(instances[0]?.lang).toBe('vi-VN');
        expect(onResult).toHaveBeenCalledWith('rừng già', 'on-device');
        expect(onFallbackKeyboard).not.toHaveBeenCalled();
        expect(wasmSpy).not.toHaveBeenCalled();
    });

    it('cascades from failed Tier 1B network error to Tier 2 keyboard assist without spawning WASM when uncached', async () => {
        class FailingCloudSpeechRecognition {
            lang = '';
            onend?: () => void;
            onerror?: (e: any) => void;
            start = vi.fn(() => {
                this.onerror?.({ error: 'network' });
                this.onend?.();
            });
            stop = vi.fn();
        }
        (window as unknown as { SpeechRecognition: unknown }).SpeechRecognition = FailingCloudSpeechRecognition;

        const wasmSpy = vi.spyOn(whisperSttService, 'startWasmVoiceCapture');
        const onFallbackKeyboard = vi.fn();
        const onError = vi.fn();

        await startSmartVietnameseSpeech({
            onFallbackKeyboard,
            onError
        });

        expect(onFallbackKeyboard).toHaveBeenCalledTimes(1);
        expect(onFallbackKeyboard.mock.calls[0][0].reason).toBe('network');
        expect(onFallbackKeyboard.mock.calls[0][0].isWasmCached).toBe(false);
        expect(onError).not.toHaveBeenCalled();
        expect(wasmSpy).not.toHaveBeenCalled();
    });

    it('invokes Tier 3 Whisper WASM only when cached or explicitly forced after Tier 1 failure', async () => {
        setWasmSpeechCached(true);
        Object.defineProperty(window.navigator, 'onLine', {
            configurable: true,
            value: false
        });
        Object.defineProperty(window.navigator, 'mediaDevices', {
            configurable: true,
            value: { getUserMedia: vi.fn() }
        });
        if (typeof globalThis.Worker === 'undefined') {
            vi.stubGlobal('Worker', class {});
        }

        const wasmSpy = vi.spyOn(whisperSttService, 'startWasmVoiceCapture').mockImplementation(async (cbs) => {
            cbs.onStart?.();
            cbs.onProcessing?.();
            cbs.onResult?.('xin chào');
            cbs.onEnd?.();
            return { stop: vi.fn(), cancel: vi.fn() };
        });

        const onResult = vi.fn();
        const onProcessing = vi.fn();
        const handle = await startSmartVietnameseSpeech({
            onResult,
            onProcessing
        });

        expect(handle.tier).toBe('wasm');
        expect(wasmSpy).toHaveBeenCalledTimes(1);
        expect(onProcessing).toHaveBeenCalledWith('wasm');
        expect(onResult).toHaveBeenCalledWith('xin chào', 'wasm');
        vi.unstubAllGlobals();
    });
});

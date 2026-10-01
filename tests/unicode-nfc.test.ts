import { describe, it, expect } from 'vitest';
import { normalizeUnicodeNFC, searchDictionary, type DictionaryEntry } from '@/renderer/services/dictionary.service';

describe('Unicode NFC Normalization Tests', () => {
    it('normalizes decomposed NFD characters into precomposed NFC', () => {
        // 'ê' in NFD is 'e' + combining circumflex (\u0302)
        const nfd_e = 'e\u0302';
        expect(nfd_e.length).toBe(2);
        const nfc_e = normalizeUnicodeNFC(nfd_e);
        expect(nfc_e.length).toBe(1);
        expect(nfc_e).toBe('ê');

        // 'ơ' in NFD is 'o' + combining horn (\u031B)
        const nfd_o = 'o\u031B';
        expect(nfd_o.length).toBe(2);
        const nfc_o = normalizeUnicodeNFC(nfd_o);
        expect(nfc_o.length).toBe(1);
        expect(nfc_o).toBe('ơ');

        // 'ư' in NFD is 'u' + combining horn (\u031B)
        const nfd_u = 'u\u031B';
        expect(nfd_u.length).toBe(2);
        const nfc_u = normalizeUnicodeNFC(nfd_u);
        expect(nfc_u.length).toBe(1);
        expect(nfc_u).toBe('ư');
    });

    it('normalizes complex Vietnamese and Sedang words with tone marks', () => {
        // 'bơ rơ ha' in NFD
        const nfd_sedang = 'b' + 'o\u031B' + ' ' + 'r' + 'o\u031B' + ' ha';
        const nfc_sedang = normalizeUnicodeNFC(nfd_sedang);
        expect(nfc_sedang).toBe('bơ rơ ha');

        // 'khế' (starfruit / moon) in NFD ('e' + circumflex + acute)
        const nfd_khe = 'kh' + 'e\u0302\u0301';
        const nfc_khe = normalizeUnicodeNFC(nfd_khe);
        expect(nfc_khe).toBe('khế');

        // 'mặt trời' in NFD
        const nfd_mattroi = 'm' + 'a\u0306\u0323' + 't tr' + 'o\u031B\u0300' + 'i';
        const nfc_mattroi = normalizeUnicodeNFC(nfd_mattroi);
        expect(nfc_mattroi).toBe('mặt trời');
    });

    it('finds search results when query is NFD and dictionary entries are NFC', () => {
        const dictionary: DictionaryEntry[] = [
            { viet: 'xin chào', ethnic: 'bơ rơ ha' },
            { viet: 'mặt trời', ethnic: 'măt hơ ri' },
            { viet: 'nước', ethnic: 'đak' }
        ];

        // Query with NFD 'bơ rơ ha'
        const nfd_query = 'b' + 'o\u031B' + ' ' + 'r' + 'o\u031B' + ' ha';
        const results = searchDictionary(nfd_query, 'ethnic_to_viet', dictionary);

        expect(results.length).toBe(1);
        expect(results[0].viet).toBe('xin chào');
    });

    it('finds search results when dictionary entry is NFD and query is NFC', () => {
        const nfd_viet = 'm' + 'a\u0306\u0323' + 't tr' + 'o\u031B\u0300' + 'i';
        const dictionary: DictionaryEntry[] = [
            { viet: nfd_viet, ethnic: 'măt hơ ri' }
        ];

        const nfc_query = 'mặt trời';
        const results = searchDictionary(nfc_query, 'viet_to_ethnic', dictionary);

        expect(results.length).toBe(1);
        expect(results[0].ethnic).toBe('măt hơ ri');
    });

    it('handles null, undefined, or empty strings safely', () => {
        expect(normalizeUnicodeNFC('')).toBe('');
        expect(normalizeUnicodeNFC(null as unknown as string)).toBe('');
        expect(normalizeUnicodeNFC(undefined as unknown as string)).toBe('');
    });
});

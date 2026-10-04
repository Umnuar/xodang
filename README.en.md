# Xe Dang – Vietnamese Dictionary

English | [Tiếng Việt](README.md)

[![Build Status](https://img.shields.io/badge/build-passing-22c55e?style=flat-square)](https://github.com/Umnuar/xodang)
[![Tests](https://img.shields.io/badge/tests-95%2F95%20passed-34d399?style=flat-square)](https://github.com/Umnuar/xodang)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-3178c6?style=flat-square)](https://www.typescriptlang.org/)
[![PWA](https://img.shields.io/badge/PWA-offline--first-f59e0b?style=flat-square)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
[![WCAG 2.2](https://img.shields.io/badge/WCAG%202.2-AA%20%2F%20AAA-4ade80?style=flat-square)](docs/design/dark-mode-tokens.md)
[![License: MIT](https://img.shields.io/badge/license-MIT-lightgrey?style=flat-square)](LICENSE)

A bilingual dictionary and educational web application for the Xe Dang (Sedang) language, an indigenous Mon-Khmer language of the Central Highlands, Vietnam. Built as an offline-first Progressive Web App (PWA) with desktop support via Electron.

Live Application: [https://umnuar.github.io/xodang/#home](https://umnuar.github.io/xodang/#home)

---

## Key Features

* **Bidirectional Search**: Xe Dang <-> Vietnamese lookup with fuzzy matching, Unicode NFC normalization, and a dedicated virtual diacritic bar for special characters (`ơ̆`, `ŏ`, `ê̆`, `ô̆`, `ă`, `ĭ`, `ŭ`).
* **Audio & Speech**: Native pronunciation playback via WebM audio files and voice search powered by the Web Speech API.
* **Study & Examination**: Double-sided 3D flashcards, topic-based multiple-choice quizzes, and localized study progress tracking in `localStorage`.
* **Language Minigames**: 4 interactive learning games (memory matching, word catcher, target shooter, vocabulary farm) with a client-side leaderboard and canvas-rendered certificates.
* **Audio Contribution**: Browser-based audio recorder with a real-time waveform visualizer via the Web Audio API (`AudioContext` / `AnalyserNode`).
* **Offline-First Resilience**: Full asset and data caching through Service Workers, with automatic fallback to a local static dataset (`snapshot-fallback.ts`) during network loss.
* **WCAG 2.2 AA / AAA Dark Mode**: Contrast-calibrated dark palettes ("Graphite" and "Forest Midnight") with surface lightness elevation.
* **Zero Runtime Dependencies**: Authored entirely in native TypeScript and DOM APIs without frontend framework overhead, minimizing bundle size and supply chain risks.

---

## System Architecture

```text
+-----------------------------------------------------------------+
|                       Client Application Layer                  |
|    Web PWA (Service Worker Cache)   |   Desktop App (Electron)  |
+-----------------------------------------------------------------+
                                |
+-------------------------------v---------------------------------+
|                      Renderer Presentation                      |
|    Dictionary     Study & Quizzes     Games     Audio Recording |
+-----------------------------------------------------------------+
                                |
+-------------------------------v---------------------------------+
|                    Service & Data Access Layer                  |
|   DictionaryEngine   StorageService   Google Sheets API (Sync)  |
|   (Unicode NFC)      (Local v10)      (Online Live Sync)        |
+-----------------------------------------------------------------+
                                |
                                v (Fallback on network/API failure)
+-----------------------------------------------------------------+
|               Offline Static Snapshot (snapshot-fallback)       |
+-----------------------------------------------------------------+
```

---

## Directory Structure

```text
tudien-main/
├── docs/
│   └── design/                 # Design specifications, tokens.json, and theme assets
├── public/
│   ├── audio/                  # Xe Dang audio recordings (.webm)
│   ├── fonts/jakarta/          # Locally hosted Plus Jakarta Sans font
│   └── icons/                  # PWA application icons
├── scripts/
│   └── generate-snapshot.ts    # Build-time Google Sheets snapshot generator
├── src/
│   ├── main/                   # Electron main process and IPC fetcher
│   ├── preload/                # Secure Electron preload bridge
│   ├── shared/                 # Shared constants, types, and fallback data
│   └── renderer/               # Web client and renderer source
│       ├── components/         # Shared UI components (navbar, footer, modal)
│       ├── features/           # Feature modules (home, quiz, games, chat, contribute)
│       ├── services/           # Business logic (dictionary, speech, storage)
│       ├── styles/             # Modular CSS architecture
│       ├── router.ts           # Client-side hash router
│       └── main.ts             # Application bootstrap entry
├── tests/                      # Vitest automated test suite (95 tests)
├── index.html                  # HTML entry point with metadata
├── vite.config.ts              # Vite and PWA configuration
└── package.json                # Project dependencies and npm scripts
```

---

## Getting Started

### Prerequisites
* Node.js >= 18.0.0
* npm >= 9.0.0

### 1. Installation
```bash
git clone https://github.com/Umnuar/xodang.git
cd xodang
npm install
```

### 2. Environment Variables (Optional)
To connect a custom Google Sheets database, configure `.env`:
```bash
cp .env.example .env
```

Configuration entries:
```ini
VITE_GOOGLE_API_KEY=your_google_sheets_api_key
VITE_SHEET_ID=your_google_sheet_id
```

If left unconfigured, the application defaults to the bundled dictionary in `src/shared/data/snapshot-fallback.ts`.

### 3. Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### 4. Production Build
```bash
npm run build
```
Compiled production files are output to `dist/`.

---

## Automated Testing & Quality Gates

The test suite runs on Vitest with happy-dom:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

Key test coverage:
* `tests/xss-security.test.ts`: Validates XSS injection defenses.
* `tests/unicode-nfc.test.ts`: Verifies diacritic normalization and character preservation.
* `tests/memory-leak.test.ts`: Verifies listener and timer teardown during view transitions.
* `tests/legacy-storage.test.ts`: Tests `localStorage` schema migration and corrupt data recovery.
* `tests/service-worker.test.ts`: Verifies offline cache-first strategies.

---

## Desktop Packaging (Electron)

To run or package the desktop client:
```bash
# Launch in development
npm run electron:dev

# Build distributable installer
npm run electron:build
```

---

## Design System

* Design Tokens: [docs/design/dark-mode-tokens.json](docs/design/dark-mode-tokens.json)
* WCAG 2.2 Contrast Audit: [docs/design/dark-mode-tokens.md](docs/design/dark-mode-tokens.md)
* CSS Custom Properties: [docs/design/dark-mode-themes.css](docs/design/dark-mode-themes.css)

---

## Security

Security policies, supported versions, and responsible disclosure procedures are documented in [SECURITY.md](SECURITY.md).

---

## License

Distributed under the [MIT License](LICENSE).

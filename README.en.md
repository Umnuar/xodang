<div align="center">

# Xe Dang – Vietnamese Dictionary
### *Bilingual Lexical Engine & Indigenous Language Learning Platform*

[![Build Status](https://img.shields.io/badge/build-passing-22c55e?style=flat-square&logo=vite)](https://github.com/Umnuar/xodang)
[![Tests](https://img.shields.io/badge/tests-95%2F95%20passed-34d399?style=flat-square&logo=vitest)](https://github.com/Umnuar/xodang)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![PWA Ready](https://img.shields.io/badge/PWA-Offline--First-f59e0b?style=flat-square&logo=pwa)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
[![WCAG 2.2](https://img.shields.io/badge/WCAG%202.2-AA%20%2F%20AAA-4ade80?style=flat-square)](docs/design/dark-mode-tokens.md)
[![Zero Runtime Deps](https://img.shields.io/badge/dependencies-0%20runtime-blueviolet?style=flat-square)](#-system-architecture)
[![License: MIT](https://img.shields.io/badge/license-MIT-lightgrey?style=flat-square)](LICENSE)

**English** • [Tiếng Việt](README.md) • **[Live Application](https://umnuar.github.io/xodang/#home)** • **[Design Tokens](docs/design/dark-mode-tokens.md)** • **[Security](SECURITY.md)**

</div>

---

## ◈ Overview

**Xe Dang Dictionary** (`tudien-xedang`) is an educational platform and linguistic repository for the Xe Dang (Sedang) language, an indigenous Mon-Khmer language spoken in the Central Highlands of Vietnam. It is designed for middle-school learners, linguistic researchers, and independent language students.

The platform is engineered around modern software standards:
* **Zero Runtime Dependencies**: Authored entirely with native Web APIs and pure TypeScript. Eliminating runtime framework overhead ensures sub-500ms First Contentful Paint.
* **Offline-First Resilience**: Functions reliably in remote environments with intermittent connectivity through Service Worker caching and a bundled static snapshot fallback (`snapshot-fallback.ts`).
* **Phonetic Normalization**: Handles complex Mon-Khmer diacritical marks and breathy vowels via automated Unicode NFC normalization pipelines.
* **WCAG 2.2 Dark Mode**: Contrast-calibrated dark palettes ("Graphite" and "Forest Midnight") supporting accessible study under low-light conditions.

---

## ⬡ System Architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│                     Client Application Layer                     │
├────────────────────────────────┬────────────────────────────────┤
│       Web Browser (PWA)        │    Desktop Client (Electron)    │
│    (Service Worker Cache)      │       (IPC Bridge Fetcher)     │
└────────────────────────────────┴────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│               Core Presentation & Modules (Vite + TS)            │
├───────────────┬────────────────┬───────────────┬────────────────┤
│  Dictionary   │  Study & Quiz  │   Game Hub    │  Contribute    │
│  Dual Search  │ 3D Flashcards  │  4 Minigames  │ WebAudio / Mic │
└───────────────┴────────────────┴───────────────┴────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                    Service & Data Access Layer                   │
├──────────────────┬───────────────────────┬──────────────────────┤
│ DictionaryEngine │ StorageService (v10)  │ Google Sheets API    │
│  (Unicode NFC)   │ (Progress / Badges)   │ (Online Live Sync)   │
└──────────────────┴───────────────────────┴──────────────────────┘
                                │
                                ▼ [Fallback on offline or API failure]
┌─────────────────────────────────────────────────────────────────┐
│             Offline Local Snapshot (`snapshot-fallback.ts`)     │
└─────────────────────────────────────────────────────────────────┘
```

---

## ◇ Core Features

### 1. ⌕ Bidirectional Lexical Search Engine
* Bidirectional lookup: **Xe Dang → Vietnamese** and **Vietnamese → Xe Dang**.
* Integrated virtual diacritic bar for special characters: `ơ̆`, `ŏ`, `ê̆`, `ô̆`, `ă`, `ĭ`, `ŭ`.
* Voice-driven search powered by the Web Speech Recognition API.
* Concise lexical summary bar displaying definition summaries and entry counts directly above the fold.

### 2. ⎘ Study & Spaced Repetition
* **Double-sided 3D Flashcards**: Front side presents Xe Dang terms with phonetic guides; reverse side reveals definitions and context examples.
* **Topic-based Examination**: Timed quizzes, automated scoring, and real-time answer explanation feedback.
* Localized study history preserved in `localStorage` with resilient recovery against corrupted JSON.

### 3. ⊡ Gamification Hub
* **4 Interactive Minigames**:
  1. *Memory Match*: Vocabulary recall and visual matching.
  2. *Word Catcher*: Reflex-based translation pairing.
  3. *Word Shooter*: Spelling and orthographic recognition.
  4. *Vocabulary Farm*: Gamified lexical progression.
* **Automated Certificate Generation**: Client-rendered completion certificates via HTML5 Canvas.
* Privacy-preserving client-side leaderboard and achievement badges.

### 4. ⊚ Crowdsourced Audio Repository
* Bundled library of native pronunciation recordings in WebM format.
* In-browser audio recorder equipped with real-time waveform visualization via Web Audio API (`AudioContext` / `AnalyserNode`).
* Streamlined single-step download and audio removal workflows.

### 5. ◐ Mathematically Audited Dark Mode (WCAG 2.2 AA / AAA)
* Structured surface elevation model (`Canvas < Card < Raised/Input`).
* Avoids pure black `#000000` and pure white text `#ffffff`.
* Token specifications:
  * Neutral Graphite canvas: `#0f1012`
  * Card surface: `#17181b`
  * Primary text: `#e8e8ea` (**14.51:1 AAA contrast**)
  * Vibrant green accent: `#34d399` (**9.90:1 AAA contrast** with dark button labels)
* Complete specifications available in [docs/design/dark-mode-tokens.md](docs/design/dark-mode-tokens.md).

---

## ◫ Project Structure

```text
tudien-main/
├── docs/
│   └── design/                 # Design tokens, contrast audits, and theme previews
├── public/
│   ├── audio/                  # Native Xe Dang audio pronunciations (.webm)
│   ├── fonts/jakarta/          # Locally bundled Plus Jakarta Sans font
│   └── icons/                  # PWA application icons (72x72 to 512x512)
├── scripts/
│   └── generate-snapshot.ts    # Build-time Google Sheets snapshot exporter
├── src/
│   ├── main/                   # Electron main process and IPC fetcher
│   ├── preload/                # Secure Electron preload bridge
│   ├── shared/                 # Shared constants, types, and fallback snapshot
│   └── renderer/               # Web client and renderer implementation
│       ├── components/         # Common UI components (navbar, footer, modal, toast)
│       ├── features/           # Feature modules (home, quiz, games, chat, contribute)
│       ├── services/           # Domain logic (dictionary, speech, audio, storage)
│       ├── styles/             # Modular CSS architecture
│       ├── router.ts           # Client-side hash router
│       └── main.ts             # Application bootstrap entry
├── tests/                      # Vitest test suite (95 tests)
├── index.html                  # HTML entry point with metadata
├── vite.config.ts              # Vite and PWA build configuration
└── package.json                # Project configuration (zero runtime dependencies)
```

---

## ▷ Quick Start & Development

### System Requirements
* Node.js >= 18.0.0
* npm >= 9.0.0

### 1. Clone Repository
```bash
git clone https://github.com/Umnuar/xodang.git
cd xodang
```

### 2. Install Development Dependencies
```bash
npm install
```

### 3. Environment Variables (Optional)
To connect a custom Google Sheets database, configure `.env`:
```bash
cp .env.example .env
```
Configuration entries:
```ini
VITE_GOOGLE_API_KEY=YOUR_GOOGLE_API_KEY_HERE
VITE_SHEET_ID=YOUR_SHEET_ID_HERE
```
*(If unconfigured, the application seamlessly defaults to bundled static data in `src/shared/data/snapshot-fallback.ts`).*

### 4. Run Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### 5. Production Build
```bash
npm run build
```
Optimized assets are emitted to the `dist/` directory.

---

## ⊚ Quality Gates & Automated Testing

The test suite runs on Vitest with happy-dom:

```bash
# Run all 95 tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Key Test Coverage:
| Test Category | Test File | Target Invariant |
| :--- | :--- | :--- |
| **XSS Security** | `tests/xss-security.test.ts` | Enforces zero unsanitized HTML injections |
| **Unicode NFC** | `tests/unicode-nfc.test.ts` | Validates diacritic clustering and vowel preservation |
| **Memory Leaks** | `tests/memory-leak.test.ts` | Verifies timer and listener disposal on route transitions |
| **Storage Integrity** | `tests/legacy-storage.test.ts` | Tests schema migrations and corrupt data recovery |
| **Offline Reliability** | `tests/service-worker.test.ts` | Ensures correct cache-first service worker behavior |

---

## ⊞ Desktop Packaging (Electron)

Supports cross-platform desktop application packaging for Windows, macOS, and Linux:

```bash
# Run Electron in development
npm run electron:dev

# Build distributable installer packages
npm run electron:build
```

---

## ⛊ Security & Contributing

* Review security policies and vulnerability disclosure procedures in [SECURITY.md](SECURITY.md).
* All pull requests must satisfy:
  1. 100% passing test suite: `npm test`.
  2. Clean compilation and packaging: `npm run build`.
  3. No unapproved runtime dependencies.

---

## ⎘ License

Distributed under the [MIT License](LICENSE).

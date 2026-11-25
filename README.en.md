<div align="center">

# Xe Dang – Vietnamese Dictionary
### *Bilingual Lexical Platform & Indigenous Language Learning Web PWA*

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Vitest](https://img.shields.io/badge/vitest-116%20passed-22c55e?style=flat-square&logo=vitest)](tests/)
[![Rust Tooling](https://img.shields.io/badge/rust%20tests-15%20passed-f97316?style=flat-square&logo=rust)](tools/audio-optimizer/)
[![PWA Offline-First](https://img.shields.io/badge/PWA-Offline--First-f59e0b?style=flat-square&logo=pwa)](src/service-worker.ts)
[![Zero Runtime Deps](https://img.shields.io/badge/runtime%20deps-0-1e7e48?style=flat-square)](package.json)
[![WCAG 2.2](https://img.shields.io/badge/WCAG%202.2-AA%20%2F%20AAA-4ade80?style=flat-square)](docs/design/dark-mode-tokens.md)
[![License: MIT](https://img.shields.io/badge/license-MIT-lightgrey?style=flat-square)](LICENSE)

**English** • [Tiếng Việt](README.md) • **[Live Application](https://umnuar.github.io/xodang/#home)** • **[Changelog](CHANGELOG.md)** • **[Design Tokens](docs/design/dark-mode-tokens.md)** • **[Security Policy](SECURITY.en.md)**

</div>

---

## Overview

**Xe Dang Dictionary** (`tudien-xedang`) is an offline-first **Progressive Web App (PWA)** for learning, phonetically searching, and preserving the Xe Dang (Sedang) language (Mon-Khmer family, Central Highlands of Vietnam).

### Key Engineering Highlights
- **Zero Frontend Runtime Dependencies:** Authored entirely in strict TypeScript and Native Web APIs (`package.json` contains devDependencies only for type-checking, testing, and Vite bundling).
- **Route-Level Code Splitting:** Lightweight startup bundle (`83.94 kB` JS / `34.32 kB` CSS initial chunks); `quiz`, `games`, `contribute`, and `chat` load on demand or during browser idle time.
- **Hybrid Audio Pack & Offline-First Sync:**
  - `1,261` native `.webm` recordings compressed via **Rust + FFmpeg Opus VoIP 24 kbps** (`40.38 MB` → `8.23 MiB`, averaging `6.8 KB`/entry) and packed into `audio-pack.bin` + `audio-pack.index.json`.
  - First-time offline caching completes in **a single HTTP request** (`8.23 MiB`) with byte-level streaming progress into `CacheStorage` (`tudien-audio`). Subsequent vocabulary additions or re-recordings use FNV-1a hashes to download only changed/new entries.
  - Background auto-sync schedules via `requestIdleCallback` and respects offline state, Data Saver (`saveData`), and slow `2g` connections.
- **Resilient Data Layer:** Request deduplication, persistent `localStorage` fallback with Private Mode exception safety (`SecurityError` / `QuotaExceededError`), and build-time static dictionary snapshot fallback (`snapshot-fallback.ts`).
- **Unicode Phonetic Indexing:** `WeakMap`-cached search engine supporting Unicode NFC normalization, Unicode word boundaries (`\p{L}\p{N}`) across Xe Dang diacritics (`ơ̆`, `ŏ`, `ê̆`), and accent-insensitive fallback ranking.
- **Companion Rust Tooling:** Zero-dependency Rust CLI ([tools/audio-optimizer](tools/audio-optimizer/)) for audio compression/packing and an optional Axum Contribute Gateway ([services/contribute-api](services/contribute-api/)) that validates binary uploads before forwarding to Google Apps Script.

---

## System Architecture

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                    Web PWA Client (Vite + Pure TypeScript)              │
├──────────────────┬────────────────────┬─────────────────┬───────────────┤
│  Home & Search   │   Study & Quiz     │    Game Hub     │  Contribute   │
│ (Initial Chunk)  │  (Lazy Imported)   │ (Lazy Imported) │(Lazy Imported)│
└────────┬─────────┴──────────┬─────────┴────────┬────────┴───────┬───────┘
         │                    │                  │                │
         ▼                    ▼                  ▼                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        Domain & Resilience Layer                        │
├───────────────────┬──────────────────────┬──────────────────────────────┤
│ DictionaryService │ SheetsService        │ OfflineSyncService           │
│ WeakMap + NFC     │ Dedupe + LS +        │ audio-pack.bin (1 req) /     │
│ & Accent Fallback │ Build Snapshot       │ Hash Delta + Idle Auto-Sync  │
└─────────┬─────────┴──────────┬───────────┴──────────────┬───────────────┘
          │                    │                          │
          ▼                    ▼                          ▼
┌───────────────────┐  ┌───────────────────┐   ┌──────────────────────────┐
│  Service Worker   │  │ Google Sheets API │   │ Google Apps Script or    │
│  Cache-First PWA  │  │ (Online Sync)     │   │ Rust Axum Gateway (A2)   │
└───────────────────┘  └───────────────────┘   └──────────────────────────┘
```

---

## Project Structure

```text
.
├── .github/workflows/          # GitHub Actions CI & GitHub Pages deployment
├── docs/design/                # Contrast audits, CSS themes, and design tokens (WCAG 2.2)
├── public/
│   ├── audio/                  # Native pronunciation recordings (1,261 .webm, 2 .mp3)
│   ├── fonts/jakarta/          # Locally bundled Plus Jakarta Sans font files
│   ├── icons/                  # PWA application icons (48x48 to 512x512)
│   ├── audio-pack.bin          # Consolidated binary pack for single-request offline sync
│   ├── audio-pack.index.json   # Byte offset, length, and FNV-1a hash manifest
│   ├── manifest.json           # Web App Manifest
│   └── offline.html            # Standalone offline fallback page
├── scripts/
│   └── generate-snapshot.ts    # Build-time Google Sheets static snapshot generator
├── services/contribute-api/    # Optional Rust Axum server for binary upload & forwarding
├── src/
│   ├── components/             # Navbar, install modal, offline-indicator, toast, footer
│   ├── features/               # home, quiz, games (4 minigames + certificates), contribute, chat, onboarding
│   ├── services/               # dictionary, sheets, offline-sync, quiz, faq, speech, storage
│   ├── shared/                 # Config constants, storage keys, and snapshot fallback
│   ├── styles/                 # Tokenized CSS & route-split feature stylesheets
│   ├── utils/                  # Event bus & inline Lucide SVG icon helpers
│   ├── router.ts               # Client-side hash router
│   ├── service-worker.ts       # PWA Service Worker with versioned cache eviction
│   └── main.ts                 # Application entry point & route lazy-loader
├── tests/
│   ├── unit/                   # Unit suites: audio, faq, NFC search, router, storage
│   ├── features/               # Feature suites: contribute, games, quiz, onboarding
│   ├── integration/            # Integration suites: Service Worker, memory leaks, design audit
│   ├── security/               # Security suites: XSS & smoke guards (allowlist, secrets, referrer)
│   └── fixtures/               # Golden baseline search & shared test fixtures
├── tools/audio-optimizer/      # Zero-dep Rust CLI for Opus encoding & pack generation
├── CHANGELOG.md                # Release history following Keep a Changelog
├── index.html                  # HTML shell with SEO & Schema.org metadata
├── package.json                # Project scripts & devDependencies
├── tsconfig.json               # Strict TypeScript compiler configuration
├── tsconfig.node.json          # Type checks for Vite/Vitest config files
├── vite.config.ts              # Vite build, CSP injection & snapshot virtual resolver
└── vitest.config.ts            # Vitest + happy-dom test setup
```

---

## Quick Start

### Prerequisites
- **Web PWA:** Node.js `>= 18.0.0`, npm `>= 9.0.0`
- **Rust Tooling (optional for audio optimization or contribute backend):** `rustc` / `cargo`, `ffmpeg` & `ffprobe`

### 1. Setup & Run Web PWA
```bash
git clone https://github.com/Umnuar/xodang.git
cd xodang
npm ci
```

Copy `.env.example` if using a custom Google Sheet or Contribute API endpoint:
```bash
cp .env.example .env
```
```ini
VITE_GOOGLE_API_KEY=YOUR_GOOGLE_SHEETS_API_KEY_HERE
GOOGLE_SHEETS_API_KEY=YOUR_GOOGLE_SHEETS_API_KEY_HERE
VITE_SHEET_ID=YOUR_GOOGLE_SHEET_ID_HERE
VITE_CONTRIBUTE_API_URL=https://YOUR_CONTRIBUTE_API_DOMAIN/api/contributions
```
*(When `VITE_CONTRIBUTE_API_URL` is omitted, submissions fall back cleanly to the configured Google Apps Script endpoint).*

```bash
# Development server at http://localhost:3000
npm run dev

# Production build into dist/ (with strict CSP meta tag injection)
npm run build
npm run preview
```

### 2. Rust Audio Optimizer & Pack CLI (`tools/audio-optimizer`)
```bash
# Transcode WebM recordings to Opus VoIP 24 kbps + loudnorm (keeps originals if not smaller)
cargo run --release --manifest-path tools/audio-optimizer/Cargo.toml -- --input public/audio --bitrate 24k

# Bundle all .webm recordings into audio-pack.bin + audio-pack.index.json
cargo run --release --manifest-path tools/audio-optimizer/Cargo.toml -- --input public/audio --pack --pack-out public
```

### 3. Rust Axum Contribute Gateway (`services/contribute-api`, Optional)
```bash
cp services/contribute-api/.env.example services/contribute-api/.env
cargo run --release --manifest-path services/contribute-api/Cargo.toml
```
Docker support is included via [services/contribute-api/Dockerfile](services/contribute-api/Dockerfile).

---

## Quality Gates & Testing

```bash
# TypeScript type checking (app + config)
npx tsc --noEmit
npx tsc -p tsconfig.node.json --noEmit

# Run all 116 Vitest tests (16 files)
npm test

# Run all 15 Rust unit & integration tests (7 CLI + 8 Axum API)
cargo test --manifest-path tools/audio-optimizer/Cargo.toml
cargo test --manifest-path services/contribute-api/Cargo.toml
```

### Automated Test Coverage Highlights
| Suite | File | Guarantees Verified |
| :--- | :--- | :--- |
| **XSS Prevention** | [tests/security/xss-security.test.ts](tests/security/xss-security.test.ts) | DOM API (`textContent`) rendering across search, chat, quiz, leaderboards, badges & certificates |
| **Phonetic NFC & Search** | [tests/unit/unicode-nfc.test.ts](tests/unit/unicode-nfc.test.ts), [tests/unit/golden-search.test.ts](tests/unit/golden-search.test.ts) | Unicode diacritic clustering, exact-match parity & accent-insensitive fallback |
| **Audio Pack & Upload** | [tests/unit/audio.test.ts](tests/unit/audio.test.ts) | Single-request binary pack unpack, hash delta sync, auto-download gating, `FormData` & fallback upload |
| **Memory & Timer Cleanup** | [tests/integration/memory-leak.test.ts](tests/integration/memory-leak.test.ts) | Cleanup of `requestAnimationFrame`, timeouts, timers, and mic streams across route transitions |
| **Storage Resilience** | [tests/unit/legacy-storage.test.ts](tests/unit/legacy-storage.test.ts) | Legacy schema migration & safe handling of `SecurityError` / `QuotaExceededError` / malformed JSON |
| **SW & Config Guards** | [tests/integration/service-worker.test.ts](tests/integration/service-worker.test.ts), [tests/security/smoke.test.ts](tests/security/smoke.test.ts) | Audio cache preservation, `audio-pack.*` cache bypass, `ALLOWED_SHEET_RANGES` enforcement |

---

## Security & Contributing

- Security policies, architectural controls, and private disclosure procedures are documented in [SECURITY.en.md](SECURITY.en.md) ([Tiếng Việt](SECURITY.md)).
- Pull Requests must:
  1. Pass `npx tsc --noEmit` and `npx tsc -p tsconfig.node.json --noEmit` with zero errors.
  2. Pass `npm test` and `npm run build`.
  3. Introduce zero unapproved frontend runtime dependencies.

---

## License

Licensed under the [MIT License](LICENSE).

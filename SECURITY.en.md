<div align="center">

# Security Policy
### *Application Security Architecture & Coordinated Vulnerability Disclosure*

[![Security Policy](https://img.shields.io/badge/Security_Policy-Active-22c55e?style=flat-square&logo=shield)](https://github.com/Umnuar/xodang/security)
[![Private Reporting](https://img.shields.io/badge/Reporting-GitHub_Private_Advisory-3b82f6?style=flat-square&logo=github)](https://github.com/Umnuar/xodang/security/advisories/new)
[![Severity Standard](https://img.shields.io/badge/Severity-CVSS_v3.1-6366f1?style=flat-square)](https://www.first.org/cvss/)

**English** • [Tiếng Việt](SECURITY.md) • **[Create Private Advisory](https://github.com/Umnuar/xodang/security/advisories/new)**

</div>

---

The **Xe Dang – Vietnamese Dictionary** project (`tudien-xedang`) is committed to protecting community linguistic assets and end-user safety by aligning with **OWASP ASVS** principles across the Web PWA frontend and optional Rust backend tooling.

---

## 1. Supported Versions

| Version | Supported | Release Scope | Maintenance Policy |
| :---: | :---: | :--- | :--- |
| **10.0.x** | Yes | Production Web PWA + Rust Audio Optimizer & Axum Gateway (`services/contribute-api`) | P0/P1 security patches shipped on `main` |
| **< 10.0.0** | No | Legacy releases | End of life; upgrade to latest `main` |

---

## 2. Reporting a Vulnerability

### Preferred Disclosure Channel
Submit vulnerability reports privately via **GitHub Private Security Advisory**:
- **[Create a Private Security Advisory](https://github.com/Umnuar/xodang/security/advisories/new)**

> [!WARNING]
> **Do not** disclose security issues or functional exploits in public GitHub issues, pull requests, or discussions prior to a coordinated fix.

### Required Report Details
1. **Vulnerability Category:** CWE ID or OWASP classification (e.g., `CWE-79` XSS, `CWE-434` Unrestricted File Upload, `CWE-22` Path Traversal).
2. **Affected Surface:** File path or module (`src/*`, `src/service-worker.ts`, `services/contribute-api/*`, CI workflows).
3. **Minimal Reproduction (PoC):** Clear, non-destructive steps demonstrating the impact without touching real user data.
4. **Estimated Severity:** Approximate **CVSS v3.1** vector/score and prerequisites.

### Good-Faith Research (Safe Harbor)
Maintainers will not pursue legal action against researchers who conduct good-faith testing within scope, avoid data destruction, refrain from automated volumetric attacks, respect user privacy, and allow reasonable remediation time before public disclosure.

### Out of Scope
- Public browser-side Google Sheets read-only API keys intended to be domain-restricted via Google Cloud HTTP Referrer rules (`https://umnuar.github.io/xodang/*`).
- Issues requiring obsolete browsers lacking ES2022 or `CacheStorage` support.
- Volumetric spam or DoS/DDoS testing against GitHub Pages or Google Apps Script endpoints.

---

## 3. Target Response SLA

| Severity (CVSS v3.1) | Score | Initial Acknowledgment | Target Patch Release |
| :--- | :---: | :---: | :--- |
| **Critical** | 9.0 – 10.0 | ≤ 24 hours | ≤ 48 hours |
| **High** | 7.0 – 8.9 | ≤ 48 hours | ≤ 72 hours |
| **Medium** | 4.0 – 6.9 | ≤ 72 hours | 7–14 days |
| **Low** | 0.1 – 3.9 | ≤ 5 days | Next scheduled release |

---

## 4. Implemented Architectural Defenses

### 4.1. Supply Chain Hardening
- **Zero Frontend Runtime Dependencies:** [package.json](package.json) declares zero `dependencies`; production client bundles ship pure compiled TypeScript with no third-party runtime npm packages.
- **Deterministic Installs:** Reproducible builds backed by `npm ci` ([package-lock.json](package-lock.json)) and pinned Rust `Cargo.lock` manifests.

### 4.2. Content Security Policy (CSP) & Referrer Policy
- Production builds in [vite.config.ts](vite.config.ts) automatically inject a strict `<meta http-equiv="Content-Security-Policy">` tag into `dist/index.html`:
  - `default-src 'self'`, `script-src 'self' 'wasm-unsafe-eval' https://cdn.jsdelivr.net`, `worker-src 'self' blob:`, `frame-src 'none'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`.
  - Explicit `connect-src` allowlist (`'self'`, `https://sheets.googleapis.com`, `https://script.google.com`, `https://script.googleusercontent.com`, `https://cdn.jsdelivr.net`, `https://huggingface.co`, `https://cdn-lfs*.hf.co`, plus the origin of `VITE_CONTRIBUTE_API_URL` when configured).
- [index.html](index.html) enforces `<meta name="referrer" content="strict-origin-when-cross-origin">`.

### 4.3. Client-Side DOM XSS Mitigation
- Dictionary entries, chat replies, leaderboards, badges, completion certificates, and upload queues are rendered through safe DOM APIs (`document.createElement` + `textContent`) rather than unescaped `innerHTML` string interpolation.
- Enforced via automated regression checks in [tests/security/xss-security.test.ts](tests/security/xss-security.test.ts).

### 4.4. Storage Safety & Credential Hygiene
- All browser storage access flows through [src/services/storage.service.ts](src/services/storage.service.ts), catching `SecurityError`, `QuotaExceededError`, and corrupt JSON without crashing ([tests/unit/legacy-storage.test.ts](tests/unit/legacy-storage.test.ts)).
- Hardcoded fallback API secrets are prohibited and checked by [tests/security/smoke.test.ts](tests/security/smoke.test.ts); `.env*` files are excluded via [.gitignore](.gitignore).

### 4.5. Service Worker Isolation
- [src/service-worker.ts](src/service-worker.ts) caches only `same-origin` assets and audio resources, evicts stale versioned caches on activation while preserving `tudien-audio` and `tudien-stt-runtime`, and explicitly bypasses SW caching for `/audio-pack.bin` and `/audio-pack.index.json` to ensure accurate hash-delta verification ([tests/integration/service-worker.test.ts](tests/integration/service-worker.test.ts)).
- The `tudien-stt-runtime` cache strictly allowlists `https://cdn.jsdelivr.net` requests matching `transformers` or `onnxruntime-web`.

### 4.6. Rust Contribute Gateway Controls (`services/contribute-api`)
When deploying the optional [services/contribute-api](services/contribute-api/) backend:
- **Hard Payload Limit:** Rejects uploads exceeding `MAX_UPLOAD_BYTES` (default `10 MB`) with HTTP `413`.
- **Magic-Byte Validation:** Ignores client file extensions/MIME claims and validates actual binary headers (`WebM`, `MP4/M4A`, `OGG`, `MP3`, `WAV`, `FLAC`), returning HTTP `415` for spoofed HTML/scripts/executables.
- **Path Traversal Prevention:** Strips directory separators and normalizes filenames before touching disk storage.
- **Rate Limiting, CORS & Least Privilege:** Per-IP sliding-window throttling (`429`), configurable `ALLOWED_ORIGINS`, and non-root Docker execution (`appuser`).

---

## 5. Emergency Key Rotation Protocol

If a Google Sheets API key or CI secret is suspected of exposure:
1. Revoke the affected key immediately in Google Cloud Console.
2. Issue a replacement key restricted strictly to read-only Sheets API access and authorized HTTP Referrers.
3. Update `VITE_GOOGLE_API_KEY` in GitHub Repository Secrets and re-run the deployment workflow.
4. Audit Cloud Console usage metrics for anomalous requests.

---

<div align="center">
  <sub>Strong security fundamentals safeguard long-term cultural preservation.</sub>
</div>

<div align="center">

# Security Policy
### *Application Security Standards & Vulnerability Disclosure Program*

[![Security Status](https://img.shields.io/badge/Security_Policy-Active-22c55e?style=flat-square&logo=shield)](https://github.com/Umnuar/xodang/security)
[![Vulnerability Reporting](https://img.shields.io/badge/Vulnerability_Reporting-Private_Advisory-3b82f6?style=flat-square&logo=github)](https://github.com/Umnuar/xodang/security/advisories/new)
[![Response SLA](https://img.shields.io/badge/Response_SLA-%3C_48h-f59e0b?style=flat-square)](https://github.com/Umnuar/xodang)
[![CVSS Standard](https://img.shields.io/badge/Severity_Standard-CVSS_v3.1-6366f1?style=flat-square)](https://www.first.org/cvss/)

**English** • [Tiếng Việt](SECURITY.md) • **[Create Private Advisory](https://github.com/Umnuar/xodang/security/advisories/new)**

</div>

---

The **Xe Dang – Vietnamese Dictionary** project (`tudien-xedang`) is committed to safeguarding indigenous cultural data and ensuring user safety by adhering to **OWASP ASVS** guidelines and international software security best practices.

This document outlines supported versions, architectural defense models, and **Responsible Disclosure** procedures.

---

## 1. ⬡ Supported Versions

We provide scheduled security maintenance and security patches according to the following support lifecycle:

| Version | Supported | Status | Patch Strategy |
| :---: | :---: | :---: | :--- |
| **10.0.x** | Yes | Active Production Release (PWA & Electron) | Critical P0/P1 patches within 24–72 hours |
| **< 10.0.0** | No | Legacy Release | End of life; upgrade recommended |

---

## 2. ⛊ Reporting a Vulnerability

If you discover a security vulnerability in the codebase or deployed infrastructure, please follow our **Responsible Disclosure** guidelines:

### ▷ Preferred Channel (Recommended on GitHub)
Submit a private report using **GitHub Private Vulnerability Reporting**:  
▷ **[Create Private Security Advisory](https://github.com/Umnuar/xodang/security/advisories/new)**

> [!WARNING]
> **Please do not** open public issues, public pull requests, or public comments containing exploit payloads prior to an official coordinated release.

### ▷ Information to Include in Your Report:
1. **Vulnerability Classification**: CWE identifier or OWASP Top 10 category (e.g., *CWE-79: Cross-site Scripting*, *CWE-200: Information Disclosure*).
2. **Affected Scope**: Impacted module (search engine, quiz module, games hub, service worker, or Electron process).
3. **Step-by-step Reproduction (Proof of Concept - PoC)**:
   * Explicit sequence of reproduction steps.
   * Sample non-destructive input payload or URL parameter.
4. **Severity Assessment (CVSS v3.1 Calculator)**: Estimated score and practical exploitability.
5. **Proposed Remediation (Optional)**: Suggested code fix or mitigation strategy.

---

## 3. ▷ Response & Remediation SLA

```text
[Report Received] 
       │
       ▼ (≤ 24 hours)
[Initial Triage & PoC Validation]
       │
       ▼ (≤ 72 hours)
[CVSS v3.1 Scoring & Internal Security Branch Created]
       │
       ▼ (7–14 days)
[Automated Regression Testing (Vitest) & Verified Build]
       │
       ▼
[Patch Deployed & Coordinated Security Advisory Published]
```

### Response Time Commitments:
| Severity (CVSS v3.1) | Score | Initial Acknowledgment | Patch Release SLA |
| :--- | :---: | :---: | :---: |
| **Critical** | 9.0 – 10.0 | < 12 hours | **Within 24 hours** |
| **High** | 7.0 – 8.9 | < 24 hours | **Within 72 hours** |
| **Medium** | 4.0 – 6.9 | < 48 hours | Within 7 days |
| **Low** | 0.1 – 3.9 | < 72 hours | Next regular release |

---

## 4. ⊞ Threat Model & Architectural Defenses

The system implements Defense-in-Depth across multiple application tiers:

### 4.1. Supply Chain Defense
* **Zero Runtime Dependencies**: No third-party packages are imported at runtime. The browser client is authored purely in native TypeScript compiled to ESM.
* **Security Impact**: Eliminates attack surfaces related to npm account takeovers, typosquatting, dependency confusion, or malicious sub-dependencies.

### 4.2. Client-Side XSS & Injection Mitigation
* Lexical and user-entered text is never directly interpolated into unescaped `innerHTML`.
* Safe DOM construction via `textContent` and `document.createElement` is mandatory.
* Enforced continuously by automated regression tests in [`tests/xss-security.test.ts`](tests/xss-security.test.ts).

### 4.3. Google Sheets API Credential Protection
* **Least Privilege**: The Google Sheets API key is granted strictly read-only access.
* **HTTP Referrer Restriction**: Keys are constrained within Google Cloud Console to authorized domain referrers (`hoctiengxodang.online/*`).
* **Offline Snapshot Resilience**: On network failure or quota exhaustion, the app gracefully falls back to bundled static data (`src/shared/data/snapshot-fallback.ts`) without leaking credentials or error traces.
* **Environment Variable Hygiene**: Production `.env` files are strictly excluded via `.gitignore`. Only `.env.example` is committed.

### 4.4. Service Worker Sandboxing
* CacheStorage is restricted to same-origin resources and pre-approved media assets.
* Built-in versioned cache eviction routines prevent cache poisoning across deployments.

---

## 5. ⊚ Emergency Key Rotation Protocol

In the event of suspected key compromise or accidental exposure:
1. **Immediate Revocation**: Deactivate the compromised key in Google Cloud Console without delay.
2. **Issue Replacement Key**: Generate a new credential and enforce domain referrer constraints.
3. **Update Secrets**: Update production environment secrets in GitHub Actions and hosting environments.
4. **Audit Access Logs**: Review Cloud Console metrics to detect anomalous traffic patterns.

---

## 6. ◈ Security Hall of Fame

We gratefully recognize security researchers and developers who practice responsible disclosure to protect the Xe Dang linguistic archive and its community of learners.

*Eligible security contributors will be credited in our official release notes and documentation.*

---

<div align="center">
  <sub>Information security is the bedrock of enduring cultural preservation.</sub>
</div>

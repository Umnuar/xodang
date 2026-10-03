---
trigger: always_on
description: Consult the graft context graph at graft/ for code intelligence, symbol search, and architecture mapping.
---

## graft

This project has a graft context graph under `graft/`.

Rules:
- For code navigation, searching, and architecture questions:
  1. Use `graft ask "<query>"` to locate relevant symbols, files, and exact line ranges.
  2. Use `graft callers <symbol>` to inspect callers and call hierarchies ($0, no LLM).
  3. Use `graft skeleton <file>` to view API signatures, exports, and line spans without reading the whole file.
  4. Use `graft grep "<pattern>"` for regex search grouped by enclosing symbol and ranked by coupling.
  5. Use `graft map` for high-level repository orientation and hub identification.
- After modifying code files, run `graft build --follow-nested-repos` to keep the context graph current.

---
name: tailwind-4-docs
description: Use when answering Tailwind CSS v4 questions, choosing utilities or variants, configuring v4, or migrating v3→v4 with an official docs snapshot and gotcha checks.
---

# Tailwind 4 Docs

## Overview

Navigate the synced Tailwind v4 docs snapshot for official guidance. Upstream is source-available, not open-source: initialize locally and respect the license; setup lives in `AGENTS.md` (AI tooling).

## Workflow

1. Ensure `references/docs/` and `references/docs-index.tsx` exist and are under a week old; if not, initialize per `AGENTS.md`.
2. Find the slug in `references/docs-index.tsx`; load only that file from `references/docs/`.
3. For implementation, refactor, or review, also load `references/engineering-playbook.md`.
4. Apply guidance; flag breaking changes.

If blocked, fall back to `references/gotchas.md` (plus the playbook for implementation) and ask for official docs.

## Entry points

Si no inicializado (`references/docs/` ausente, `docs-source.txt` con `Status: Not initialized`), solo existen 3 ficheros (`docs-source.txt`, `engineering-playbook.md`, `gotchas.md`); ejecuta el script con `--accept-docs-license` (ver Update) e ignora las filas marcadas *post-init*.

| Need | Read | When |
| --- | --- | --- |
| Migration *(post-init)* | `references/docs/upgrade-guide.mdx`, `references/docs/compatibility.mdx` | v3→v4 or browser/tooling support |
| Implement, refactor, review | `references/engineering-playbook.md` | Writing or judging Tailwind code |
| Gotchas | `references/gotchas.md` | Quick pitfall scan |
| Config, directives, theme *(post-init)* | `references/docs/functions-and-directives.mdx`, `references/docs/theme.mdx` | `@theme`, `@utility`, `@import`, custom CSS |
| Variants, responsive *(post-init)* | `references/docs/hover-focus-and-other-states.mdx`, `references/docs/responsive-design.mdx` | State variants, breakpoints |

## References

- [docs/](references/docs/) *(post-init)* — generated MDX snapshot.
- [docs-index.tsx](references/docs-index.tsx) *(post-init)* — generated slug map.
- [docs-source.txt](references/docs-source.txt) — upstream repo, commit, date.
- [engineering-playbook.md](references/engineering-playbook.md) — implementation guide, abstraction ladder, review checklist, MDX notes.
- [gotchas.md](references/gotchas.md) — v4 pitfalls and migration checklist.

## Update

Refresh via `python .agents/skills/tailwind-4-docs/scripts/sync_tailwind_docs.py --accept-docs-license` (`--local-repo` for a clone). Setup in `AGENTS.md`.

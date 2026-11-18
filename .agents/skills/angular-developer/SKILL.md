---
name: angular-developer
description: Use when writing or reviewing Angular code: components, signals, forms, DI, routing, rendering, styling, accessibility, testing, or CLI tooling. Load the matching reference before editing.
license: MIT
metadata:
  author: Copyright 2026 Google LLC
  version: '1.0'
---

# Angular Developer Guidelines

Follow `AGENTS.md` for version checks, build/lint/test commands, and conventions; never assume a version or a command — verify with `AGENTS.md` and `ng version`.

Scaffold with the Angular CLI; prefer standalone APIs, signals, native control flow, and `AGENTS.md` conventions.

References are self-contained: read the one matching the task; load another only if it spans areas.

## References

- [components-and-templates.md](references/components-and-templates.md) — Component anatomy, inputs/outputs, host bindings, queries, projection, `@defer`, pipes, naming. Read when changing components, templates, or their data flow.
- [reactivity-and-http.md](references/reactivity-and-http.md) — `signal`, `computed`, `linkedSignal`, `resource`/`httpResource`, `effect`, `provideHttpClient`, interceptors. Read when managing state, fetching data, or debugging reactivity.
- [forms.md](references/forms.md) — Signal Forms, reactive and template-driven forms. Read when changing a form; prefer Signal Forms on v22+.
- [dependency-injection.md](references/dependency-injection.md) — `inject()`, services, providers, `InjectionToken`, injection context, hierarchical injectors. Read when wiring dependencies or debugging providers.
- [routing.md](references/routing.md) — Route definitions, lazy loading, outlets, navigation, guards, resolvers, router events. Read when adding routes, navigation, access control, or prefetching.
- [rendering.md](references/rendering.md) — CSR vs SSG vs SSR, prerendering, hydration, server-compatible code. Read when choosing or debugging a rendering mode.
- [styling-and-animations.md](references/styling-and-animations.md) — Component styles and encapsulation, Tailwind CSS, animations, view transitions. Read when styling or adding motion.
- [accessibility.md](references/accessibility.md) — Angular Aria headless directives, WAI-ARIA patterns, styling ARIA states. Read when building accessible widgets (accordion, menu, tabs, combobox, grid).
- [testing.md](references/testing.md) — Vitest and TestBed, harnesses, `RouterTestingHarness`, E2E. Read when writing or fixing tests.
- [tooling.md](references/tooling.md) — New-app scaffolding (`ng new` flags), CLI workflows, migrations, Angular MCP server, environment config. Read when creating, scaffolding, upgrading, or configuring.

## Deep dives

Docs: angular.dev/guide/components, angular.dev/guide/routing.

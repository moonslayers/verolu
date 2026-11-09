---
name: horario-tema-persistencia
description: "Use when touching light/dark/system theme, Dexie persistence, or first-paint flash. Covers theme service, app initializer, pre-paint script and theme-color."
---

# Horario tema y persistencia

Ámbito: `src/app/core/theme/`, `app.config.ts`, `src/index.html`, tokens dark en `src/styles.css`.

## Dexie
DB `verolu-db`, tabla `settings`, clave `themePreference` (light|dark|system). Solo se persiste el tema; el horario sigue en constantes.

## ThemeService
Default `system`; resuelve con `matchMedia`; escucha cambios SOLO en modo system; limpia listener con `DestroyRef`; `init()` idempotente y listener único.

## Aplicación
Clase `dark` en `<html>`, `color-scheme` y un único meta `theme-color` (sin `media`).

## Arranque
Script inline pre-paint aplica system; `provideAppInitializer` espera `init()` con race de 400 ms; si IndexedDB falla, arranca en system sin errores.

## Tests
`src/test-setup.ts` con `fake-indexeddb/auto`; DB limpia y conexión cerrada por test; sin esperas arbitrarias.

## Pitfalls
- IndexedDB asíncrono puede provocar flash.
- No usar `localStorage`.
- No dejar metas `theme-color` con `media`.
- No romper el fallback.

## Verificación
Persistencia tras recarga, cambio en vivo en system, fallback sin IndexedDB.

---
name: horario-pwa-actualizaciones
description: 'Use when changing PWA updates, the service worker version prompt, Android stale installs, or the update toast. Covers triggers, dedupe, reload fallback and E2E.'
---

# Horario PWA actualizaciones

Ámbito: `src/app/core/pwa/`, `src/app/shared/toast/`, `app.config.ts`, `DESIGN.md` ("Avisos y toasts"), `ngsw-config.json`.

## Modelo mental

Hash routing ⇒ sin navegaciones reales el SW no re-chequea solo. `UpdateService` escucha `SwUpdate.versionUpdates`: `VERSION_READY` → toast persistente por hash; `unrecoverable` → assertive no descartable. Triggers: `visibilitychange` visible, `pageshow`, `online`, intervalo 60 min tras `isStable` (fallback 30 s). Throttle 60 s solo tras chequeo exitoso. `Actualizar` = `activateUpdate()` tolerante + `reload()` con fallback "No se pudo recargar…". `Más tarde` = silencio de sesión para ese hash, se reevalúa al siguiente arranque (no es snooze). SW solo en producción (`!isDevMode()`) con `registerWhenStable:30000`, no se cambia.

## Archivos clave

- `update.service.ts`: orquestación, dedupe por hash, throttle, fallback de reload.
- `pwa-window.ts`: token `WINDOW` para reload/eventos testeables.
- `toast.service.ts`: `show/dismiss/clear`, máx. 3 con persistentes protegidos.
- `toast-outlet.ts`: live regions, "Más tarde"/"Cerrar", placement.
- `app.config.ts`: segundo `provideAppInitializer` no bloqueante.
- `DESIGN.md`: contrato visual/a11y y semántica.

## Reglas

- Nunca recargar sin acción del usuario.
- No tocar `ngsw-config.json`, `registerWhenStable` ni `enabled` sin justificar.
- `SwUpdate` opcional + guard `isEnabled`.
- En tests usar fakes, no un SW real.
- No usar `localStorage` para coordinar pestañas (regla de dominio).
- Copy en español y tokens de `DESIGN.md`.

## Pitfalls

- Dedupe por hash ≠ snooze: no borres el hash al descartar.
- Un fallo offline no debe consumir el throttle.
- `location.reload` no es mockeable en jsdom: usa `WINDOW`.
- GH Pages cachea `ngsw.json` (~10 min).
- Multi-pestaña: dedupe por pestaña; `Actualizar` solo recarga la activa.

## Router

| Necesidad                                        | Referencia                               |
| ------------------------------------------------ | ---------------------------------------- |
| Probar una actualización real de punta a punta   | `references/prueba-actualizacion-e2e.md` |
| Tocar el contrato de toasts, su a11y o el outlet | `references/toast-contrato.md`           |

## Verificación

Comandos obligatorios: los de `AGENTS.md`. La prueba manual está en `references/prueba-actualizacion-e2e.md`.

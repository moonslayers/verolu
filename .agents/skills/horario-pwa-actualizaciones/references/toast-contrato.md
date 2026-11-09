# Contrato de toasts

## API pública de `ToastService`

- `show(options)` → id numérico.
- `dismiss(id)` idempotente.
- `clear()` cancela timers y vacía.
- `toasts` readonly signal.

## Opciones y defaults

- `message` (requerido).
- `action`: `{ label, callback }`.
- `dismissible` (default `true`).
- `politeness`: `polite` | `assertive` (default `polite`).
- `durationMs`: ms; `0` = persistente (default `5000`).
- `variant`: `neutral` | `danger` (default `neutral`).

## Comportamiento

- IDs monotónicos (`++counter`).
- `dismiss` idempotente (no-op si no existe).
- Timers cancelables; `clear` cancela todos.
- `DestroyRef` limpia en destrucción.
- Máximo 3 toasts; persistentes (`durationMs === 0`) se protegen y puede excederse.
- `show` emite una sola vez.

## Outlet

- Dos live regions siempre montadas: `role="status"`/`aria-live="polite"` y `role="alert"`/`aria-live="assertive"`.
- `aria-atomic="false"` para anunciar solo la tarjeta nueva.
- "Más tarde" solo con acción + dismissible; "Cerrar" sin acción.
- No robar foco.
- Placement: `bottom-[calc(56px+env(safe-area-inset-bottom)+12px)] md:bottom-6`, `z-50`, `pointer-events`, `data-print="hide"`.
- Botones ≥44 px, foco visible, AA.

## Tests

- Vitest con fake timers y restauración en `afterEach`.
- Callback de acción que lanza debe descartar el toast (`try/finally`).
- Sin esperas arbitrarias.

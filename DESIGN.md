# Verolu — Diseño

## Propósito y usuario primario
Horario semanal de Informática de la Prof. Verónica Luna Hernández para consulta rápida en navegador y como PWA instalada. **Usuario primario**: estudiantes que necesitan saber dónde y cuándo es la siguiente clase; **usuario secundario**: la profesora.

## Dirección — tablero de wayfinding cálido (B amigable)
Wayfinding cálido, legible a 16 px, sin ruido visual. Paleta papel/tinta + terracota como acento de acción, superficies cálidas y divisor sutil. Tipografía display con contraste alto y jerarquía tipográfica explícita (`text-display`/`h1`/`h2`/`body`/`caption` + `font-numeric` para horarios). Superficies con borde sutil y radio `card/chip/pill`, sombra solo como trazo `shadow-card`. Mobile-first, contenido primero, controles discretos. No es Bitácora A: no hay textura editorial ni cabecera pesada, prima la orientación rápida (hora grande, placa salón, badge Hoy/Ahora).

## Navegación
2 destinos primarios **Hoy** y **Horario** + **Ajustes** por engranaje en cabecera. En `/ajustes` el engranaje se sustituye por acción **Volver** ( `Location.back()` con fallback a `/hoy`). Sin tercer tab. Desktop: `header nav.hidden md:flex` con contenedor `border-divider rounded-[10px]` y 2 placas `aria-current="page"` con fondo `bg-accent`. Móvil: bottom bar `fixed md:hidden` con 2 placas `flex-1 min-h-[56px]` y filete `w-px bg-divider`; sin Ajustes. Ambas nav usan `ariaCurrentWhenActive="page"`.

## Tokens
Definidos en `src/styles.css` (`@theme`) y `:root`/`.dark`.

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `--surface` | `#faf7f0` | `#141210` | Fondo página |
| `--surface-muted` | `#f3eee4` | `#1e1b18` | Tarjetas / inputs / hero |
| `--surface-raised` | `#fffdf8` | `#26221e` | Elevación (toolbar, celdas salón) |
| `--foreground` | `#1c1917` | `#f5f0e6` | Texto principal (AA 16.3 claro, 16.4 oscuro) |
| `--foreground-muted` | `#57534e` | `#c9bfb0` | Texto secundario (AA 7.1/~9) |
| `--border` | `#e3dccf` | `#3a342c` | Bordes de tarjetas/tabla |
| `--divider` | `#ece6d9` | `#3a342c` | Divisores y filetes (header, tabs) |
| `--accent` | `#c2410c` | `#fb923c` | Enlaces, foco, CTA (AA 4.8 claro sobre `--surface`, 8.2 oscuro) |
| `--shift-morning` | `#0f766e` | `#5eead4` | Turno mañana |
| `--shift-afternoon` | `#b45309` | `#fcd34d` | Turno tarde |
| `--font-numeric` | `ui-monospace, SFMono-Regular, Menlo` | — | Horas con `tabular-nums` |
| `--radius-card` | `14px` | — | Tarjetas / tabla |
| `--radius-chip` | `10px` | — | Chips / inputs |
| `--radius-pill` | `999px` | — | Pills / progreso |
| `--shadow-card` | `0 0 0 1px var(--border)` | — | Trazo sutil |
| `mark` búsqueda | `bg-amber-200/text-zinc-900` claro, `bg-amber-300` oscuro | — | Contraste 14.2/12.2 |

Tokens adicionales en print: mañana `bg #ccfbf1 / text #134e4a` (8.4), tarde `bg #fef3c7 / text #78350f` (8.1).

## Tipografía
- **Display**: `Fraunces Variable` 100–900, `font-display` (WOFF2 variable, 13 kB con `unicode-range` latino, `display:swap`). Sin `<link rel="preload">`: la fuente se sirve una sola vez desde `media/` (hash del build) y `font-display: swap` cubre la carga. Fallback `ui-serif, Georgia`.
- **Numérica**: `font-numeric` (`ui-monospace`) + `tabular-nums` para horas; no salta el layout.
- Escala: `display 56/60` (64 en md para hero Hoy), `h1 32/36`, `h2 24/30`, `body 16/26`, `caption 13/18`. Titulares `font-semibold/bold` con `tracking-tight`; etiquetas con `uppercase tracking-widest 12px`.

## Composición por página
- **App shell** (`src/app/app.html`): skip link `href="#contenido"` (sr-only → focus veil), header sticky `border-b border-divider bg-surface` con marca + nav desktop 2 placas + engranaje/Volver, `main#contenido tabindex=-1` `mx-auto max-w-[960px] px-4 md:px-6 overflow-x-hidden pb-[calc(56px+env(safe-area-inset-bottom)+24px)] md:pb-8`, bottom nav 2 placas. Sin `max-w` propio en features: siguen el eje del shell.
- **Hoy** (`today-page`): franja superior con `<time datetime="YYYY-MM-DD">` + `formatDayLong` + `statusLabel()` + link discreto `Ver semana →` a `/horario`; `aria-live="polite"` sr-only con `liveMessage()` estable (no cambia cada tick). Tablero `bg-surface-raised rounded-card border-divider grid lg:grid-cols-2 divide-divider`: hero por estado `in-class` (Ahora con rango `text-display font-numeric`, placa salón `rounded-chip border-divider bg-surface`, progreso `role="progressbar"` + `Termina en N min`), `break` (Recreo con countdown + Siguiente), `before-first` (Primera clase + panel derecho `El resto del día` lista hora|periodo|salón con borde turno), `after-last` (Terminaste por hoy → Próxima clase + lista del siguiente día lectivo), `weekend`/`no-classes` (Hoy no hay clases → Próxima). Resto del día `bg-surface` con filas `border-l-[3px] border-shift-*` y estados `now` ( `bg-accent text-white` + badge Ahora), `past` (`Finalizada` + `text-foreground-muted`), `future` (hora fin). Sin duplicar hora/salón entre paneles; `whitespace-nowrap` anti-cuelgue a 360.
- **Horario** (`schedule-page`): header `Horario` + print header `hidden print:block` con fecha; toolbar `data-print="hide"` `border-divider bg-surface` con búsqueda (`label sr-only` + `type="search"` + `getHighlightSegments` → `mark` sin `innerHTML`, contador `role="status"` polite, limpiar `aria-label`) + acciones Imprimir/PDF/Excel (`aria-label`/`aria-busy`/`disabled`, foco restaurado tras `finally` vía `queueMicrotask` a `activeElement` o `role="alert"`). Tabla desktop `hidden md:block print:block` `caption sr-only` `scope="col/row"` header sticky; **columna de hoy** con header `border-t-accent bg-accent/[0.08]` + badge Hoy pill + celdas `bg-accent/6`; **fila AHORA** con `bg-accent/4` en `tr` y `border-l-accent` + badge Ahora pill y `ring`. Tarjetas móviles `md:hidden print:hidden` con header `Hora + L M X J V`, separadores turno `t1/m4`, celdas salón `bg-surface-raised`. Print: `@page A4 landscape 12mm`, `data-print="hide"`, colores turno exactos.
- **Ajustes** (`settings-page`): sin `max-w` propio, sigue eje shell. `h1 Ajustes` + `h2 Tema / Acerca de`; `fieldset` con `legend sr-only` y `aria-describedby="tema-desc tema-estado"`; **filas con un único indicador** `data-testid="theme-indicator"` (`border-2 rounded-pill` con `check` solo en seleccionada), `label` clickable ≥44 px con `border-l-4` (`border-l-accent` + `bg-surface-raised` seleccionada) + icono `sun/moon/monitor` + thumbnails inline con colores literales; radios nativos `sr-only` con `aria-label`; estado `currentStateText()` y anuncio `role="status" aria-live="polite"`.

## Responsive
`360 / 768 / 1280` probados mentalmente + build. Grid `lg:grid-cols-2` en Hoy, tabla scroll `overflow-auto` (desktop) / grid móvil, header `max-w-[960px]`. Sin `overflow-x` gracias a `overflow-x:clip` en `:host` y `overflow-x-hidden` en `main`.

## Estados
Vacío / sin coincidencias (mensaje + CTA Limpiar), carga/exportación (`isExporting`/`exportKind` → `disabled` + `Generando…` + `aria-busy`, foco restaurado), error (`role="alert"` + botón Cerrar con foco), deshabilitado (`disabled:opacity-60` + no solo color), hoy resaltado + Ahora, turno mañana/tarde, progreso 0–100, receso/antes/terminado/fin de semana.

## Iconografía
**Lucide Angular** (`@lucide/angular`, 18 iconos registrados en `app.config.ts` con `provideLucideIcons` y `provideLucideConfig size 20 strokeWidth 1.75`) + **isotipo propio** `public/icons/brand-icon.svg` (baldosa `#FAF7F0` con contorno `#1C1917` + raíl + 3 bloques; `brand-icon-favicon.svg` 3 bloques escalonados sin raíl, anchos 288/352/320 con diferencia ≥32 px en viewBox 512 para legibilidad a 16 px; `brand-icon-maskable.svg` y `brand-mark-mono.svg`). Script `scripts/generate-icons.mjs` genera PNG `72–512`, `maskable`, `apple-touch-icon`, `favicon-16/32` y `favicon.ico` (vía `sharp` + `png-to-ico`). Paleta y `manifest` no se tocan. 7 iconos registrados con uso futuro reservado (`clock`, `calendar-days`, `map-pin`, `building-2`, `coffee`, `chevron-right`, `arrow-right`).

## Accesibilidad
- **AA y AXE**: contraste AA verificado para todos los pares (ver tabla), `mark` 14.2, chips 5.0–12.2; foco `*:focus-visible 2px solid var(--accent) offset 2px`; no dependencia de color (texto + icono para Finalizada, borde + check para tema).
- **Landmarks/headings**: `header/nav/main/nav`, jerarquía `h1 → h2 → h3`, `skip link` funcional.
- **Nombres accesibles**: `label` + `aria-label` en búsqueda y exportaciones, `fieldset/legend`, botones ≥44 px (`min-h-11`).
- **Tabla**: `caption sr-only`, `scope`, `time[datetime]` + `tabular-nums`.
- **Live**: Hoy `aria-live="polite" aria-atomic="true"` sr-only con mensaje estable (no cada 10 s); Horario `role="status"` para contador; error `role="alert"`.
- **Foco**: orden lógico desktop/móvil, `tabindex=-1` en `main`, `aria-current="page"` en nav 2 placas + engranaje sutil (`bg-accent/10`), `progressbar` con `aria-valuenow/min/max/label`, foco no perdido tras exportar (restauración con `queueMicrotask`).
- **Movimiento**: `@media (prefers-reduced-motion: reduce)` anula `animation/transition/scroll-behavior` (progreso y transiciones).

## Criterios de verificación
`npm run lint --max-warnings=0` (Angular ESLint + a11y), `npm run build` (prod con budgets intactos, `initial 500 kB warning / 1 MB error`), `npm test` (Vitest + `fake-indexeddb/auto`). Visual code+build revisado (sin navegador headless disponible en entorno).

## Limitaciones conocidas
- **Peso pdfmake** `~1.6 MB` crudo (`pdfmake 788 kB + vfs_fonts 854 kB`, transfer ~567 kB) — lazy `import('pdfmake/build/pdfmake')` solo desde Horario, no afecta `initial`; a futuro evaluar exportador más liviano o worker.
- **Prefetch del service worker** precachea el shell; `ngsw-config.json` con `scope ./` bajo `/verolu/` — correcto pero suma descarga inicial en segunda visita.
- **Bundle inicial** `~459 kB` crudo (~110 kB transfer) cerca del warning 500 kB: margen estrecho; no añadir dependencias sin medir. Chunks lazy `today-page ~14 kB`, `schedule-page ~20 kB`, `settings-page ~8 kB`.
- **Verificación visual** limitada a código+build: no había `google-chrome/chromium` instalado, no se pudo capturar `/#/hoy /#/horario /#/ajustes` a 360/768/1280 en claro/oscuro. Se revisó overflow, solapamientos, hero, tablas y tabs por inspección de código y build.
- **Impresión** verificada solo por CSS (`@media print`, `@page A4 landscape 12mm`, `data-print="hide"`, colores exactos): sin render real.

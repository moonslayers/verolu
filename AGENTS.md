# Verolu — Horario de la Prof. Verónica Luna Hernández

Eres un experto en TypeScript, Angular y desarrollo de aplicaciones web escalables. Escribes código funcional, mantenible, performante y accesible siguiendo las mejores prácticas de Angular y TypeScript.

## Proyecto

Aplicación web de **horario semanal** de la Prof. Verónica Luna Hernández. Usuarios: la profesora y sus estudiantes, que consultan el horario desde el navegador o instalado como PWA en el teléfono.

Estado actual: estructura base y PWA listas; el port del prototipo (`prototype/`) al código Angular está pendiente. La UI muestra "En construcción — port en progreso".

## Stack y versiones

- Angular 22 (standalone, signals, zoneless) — `@angular/core ^22.2.0`
- Tailwind CSS v4 vía schematic oficial de Angular (CSS-first, sin `tailwind.config.js`; config en `src/styles.css` + `@tailwindcss/postcss`; `tailwindcss ^4.1.12` en `package.json`, resuelto 4.3.5 — verifica con `npm ls tailwindcss`)
- PWA vía schematic `@angular/pwa` (generador dev-time, intencionalmente no es dependencia del proyecto) + paquete runtime `@angular/service-worker` (producción)
- npm 10.9.9, Node 22
- Vitest para tests unitarios (`ng test`)

## Estructura del repositorio

- `src/app/` — componentes, configuración (`app.config.ts`), estilos.
- `public/` y `public/icons/` — assets estáticos y iconos PWA.
- `prototype/` — referencia HTML del prototipo (no modificar; se portará después).
- `.agents/skills/` — skills de IA del proyecto (angular-developer, angular-new-app, tailwind-4-docs).
- `.vscode/` — configuración del editor y MCP de VS Code.
- `dist/verolu/browser/` — salida de build (generada).

## Verificación obligatoria

Después de CUALQUIER tarea de implementación el agente DEBE ejecutar y pasar, en este orden, `npm run lint`, `npm run build` y `npm test` (no interactivo). Una tarea NO se considera terminada si alguno falla. Nunca deshabilites reglas ni uses `eslint-disable` para forzar un pase; si una regla es genuinamente incorrecta para el proyecto, cámbiala en `eslint.config.js` con justificación en el commit/PR. CI también bloquea el despliegue si `npm run lint` falla (ver `.github/workflows/deploy.yml`).
- `src/test-setup.ts` registra `fake-indexeddb/auto` (vía `angular.json` → `test.setupFiles`). En tests con Dexie, parte de una DB limpia y cierra la conexión en `afterEach`; no uses esperas arbitrarias.

## Convenciones

- Sin NgModules; componentes standalone por defecto.
- No poner `standalone: true` explícito (es el default en Angular v20+).
- No poner `changeDetection: ChangeDetectionStrategy.OnPush` explícito (es el default en Angular v22+).
- Estado con signals; `input()`/`output()`/`model()` en lugar de decoradores; `computed()`/`linkedSignal()` para estado derivado.
- Control de flujo nativo (`@if`, `@for`, `@switch`), no `*ngIf`/`*ngFor`/`*ngSwitch`.
- Bindings `class`/`style` en lugar de `ngClass`/`ngStyle`.
- No importar `CommonModule`; importar solo las directivas/pipes usadas.
- Sin CDNs ni librerías de UI/iconos salvo aprobación.
- Copy de UI en español; identificadores en inglés.
- Accesibilidad: pasar AXE y WCAG AA (foco, contraste, ARIA).
- Mobile-first.
- Toda la UI sigue `DESIGN.md`. No hardcodees fondos claros (`bg-white`) ni texto blanco sobre `accent`: usa tokens (`surface-raised`, `text-surface`) para mantener AA en ambos temas.

## Reglas de dominio

- Los datos del horario viven como constantes tipadas por ahora (sin backend, sin `localStorage` todavía).
- No inventar nuevas fuentes de datos ni persistencia.

## PWA y GitHub Pages

- La app se despliega bajo el subpath `/verolu/`.
- `manifest.webmanifest`: `scope` y `start_url` son relativos a propósito (`./`).
- El service worker debe seguir funcionando bajo el subpath.
- El build de producción usa base href `/verolu/`.
- Las URLs de assets en CSS deben ser relativas (`url('fonts/...')`), nunca absolutas (`url('/...')`), para funcionar bajo `/verolu/`. Verifica con `npm run build -- --base-href /verolu/` sirviendo el `dist` bajo el subpath.

## Comandos

- Instalar: `npm install`
- Servir: `npm start` (equiv. `ng serve`, http://localhost:4200)
- Build: `npm run build`
- Build para Pages: `npm run build -- --base-href /verolu/`
- Lint: `npm run lint` (falla también con warnings)
- Formato: `npm run format:check`
- Tests: `npm run test`

## AI tooling

Skills disponibles en `.agents/skills/`:
- `angular-developer`: generar código Angular, arquitectura, signals, forms, routing, testing, CLI.
- `angular-new-app`: crear nuevas apps Angular con CLI.
  Nota: su ejemplo `--ai-config=agents` no es aceptado por CLI 22.2.6; valores válidos son `vscode`, `claude`, `cursor`, `gemini`, `jetbrains`, `windsurf` o `none`.
- `tailwind-4-docs`: Tailwind v4 (utilidades, variantes, config, migración). El snapshot de docs NO está incluido; requiere aceptar la licencia upstream ejecutando `python .agents/skills/tailwind-4-docs/scripts/sync_tailwind_docs.py --accept-docs-license`.

MCP: servidor `angular-cli` configurado en `opencode.json` (`npx -y @angular/cli mcp`), con herramientas como `get_best_practices`, `search_documentation`, `run_target`, `devserver_*`. No hay MCP oficial de Tailwind.

En `opencode.json` usa solo las formas vigentes del esquema: `skills` como arreglo de rutas y `mcp.servers.<name>`. No reintroduzcas `skills.paths` ni entradas planas `mcp.<name>`; están deprecadas. Valida con `opencode debug config` y `opencode mcp list` tras editar.

## Límites

- No cambiar configuración de deploy/PWA casualmente.
- No commitear secretos.
- No tocar `prototype/` salvo para portarlo después.

---

## Guía oficial de Angular (generada por Angular CLI)

You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

## Angular Best Practices

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- Do NOT set `changeDetection: ChangeDetectionStrategy.OnPush` explicitly. `OnPush` is the default in Angular v22+.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.

## Accessibility Requirements

- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.

## Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `model()` for two-way bound properties with `[(prop)]` syntax instead of pairing `input()` with `output()`
- Use `computed()` for derived state
- Use `linkedSignal()` for state derived from multiple reactive sources that must stay synchronized
- Prefer inline templates for small components
- Prefer Signal Forms (`@angular/forms/signals`) for new forms. They are stable in Angular v22+ and provide signal-based state, type-safe field access, and schema-based validation
- When not using Signal Forms, prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- Do NOT import `CommonModule`, import only the directives and pipes the template uses, such as `AsyncPipe` or `DatePipe`
- When using external templates/styles, use paths relative to the component TS file.

## State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

## Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- Do not assume globals like (`new Date()`) are available.

## Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Prefer the `@Service` decorator over `@Injectable({providedIn: 'root'})` for new singleton services (Angular v22+)
- Use the `inject()` function instead of constructor injection

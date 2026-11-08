# Verolu — Horario de la Prof. Verónica Luna Hernández

Aplicación web de **horario semanal** de la Prof. Verónica Luna Hernández. La consultan la profesora y sus estudiantes desde el navegador o instalada como PWA en el teléfono.

Estado actual: estructura base y PWA listas; el port del prototipo (`prototype/`) al código Angular está en progreso. La UI muestra "En construcción — port en progreso".

## Stack

- Angular 22 (standalone, signals, zoneless)
- Tailwind CSS v4 vía schematic oficial de Angular (CSS-first, sin `tailwind.config.js`; `tailwindcss ^4.1.12` en `package.json`, resuelto 4.3.5 — verifica con `npm ls tailwindcss`)
- PWA vía schematic `@angular/pwa` (generador dev-time, intencionalmente no es dependencia del proyecto) + paquete runtime `@angular/service-worker` (producción)
- npm 10.9.9, Node 22
- Vitest para tests unitarios

## Requisitos

- Node 22
- npm 10.9.9

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm start
```

Servidor de desarrollo en http://localhost:4200/. Recarga automática al modificar archivos.

## Build

```bash
npm run build
```

Artefactos en `dist/verolu/browser/`.

## Build para GitHub Pages

```bash
npm run build -- --base-href /verolu/
```

## Lint y formato

```bash
npm run lint          # ESLint (Angular + TypeScript + template a11y), falla en warnings (--max-warnings=0)
npm run format:check  # Prettier --check (respeta .prettierrc)
```

CI ejecuta `npm run lint` antes del build y bloquea el despliegue si falla (ver `.github/workflows/deploy.yml`).

## Tests

```bash
npm run test
```

## Instalar la PWA en el teléfono

La app se instala como PWA desde un origen servido por **HTTPS** (GitHub Pages cumple). El service worker solo se registra en producción (`enabled: !isDevMode()`).

- Android (Chrome): abrir https://moonslayers.github.io/verolu/, menú ⋮ → "Instalar aplicación" / "Añadir a pantalla de inicio".
- iOS (Safari): abrir la URL, botón Compartir → "Añadir a pantalla de inicio".

El `manifest.webmanifest` usa `start_url` y `scope` relativos (`./`) a propósito para funcionar bajo el subpath `/verolu/`.

## Despliegue

Publicación en GitHub Pages bajo https://moonslayers.github.io/verolu/. El build de producción usa base href `/verolu/` y el service worker se mantiene funcional bajo el subpath.

## Estructura del repositorio

- `src/app/` — componentes, configuración (`app.config.ts`), estilos.
- `public/` y `public/icons/` — assets estáticos e iconos PWA.
- `prototype/` — referencia HTML del prototipo (no modificar).
- `.agents/skills/` — skills de IA (angular-developer, angular-new-app, tailwind-4-docs).
- `.vscode/` — configuración del editor y MCP de VS Code.

## AI tooling

Skills en `.agents/skills/`:
- `angular-developer`: código Angular, arquitectura, signals, forms, routing, testing, CLI.
- `angular-new-app`: crear nuevas apps Angular con CLI.
- `tailwind-4-docs`: Tailwind v4. El snapshot de docs NO está incluido; requiere aceptar la licencia upstream ejecutando `python .agents/skills/tailwind-4-docs/scripts/sync_tailwind_docs.py --accept-docs-license`.

MCP: servidor `angular-cli` configurado en `opencode.json` (`npx -y @angular/cli mcp`). Tras modificar `opencode.json` o skills, reinicia opencode para que cargue los cambios.

## Roadmap

- Port del horario del prototipo (`prototype/`) a componentes Angular.
- Datos del horario como constantes tipadas (sin backend ni `localStorage` por ahora).

## Caveat conocido

El snapshot de documentación de Tailwind v4 no está incluido en el repositorio; debe inicializarse localmente aceptando la licencia upstream.

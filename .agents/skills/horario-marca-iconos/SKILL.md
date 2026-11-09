---
name: horario-marca-iconos
description: "Use when changing the logo, favicon, app/PWA icons or maskable assets. Covers SVG sources, generation script and Android circular-mask pitfalls."
---

# Marca e iconos

## Ámbito
`public/icons/`, `scripts/generate-icons.mjs`, `public/manifest.webmanifest`, `src/index.html`.

## Fuentes SVG
- `brand-icon.svg` — navegador: papel con marco de tinta.
- `brand-icon-app.svg` — app/PWA: tinta a sangre + disco papel ~83% + glifo tinta/terracota.
- `brand-icon-app-maskable.svg` — disco ~78% dentro de la zona segura.
- `brand-icon-favicon.svg` — simplificada 16/32.
- `brand-mark-mono.svg` — cabecera.

## Generación
`npm run icons:generate` (sharp + png-to-ico) → 72/96/128/144/152/192/384/512, maskable 512, apple-touch 180, favicon 16/32/ico. Todos opacos; esquinas papel.

## GOTCHA Android
Un icono solo papel sin baldosa que contraste se percibe "transparente" sobre launchers claros; un marco cuadrado se corta con la máscara circular. Solución: baldosa tinta + disco papel grande, sin marco cuadrado. Verifica con máscaras y sobre claro/oscuro (48–512), esquinas #1C1917, centro terracota.

## Manifest/index
Referencian nombres estables; al cambiar solo el arte no hay que renombrar. Una PWA ya instalada conserva el icono hasta desinstalar/reinstalar. El favicon puede diferir del icono de app; no usar la variante de navegador para la app.

## Pitfalls
- No usar la variante con marco para iconos de app.
- No dejar esquinas transparentes.
- No tocar la paleta sin regenerar.
- No usar favicon simplificado como icono de app.

## Verificación
Generar, revisar manifest, 200 de todos los assets, opacidad y centrado.

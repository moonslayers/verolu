---
name: horario-marca-iconos
description: "Use when changing the logo, favicon, app/PWA icons or maskable assets. Covers SVG sources, generation script and Android circular-mask pitfalls."
---

# Marca e iconos

## Ámbito
`public/icons/`, `scripts/generate-icons.mjs`, `public/manifest.webmanifest`, `src/index.html`.

## Fuentes SVG
- `brand-icon.svg` — navegador: baldosa papel con marco de tinta.
- `brand-icon-app.svg` — app/PWA full-bleed papel, SIN marco, marca ~56%.
- `brand-icon-app-maskable.svg` — marca ~63%, fondo a sangre.
- `brand-icon-favicon.svg` — simplificada, 3 bloques gruesos para 16/32.
- `brand-mark-mono.svg` — cabecera, currentColor + terracota.

## Generación
`npm run icons:generate` (sharp + png-to-ico) → 72/96/128/144/152/192/384/512, maskable 512, apple-touch 180, favicon 16/32/ico. Todos opacos; esquinas papel.

## GOTCHA Android
Un marco cuadrado dentro del icono se ve "cortado" con la máscara circular del launcher. Los iconos de app deben ir a sangre y sin marco. Verifica con simulación de máscara circular/squircle (48–512) y por píxeles (esquinas #FAF7F0, centro terracota).

## Manifest/index
Referencian nombres estables; al cambiar solo el arte no hay que renombrar. Una PWA ya instalada conserva el icono hasta desinstalar/reinstalar.

## Pitfalls
- No usar la variante con marco para iconos de app.
- No dejar esquinas transparentes.
- No tocar la paleta sin regenerar.
- No usar favicon simplificado como icono de app.

## Verificación
Generar, revisar manifest, 200 de todos los assets, opacidad y centrado.

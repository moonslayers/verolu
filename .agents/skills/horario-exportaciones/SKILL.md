---
name: horario-exportaciones
description: "Use when changing PDF/Excel export, lazy chunks or print styles. Covers the export service, pdfmake/write-excel-file and bundle pitfalls."
---

## Qué cubre
Exportar el horario a PDF/Excel desde la toolbar y que Ctrl+P siga imprimiendo bien.

## Modelo mental: tres capas
1. Datos puros — `schedule-export.ts` arma docDefinition y filas/columnas sin importar pdfmake ni xlsx (testeable, barato).
2. Efectos lazy — `schedule-export.service.ts` hace `import()` de pdfmake/vfs y write-excel-file solo al pulsar el botón.
3. UI — `schedule-page.ts` orquesta bloqueo/errores; `schedule-toolbar.ts` pinta botones; `schedule-view.model.ts` comparte el modelo.

## Invariantes (por qué)
- **Lazy, no estático:** un import normal infla el bundle inicial (>500 kB). Los `import()` mantienen el chunk inicial bajo el warning y difieren ~1.6 MB hasta el clic. No los conviertas en imports de módulo.
- **Split datos/efecto:** la lógica pura se prueba sin cargar librerías; los tests nunca importan pdfmake/xlsx.
- **Print separado del PDF:** no hay botón Imprimir; Ctrl+P usa `@media print` + `[data-print="hide"]` (header, toolbar, toast). PDF y print comparten intención visual pero no código; borrar esos estilos rompe la impresión.
- **CJS allowlist:** `angular.json` declara exactamente `pdfmake/build/pdfmake` y `pdfmake/build/vfs_fonts`; write-excel-file es ESM y no va ahí.
- **Límite del SW:** `ngsw-config` precarga `/*.js`, así que los chunks lazy (~1.6 MB) se descargan al instalar. Aceptado; no lo "arregles" sin decisión.
- **UX compartida:** PDF y Excel comparten `isExporting`, `aria-busy`, error recuperable y restauración de foco.

## Deep-dive
- Lógica pura y shapes: `src/app/features/schedule/schedule-export.ts`
- Servicio + imports dinámicos: `src/app/features/schedule/schedule-export.service.ts`
- Orquestación/errores/foco: `src/app/features/schedule/schedule-page.ts`
- Botones y aria: `src/app/features/schedule/schedule-toolbar.ts`
- Modelo: `src/app/features/schedule/schedule-view.model.ts`
- Estilos de impresión: `src/styles.css` (`@media print`, `[data-print]`)

## Anexo de tamaños
pdfmake ~788 kB, vfs ~854 kB, excel ~72 kB; inicial bajo 500 kB.

## Verificación
Descarga real: PDF empieza con `%PDF`, XLSX con `PK`; una ruta que no exporta no baja esos chunks. `npm run lint && npm run build && npm test`.

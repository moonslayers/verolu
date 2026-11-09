---
name: horario-exportaciones
description: "Use when changing PDF/Excel export, lazy chunks or print styles. Covers the export service, pdfmake/write-excel-file and bundle pitfalls."
---

# Exportaciones PDF/Excel

## Ámbito
`src/app/features/schedule/schedule-export.service.ts`, toolbar y página; modelo compartido en `schedule-view.model.ts`.

## PDF
`import()` dinámico de `pdfmake/build/pdfmake` + `pdfmake/build/vfs_fonts`; A4 horizontal, colores por turno, título y fecha. Nombre `horario-veronica-luna.pdf`.

## Excel
`import()` de `write-excel-file/browser`; hoja "Horario", columnas Hora/Turno/Lunes–Viernes, cabecera fija y anchos. Nombre `.xlsx`.

## angular.json
`allowedCommonJsDependencies` exactos: `pdfmake/build/pdfmake` y `pdfmake/build/vfs_fonts`. write-excel-file es ESM.

## UI
PDF y Excel comparten bloqueo, `aria-busy`, error visible/recuperable y restauración de foco. El botón Imprimir se retiró; Ctrl+P sigue usando `@media print` + `[data-print="hide"]` (no borrar esos estilos).

## Bundle
Chunks lazy (pdfmake ~788k, vfs ~854k, excel ~72k); el inicial debe quedar bajo el warning de 500 kB. El SW precarga `/*.js`, incluidos esos chunks (~1.6 MB) en la instalación: limitación conocida.

## Tests
Probar mapeo puro y bloqueo; NO importar pdfmake/xlsx en tests.

## Verificación
Descarga real, PDF con cabecera `%PDF`, XLSX con firma `PK`, y que una ruta sin exportar no descargue esos chunks.

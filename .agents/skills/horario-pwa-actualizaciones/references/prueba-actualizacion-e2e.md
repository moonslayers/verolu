# Prueba de actualización E2E

Procedimiento manual reproducible para validar una actualización real del SW.

## Preparación

1. Build de producción con base href: `npm run build -- --base-href /verolu/`.
2. Copiar `dist/verolu/browser` a un directorio temporal servible.
3. Servir en `http://127.0.0.1:4300` con `python3 -m http.server` (localhost = contexto seguro).
4. Playwright Chromium: esperar `navigator.serviceWorker.ready`, recargar para quedar controlado.
5. Verificar outlet y consola sin errores.

## Generar v2

1. Cambio reversible solo en `<title>` de `src/index.html` (guardar copia temporal y restaurar; NO `git checkout`).
2. Rebuild.
3. Reemplazar el directorio servido.
4. Recargar; esperar el banner "Hay una nueva versión disponible.".
5. Clic en **Más tarde** y verificar que oculta.
6. Recarga manual y verificar activación de v2 (en el entorno de prueba puede requerir un segundo reload).

## Limpieza

- Matar servidor.
- Borrar temp.
- Restaurar `src/index.html` exacto y build final.

## Pitfalls

- No commitear el cambio de título.
- No usar esperas arbitrarias.
- No confundir el reload extra del entorno con un bug.
- No tocar `ngsw-config.json`.

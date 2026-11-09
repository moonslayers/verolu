---
name: horario-motor-temporal
description: "Use when changing ahora/siguiente, day states, time math, or schedule data. Covers periods/lessons, breaks, next-lesson scanning and ClockService."
---

# Horario motor temporal

Ámbito: `src/app/core/schedule/` (model, data, utils, clock).

## Modelo
- 9 `Period` compartidos entre días.
- 25 `Lesson`: `periodId` + `weekday` (lunes=1…viernes=5) + `room`.
- Celdas libres NO se almacenan.
- Materia constante "Informática".

## Horas
- Mañana: m4 09:15–10:00, m5 10:30–11:10.
- Tarde: t1 13:00–13:45 … t7 17:50–18:35.
- Recesos: 10:00–10:30 y 16:00–16:20.

## Tiempo
- Minutos desde medianoche, reloj de pared local; no usar UTC/DST.
- `timeStringToMinutes` valida `HH:mm` estricto.
- `minutesUntil` evita NaN.

## Estados
in-class, break, before-first, after-last, weekend, no-classes.

## SIGUIENTE
Primera clase que empieza después de ahora; si no hay hoy, escanear hasta 7 días saltando fines de semana. No es "la clase de la siguiente hora en punto".

## ClockService
Signal `now` cada 10 s, limpieza con `DestroyRef`; lógica pura fuera del servicio.

## Pitfalls
- `getDay()` 0=domingo.
- No duplicar la siguiente clase en dos paneles (receso/antes).
- `aria-live` debe depender de estado/clase, no de cada tick.
- Viernes→lunes.

## Verificación
Tests de los 6 estados, ambos recesos, viernes→lunes, día con una sola clase.

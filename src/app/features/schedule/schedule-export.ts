import type { Lesson, Period } from '../../core/schedule/schedule.model';
import { PERIODS, LESSONS } from '../../core/schedule/schedule.data';
import { formatDayLong, formatTimeRange } from '../../core/schedule/schedule.utils';

export const WEEKDAY_LABELS: readonly string[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'] as const;

export interface ExcelRow {
  readonly hora: string;
  readonly turno: string;
  readonly lunes: string;
  readonly martes: string;
  readonly miercoles: string;
  readonly jueves: string;
  readonly viernes: string;
}

function lessonFor(periodId: string, weekday: number, lessons: readonly Lesson[]): Lesson | undefined {
  return lessons.find((l) => l.periodId === periodId && l.weekday === weekday);
}

export function toExcelRows(
  periods: readonly Period[] = PERIODS,
  lessons: readonly Lesson[] = LESSONS,
): ExcelRow[] {
  return periods.map((p) => {
    const cells: Record<string, string> = {};
    for (let w = 1; w <= 5; w += 1) {
      const lesson = lessonFor(p.id, w, lessons);
      const key = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'][w - 1] as string;
      cells[key] = lesson?.room ?? '-';
    }
    const shiftLabel = p.shift === 'morning' ? 'Mañana' : 'Tarde';
    return {
      hora: `${p.label} (${formatTimeRange(p)})`,
      turno: shiftLabel,
      lunes: cells['lunes'] ?? '-',
      martes: cells['martes'] ?? '-',
      miercoles: cells['miercoles'] ?? '-',
      jueves: cells['jueves'] ?? '-',
      viernes: cells['viernes'] ?? '-',
    };
  });
}

export function buildExcelSheetData(
  periods: readonly Period[] = PERIODS,
  lessons: readonly Lesson[] = LESSONS,
): unknown[][] {
  const header = ['Hora', 'Turno', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
  const rows = toExcelRows(periods, lessons).map((r) => [
    r.hora,
    r.turno,
    r.lunes,
    r.martes,
    r.miercoles,
    r.jueves,
    r.viernes,
  ]);
  return [header, ...rows];
}

export function buildExcelColumnWidths(): { width: number }[] {
  // Hora wider, turno narrow, days medium
  return [{ width: 26 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 }];
}

export function getExcelSheetName(): string {
  return 'Horario';
}

export interface PdfDefinition {
  readonly pageOrientation: 'landscape';
  readonly pageSize: 'A4';
  readonly header: string;
  readonly subheader: string;
  readonly generatedAt: string;
  readonly tableHeader: readonly string[];
  readonly rows: readonly (readonly string[])[];
  readonly shiftByRow: readonly ('morning' | 'afternoon')[];
  // Full doc definition for pdfmake (without importing pdfmake types)
  readonly docDefinition: Record<string, unknown>;
}

export function buildPdfDefinition(
  periods: readonly Period[] = PERIODS,
  lessons: readonly Lesson[] = LESSONS,
  generatedAt: Date = new Date(),
): PdfDefinition {
  const header = 'Horario de Informática';
  const subheader = 'Prof. Verónica Luna Hernández';
  const generatedLabel = `Generado el ${formatDayLong(generatedAt)} · ${generatedAt.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}`;
  const tableHeader = ['Hora / Turno', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'] as const;

  const rows: string[][] = periods.map((p) => {
    const hourCell = `${p.label}\n${formatTimeRange(p)}\n${p.shift === 'morning' ? 'MAÑANA' : 'TARDE'}`;
    const dayCells = [1, 2, 3, 4, 5].map((w) => {
      const lesson = lessonFor(p.id, w, lessons);
      return lesson?.room ?? '-';
    });
    return [hourCell, ...dayCells];
  });

  const shiftByRow = periods.map((p) => p.shift);

  // Build pdfmake docDefinition (lightweight, no pdfmake import)
  const docDefinition: Record<string, unknown> = {
    pageOrientation: 'landscape',
    pageSize: 'A4',
    pageMargins: [20, 20, 20, 20],
    content: [
      { text: header, style: 'header' },
      { text: subheader, style: 'subheader', margin: [0, 0, 0, 8] },
      { text: generatedLabel, style: 'subheaderSmall', margin: [0, 0, 0, 12] },
      {
        table: {
          headerRows: 1,
          widths: ['auto', '*', '*', '*', '*', '*'],
          body: [
            tableHeader.map((h) => ({ text: h, style: 'tableHeader' })),
            ...rows.map((r, idx) => {
              const shift = periods[idx]?.shift;
              const fill = shift === 'morning' ? '#ecfdf5' : '#fffbeb';
              return r.map((cell, cIdx) => {
                const isHour = cIdx === 0;
                return {
                  text: cell,
                  style: isHour ? 'cellHour' : 'cell',
                  fillColor: fill,
                  alignment: 'center',
                  margin: isHour ? [2, 4, 2, 4] : [0, 8, 0, 8],
                };
              });
            }),
          ],
        },
        layout: 'lightHorizontalLines',
      },
      { text: `Generado el ${generatedAt.toLocaleString('es-MX')}`, style: 'footer', margin: [0, 12, 0, 0] },
    ],
    styles: {
      header: { fontSize: 18, bold: true, alignment: 'center' },
      subheader: { fontSize: 12, alignment: 'center', color: '#57534e' },
      subheaderSmall: { fontSize: 10, alignment: 'center', color: '#57534e' },
      tableHeader: { bold: true, fontSize: 10, alignment: 'center', fillColor: '#e3dccf' },
      cellHour: { fontSize: 8, alignment: 'center' },
      cell: { fontSize: 10, alignment: 'center', bold: false },
      footer: { fontSize: 8, alignment: 'center', color: '#57534e' },
    },
    defaultStyle: { font: 'Roboto' },
  };

  return { pageOrientation: 'landscape', pageSize: 'A4', header, subheader, generatedAt: generatedLabel, tableHeader, rows, shiftByRow, docDefinition };
}

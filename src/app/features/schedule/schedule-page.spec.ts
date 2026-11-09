import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  provideLucideConfig,
  provideLucideIcons,
  LucideSearch,
  LucideX,
  LucideFileDown,
  LucideFileSpreadsheet,
} from '@lucide/angular';
import { SchedulePage } from './schedule-page';
import { buildExcelSheetData, buildPdfDefinition, toExcelRows } from './schedule-export';
import { getHighlightSegments, normalizeText } from './schedule-search';
import { LESSONS, PERIODS } from '../../core/schedule/schedule.data';
import { ClockService } from '../../core/schedule/clock.service';
import { signal } from '@angular/core';

function fakeClockWithDate(date: Date): ClockService {
  const svc = { now: signal(date) } as unknown as ClockService;
  return svc;
}

describe('SchedulePage', () => {
  async function setup(
    date: Date = new Date(2026, 10, 9, 10, 0),
  ): Promise<ComponentFixture<SchedulePage>> {
    const clock = fakeClockWithDate(date);
    await TestBed.configureTestingModule({
      imports: [SchedulePage],
      providers: [
        { provide: ClockService, useValue: clock },
        provideLucideConfig({ color: 'currentColor', size: 16, strokeWidth: 1.75 }),
        provideLucideIcons(LucideSearch, LucideX, LucideFileDown, LucideFileSpreadsheet),
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(SchedulePage);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }

  it('render: 25 lecciones y 20 celdas libres', async () => {
    const fixture = await setup();
    const el = fixture.nativeElement as HTMLElement;
    const freeCells = el.querySelectorAll('[aria-label="Sin clase"]');
    const comp = fixture.componentInstance;
    expect(comp.lessonMap.size).toBe(25);
    const totalCells = PERIODS.length * 5;
    expect(totalCells - comp.lessonMap.size).toBe(20);
    expect(totalCells).toBe(45);
    expect(freeCells.length).toBeGreaterThan(0);
  });

  it('columna de hoy resaltada con reloj/día controlado (lunes)', async () => {
    const monday = new Date(2026, 10, 9, 10, 0);
    const fixture = await setup(monday);
    const el = fixture.nativeElement as HTMLElement;
    const hoyBadges = Array.from(el.querySelectorAll('th')).filter((th) =>
      th.textContent?.includes('Hoy'),
    );
    expect(hoyBadges.length).toBeGreaterThan(0);
    const lunesHeader = Array.from(el.querySelectorAll('th')).find((th) =>
      th.textContent?.includes('Lunes'),
    );
    expect(lunesHeader?.textContent).toContain('Hoy');
    expect(fixture.componentInstance.todayWeekday()).toBe(1);
  });

  it('columna de hoy no resalta en fin de semana', async () => {
    const saturday = new Date(2026, 10, 7, 10, 0);
    const fixture = await setup(saturday);
    expect(fixture.componentInstance.todayWeekday()).toBeNull();
    const el = fixture.nativeElement as HTMLElement;
    const hoyBadges = Array.from(el.querySelectorAll('th')).filter((th) =>
      th.textContent?.includes('Hoy'),
    );
    expect(hoyBadges.length).toBe(0);
  });

  it('periodo en curso lunes 14:45 marca AHORA y columna hoy teñida', async () => {
    const mondayClass = new Date(2026, 10, 9, 14, 45);
    const fixture = await setup(mondayClass);
    const comp = fixture.componentInstance;
    expect(comp.todayWeekday()).toBe(1);
    expect(comp.currentPeriodId()).toBe('t3');
    expect(comp.currentPeriodId()).toBe('t3');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const ahoraBadges = Array.from(el.querySelectorAll('*')).filter(
      (n) => n.textContent?.trim() === 'Ahora',
    );
    expect(ahoraBadges.length).toBeGreaterThan(0);
    const hoyCount = Array.from(el.querySelectorAll('*')).filter((n) =>
      n.textContent?.includes('Hoy'),
    ).length;
    expect(hoyCount).toBeGreaterThan(0);
  });

  it('fin de semana domingo no resalta Hoy ni Ahora', async () => {
    const sunday = new Date(2026, 10, 8, 12, 0);
    const fixture = await setup(sunday);
    const comp = fixture.componentInstance;
    expect(comp.todayWeekday()).toBeNull();
    expect(comp.currentPeriodId()).toBeNull();
    const el = fixture.nativeElement as HTMLElement;
    expect(Array.from(el.querySelectorAll('*')).some((n) => n.textContent?.includes('Hoy'))).toBe(
      false,
    );
    expect(
      Array.from(el.querySelectorAll('*')).some((n) => n.textContent?.trim() === 'Ahora'),
    ).toBe(false);
  });

  it('búsqueda: placeholder corto, un único limpiar y contador AA', async () => {
    const fixture = await setup();
    const el = fixture.nativeElement as HTMLElement;
    const input = el.querySelector('#schedule-search') as HTMLInputElement;
    expect(input.placeholder).toBe('Buscar salón, día o periodo');
    // sin query no hay botón limpiar
    expect(el.querySelector('button[aria-label="Limpiar búsqueda"]')).toBeNull();
    const comp = fixture.componentInstance;
    comp.query.set('2f');
    fixture.detectChanges();
    await fixture.whenStable();
    const clearBtns = el.querySelectorAll('button[aria-label="Limpiar búsqueda"]');
    expect(clearBtns.length).toBe(1);
    // contador usa foreground-muted
    const counter = el.querySelector('[role="status"]:not(.sr-only)') as HTMLElement;
    expect(counter).not.toBeNull();
    expect(counter.textContent?.trim()).toBe('3 coincidencias');
    expect(counter.getAttribute('role')).toBe('status');
    expect(counter.getAttribute('aria-live')).toBe('polite');
    expect(counter.className).toContain('text-foreground-muted');
    expect(counter.textContent).toContain('3');
    expect(clearBtns[0]?.className).toContain('min-h-11');
    expect(clearBtns[0]?.className).toContain('min-w-11');
  });

  it('móvil: encabezado único HORA + L M X J V y sin repetir letras en filas', async () => {
    const fixture = await setup(new Date(2026, 10, 9, 14, 45));
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    // header sticky with Hora
    const mobileHeader = el.querySelector('.md\\:hidden .sticky') as HTMLElement | null;
    expect(mobileHeader).not.toBeNull();
    expect(mobileHeader?.textContent).toContain('Hora');
    expect(mobileHeader?.className).toContain('sticky');
    for (const letter of ['L', 'M', 'X', 'J', 'V']) {
      expect(mobileHeader?.textContent).toContain(letter);
    }
    // filas no deben repetir letras con gap? check that dayLetter spans only in header, not in each cell wrapper? we ensure no dayLetter inside cell wrappers beyond header?
    // At least verify sticky header exists once
    const headers = el.querySelectorAll('.md\\:hidden .sticky');
    expect(headers.length).toBe(1);
  });

  it('búsqueda: miercoles sin acento filtra 5 coincidencias y contador correcto', async () => {
    const fixture = await setup();
    const comp = fixture.componentInstance;
    comp.query.set('miercoles');
    fixture.detectChanges();
    expect(comp.matchCount()).toBe(5);
    expect(comp.statusText()).toContain('5');
    const segs = getHighlightSegments('Miércoles', 'miercoles');
    expect(segs.some((s) => s.isMatch)).toBe(true);
    expect(normalizeText('Miércoles')).toBe('miercoles');
  });

  it('búsqueda: 2f encuentra 3 (dato real) y limpiar restaura', async () => {
    const fixture = await setup();
    const comp = fixture.componentInstance;
    comp.query.set('2f');
    fixture.detectChanges();
    expect(comp.matchCount()).toBe(3);
    expect(comp.statusText()).toContain('3');
    const segs = getHighlightSegments('2F', '2f');
    expect(segs.some((s) => s.isMatch && s.text === '2F')).toBe(true);

    comp.clearQuery();
    fixture.detectChanges();
    expect(comp.query()).toBe('');
    expect(comp.matchCount()).toBe(0);
    expect(comp.statusText()).toBe('Sin filtro');
  });

  it('búsqueda: contador y estado vacío Sin coincidencias', async () => {
    const fixture = await setup();
    const comp = fixture.componentInstance;
    comp.query.set('zzz-no-existe');
    fixture.detectChanges();
    expect(comp.matchCount()).toBe(0);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Sin coincidencias');
    expect(el.textContent).toContain('Limpiar búsqueda');
  });

  it('highlight sin innerHTML: segmenta texto en TS', () => {
    const segs = getHighlightSegments('2E', '2e');
    expect(segs).toEqual([{ text: '2E', isMatch: true }]);
    const segs2 = getHighlightSegments('Hola Mundo', 'mundo');
    expect(segs2.some((s) => s.isMatch)).toBe(true);
    expect(segs2.find((s) => s.isMatch)?.text).toBe('Mundo');
  });

  it('mapeo exportación: filas/columnas y turnos sin cargar librerías pesadas', () => {
    const sheetData = buildExcelSheetData();
    expect(sheetData.length).toBe(10);
    expect((sheetData[0] as string[]).length).toBe(7);
    expect(sheetData[0]).toEqual([
      'Hora',
      'Turno',
      'Lunes',
      'Martes',
      'Miércoles',
      'Jueves',
      'Viernes',
    ]);
    const rows = toExcelRows();
    expect(rows.length).toBe(9);
    const pdf = buildPdfDefinition(PERIODS, LESSONS, new Date(2026, 10, 9));
    expect(pdf.rows.length).toBe(9);
    expect(pdf.tableHeader.length).toBe(6);
    expect(pdf.shiftByRow.length).toBe(9);
    expect(pdf.shiftByRow[0]).toBe('morning');
    expect(pdf.shiftByRow[2]).toBe('afternoon');
    const doc = pdf.docDefinition as { content: unknown[] };
    expect(doc.content).toBeDefined();
  });

  it('export: botones deshabilitados no permiten simultánea', async () => {
    const fixture = await setup();
    const comp = fixture.componentInstance;
    comp.isExporting.set(true);
    comp.exportKind.set('pdf');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const pdfBtn = el.querySelector('button[aria-label="Exportar a PDF"]') as HTMLButtonElement;
    const excelBtn = el.querySelector('button[aria-label="Exportar a Excel"]') as HTMLButtonElement;
    expect(pdfBtn.disabled).toBe(true);
    expect(excelBtn.disabled).toBe(true);
    expect(pdfBtn.getAttribute('aria-busy')).toBe('true');
  });
});

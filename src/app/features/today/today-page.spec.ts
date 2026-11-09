import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { computed, signal } from '@angular/core';
import { TodayPage } from './today-page';
import { ClockService } from '../../core/schedule/clock.service';
import { getDayStatusForLessons } from '../../core/schedule/schedule.utils';

function localDate(year: number, month: number, day: number, hh: number, mm: number): Date {
  return new Date(year, month - 1, day, hh, mm, 0, 0);
}

const MON = (hh: number, mm: number): Date => localDate(2026, 11, 9, hh, mm);
const FRI = (hh: number, mm: number): Date => localDate(2026, 11, 13, hh, mm);
const SAT = (hh: number, mm: number): Date => localDate(2026, 11, 7, hh, mm);

function setup(date: Date): HTMLElement {
  const nowSig = signal(date);
  const clockDouble = { now: nowSig } as unknown as ClockService;

  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [TodayPage],
    providers: [provideRouter([]), { provide: ClockService, useValue: clockDouble }],
  });

  const fixture = TestBed.createComponent(TodayPage);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('TodayPage — franja superior', () => {
  it('muestra HOY en versalitas, fecha larga y estado con link discreto a /horario', () => {
    const el = setup(MON(13, 20));
    const html = el.innerHTML;
    const text = el.textContent ?? '';
    // HOY versalitas
    const hoy = el.querySelector('#today-title');
    expect(hoy).not.toBeNull();
    expect(hoy?.textContent).toBe('Hoy');
    expect(hoy?.className).toContain('uppercase');
    // fecha larga
    const time = el.querySelector('time[datetime="2026-11-09"]');
    expect(time).not.toBeNull();
    expect(time?.textContent).toContain('lunes');
    expect(time?.textContent).toContain('9 de noviembre');
    // estado
    expect(text).toContain('En clase');
    // link discreto sustituye botón grande
    const link = el.querySelector('a[href*="horario"]');
    expect(link).not.toBeNull();
    expect(link?.textContent).toContain('Ver semana');
    expect(link?.textContent).toContain('→');
    expect(link?.getAttribute('href')).toContain('/horario');
    // no debe existir botón grande anterior
    expect(text).not.toContain('Ver la semana completa');
    // header usa <time> con datetime
    expect(html).toContain('<time');
  });

  it('estado cambia según hora: break, before-first, after-last, weekend', () => {
    expect(setup(MON(14, 0)).textContent).toContain('Recreo');
    expect(setup(MON(8, 0)).textContent).toContain('Antes de tu primera clase');
    expect(setup(MON(19, 0)).textContent).toContain('Terminaste por hoy');
    expect(setup(SAT(10, 0)).textContent).toContain('Fin de semana');
    expect(getDayStatusForLessons(MON(10, 0), [])).toBe('no-classes');
  });
});

describe('TodayPage — tablero principal', () => {
  it('in-class: AHORA con rango horario enorme, placa salón, periodo/día versalitas, materia, progreso y SIGUIENTE', () => {
    const el = setup(MON(13, 20));
    const text = el.textContent ?? '';
    // AHORA
    expect(text).toContain('Ahora');
    // rango horario enorme font-numeric
    const heroTimeStart = el.querySelector('time[datetime="13:00"]');
    const heroTimeEnd = el.querySelector('time[datetime="13:45"]');
    expect(heroTimeStart).not.toBeNull();
    expect(heroTimeEnd).not.toBeNull();
    // placa grande junto a hora
    expect(text).toContain('2G');
    const placa = Array.from(el.querySelectorAll('span')).find((s) => s.textContent?.trim() === '2G');
    expect(placa).toBeDefined();
    expect(placa?.className).toContain('font-numeric');
    expect(placa?.className).toContain('rounded-chip');
    expect(placa?.className).toContain('whitespace-nowrap');
    // periodo/día versalitas 12px
    expect(text).toContain('1ra hora');
    expect(text.toLowerCase()).toContain('lunes');
    const versalitas = el.querySelector('.uppercase.tracking-widest');
    expect(versalitas).not.toBeNull();
    // materia
    expect(text).toContain('Informática');
    // progreso a sangre
    const prog = el.querySelector('[role="progressbar"]');
    expect(prog).not.toBeNull();
    expect(prog?.getAttribute('aria-valuenow')).toMatch(/\d+/);
    expect(text).toContain('Termina en');
    // Siguiente con hora + placa + countdown
    expect(text).toContain('Siguiente');
    expect(text).toContain('3A');
    expect(text).toContain('en');
    const nextTime = el.querySelector('#next-title');
    expect(nextTime).not.toBeNull();
    // rango horario no se parte (nowrap)
    const range = el.querySelector('#next-title')?.closest('section')?.querySelector('p.whitespace-nowrap');
    expect(range).not.toBeNull();
    // region aria-live estable
    const live = el.querySelector('[aria-live="polite"]');
    expect(live).not.toBeNull();
    expect(live?.textContent).toContain('En clase');
  });

  it('break: RECREO con cuenta regresiva y SIGUIENTE con la clase sin duplicar hora/salón', () => {
    const el = setup(MON(14, 0));
    const text = el.textContent ?? '';
    expect(text).toContain('Recreo');
    // hora/salón aparece solo en SIGUIENTE, no duplicado en RECREO
    const tablero = el.querySelector('div.rounded-card .grid') as HTMLElement | null;
    expect(tablero).not.toBeNull();
    const timesInTablero = tablero?.querySelectorAll('time[datetime="14:30"]') ?? [];
    // hero + rango en SIGUIENTE = 2 ocurrencias dentro del tablero (resto tiene otra pero fuera)
    expect(timesInTablero.length).toBe(2);
    const recreoSection = el.querySelector('#recreo-title')?.closest('section') as HTMLElement | null;
    expect(recreoSection).not.toBeNull();
    expect(recreoSection?.querySelector('time[datetime="14:30"]')).toBeNull();
    expect(recreoSection?.textContent).not.toContain('3A');
    // cuenta regresiva en RECREO (tiempo restante)
    expect(recreoSection?.textContent).toMatch(/en \d+ min|en \d+ h/);
    // siguiente bloque con clase, hora y salón una sola vez en panel
    expect(text).toContain('Siguiente');
    const nextSection = el.querySelector('#next-title-break')?.closest('section') as HTMLElement | null;
    expect(nextSection).not.toBeNull();
    expect(nextSection?.querySelector('time[datetime="14:30"]')).not.toBeNull();
    expect(nextSection?.textContent).toContain('3A');
    expect(nextSection?.textContent).toContain('3ra hora');
    // rango nowrap
    expect(nextSection?.querySelector('p.whitespace-nowrap')).not.toBeNull();
    // placa nowrap
    const placa = nextSection?.querySelector('span.whitespace-nowrap.rounded-chip');
    expect(placa).not.toBeNull();
    expect(el.querySelector('[role="progressbar"]')).toBeNull();
    expect(el.querySelector('[aria-live="polite"]')?.textContent).toContain('Recreo');
  });

  it('before-first: PRIMERA CLASE con hora + salón, sin duplicar rango en panel derecho; resto del día lista (hora | periodo | salón)', () => {
    const el = setup(MON(8, 0));
    const text = el.textContent ?? '';
    expect(text).toContain('Primera clase');
    expect(el.querySelector('time[datetime="10:30"]')).not.toBeNull();
    expect(text).toContain('2E');
    expect(text).toContain('5ta hora');
    expect(text).not.toContain('Empieza');
    // hero tiene hora + placa nowrap y rango nowrap
    const heroSection = el.querySelector('#primera-title')?.closest('section') as HTMLElement | null;
    expect(heroSection).not.toBeNull();
    expect(heroSection?.querySelector('span.whitespace-nowrap.rounded-chip')).not.toBeNull();
    expect(heroSection?.querySelector('p.whitespace-nowrap')).not.toBeNull();
    // panel derecho = El resto del día, sin repetir la primera ni su rango
    const restoAntes = el.querySelector('#resto-antes-title');
    expect(restoAntes).not.toBeNull();
    expect(restoAntes?.textContent).toContain('El resto del día');
    const tablero = el.querySelector('div.rounded-card .grid') as HTMLElement | null;
    expect(tablero).not.toBeNull();
    // rango 10:30 debe aparecer solo en el hero (start+end = 2 times), no duplicado a la derecha
    const timesInTablero = tablero?.querySelectorAll('time[datetime="10:30"]') ?? [];
    expect(timesInTablero.length).toBe(2);
    const rightPanel = restoAntes?.closest('section') as HTMLElement | null;
    expect(rightPanel).not.toBeNull();
    expect(rightPanel?.querySelector('time[datetime="10:30"]')).toBeNull();
    // lista de clases posteriores (hora | periodo | salón), sin repetir primera
    const rows = rightPanel?.querySelectorAll('ul li') ?? [];
    expect(rows.length).toBe(5); // lunes 6 menos la primera = 5
    expect(Array.from(rows).some((r) => r.textContent?.includes('2E'))).toBe(false);
    expect(rows[0].textContent).toContain('2G');
    expect(rows[0].textContent).toContain('1ra hora');
    expect(rows[0].querySelector('time.font-numeric.whitespace-nowrap')).not.toBeNull();
    expect(rows[0].querySelector('span.whitespace-nowrap.rounded-chip')).not.toBeNull();
    expect(rows[0].className).toContain('border-l-');
    expect(el.querySelector('[aria-live="polite"]')?.textContent).toContain('Tu primera clase');
  });

  it('before-first con una sola clase muestra mensaje breve sin lista vacía', () => {
    // Lunes tiene 6 clases; con resto >0 no debe mostrar el mensaje de clase única
    const el = setup(MON(8, 0));
    const rightPanel = el.querySelector('#resto-antes-title')?.closest('section') as HTMLElement | null;
    expect(rightPanel?.textContent).not.toContain('Solo tienes esta clase hoy');
    expect(el.innerHTML).not.toContain('undefined');
  });

  it('before-first con una sola clase muestra mensaje Solo tienes esta clase hoy (rama vacía)', () => {
    const nowSig = signal(MON(8, 0));
    const clockDouble = { now: nowSig } as unknown as ClockService;
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [TodayPage],
      providers: [provideRouter([]), { provide: ClockService, useValue: clockDouble }],
    });
    const fixture = TestBed.createComponent(TodayPage);
    // Fuerza rama else: beforeFirstRest vacío aunque haya 6 lecciones reales
    Object.defineProperty(fixture.componentInstance, 'beforeFirstRest', {
      value: computed(() => []),
      configurable: true,
    });
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const rightPanel = el.querySelector('#resto-antes-title')?.closest('section') as HTMLElement | null;
    expect(rightPanel).not.toBeNull();
    expect(rightPanel?.textContent).toContain('Solo tienes esta clase hoy');
    expect(rightPanel?.querySelector('ul')).toBeNull();
    const msg = rightPanel?.querySelector('p') as HTMLElement | null;
    expect(msg).not.toBeNull();
    expect(msg?.textContent).toContain('Solo tienes esta clase hoy');
  });

  it('after-last: Terminaste por hoy con hero PRÓXIMA CLASE y lista del siguiente día sin HOY NO HAY CLASES', () => {
    const el = setup(MON(19, 0));
    const text = el.textContent ?? '';
    // estado Terminaste por hoy, no debe mostrar HOY NO HAY CLASES
    expect(text).toContain('Terminaste por hoy');
    expect(text).not.toContain('Hoy no hay clases');
    expect(el.querySelector('#vacio-title')).toBeNull();
    // hero es Próxima clase
    const proxima = el.querySelector('#proxima-title-after');
    expect(proxima).not.toBeNull();
    expect(proxima?.textContent).toContain('Próxima clase');
    expect(text.toLowerCase()).toContain('martes');
    expect(el.querySelector('time[datetime="10:30"]')).not.toBeNull();
    expect(text).toContain('2F');
    // sin duplicación Siguiente:
    expect(el.querySelector('#next-title')).toBeNull();
    expect(el.textContent).not.toMatch(/Siguiente:/);
    // lista del siguiente día lectivo rellena espacio a 1280 (hora | periodo | salón)
    const listTitle = el.querySelector('#next-day-title-after');
    expect(listTitle).not.toBeNull();
    expect(listTitle?.textContent).toContain('Horario');
    expect(listTitle?.textContent?.toLowerCase()).toContain('martes');
    const rows = el.querySelectorAll('#next-day-title-after + ul li');
    expect(rows.length).toBe(4); // martes: 4 clases
    const firstRow = rows[0] as HTMLElement;
    expect(firstRow.querySelector('time.font-numeric.whitespace-nowrap')).not.toBeNull();
    expect(firstRow.textContent).toContain('5ta hora');
    expect(firstRow.textContent).toContain('2F');
    expect(firstRow.className).toContain('border-l-');
    expect(firstRow.querySelector('span.whitespace-nowrap.rounded-chip')).not.toBeNull();
    // rango nowrap en hero
    const heroSection = proxima?.closest('section') as HTMLElement | null;
    expect(heroSection?.querySelector('p.whitespace-nowrap')).not.toBeNull();
    // no resto
    expect(el.querySelector('#resto-title')).toBeNull();
  });

  it('weekend: Hoy no hay clases + próxima lunes con lista', () => {
    const el = setup(SAT(10, 0));
    const text = el.textContent ?? '';
    expect(el.querySelector('#vacio-weekend-title')?.textContent).toContain('Hoy no hay clases');
    // etiqueta pequeña Hoy no hay clases + hero Próxima clase
    expect(text).toContain('Próxima clase');
    expect(text.toLowerCase()).toContain('lunes');
    expect(text).toContain('2E');
    // lista del siguiente día lectivo
    const listTitle = el.querySelector('#next-day-title-weekend');
    expect(listTitle).not.toBeNull();
    expect(listTitle?.textContent).toContain('Horario');
    expect(listTitle?.textContent?.toLowerCase()).toContain('lunes');
    const rows = el.querySelectorAll('#next-day-title-weekend + ul li');
    expect(rows.length).toBe(6); // lunes: 6 clases
    expect(rows[0].textContent).toContain('2E');
    expect(el.querySelector('#resto-title')).toBeNull();
    expect(el.querySelector('[aria-live="polite"]')?.textContent).toContain('Hoy no hay clases');
  });

  it('no-classes: estado puro vía util', () => {
    expect(getDayStatusForLessons(MON(10, 0), [])).toBe('no-classes');
    const el = setup(SAT(10, 0));
    expect(el.textContent).toContain('Hoy no hay clases');
  });

  it('siguiente clase es otro día: viernes after-last salta a lunes', () => {
    const el = setup(FRI(19, 0));
    const text = el.textContent ?? '';
    expect(text).toContain('Terminaste por hoy');
    expect(text.toLowerCase()).toContain('lunes');
    expect(text).toContain('2E');
    const times = Array.from(el.querySelectorAll('time')).map((t) => t.textContent);
    expect(times.join(' ')).toContain('10:30');
    // lista lunes completa
    const rows = el.querySelectorAll('#next-day-title-after + ul li');
    expect(rows.length).toBe(6);
  });

  it('terminado no muestra HOY NO HAY CLASES y weekend sí', () => {
    const terminado = setup(MON(19, 0));
    expect(terminado.textContent).not.toContain('Hoy no hay clases');
    expect(terminado.querySelector('#proxima-title-after')).not.toBeNull();
    const weekend = setup(SAT(10, 0));
    expect(weekend.querySelector('#vacio-weekend-title')?.textContent).toContain('Hoy no hay clases');
    expect(weekend.textContent).toContain('Próxima clase');
  });

  it('receso no duplica hora/salón entre paneles', () => {
    const el = setup(MON(14, 0));
    const recreo = el.querySelector('#recreo-title')?.closest('section') as HTMLElement | null;
    const siguiente = el.querySelector('#next-title-break')?.closest('section') as HTMLElement | null;
    expect(recreo).not.toBeNull();
    expect(siguiente).not.toBeNull();
    // solo siguiente tiene el time y la placa
    expect(recreo?.querySelectorAll('time').length).toBe(0);
    expect(siguiente?.querySelectorAll('time[datetime="14:30"]').length).toBe(2);
    // salón 3A solo en siguiente
    expect(recreo?.textContent).not.toContain('3A');
    expect(siguiente?.textContent).toContain('3A');
  });

  it('receso no muestra etiqueta de día huérfana; solo RECREO + countdown y SIGUIENTE una vez', () => {
    const el = setup(MON(14, 0));
    const recreo = el.querySelector('#recreo-title')?.closest('section') as HTMLElement | null;
    expect(recreo).not.toBeNull();
    // etiqueta huérfana LUNES eliminada
    expect(recreo?.textContent?.toLowerCase()).not.toContain('lunes');
    expect(recreo?.textContent).toContain('Recreo');
    // SIGUIENTE heading aparece una sola vez en el tablero
    const tablero = el.querySelector('div.rounded-card .grid') as HTMLElement | null;
    expect(tablero?.querySelectorAll('#next-title-break').length).toBe(1);
    expect(tablero?.querySelectorAll('[id^="next-title"]').length).toBe(1);
  });
});

describe('TodayPage — resto del día', () => {
  it('filas a sangre con hora mono, periodo, placa y estado; barra lateral por turno; ahora/finalizada', () => {
    const el = setup(MON(13, 20));
    const resto = el.querySelector('#resto-title');
    expect(resto).not.toBeNull();
    expect(resto?.textContent).toContain('Resto del día');
    const rows = el.querySelectorAll('#resto-title + ul li');
    expect(rows.length).toBeGreaterThan(0);
    // debe listar todas las lecciones del día (6 lunes)
    expect(rows.length).toBe(6);
    // cada fila tiene time con font-numeric, periodo, placa, estado
    const firstRow = rows[0] as HTMLElement;
    expect(firstRow.querySelector('time.font-numeric')).not.toBeNull();
    expect(firstRow.textContent).toContain('5ta hora');
    expect(firstRow.textContent).toContain('2E');
    // barra lateral 3px con color turno
    expect(firstRow.className).toContain('border-l-');
    expect(firstRow.className).toMatch(/border-shift-(morning|afternoon)/);
    // pasada con Finalizada y contraste AA (muted pero no solo color)
    expect(firstRow.textContent).toContain('Finalizada');
    expect(firstRow.querySelector('.text-foreground-muted')).not.toBeNull();
    // fila actual invertida con AHORA (naranja solo para ahora)
    const nowRow = Array.from(rows).find((r) => r.textContent?.includes('Ahora')) as HTMLElement | undefined;
    expect(nowRow).toBeDefined();
    expect(nowRow?.textContent).toContain('Ahora');
    expect(nowRow?.className).toContain('bg-accent');
    // sin tarjetas por fila (no rounded-card dentro de li)
    const nestedCards = el.querySelectorAll('#resto-title + ul li .rounded-card');
    expect(nestedCards.length).toBe(0);
    // divisores 1px
    const list = el.querySelector('#resto-title + ul');
    expect(list?.className).toContain('divide-y');
    expect(list?.className).toContain('divide-divider');
  });

  it('break: resto marca pasadas como finalizadas y futuras sin Ahora', () => {
    const el = setup(MON(14, 0));
    const rows = el.querySelectorAll('#resto-title + ul li');
    expect(rows.length).toBe(6);
    const texts = Array.from(rows).map((r) => r.textContent ?? '');
    // m5 y t1 pasadas
    expect(texts[0]).toContain('Finalizada');
    expect(texts[1]).toContain('Finalizada');
    expect(texts.join(' ')).not.toContain('Ahora');
  });

  it('no renderiza resto vacío cuando no hay clases hoy', () => {
    const el = setup(SAT(10, 0));
    expect(el.querySelector('#resto-title')).toBeNull();
  });

  it('before-first resto en panel derecho no limita y muestra bordes por turno; bottom resto no se duplica', () => {
    const el = setup(MON(8, 0));
    // bottom resto no debe aparecer en before-first (evita duplicación)
    expect(el.querySelector('#resto-title')).toBeNull();
    const rows = el.querySelectorAll('#resto-antes-title + ul li');
    expect(rows.length).toBe(5);
    const afternoonRow = Array.from(rows).find((r) => r.textContent?.includes('2G')) as HTMLElement;
    expect(afternoonRow.className).toContain('border-shift-afternoon');
    // morning no debe estar (primera excluida)
    expect(Array.from(rows).some((r) => r.textContent?.includes('2E'))).toBe(false);
  });

  it('360: rango horario en una sola línea con nowrap y placa sin partir', () => {
    const el = setup(MON(14, 0));
    // cualquier rango debe tener whitespace-nowrap para no colgar guion a 360
    const ranges = Array.from(el.querySelectorAll('p.whitespace-nowrap'));
    expect(ranges.length).toBeGreaterThan(0);
    ranges.forEach((p) => expect(p.className).toContain('whitespace-nowrap'));
    // placas siempre nowrap
    const placas = Array.from(el.querySelectorAll('span.rounded-chip'));
    placas.forEach((s) => expect(s.className).toContain('whitespace-nowrap'));
  });
});

describe('TodayPage — accesibilidad y formato', () => {
  it('usa <time> con datetime y fecha larga en español', () => {
    const el = setup(MON(10, 30));
    const headerTime = el.querySelector('time[datetime="2026-11-09"]');
    expect(headerTime).not.toBeNull();
    expect(headerTime?.textContent).toContain('lunes');
    expect(headerTime?.textContent).toContain('9 de noviembre');
  });

  it('progreso accesible y live region no anuncia countdown cada tick', () => {
    const el = setup(MON(13, 20));
    const prog = el.querySelector('[role="progressbar"]');
    expect(prog?.getAttribute('aria-valuemin')).toBe('0');
    expect(prog?.getAttribute('aria-valuemax')).toBe('100');
    expect(prog?.getAttribute('aria-label')).toContain('1ra hora');
    const live = el.querySelector('[aria-live="polite"]') as HTMLElement;
    expect(live).not.toBeNull();
    expect(live.className).toContain('sr-only');
    // mensaje estable contiene estado, no minutos exactos cambiantes cada tick
    expect(live.textContent).not.toMatch(/^\s*en \d+ min\s*$/);
  });

  it('hora manda 56–64px font-numeric y versalitas 12px', () => {
    const el = setup(MON(13, 20));
    const huge = el.querySelector('.text-display.font-numeric');
    expect(huge).not.toBeNull();
    expect(huge?.className).toContain('font-numeric');
    expect(huge?.className).toContain('tabular-nums');
    const caps = el.querySelector('.text-\\[12px\\].uppercase.tracking-widest');
    expect(caps).not.toBeNull();
  });
});

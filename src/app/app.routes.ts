import type { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'hoy' },
  {
    path: 'hoy',
    loadComponent: () => import('./features/today/today-page').then((m) => m.TodayPage),
    title: 'Hoy · Horario Verónica Luna',
  },
  {
    path: 'horario',
    loadComponent: () => import('./features/schedule/schedule-page').then((m) => m.SchedulePage),
    title: 'Horario · Horario Verónica Luna',
  },
  {
    path: 'ajustes',
    loadComponent: () => import('./features/settings/settings-page').then((m) => m.SettingsPage),
    title: 'Ajustes · Horario Verónica Luna',
  },
  { path: '**', redirectTo: 'hoy' },
];

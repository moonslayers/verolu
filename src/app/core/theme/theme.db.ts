import Dexie, { type Table } from 'dexie';

export interface Setting {
  key: string;
  value: string;
}

export class VeroluDatabase extends Dexie {
  settings!: Table<Setting, string>;

  constructor() {
    super('verolu-db');
    this.version(1).stores({
      settings: '&key',
    });
  }
}

export const veroluDb = new VeroluDatabase();

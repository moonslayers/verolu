import { Service } from '@angular/core';
import type { Cell } from 'write-excel-file/browser';
import { PERIODS, LESSONS } from '../../core/schedule/schedule.data';
import {
  buildExcelSheetData,
  buildExcelColumnWidths,
  getExcelSheetName,
  buildPdfDefinition,
} from './schedule-export';

type ExcelCell = string | number | null;

function toSheetData(rows: readonly (readonly Cell[])[]): Cell[][] {
  return rows.map((row) => [...row]);
}

@Service()
export class ScheduleExportService {
  async exportPdf(): Promise<void> {
    const { docDefinition } = buildPdfDefinition(PERIODS, LESSONS, new Date());
    const pdfMakeModule = await import('pdfmake/build/pdfmake');
    await import('pdfmake/build/vfs_fonts');
    const pdfMake = (pdfMakeModule.default ?? pdfMakeModule) as unknown as {
      createPdf: (def: Record<string, unknown>) => { download: (name: string) => void };
    };
    if (!pdfMake?.createPdf) throw new Error('pdfMake no disponible');
    pdfMake.createPdf(docDefinition).download('horario-veronica-luna.pdf');
  }

  async exportExcel(): Promise<void> {
    const sheetData: ExcelCell[][] = buildExcelSheetData(PERIODS, LESSONS);
    const columns = buildExcelColumnWidths();
    const sheetName = getExcelSheetName();
    const mod = await import('write-excel-file/browser');
    const writeXlsxFile = mod.default;
    const styledData: Cell[][] = sheetData.map((row, rowIndex) =>
      row.map((cell) => {
        if (rowIndex === 0) {
          return {
            value: cell === null ? undefined : cell,
            fontWeight: 'bold',
            backgroundColor: '#e3dccf',
            align: 'center',
          };
        }
        return { value: cell === null ? undefined : cell, align: 'center' };
      }),
    );
    await writeXlsxFile(toSheetData(styledData), {
      columns,
      stickyRowsCount: 1,
      sheet: sheetName,
    }).toFile('horario-veronica-luna.xlsx');
  }
}

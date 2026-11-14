import { Injectable } from '@nestjs/common';

@Injectable()
export class CsvService {
  toCsv(rows: Record<string, any>[], headers?: { key: string; label: string }[]): string {
    if (!rows || rows.length === 0) {
      return '';
    }

    const cols = headers || Object.keys(rows[0]).map((k) => ({ key: k, label: k }));
    const headerLine = cols.map((c) => this.escapeCsv(c.label)).join(',');

    const lines = rows.map((row) =>
      cols
        .map((c) => {
          const val = row[c.key];
          return this.escapeCsv(val);
        })
        .join(','),
    );

    return [headerLine, ...lines].join('\r\n');
  }

  private escapeCsv(val: any): string {
    if (val === null || val === undefined) return '""';
    let str = String(val);
    if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
      str = str.replace(/"/g, '""');
      return `"${str}"`;
    }
    return `"${str}"`;
  }
}

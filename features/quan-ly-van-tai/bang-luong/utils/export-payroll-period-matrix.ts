import { saveBlobAs, formatDateTime, getTodayISODate } from '@/lib/utils';
import { resolveTransportValue, type TransportLookupRows, type TransportRow } from '../../shared/transport-config';
import { useUIStore } from '@/store/useStore';
import { buildPayrollMatrix, getPayrollTripDetails } from './payroll-matrix';

const COLORS = {
  yellow: 'FEE06A',
  green: '00FF00',
  orange: 'FF6A1A',
  beige: 'FFF4EC',
  border: 'CBD5E1',
  slate: '64748B',
  emerald: '047857',
  rose: 'E11D48',
  white: 'FFFFFF',
  company: '1E3A8A',
};

type CellValue = string | number;

function safeFileName(name: string): string {
  return name.replace(/\s+/g, '_').replace(/[<>:"/\\|?*]/g, '');
}

function thinBorder() {
  const c = { rgb: COLORS.border };
  return {
    top: { style: 'thin', color: c },
    bottom: { style: 'thin', color: c },
    left: { style: 'thin', color: c },
    right: { style: 'thin', color: c },
  };
}

function baseStyle(overrides: Record<string, unknown> = {}) {
  return {
    font: { name: 'Arial', sz: 10 },
    alignment: { vertical: 'center', horizontal: 'center', wrapText: true },
    border: thinBorder(),
    ...overrides,
  };
}

/** Xuất ma trận chi tiết trong kỳ ra Excel — màu sắc khớp bản in trên web, ô có thể sửa. */
export async function exportPayrollPeriodMatrixExcel(
  row: TransportRow,
  lookups: Partial<TransportLookupRows>,
): Promise<void> {
  const XLSX = await import('xlsx-js-style');
  const info = useUIStore.getState().companyInfo;
  const tripDetails = getPayrollTripDetails(row, lookups, true);
  const matrixRows = buildPayrollMatrix(tripDetails, row);
  const maxTripSlots = Math.max(6, ...matrixRows.map((item) => item.rows.length));
  const totalCols = 2 + maxTripSlots + 1;

  const periodSalaryTotal = tripDetails.reduce((sum, item) => sum + (Number(item.tien_luong) || 0), 0);
  const periodCostTotal = tripDetails.reduce((sum, item) => sum + (Number(item.chi_phi) || 0), 0);
  const luongCoBan = Number(row.luong_co_ban) || 0;
  const tongLuong = row.tong_luong_chuyen != null ? Number(row.tong_luong_chuyen) : periodSalaryTotal;
  const tongChiPhi = row.tong_chi_phi_chuyen != null ? Number(row.tong_chi_phi_chuyen) : periodCostTotal;
  const truKhac = Number(row.tru_tien_khac) || 0;
  const tongConLai = row.tong_con_lai != null ? Number(row.tong_con_lai) : (luongCoBan + tongLuong + tongChiPhi - truKhac);

  const driver = (lookups?.drivers || []).find((d) => String(d.id) === String(row.id_tai_xe));
  const driverName =
    driver?.ho_ten || driver?.ho_va_ten || resolveTransportValue('id_tai_xe', row.id_tai_xe, lookups);
  const printedAt = formatDateTime(new Date());

  const rows: CellValue[][] = [];
  const styles: Map<string, Record<string, unknown>> = new Map();
  const merges: Array<{ s: { r: number; c: number }; e: { r: number; c: number } }> = [];
  const moneyCells: Set<string> = new Set();

  const mark = (r: number, c: number, style: Record<string, unknown>, isMoney = false) => {
    const ref = XLSX.utils.encode_cell({ r, c });
    styles.set(ref, style);
    if (isMoney) moneyCells.add(ref);
  };

  const pushRow = (cells: CellValue[]) => {
    while (cells.length < totalCols) cells.push('');
    rows.push(cells.slice(0, totalCols));
    return rows.length - 1;
  };

  const mergeRow = (r: number) => merges.push({ s: { r, c: 0 }, e: { r, c: totalCols - 1 } });

  let r = pushRow([info.companyName || '5F Quản lý vận tải']);
  mark(r, 0, baseStyle({ font: { name: 'Arial', sz: 12, bold: true, color: { rgb: COLORS.company } } }));
  mergeRow(r);

  r = pushRow(['Chi tiết trong kỳ']);
  mark(r, 0, baseStyle({ font: { name: 'Arial', sz: 11, bold: true } }));
  mergeRow(r);

  r = pushRow([`Kỳ lương tháng ${row.thang}/${row.nam} — Tài xế: ${driverName}`]);
  mark(r, 0, baseStyle({ font: { name: 'Arial', sz: 10, color: { rgb: COLORS.slate } } }));
  mergeRow(r);

  pushRow([]);

  const summaryLabels = ['Lương cơ bản', 'Tổng lương chuyến', 'Tổng chi phí chuyến', 'Trừ tiền khác', 'Tổng còn lại'];
  const summaryValues: CellValue[] = [luongCoBan, tongLuong, tongChiPhi, truKhac, tongConLai];
  const summaryAccents = [COLORS.slate, COLORS.company, '000000', COLORS.rose, COLORS.emerald];

  r = pushRow(summaryLabels);
  for (let c = 0; c < 5; c++) {
    mark(
      r,
      c,
      baseStyle({
        font: { name: 'Arial', sz: 9, color: { rgb: COLORS.slate } },
        fill: { fgColor: { rgb: COLORS.white } },
      }),
    );
  }

  r = pushRow(summaryValues);
  for (let c = 0; c < 5; c++) {
    mark(
      r,
      c,
      baseStyle({
        font: { name: 'Arial', sz: 10, bold: true, color: { rgb: summaryAccents[c] } },
        fill: { fgColor: { rgb: COLORS.white } },
      }),
      true,
    );
  }

  pushRow([]);

  r = pushRow([`${tripDetails.length} chuyến trong kỳ`]);
  mark(
    r,
    0,
    baseStyle({
      font: { name: 'Arial', sz: 9, bold: true, color: { rgb: COLORS.emerald } },
      alignment: { horizontal: 'center', vertical: 'center' },
    }),
  );
  mergeRow(r);

  if (matrixRows.length > 0) {
    const headerRow: CellValue[] = ['Ngày', 'Lương'];
    for (let i = 0; i < maxTripSlots; i++) headerRow.push(`Chuyến ${i + 1}`);
    headerRow.push('Tổng / TỔNG CỘNG');
    r = pushRow(headerRow);

    mark(
      r,
      0,
      baseStyle({
        font: { name: 'Arial', sz: 9, bold: true },
        fill: { fgColor: { rgb: COLORS.green } },
      }),
    );
    for (let c = 1; c < totalCols - 1; c++) {
      mark(
        r,
        c,
        baseStyle({
          font: { name: 'Arial', sz: 9, bold: true },
          fill: { fgColor: { rgb: COLORS.yellow } },
        }),
      );
    }
    mark(
      r,
      totalCols - 1,
      baseStyle({
        font: { name: 'Arial', sz: 9, bold: true, color: { rgb: COLORS.white } },
        fill: { fgColor: { rgb: COLORS.orange } },
      }),
    );

    for (const { date, dayLabel, rows: items } of matrixRows) {
      const displayDay = dayLabel ?? resolveTransportValue('ngay', date, lookups);
      const totalSalary = items.reduce((sum, item) => sum + (Number(item.tien_luong) || 0), 0);
      const totalCost = items.reduce((sum, item) => sum + (Number(item.chi_phi) || 0), 0);
      const startR = rows.length;

      const subDefs = [
        {
          label: 'Vị trí',
          highlight: true,
          getValue: (i: number) =>
            items[i] ? resolveTransportValue('id_dia_diem', items[i].id_dia_diem, lookups) : '',
          total: '' as CellValue,
        },
        {
          label: 'Lương',
          highlight: false,
          getValue: (i: number) => (items[i] ? Number(items[i].tien_luong) || 0 : ''),
          total: totalSalary,
        },
        {
          label: 'Chi phí',
          highlight: true,
          getValue: (i: number) => (items[i] ? Number(items[i].chi_phi) || 0 : ''),
          total: totalCost,
        },
      ];

      subDefs.forEach((sub, subIndex) => {
        const line: CellValue[] = [];
        if (subIndex === 0) line.push(displayDay);
        else line.push('');
        line.push(sub.label);
        for (let i = 0; i < maxTripSlots; i++) line.push(sub.getValue(i));
        if (sub.label === 'Vị trí') line.push('');
        else line.push(sub.total);
        r = pushRow(line);

        if (subIndex === 0) {
          mark(
            r,
            0,
            baseStyle({
              font: { name: 'Arial', sz: 9, bold: true },
              alignment: { vertical: 'center', horizontal: 'center', wrapText: true },
            }),
          );
          merges.push({ s: { r: startR, c: 0 }, e: { r: startR + 2, c: 0 } });
        }

        mark(
          r,
          1,
          baseStyle({
            font: { name: 'Arial', sz: 9, bold: true },
            fill: { fgColor: { rgb: sub.highlight ? COLORS.yellow : COLORS.white } },
          }),
        );

        for (let c = 2; c < totalCols - 1; c++) {
          const isMoney = sub.label !== 'Vị trí';
          mark(
            r,
            c,
            baseStyle({
              font: { name: 'Arial', sz: 9 },
              alignment: {
                horizontal: isMoney ? 'right' : 'center',
                vertical: 'center',
                wrapText: true,
              },
            }),
            isMoney,
          );
        }

        if (sub.label !== 'Vị trí') {
          mark(
            r,
            totalCols - 1,
            baseStyle({
              font: { name: 'Arial', sz: 9, bold: true },
              fill: { fgColor: { rgb: COLORS.beige } },
              alignment: { horizontal: 'right', vertical: 'center' },
            }),
            true,
          );
        }
      });
    }

    r = pushRow([...Array(1 + maxTripSlots).fill(''), 'Lương', tongLuong]);
    mark(r, totalCols - 2, baseStyle({ font: { name: 'Arial', sz: 9, bold: true } }));
    mark(
      r,
      totalCols - 1,
      baseStyle({
        font: { name: 'Arial', sz: 9, bold: true, color: { rgb: COLORS.white } },
        fill: { fgColor: { rgb: COLORS.orange } },
        alignment: { horizontal: 'right', vertical: 'center' },
      }),
      true,
    );

    r = pushRow([...Array(1 + maxTripSlots).fill(''), 'Chi phí', tongChiPhi]);
    mark(r, totalCols - 2, baseStyle({ font: { name: 'Arial', sz: 9, bold: true } }));
    mark(
      r,
      totalCols - 1,
      baseStyle({
        font: { name: 'Arial', sz: 9, bold: true, color: { rgb: COLORS.white } },
        fill: { fgColor: { rgb: COLORS.orange } },
        alignment: { horizontal: 'right', vertical: 'center' },
      }),
      true,
    );
  }

  pushRow([]);
  pushRow([]);

  r = pushRow(['TÀI XẾ (KÝ, GHI RÕ HỌ TÊN)', '', 'QUẢN LÝ / KẾ TOÁN (KÝ, GHI RÕ HỌ TÊN)']);
  mark(r, 0, baseStyle({ font: { name: 'Arial', sz: 9, bold: true } }));
  mark(r, 2, baseStyle({ font: { name: 'Arial', sz: 9, bold: true } }));
  merges.push({ s: { r, c: 0 }, e: { r, c: 1 } });
  merges.push({ s: { r, c: 2 }, e: { r, c: totalCols - 1 } });

  r = pushRow([driverName]);
  mark(r, 0, baseStyle({ font: { name: 'Arial', sz: 9, color: { rgb: COLORS.slate } } }));
  merges.push({ s: { r, c: 0 }, e: { r, c: 1 } });

  pushRow([]);
  pushRow([]);

  r = pushRow([`Ngày in: ${printedAt}`]);
  mark(r, 0, baseStyle({ font: { name: 'Arial', sz: 8, color: { rgb: '94A3B8' } } }));
  mergeRow(r);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!merges'] = merges;
  ws['!cols'] = Array.from({ length: totalCols }, (_, i) => ({
    wch: i === 0 ? 10 : i === 1 ? 12 : i === totalCols - 1 ? 16 : 14,
  }));

  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
  for (let R = range.s.r; R <= range.e.r; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
      if (!ws[cellRef]) {
        ws[cellRef] = { t: 's', v: '' };
      }
      const custom = styles.get(cellRef);
      ws[cellRef].s = custom ?? baseStyle();
      if (moneyCells.has(cellRef) && typeof ws[cellRef].v === 'number') {
        ws[cellRef].s = {
          ...ws[cellRef].s,
          numFmt: '#,##0',
        };
      }
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Chi tiet trong ky');

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveBlobAs(
    blob,
    `Chi_tiet_trong_ky_${safeFileName(driverName)}_Thang_${row.thang}_${row.nam}_${getTodayISODate()}.xlsx`,
  );
}
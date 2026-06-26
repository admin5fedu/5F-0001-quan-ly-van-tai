import { describe, expect, it } from 'vitest';
import { getTripReportRows } from '../transport-report-rows';

describe('getTripReportRows', () => {
  it('maps execution and approval domains separately', () => {
    const rows = getTripReportRows(
      [
        {
          id: '1',
          id_chuyen_xe: '52',
          id_dia_diem: '10',
          tien_luong: 100,
          chi_phi: 20,
          trang_thai: 'Đã thực hiện',
          phe_duyet: 'Chưa duyệt',
        } as any,
      ],
      {
        trips: [{ id: '52', id_tai_xe: '115', ngay: '2026-06-12' } as any],
        drivers: [],
        vehicles: [],
        locations: [],
      },
    );
    expect(rows[0].trang_thai).toBe('Đã thực hiện');
    expect(rows[0].phe_duyet).toBe('Chưa duyệt');
  });
});
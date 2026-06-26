import { describe, expect, it } from 'vitest';
import { getReportableCtRowsForTrip, shouldPickCtBeforeReport } from './driver-ct-report-flow';
import type { TransportRow } from './transport-config';

const tripDetails = [
  { id: 1, id_chuyen_xe: 52, phe_duyet: 'Chưa duyệt', trang_thai: 'Chưa thực hiện' },
  { id: 2, id_chuyen_xe: 52, phe_duyet: 'Chưa duyệt', trang_thai: 'Đã thực hiện' },
  { id: 3, id_chuyen_xe: 52, phe_duyet: 'Đã duyệt', trang_thai: 'Đã thực hiện' },
] as TransportRow[];

describe('driver-ct-report-flow', () => {
  it('filters only reportable CT rows', () => {
    expect(getReportableCtRowsForTrip(52, tripDetails).map((r) => r.id)).toEqual([1, 2]);
  });

  it('requires picker when multiple reportable CTs', () => {
    expect(shouldPickCtBeforeReport(2)).toBe(true);
    expect(shouldPickCtBeforeReport(1)).toBe(false);
  });
});
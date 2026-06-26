import { describe, expect, it } from 'vitest';
import {
  formatTripCtCompletionStats,
  getTripCtCompletionStats,
  isCtEligibleForPayroll,
  normalizeExecutionStatus,
} from '../trip-execution-sync';

describe('normalizeExecutionStatus', () => {
  it('maps legacy and default values', () => {
    expect(normalizeExecutionStatus('Chưa thực hiện')).toBe('Chưa thực hiện');
    expect(normalizeExecutionStatus('Đã thực hiện')).toBe('Đã thực hiện');
    expect(normalizeExecutionStatus('Hủy')).toBe('Hủy');
    expect(normalizeExecutionStatus(undefined)).toBe('Chưa thực hiện');
  });
});

describe('isCtEligibleForPayroll', () => {
  it('requires both Đã duyệt and Đã thực hiện', () => {
    expect(isCtEligibleForPayroll({ phe_duyet: 'Đã duyệt', trang_thai: 'Đã thực hiện' })).toBe(true);
    expect(isCtEligibleForPayroll({ phe_duyet: 'Chưa duyệt', trang_thai: 'Đã thực hiện' })).toBe(false);
    expect(isCtEligibleForPayroll({ phe_duyet: 'Đã duyệt', trang_thai: 'Chưa thực hiện' })).toBe(false);
  });
});

describe('getTripCtCompletionStats', () => {
  const details = [
    { id: '1', id_chuyen_xe: 'trip-a', trang_thai: 'Đã thực hiện', phe_duyet: 'Đã duyệt' },
    { id: '2', id_chuyen_xe: 'trip-a', trang_thai: 'Đã thực hiện', phe_duyet: 'Chưa duyệt' },
    { id: '3', id_chuyen_xe: 'trip-a', trang_thai: 'Chưa thực hiện', phe_duyet: 'Chưa duyệt' },
    { id: '4', id_chuyen_xe: 'trip-a', trang_thai: 'Hủy', phe_duyet: 'Không duyệt' },
  ];

  it('counts only Đã thực hiện over total CT', () => {
    expect(getTripCtCompletionStats('trip-a', details)).toEqual({ executed: 2, total: 4 });
    expect(formatTripCtCompletionStats(getTripCtCompletionStats('trip-a', details))).toBe('2/4');
  });
});
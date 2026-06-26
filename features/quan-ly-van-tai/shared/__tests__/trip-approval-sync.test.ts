import { describe, expect, it } from 'vitest';
import { deriveParentTripStatus, isPendingTripApproval } from '../trip-approval-sync';

describe('deriveParentTripStatus', () => {
  it('returns Chưa duyệt when any child is Chưa duyệt (e.g. 2/3 approved)', () => {
    expect(deriveParentTripStatus(['Đã duyệt', 'Đã duyệt', 'Chưa duyệt'])).toBe('Chưa duyệt');
  });

  it('returns Đã duyệt when all children are Đã duyệt', () => {
    expect(deriveParentTripStatus(['Đã duyệt', 'Đã duyệt', 'Đã duyệt'])).toBe('Đã duyệt');
  });

  it('returns Không duyệt when all children are Không duyệt', () => {
    expect(deriveParentTripStatus(['Không duyệt', 'Không duyệt'])).toBe('Không duyệt');
  });

  it('returns Chưa duyệt when no children', () => {
    expect(deriveParentTripStatus([])).toBe('Chưa duyệt');
  });
});

describe('isPendingTripApproval', () => {
  it('true only for Chưa duyệt / Chờ duyệt', () => {
    expect(isPendingTripApproval('Chưa duyệt')).toBe(true);
    expect(isPendingTripApproval('Chờ duyệt')).toBe(true);
    expect(isPendingTripApproval('Đã duyệt')).toBe(false);
    expect(isPendingTripApproval('Không duyệt')).toBe(false);
  });
});


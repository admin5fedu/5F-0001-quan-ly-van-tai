import { toast } from 'sonner';
import { txt } from '@/lib/text';

export function openPayrollPeriodMatrixTab(payrollId: string): void {
  const url = `${window.location.origin}/bang-luong-ky-chi-tiet/${encodeURIComponent(payrollId)}`;
  const w = window.open(url, '_blank', 'noopener,noreferrer');
  if (w == null) {
    toast.error(txt('employee.rowActions.popupBlocked') || 'Trình duyệt đã chặn popup', {
      description: txt('employee.rowActions.popupBlockedHint') || 'Vui lòng cho phép popup để mở trang chi tiết trong kỳ',
    });
  }
}
import { toast } from 'sonner';
import { txt } from '@/lib/text';

/** Mở trang in / xem bảng lương (tab mới). Báo toast nếu trình duyệt chặn popup. */
export function openPayrollPreviewTab(payrollId: string): void {
  const url = `${window.location.origin}/bang-luong-preview/${encodeURIComponent(payrollId)}`;
  const w = window.open(url, '_blank', 'noopener,noreferrer');
  if (w == null) {
    toast.error(txt('employee.rowActions.popupBlocked') || 'Trình duyệt đã chặn popup', {
      description: txt('employee.rowActions.popupBlockedHint') || 'Vui lòng cho phép popup để mở trang in',
    });
  }
}

import React, { useEffect, useState } from 'react';
import { ClipboardList, Save } from 'lucide-react';
import { TRANG_THAI_THUC_HIEN_CHUYEN } from '@/lib/constants/trang-thai';
import type { TripExecutionStatus } from './trip-execution-sync';
import { normalizeExecutionStatus } from './trip-execution-sync';
import {
  StatusChoiceForm,
  confirmCurrencyInputClass,
  confirmNoteFieldClass,
  type StatusChoiceOption,
} from './StatusChoiceForm';

export type DriverCtReportValues = {
  trang_thai: TripExecutionStatus;
  chi_phi: number;
  ghi_chu: string;
};

type DriverCtReportDialogProps = {
  locationLabel: string;
  tienLuong: number;
  initialValues: DriverCtReportValues;
  onValuesChange: (values: DriverCtReportValues) => void;
};

const REPORTABLE_STATUSES: StatusChoiceOption<TripExecutionStatus>[] = [
  { value: 'Đã thực hiện', label: 'Đã thực hiện', tone: 'success' },
  { value: 'Hủy', label: 'Hủy', tone: 'danger' },
];

export const DriverCtReportDialog: React.FC<DriverCtReportDialogProps> = ({
  locationLabel,
  tienLuong,
  initialValues,
  onValuesChange,
}) => {
  const [status, setStatus] = useState<TripExecutionStatus>(
    normalizeExecutionStatus(initialValues.trang_thai) === 'Chưa thực hiện'
      ? 'Đã thực hiện'
      : normalizeExecutionStatus(initialValues.trang_thai),
  );
  const [chiPhi, setChiPhi] = useState(initialValues.chi_phi ?? 0);
  const [ghiChu, setGhiChu] = useState(initialValues.ghi_chu ?? '');

  useEffect(() => {
    onValuesChange({ trang_thai: status, chi_phi: chiPhi, ghi_chu: ghiChu });
  }, [status, chiPhi, ghiChu, onValuesChange]);

  return (
    <div className="space-y-4 text-left py-1 w-full min-w-[320px] sm:min-w-[400px]">
      <div className="rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Địa điểm</p>
        <p className="mt-1 font-medium text-foreground">{locationLabel || '—'}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Lương chuyến (do quản lý thiết lập):{' '}
          <strong className="text-foreground tabular-nums">
            {new Intl.NumberFormat('vi-VN').format(tienLuong)} đ
          </strong>
        </p>
      </div>

      <StatusChoiceForm
        sectionLabel="TRẠNG THÁI THỰC HIỆN"
        options={REPORTABLE_STATUSES}
        value={status}
        onChange={setStatus}
        hint={`Mặc định: ${TRANG_THAI_THUC_HIEN_CHUYEN[0]}. Báo cáo không đổi trạng thái duyệt — có thể sửa lại chi phí cho đến khi CT bị khóa duyệt.`}
      />

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted-foreground font-medium">Chi phí phát sinh</label>
        <input
          type="text"
          value={new Intl.NumberFormat('vi-VN').format(chiPhi)}
          onChange={(e) => {
            const numeric = e.target.value.replace(/[^0-9]/g, '');
            setChiPhi(Number(numeric) || 0);
          }}
          className={confirmCurrencyInputClass}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted-foreground font-medium">Ghi chú (tùy chọn)</label>
        <textarea
          value={ghiChu}
          onChange={(e) => setGhiChu(e.target.value)}
          placeholder="Mô tả tiến độ, chi phí..."
          className={confirmNoteFieldClass}
        />
      </div>
    </div>
  );
};

export const DriverCtReportDialogIcon = ClipboardList;
export const DriverCtReportSaveIcon = Save;
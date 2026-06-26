/**
 * Trang chi tiết trong kỳ — in được, footer ký nhận, mobile-friendly.
 * Route: /bang-luong-ky-chi-tiet/:id
 */
import React, { useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { X, Printer, FileSpreadsheet } from 'lucide-react';
import { exportPayrollPeriodMatrixExcel } from './utils/export-payroll-period-matrix';
import { useQuery } from '@tanstack/react-query';
import { getTransportRows, getTransportLookupRows } from '../shared/transport-service';
import { TRANSPORT_MODULES, EMPTY_TRANSPORT_LOOKUPS } from '../shared/transport-config';
import PayrollPeriodMatrixContent from './components/PayrollPeriodMatrixContent';

const PayrollPeriodMatrixPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: payrollRows = [], isLoading: isPayrollLoading } = useQuery({
    queryKey: ['transport', 'bang-luong'],
    queryFn: () => getTransportRows(TRANSPORT_MODULES.payroll),
  });

  const { data: lookups = EMPTY_TRANSPORT_LOOKUPS, isLoading: isLookupsLoading } = useQuery({
    queryKey: ['transport', 'lookups'],
    queryFn: getTransportLookupRows,
  });

  const payrollRow = payrollRows.find((r) => String(r.id) === String(id));
  const driver = (lookups?.drivers || []).find((d: { id: unknown }) => String(d.id) === String(payrollRow?.id_tai_xe));
  const driverName = driver?.ho_ten || driver?.ho_va_ten || 'Tài xế';

  const handleClose = useCallback(() => {
    navigate('/quan-ly-van-tai/bang-luong');
  }, [navigate]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [handleClose]);

  useEffect(() => {
    if (!payrollRow) return;
    const prev = document.title;
    document.title = `Chi tiết trong kỳ - ${driverName} - ${payrollRow.thang}/${payrollRow.nam}`;
    return () => { document.title = prev; };
  }, [payrollRow, driverName]);

  const handlePrint = () => window.print();

  const handleExportExcel = async () => {
    if (!payrollRow) return;
    await exportPayrollPeriodMatrixExcel(payrollRow, lookups);
  };

  if (isPayrollLoading || isLookupsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="h-10 w-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin" aria-label="Đang tải" />
      </div>
    );
  }

  if (!payrollRow) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-muted/30 p-4">
        <p className="text-destructive font-medium text-center">Không tìm thấy bảng lương yêu cầu</p>
        <button type="button" onClick={handleClose} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white">
          <X size={16} /> Đóng
        </button>
      </div>
    );
  }

  return (
    <div className="payroll-period-matrix-backdrop fixed inset-0 z-[70] flex flex-col bg-muted/90" role="main">
      <div className="payroll-period-matrix-toolbar flex items-center justify-between gap-3 px-4 py-3 bg-card border-b border-border shadow-sm shrink-0 no-print">
        <button type="button" onClick={handleClose} className="p-2 rounded-lg text-muted-foreground hover:bg-muted" aria-label="Đóng">
          <X size={20} />
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-primary text-primary bg-card hover:bg-primary/5"
          >
            <FileSpreadsheet size={16} />
            Xuất Excel
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary/90"
          >
            <Printer size={16} />
            In chi tiết trong kỳ
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-3 sm:p-6 flex justify-center bg-muted/30">
        <div className="bg-white shadow-xl rounded-sm max-w-[210mm] w-full min-h-[min(297mm,100%)]">
          <PayrollPeriodMatrixContent row={payrollRow} lookups={lookups} />
        </div>
      </div>
    </div>
  );
};

export default PayrollPeriodMatrixPage;
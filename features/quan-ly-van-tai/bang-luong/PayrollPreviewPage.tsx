/**
 * Trang preview bảng lương tài xế (mở tab mới) – toolbar: Tải (Doc / Excel / PDF), In.
 * Route: /bang-luong-preview/:id
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { X, Printer, Download, ChevronDown, FileText, FileSpreadsheet, FileType } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { getTransportRows, getTransportLookupRows } from '../shared/transport-service';
import { TRANSPORT_MODULES, EMPTY_TRANSPORT_LOOKUPS } from '../shared/transport-config';
import { printPayrollPDF } from './utils/print-payroll-pdf';
import { exportPayrollDoc, exportPayrollExcel } from './utils/export-payroll-profile';
import PayrollPreviewContent from './components/PayrollPreviewContent';

type ExportFormat = 'pdf' | 'excel' | 'doc';

const FORMATS: { format: ExportFormat; label: string; icon: React.ReactNode }[] = [
  { format: 'doc', label: 'Xuất file Word (.doc)', icon: <FileType size={16} /> },
  { format: 'excel', label: 'Xuất file Excel (.xlsx)', icon: <FileSpreadsheet size={16} /> },
  { format: 'pdf', label: 'Tải file PDF (.pdf)', icon: <FileText size={16} /> },
];

const PayrollPreviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [exporting, setExporting] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);


  // Fetch Payroll Rows
  const { data: payrollRows = [], isLoading: isPayrollLoading } = useQuery({
    queryKey: ['transport', 'bang-luong'],
    queryFn: () => getTransportRows(TRANSPORT_MODULES.payroll),
  });

  // Fetch Lookups
  const { data: lookups = EMPTY_TRANSPORT_LOOKUPS, isLoading: isLookupsLoading } = useQuery({
    queryKey: ['transport', 'lookups'],
    queryFn: getTransportLookupRows,
  });

  const payrollRow = payrollRows.find((r) => String(r.id) === String(id));
  const driver = (lookups?.drivers || []).find((d: any) => String(d.id) === String(payrollRow?.id_tai_xe));
  const driverName = driver?.ho_ten || driver?.ho_va_ten || 'Tài xế';

  const handleClose = useCallback(() => {
    navigate('/quan-ly-van-tai/bang-luong');
  }, [navigate]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (downloadOpen) setDownloadOpen(false);
        else handleClose();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [handleClose, downloadOpen]);

  useEffect(() => {
    if (!downloadOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDownloadOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [downloadOpen]);

  useEffect(() => {
    if (!payrollRow) return;
    const prev = document.title;
    document.title = `Phiếu lương tài xế - ${driverName} - Tháng ${payrollRow.thang}/${payrollRow.nam}`;
    return () => { document.title = prev; };
  }, [payrollRow, driverName]);

  const handlePrint = () => window.print();

  const handleDownload = async (format: ExportFormat) => {
    if (!payrollRow) return;
    setExporting(true);
    setDownloadOpen(false);
    try {
      if (format === 'pdf') {
        await printPayrollPDF(payrollRow, lookups);
      } else if (format === 'excel') {
        await exportPayrollExcel(payrollRow, lookups);
      } else {
        exportPayrollDoc(payrollRow, lookups);
      }
    } finally {
      setExporting(false);
    }
  };

  const isLoading = isPayrollLoading || isLookupsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="h-10 w-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin" aria-label="Đang tải dữ liệu" />
      </div>
    );
  }

  if (!payrollRow) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-muted/30 p-4">
        <p className="text-destructive font-medium text-center">
          Không tìm thấy thông tin bảng lương yêu cầu
        </p>
        <button
          type="button"
          onClick={handleClose}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90"
        >
          <X size={16} />
          Đóng cửa sổ
        </button>
      </div>
    );
  }

  return (
    <div
      className="payroll-preview-backdrop fixed inset-0 z-[70] flex flex-col bg-muted/90"
      role="main"
      aria-label="Xem trước phiếu lương"
    >
      <div className="payroll-preview-toolbar flex items-center justify-between gap-3 px-4 py-3 bg-card border-b border-border shadow-sm shrink-0 no-print">
        <button
          type="button"
          onClick={handleClose}
          className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Đóng"
        >
          <X size={20} />
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary/90"
          >
            <Printer size={16} />
            In phiếu lương
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6 flex justify-center bg-muted/30">
        <div
          className="bg-white shadow-xl rounded-sm max-w-[210mm] w-full min-h-[297mm]"
          style={{ minHeight: '297mm' }}
        >
          <PayrollPreviewContent row={payrollRow} lookups={lookups} />
        </div>
      </div>
    </div>
  );
};

export default PayrollPreviewPage;

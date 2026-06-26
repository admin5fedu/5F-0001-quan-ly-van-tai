import React from 'react';
import { resolveTransportValue } from '../../shared/transport-config';
import { useUIStore } from '@/store/useStore';
import { formatDateTime } from '@/lib/utils';
import {
  buildPayrollMatrix,
  formatPayrollMoney,
  getPayrollTripDetails,
} from '../utils/payroll-matrix';
import type { TransportLookupRows, TransportRow } from '../../shared/transport-config';

const CELL =
  'border border-slate-300 px-2 py-1.5 text-center align-middle text-[9pt] leading-snug';

const MONEY_CELL = `${CELL} tabular-nums whitespace-nowrap`;

const inlineCellStyle: React.CSSProperties = {
  border: '1px solid #cbd5e1',
  padding: '6px 8px',
  textAlign: 'center',
  verticalAlign: 'middle',
};

interface Props {
  row: TransportRow;
  lookups: Partial<TransportLookupRows>;
}

const PayrollPeriodMatrixContent: React.FC<Props> = ({ row, lookups }) => {
  const companyInfo = useUIStore((s) => s.companyInfo);
  // Bảng lương chỉ phản ánh số tiền thực trả: chỉ tính chuyến đã duyệt,
  // khớp với tong_luong_chuyen được tính ở applyPayrollTotals.
  const tripDetails = getPayrollTripDetails(row, lookups, true);
  const matrixRows = buildPayrollMatrix(tripDetails, row);
  const maxTripSlots = Math.max(6, ...matrixRows.map((item) => item.rows.length));
  const periodSalaryTotal = tripDetails.reduce((sum, item) => sum + (Number(item.tien_luong) || 0), 0);
  const periodCostTotal = tripDetails.reduce((sum, item) => sum + (Number(item.chi_phi) || 0), 0);

  const driver = (lookups?.drivers || []).find((d) => String(d.id) === String(row.id_tai_xe));
  const driverName = driver?.ho_ten || driver?.ho_va_ten || resolveTransportValue('id_tai_xe', row.id_tai_xe, lookups);
  const printedAt = formatDateTime(new Date());

  return (
    <div className="payroll-period-matrix-content bg-white text-gray-900 font-sans text-[10pt] px-4 py-6 sm:px-8 sm:py-8 min-h-full mx-auto max-w-[210mm]">
      <div className="text-center border-b border-gray-200 pb-4 mb-5">
        <h1 className="text-sm font-bold uppercase tracking-wide text-slate-800">
          {companyInfo.companyName || '5F Quản lý vận tải'}
        </h1>
        <h2 className="text-base font-bold text-primary mt-1">Chi tiết trong kỳ</h2>
        <p className="text-xs text-slate-600 mt-1">
          Kỳ lương tháng {row.thang}/{row.nam} — Tài xế: <strong>{driverName}</strong>
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-3 mb-5 text-[9pt]">
        {[
          { label: 'Lương cơ bản', value: formatPayrollMoney(row.luong_co_ban), accent: 'text-slate-700' },
          { label: 'Tổng lương chuyến', value: formatPayrollMoney(row.tong_luong_chuyen != null ? Number(row.tong_luong_chuyen) : periodSalaryTotal), accent: 'text-primary' },
          { label: 'Tổng chi phí chuyến', value: formatPayrollMoney(row.tong_chi_phi_chuyen != null ? Number(row.tong_chi_phi_chuyen) : periodCostTotal) },
          { label: 'Trừ tiền khác', value: formatPayrollMoney(row.tru_tien_khac), accent: 'text-rose-600' },
          { label: 'Tổng còn lại', value: formatPayrollMoney(row.tong_con_lai != null ? Number(row.tong_con_lai) : (Number(row.luong_co_ban || 0) + periodSalaryTotal + periodCostTotal - (Number(row.tru_tien_khac) || 0))), accent: 'text-emerald-700' },
        ].map((item) => (
          <div key={item.label} className="min-w-[120px] rounded border border-gray-200 px-3 py-2 text-center">
            <div className="text-gray-500">{item.label}</div>
            <div className={`font-bold tabular-nums whitespace-nowrap ${item.accent ?? ''}`}>{item.value}</div>
          </div>
        ))}
      </div>

      <p className="text-center text-[9pt] text-emerald-700 font-medium mb-3">
        {tripDetails.length} chuyến trong kỳ
      </p>

      <div className="space-y-2 sm:hidden mb-4">
        {tripDetails.length === 0 ? (
          <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-gray-300 text-xs text-gray-400 text-center">
            Chưa có chuyến nào trong kỳ lương này.
          </div>
        ) : (
          tripDetails.map((detail) => (
            <div key={detail.id} className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
              <div className="text-xs font-medium text-primary text-center">
                {resolveTransportValue('ngay', detail.trip?.ngay, lookups)}
              </div>
              <div className="font-semibold text-center mt-1">
                {resolveTransportValue('id_dia_diem', detail.id_dia_diem, lookups)}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-600 text-center">
                <span>Lương: <strong className="tabular-nums">{formatPayrollMoney(detail.tien_luong)}</strong></span>
                <span>Chi phí: <strong className="tabular-nums">{formatPayrollMoney(detail.chi_phi)}</strong></span>
              </div>
            </div>
          ))
        )}
      </div>

      {matrixRows.length > 0 ? (
        <div className="hidden sm:block overflow-x-auto rounded-lg border border-gray-300 mx-auto">
          <table
            className="payroll-matrix-table border-collapse w-max max-w-full mx-auto"
            style={{ borderCollapse: 'collapse', tableLayout: 'auto' }}
          >
            <thead>
              <tr className="bg-[#fee06a]" style={{ backgroundColor: '#fee06a' }}>
                <th className={`${CELL} bg-[#00ff00] font-bold`} style={{ ...inlineCellStyle, backgroundColor: '#00ff00', fontWeight: 'bold' }}>Ngày</th>
                <th className={`${CELL} font-bold`} style={{ ...inlineCellStyle, fontWeight: 'bold' }}>Lương</th>
                {Array.from({ length: maxTripSlots }).map((_, index) => (
                  <th key={index} className={`${CELL} font-bold`} style={{ ...inlineCellStyle, fontWeight: 'bold' }}>
                    Chuyến {index + 1}
                  </th>
                ))}
                <th className={`${CELL} bg-[#ff6a1a] font-bold text-white`} style={{ ...inlineCellStyle, backgroundColor: '#ff6a1a', color: 'white', fontWeight: 'bold' }}>Tổng / TỔNG CỘNG</th>
              </tr>
            </thead>
            <tbody>
              {matrixRows.map(({ date, dayLabel, rows: items }) => {
                const totalSalary = items.reduce((sum, item) => sum + (Number(item.tien_luong) || 0), 0);
                const totalCost = items.reduce((sum, item) => sum + (Number(item.chi_phi) || 0), 0);
                const displayDay = dayLabel ?? resolveTransportValue('ngay', date, lookups);

                if (items.length === 0) {
                  return (
                    <tr key={date}>
                      <td className={`${CELL} font-semibold`} style={{ ...inlineCellStyle, fontWeight: '600' }}>{displayDay}</td>
                      <td className={CELL} style={inlineCellStyle} />
                      {Array.from({ length: maxTripSlots }).map((_, index) => (
                        <td key={index} className={CELL} style={inlineCellStyle} />
                      ))}
                      <td className={CELL} style={inlineCellStyle} />
                    </tr>
                  );
                }

                const subRows = [
                  {
                    key: 'location',
                    label: 'Vị trí',
                    highlight: true,
                    getValue: (i: number) =>
                      items[i] ? resolveTransportValue('id_dia_diem', items[i].id_dia_diem, lookups) : '',
                  },
                  {
                    key: 'salary',
                    label: 'Lương',
                    highlight: false,
                    getValue: (i: number) => (items[i] ? formatPayrollMoney(items[i].tien_luong) : ''),
                  },
                  {
                    key: 'cost',
                    label: 'Chi phí',
                    highlight: true,
                    getValue: (i: number) => (items[i] ? formatPayrollMoney(items[i].chi_phi) : ''),
                  },
                ];

                return subRows.map((subRow, subIndex) => (
                  <tr key={`${date}-${subRow.key}`}>
                    {subIndex === 0 ? (
                      <td rowSpan={3} className={`${CELL} font-semibold`} style={{ ...inlineCellStyle, fontWeight: '600' }}>
                        {displayDay}
                      </td>
                    ) : null}
                    <td className={`${CELL} font-semibold ${subRow.highlight ? 'bg-[#fee06a]' : ''}`} style={{ ...inlineCellStyle, fontWeight: '600', backgroundColor: subRow.highlight ? '#fee06a' : undefined }}>
                      {subRow.label}
                    </td>
                    {Array.from({ length: maxTripSlots }).map((_, index) => {
                      const cellValue = subRow.getValue(index);
                      const isLocation = subRow.key === 'location';
                      return (
                        <td
                          key={index}
                          className={isLocation ? CELL : MONEY_CELL}
                          title={cellValue}
                          style={{
                            ...inlineCellStyle,
                            whiteSpace: isLocation ? 'normal' : 'nowrap',
                            minWidth: isLocation && cellValue ? 'max-content' : undefined,
                          }}
                        >
                          {cellValue}
                        </td>
                      );
                    })}
                    {subRow.key === 'salary' ? (
                      <td className={`${MONEY_CELL} font-bold bg-[#fff4ec]`} style={{ ...inlineCellStyle, fontWeight: 'bold', backgroundColor: '#fff4ec', whiteSpace: 'nowrap' }}>
                        {formatPayrollMoney(totalSalary)}
                      </td>
                    ) : null}
                    {subRow.key === 'cost' ? (
                      <td className={`${MONEY_CELL} font-bold bg-[#fff4ec]`} style={{ ...inlineCellStyle, fontWeight: 'bold', backgroundColor: '#fff4ec', whiteSpace: 'nowrap' }}>
                        {formatPayrollMoney(totalCost)}
                      </td>
                    ) : null}
                    {subRow.key === 'location' ? (
                      <td className={CELL} style={inlineCellStyle} />
                    ) : null}
                  </tr>
                ));
              })}
              <tr>
                <td colSpan={1 + maxTripSlots} className={CELL} style={inlineCellStyle} />
                <td className={`${CELL} font-bold`} style={{ ...inlineCellStyle, fontWeight: 'bold' }}>Lương</td>
                <td className={`${MONEY_CELL} font-bold bg-[#ff6a1a] text-white`} style={{ ...inlineCellStyle, fontWeight: 'bold', backgroundColor: '#ff6a1a', color: 'white', whiteSpace: 'nowrap' }}>
                  {formatPayrollMoney(periodSalaryTotal)}
                </td>
              </tr>
              <tr>
                <td colSpan={1 + maxTripSlots} className={CELL} style={inlineCellStyle} />
                <td className={`${CELL} font-bold`} style={{ ...inlineCellStyle, fontWeight: 'bold' }}>Chi phí</td>
                <td className={`${MONEY_CELL} font-bold bg-[#ff6a1a] text-white`} style={{ ...inlineCellStyle, fontWeight: 'bold', backgroundColor: '#ff6a1a', color: 'white', whiteSpace: 'nowrap' }}>
                  {formatPayrollMoney(periodCostTotal)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : null}

      {(row.ghi_chu_khoan_tru || row.ghi_chu_chi_phi) && (
        <div className="mt-5 rounded border border-gray-200 p-3 text-[9pt] text-gray-600 text-center max-w-lg mx-auto">
          {row.ghi_chu_khoan_tru ? <p>Ghi chú khoản trừ: {String(row.ghi_chu_khoan_tru)}</p> : null}
          {row.ghi_chu_chi_phi ? <p>Ghi chú chi phí: {String(row.ghi_chu_chi_phi)}</p> : null}
        </div>
      )}

      <div className="payroll-signature-footer mt-10 grid grid-cols-1 sm:grid-cols-2 gap-8 text-center text-[9pt] max-w-xl mx-auto">
        <div>
          <p className="font-semibold uppercase">Tài xế (ký, ghi rõ họ tên)</p>
          <p className="text-gray-500 mt-1">{driverName}</p>
          <div className="h-16 mt-6 border-b border-dashed border-gray-400 mx-4" />
        </div>
        <div>
          <p className="font-semibold uppercase">Quản lý / Kế toán (ký, ghi rõ họ tên)</p>
          <div className="h-16 mt-10 border-b border-dashed border-gray-400 mx-4" />
        </div>
      </div>

      <p className="text-[7pt] text-gray-400 mt-6 text-center no-screen-only-print">Ngày in: {printedAt}</p>
    </div>
  );
};

export default PayrollPeriodMatrixContent;
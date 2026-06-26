import React from 'react';
import { resolveTransportValue } from '../../shared/transport-config';
import { isCtEligibleForPayroll } from '../../shared/trip-execution-sync';
import { useUIStore } from '../../../../store/useStore';
import { formatDateTime } from '../../../../lib/utils';

interface Props {
  row: any;
  lookups: any;
}

function numberToVietnameseWords(num: number): string {
  if (num === 0) return 'Không đồng';
  const units = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];
  const digits = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

  const readGroup3 = (n: number, showZeroHundred: boolean): string => {
    const hundred = Math.floor(n / 100);
    const ten = Math.floor((n % 100) / 10);
    const unit = n % 10;
    let res = '';

    if (hundred > 0 || showZeroHundred) {
      res += digits[hundred] + ' trăm ';
    }
    if (ten > 0) {
      if (ten === 1) res += 'mười ';
      else res += digits[ten] + ' mươi ';
    } else if (hundred > 0 && unit > 0) {
      res += 'lẻ ';
    }

    if (unit > 0) {
      if (unit === 1 && ten > 1) res += 'mốt';
      else if (unit === 5 && ten > 0) res += 'lăm';
      else res += digits[unit];
    }
    return res.trim();
  };

  let words = '';
  let temp = Math.floor(Math.abs(num));
  let groupIdx = 0;

  while (temp > 0) {
    const group = temp % 1000;
    if (group > 0) {
      const showZero = temp >= 1000;
      const groupWords = readGroup3(group, showZero);
      words = groupWords + ' ' + units[groupIdx] + ' ' + words;
    } else if (groupIdx === 3 && temp > 0) {
      words = units[groupIdx] + ' ' + words;
    }
    temp = Math.floor(temp / 1000);
    groupIdx++;
  }

  let finalResult = words.trim().replace(/\s+/g, ' ');
  if (!finalResult) return 'Không đồng';
  
  finalResult = finalResult.charAt(0).toUpperCase() + finalResult.slice(1);
  return (num < 0 ? 'Âm ' : '') + finalResult + ' đồng';
}

const PayrollPreviewContent: React.FC<Props> = ({ row, lookups }) => {
  const companyInfo = useUIStore((s) => s.companyInfo);
  const driver = (lookups?.drivers || []).find((d: any) => String(d.id) === String(row.id_tai_xe));
  const driverName = driver?.ho_ten || driver?.ho_va_ten || resolveTransportValue('id_tai_xe', row.id_tai_xe, lookups);
  const driverPhone = driver?.so_dien_thoai || '—';
  const driverEmail = driver?.email || '—';
  const driverGplx = driver?.so_gplx || '—';
  const driverHang = driver?.hang_bang || '—';
  const driverVehicleId = driver?.id_xe_mac_dinh;
  const driverVehicle = driverVehicleId
    ? resolveTransportValue('id_xe_mac_dinh', driverVehicleId, lookups)
    : '—';

  const year = Number(row.nam);
  const month = Number(row.thang);
  const driverTrips = (lookups?.trips || []).filter((trip: any) => {
    const date = String(trip.ngay ?? '');
    if (!date) return false;
    const parts = date.split(/[-T]/);
    if (parts.length < 2) return false;
    const tripYear = Number(parts[0]);
    const tripMonth = Number(parts[1]);
    return (
      String(trip.id_tai_xe) === String(row.id_tai_xe) &&
      tripYear === year &&
      tripMonth === month &&
      trip.trang_thai === 'Đã duyệt'
    );
  }).sort((a: any, b: any) => String(a.ngay).localeCompare(String(b.ngay)));

  const getVehicleLicense = (idXe: unknown) => {
    const v = (lookups?.vehicles || []).find((veh: any) => String(veh.id) === String(idXe));
    return v ? `${v.bien_so}` : '—';
  };

  const luongCoBan = Number(row.luong_co_ban) || 0;
  const tongLuongChuyen = Number(row.tong_luong_chuyen) || 0;
  const tongChiPhiChuyen = Number(row.tong_chi_phi_chuyen) || 0;
  const tongChiPhiKhac = Number(row.tong_chi_phi_khac) || 0;
  const truTienKhac = Number(row.tru_tien_khac) || 0;
  const thucLinh = Number(row.tong_con_lai) || 0;
  const tongThanhToan = thucLinh + tongChiPhiChuyen + tongChiPhiKhac;
  const thucLinhBangChu = numberToVietnameseWords(tongThanhToan);
  const printedAt = formatDateTime(new Date());

  return (
    <div className="payroll-preview-content bg-white text-gray-900 font-sans text-[10pt] p-5 min-h-full">
      {/* Header công ty: logo + tên, địa chỉ, email, SĐT */}
      <div className="flex items-start gap-4 pb-4 mb-4 border-b-2 border-gray-300">
        {companyInfo.appLogo && (
          <img
            src={companyInfo.appLogo}
            alt="Logo"
            className="w-16 h-16 object-contain shrink-0"
          />
        )}
        <div className="min-w-0 flex-1">
          <h2 className="text-[14pt] font-bold text-gray-900 uppercase tracking-tight">
            {companyInfo.companyName}
          </h2>
          {companyInfo.address && (
            <p className="text-[9pt] text-gray-600 mt-0.5">
              Địa chỉ: {companyInfo.address}
            </p>
          )}
          {(companyInfo.email || companyInfo.phone) && (
            <p className="text-[9pt] text-gray-600">
              {companyInfo.email && <span>Email: {companyInfo.email}</span>}
              {companyInfo.email && companyInfo.phone && ' · '}
              {companyInfo.phone && <span>SĐT: {companyInfo.phone}</span>}
            </p>
          )}
        </div>
      </div>

      <div className="text-center mb-4">
        <h1 className="text-[16pt] font-bold text-slate-900 uppercase tracking-wide">
          Phiếu thanh toán lương tài xế
        </h1>
        <p className="text-[10pt] text-gray-500 mb-4">
          Kỳ lương: Tháng {month} năm {year}  ·  Tài xế: {driverName}
        </p>
      </div>
      <hr className="border-t border-gray-300 my-3" />

      {/* Driver Info section */}
      <table className="w-full border-collapse mt-3 text-[10pt] mb-5">
        <thead>
          <tr>
            <th colSpan={2} className="bg-primary text-white p-1.5 text-left text-[9pt] font-bold">
              THÔNG TIN TÀI XẾ NHẬN LƯƠNG
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="w-[40%] border border-gray-300 p-1.5 font-semibold text-gray-600 bg-gray-50/50">
              Họ và tên
            </td>
            <td className="border border-gray-300 p-1.5 text-gray-900 font-bold">{driverName}</td>
          </tr>
          <tr>
            <td className="w-[40%] border border-gray-300 p-1.5 font-semibold text-gray-600 bg-gray-50/50">
              Số điện thoại
            </td>
            <td className="border border-gray-300 p-1.5 text-gray-900">{driverPhone}</td>
          </tr>
          <tr>
            <td className="w-[40%] border border-gray-300 p-1.5 font-semibold text-gray-600 bg-gray-50/50">
              Số GPLX / Hạng
            </td>
            <td className="border border-gray-300 p-1.5 text-gray-900">{driverGplx} ({driverHang})</td>
          </tr>
          <tr>
            <td className="w-[40%] border border-gray-300 p-1.5 font-semibold text-gray-600 bg-gray-50/50">
              Xe thường chạy
            </td>
            <td className="border border-gray-300 p-1.5 text-gray-900">{driverVehicle}</td>
          </tr>
          <tr>
            <td className="w-[40%] border border-gray-300 p-1.5 font-semibold text-gray-600 bg-gray-50/50">
              Email liên hệ
            </td>
            <td className="border border-gray-300 p-1.5 text-gray-900">{driverEmail}</td>
          </tr>
        </tbody>
      </table>

      {/* Table I: List of Trips */}
      <h3 className="text-[10pt] font-bold text-slate-800 uppercase mb-2">
        I. Bảng kê chi tiết chuyến xe trong kỳ
      </h3>
      <table className="w-full border-collapse mb-5 text-[9pt]">
        <thead>
          <tr className="bg-primary text-white">
            <th className="border border-gray-300 p-2 text-center w-[15%]">Ngày</th>
            <th className="border border-gray-300 p-2 text-center w-[15%]">Biển số xe</th>
            <th className="border border-gray-300 p-2 text-center w-[10%]">Số chuyến</th>
            <th className="border border-gray-300 p-2 text-right w-[18%]">Lương chuyến</th>
            <th className="border border-gray-300 p-2 text-right w-[18%]">Chi phí phụ</th>
            <th className="border border-gray-300 p-2 text-left w-[24%]">Ghi chú hành trình</th>
          </tr>
        </thead>
        <tbody>
          {driverTrips.length === 0 ? (
            <tr>
              <td colSpan={6} className="border border-gray-300 p-4 text-center text-gray-400 italic">
                Không có chuyến xe nào được ghi nhận trong kỳ lương này.
              </td>
            </tr>
          ) : (
            driverTrips.map((trip: any, index: number) => {
              const details = (lookups?.tripDetails || []).filter(
                (d: any) => String(d.id_chuyen_xe) === String(trip.id) && isCtEligibleForPayroll(d),
              );
              
              const dateObj = trip.ngay ? new Date(trip.ngay as any) : null;
              const ngayDinhDang = dateObj ? dateObj.toLocaleDateString('vi-VN') : '—';
              const xeDinhDang = getVehicleLicense(trip.id_xe);
              
              const soChuyen = details.length > 0 ? details.length : (trip.so_chuyen ?? 0);
              const tongTienLuong = details.length > 0 ? details.reduce((sum: number, d: any) => sum + (Number(d.tien_luong) || 0), 0) : (Number(trip.tong_tien_luong) || 0);
              const tongChiPhi = details.length > 0 ? details.reduce((sum: number, d: any) => sum + (Number(d.chi_phi) || 0), 0) : (Number(trip.tong_phi) || 0);

              const luongChuyen = new Intl.NumberFormat('vi-VN').format(tongTienLuong) + ' đ';
              const chiPhi = new Intl.NumberFormat('vi-VN').format(tongChiPhi) + ' đ';
              const ghiChu = trip.ghi_chu || '—';

              return (
                <tr key={trip.id || index}>
                  <td className="border border-gray-300 p-2 text-center">{ngayDinhDang}</td>
                  <td className="border border-gray-300 p-2 text-center font-semibold text-primary">{xeDinhDang}</td>
                  <td className="border border-gray-300 p-2 text-center font-semibold">{soChuyen}</td>
                  <td className="border border-gray-300 p-2 text-right font-semibold">{luongChuyen}</td>
                  <td className="border border-gray-300 p-2 text-right">{chiPhi}</td>
                  <td className="border border-gray-300 p-2 text-slate-600">{ghiChu}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* Table II: Salary breakdown */}
      <h3 className="text-[10pt] font-bold text-slate-800 uppercase mb-2">
        II. Tổng hợp lương & Các khoản thanh toán
      </h3>
      <table className="w-full border-collapse mb-4 text-[9pt]">
        <thead>
          <tr className="bg-primary text-white">
            <th className="border border-gray-300 p-2 text-left w-[70%]">Nội dung thanh toán</th>
            <th className="border border-gray-300 p-2 text-right w-[30%]">Số tiền (VND)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-gray-300 p-2">1. Lương cơ bản</td>
            <td className="border border-gray-300 p-2 text-right font-semibold">
              {new Intl.NumberFormat('vi-VN').format(luongCoBan)} đ
            </td>
          </tr>
          <tr>
            <td className="border border-gray-300 p-2">2. Tổng tiền lương theo chuyến (Cộng dồn mục I)</td>
            <td className="border border-gray-300 p-2 text-right font-semibold">
              {new Intl.NumberFormat('vi-VN').format(tongLuongChuyen)} đ
            </td>
          </tr>
          <tr>
            <td className="border border-gray-300 p-2 text-red-600 pl-5">- Khấu trừ chi phí chuyến đi (Cộng dồn mục I)</td>
            <td className="border border-gray-300 p-2 text-right font-semibold text-red-600">
              - {new Intl.NumberFormat('vi-VN').format(tongChiPhiChuyen)} đ
            </td>
          </tr>
          <tr>
            <td className="border border-gray-300 p-2 text-red-600 pl-5">- Khấu trừ khác (Tạm ứng, phạt vi phạm,...)</td>
            <td className="border border-gray-300 p-2 text-right font-semibold text-red-600">
              - {new Intl.NumberFormat('vi-VN').format(truTienKhac)} đ
            </td>
          </tr>
          {row.ghi_chu_khoan_tru && (
            <tr className="bg-slate-50/50">
              <td colSpan={2} className="border border-gray-300 p-1.5 pl-8 text-gray-500 italic text-[8.5pt]">
                Ghi chú khoản trừ: {row.ghi_chu_khoan_tru}
              </td>
            </tr>
          )}
          <tr className="bg-slate-50">
            <td className="border border-gray-300 p-2 pl-5 font-semibold text-primary">= Còn lại thực lĩnh</td>
            <td className="border border-gray-300 p-2 text-right font-bold text-primary">
              {new Intl.NumberFormat('vi-VN').format(thucLinh)} đ
            </td>
          </tr>
          <tr>
            <td className="border border-gray-300 p-2">3. Tổng phụ cấp chi phí chuyến đi (Cộng dồn mục I)</td>
            <td className="border border-gray-300 p-2 text-right font-semibold">
              {new Intl.NumberFormat('vi-VN').format(tongChiPhiChuyen)} đ
            </td>
          </tr>
          <tr>
            <td className="border border-gray-300 p-2">4. Tổng chi phí khác được thanh toán (Ngoài chuyến đi)</td>
            <td className="border border-gray-300 p-2 text-right font-semibold">
              {new Intl.NumberFormat('vi-VN').format(tongChiPhiKhac)} đ
            </td>
          </tr>
          {row.ghi_chu_chi_phi && (
            <tr className="bg-slate-50/50">
              <td colSpan={2} className="border border-gray-300 p-1.5 pl-8 text-gray-500 italic text-[8.5pt]">
                Ghi chú chi phí khác: {row.ghi_chu_chi_phi}
              </td>
            </tr>
          )}
          <tr className="bg-emerald-50 text-emerald-800 font-bold border-t-2 border-emerald-600 border-b-4 border-double">
            <td className="border border-gray-300 p-2 uppercase">Tổng cộng thực nhận chuyển khoản (1 + 2 - Chi phí chuyến - Khấu trừ khác + 3 + 4)</td>
            <td className="border border-gray-300 p-2 text-right">
              {new Intl.NumberFormat('vi-VN').format(tongThanhToan)} đ
            </td>
          </tr>
        </tbody>
      </table>

      {/* Words */}
      <div className="bg-emerald-50/50 border-l-4 border-emerald-600 rounded-r-lg p-3 mb-8 text-[9.5pt]">
        <strong>Số tiền viết bằng chữ:</strong> <em className="text-slate-800 font-medium">{thucLinhBangChu}</em>.
      </div>

      <p className="text-[7pt] text-gray-500 mt-5">
        Ngày in: {printedAt}
      </p>
    </div>
  );
};

export default PayrollPreviewContent;

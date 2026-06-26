import { saveBlobAs, getFontStack, formatDateTime } from '@/lib/utils';
import { resolveTransportValue } from '../../shared/transport-config';
import { isCtEligibleForPayroll } from '../../shared/trip-execution-sync';
import { useUIStore } from '@/store/useStore';

/** HTML header công ty (logo, tên, địa chỉ, email, SĐT) — giống employee export */
function buildCompanyHeaderHTML(): string {
  const info = useUIStore.getState().companyInfo;
  const logoHtml = info.appLogo
    ? `<img src="${info.appLogo}" alt="Logo" style="width:64px;height:64px;object-fit:contain;flex-shrink:0" />`
    : '';
  const addr = info.address ? `Địa chỉ: ${info.address}` : '';
  const contact: string[] = [];
  if (info.email) contact.push(`Email: ${info.email}`);
  if (info.phone) contact.push(`SĐT: ${info.phone}`);
  const contactLine = contact.join(' · ');
  return `
<div style="display:flex;align-items:flex-start;gap:16px;padding-bottom:16px;margin-bottom:16px;border-bottom:2px solid #333;font-family:${getFontStack()}">
  ${logoHtml}
  <div style="flex:1;min-width:0">
    <div style="font-size:14pt;font-weight:bold;color:#111;text-transform:uppercase;letter-spacing:0.02em">${info.companyName}</div>
    ${addr ? `<p style="font-size:9pt;color:#444;margin:2px 0 0 0">${addr}</p>` : ''}
    ${contactLine ? `<p style="font-size:9pt;color:#444;margin:2px 0 0 0">${contactLine}</p>` : ''}
  </div>
</div>`;
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

function safeFileName(name: string): string {
  return name.replace(/\s+/g, '_').replace(/[<>:"/\\|?*]/g, '');
}

export type PayrollExportFormat = 'pdf' | 'excel' | 'doc';

/** Xuất bảng lương tài xế ra Word (.doc) */
export function exportPayrollDoc(row: any, lookups: any): void {
  const driver = (lookups?.drivers || []).find((d: any) => String(d.id) === String(row.id_tai_xe));
  const driverName = driver?.ho_ten || driver?.ho_va_ten || resolveTransportValue('id_tai_xe', row.id_tai_xe, lookups);
  const driverPhone = driver?.so_dien_thoai || '—';
  const driverEmail = driver?.email || '—';
  const driverGplx = driver?.so_gplx || '—';
  const driverHang = driver?.hang_bang || '—';
  const driverVehicleId = driver?.id_xe_mac_dinh;
  const driverVehicle = driverVehicleId ? resolveTransportValue('id_xe_mac_dinh', driverVehicleId, lookups) : '—';

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
  });

  const getVehicleLicense = (idXe: any) => {
    const v = (lookups?.vehicles || []).find((veh: any) => String(veh.id) === String(idXe));
    return v ? `${v.bien_so}` : '—';
  };

  let tripsHtml = '';
  if (driverTrips.length === 0) {
    tripsHtml = `
      <tr>
        <td colspan="6" style="text-align:center;color:#64748b;padding:12px;font-style:italic;border:1px solid #cbd5e1;">Không có chuyến xe nào được ghi nhận trong kỳ lương này.</td>
      </tr>
    `;
  } else {
    driverTrips.forEach((trip: any) => {
      const details = (lookups?.tripDetails || []).filter((d: any) => String(d.id_chuyen_xe) === String(trip.id) && isCtEligibleForPayroll(d));
      const dateObj = trip.ngay ? new Date(trip.ngay as any) : null;
      const ngayDinhDang = dateObj ? dateObj.toLocaleDateString('vi-VN') : '—';
      const xeDinhDang = getVehicleLicense(trip.id_xe);
      const soChuyen = details.length > 0 ? details.length : (trip.so_chuyen ?? 0);
      const tongTienLuong = details.length > 0 ? details.reduce((sum: number, d: any) => sum + (Number(d.tien_luong) || 0), 0) : (Number(trip.tong_tien_luong) || 0);
      const tongChiPhi = details.length > 0 ? details.reduce((sum: number, d: any) => sum + (Number(d.chi_phi) || 0), 0) : (Number(trip.tong_phi) || 0);
      
      const luongChuyen = new Intl.NumberFormat('vi-VN').format(tongTienLuong) + ' đ';
      const chiPhi = new Intl.NumberFormat('vi-VN').format(tongChiPhi) + ' đ';
      const ghiChu = trip.ghi_chu || '—';
      
      tripsHtml += `
        <tr>
          <td style="text-align:center;border:1px solid #cbd5e1;padding:6px;">${ngayDinhDang}</td>
          <td style="text-align:center;font-weight:bold;color:#1e3a8a;border:1px solid #cbd5e1;padding:6px;">${xeDinhDang}</td>
          <td style="text-align:center;font-weight:bold;border:1px solid #cbd5e1;padding:6px;">${soChuyen}</td>
          <td style="text-align:right;font-weight:bold;border:1px solid #cbd5e1;padding:6px;">${luongChuyen}</td>
          <td style="text-align:right;border:1px solid #cbd5e1;padding:6px;">${chiPhi}</td>
          <td style="color:#475569;border:1px solid #cbd5e1;padding:6px;">${ghiChu}</td>
        </tr>
      `;
    });
  }

  const luongCoBan = Number(row.luong_co_ban) || 0;
  const tongLuongChuyen = Number(row.tong_luong_chuyen) || 0;
  const tongChiPhiChuyen = Number(row.tong_chi_phi_chuyen) || 0;
  const tongChiPhiKhac = Number(row.tong_chi_phi_khac) || 0;
  const truTienKhac = Number(row.tru_tien_khac) || 0;
  const thucLinh = Number(row.tong_con_lai) || 0;
  const tongThanhToan = thucLinh + tongChiPhiChuyen + tongChiPhiKhac;
  const thucLinhBangChu = numberToVietnameseWords(tongThanhToan);

  const printedAt = formatDateTime(new Date());

  const html = `<!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <style>
      body { font-family: ${getFontStack()}; font-size: 10pt; color: #1e293b; line-height: 1.4; }
      .table-title { font-size: 10pt; font-weight: bold; color: #334155; margin-bottom: 8px; text-transform: uppercase; margin-top: 15px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 9pt; }
      th, td { border: 1px solid #cbd5e1; padding: 6px 8px; }
      th { background-color: #f8fafc; color: #334155; font-weight: bold; text-transform: uppercase; font-size: 8pt; }
      .breakdown-table th { background-color: #3b82f6; color: #fff; }
      .subtotal-row { background-color: #f8fafc; }
      .net-pay-row { background-color: #f0fdf4; border-top: 2px solid #16a34a; border-bottom: 2px double #16a34a; font-size: 11pt; color: #15803d; font-weight: bold; }
      .amount-words { font-style: italic; font-size: 10pt; color: #334155; margin-bottom: 24px; background-color: #f0fdf4; padding: 10px; border-left: 4px solid #16a34a; }
    </style>
  </head>
  <body>
    <div style="font-family:${getFontStack()};font-size:10pt;color:#222;padding:20px;min-width:600px">
    ${buildCompanyHeaderHTML()}
    
    <h1 style="font-size:16pt;text-align:center;margin:0 0 8px">PHIẾU THANH TOÁN LƯƠNG TÀI XẾ</h1>
    <p style="font-size:10pt;color:#555;text-align:center;margin-bottom:12px">Kỳ lương: Tháng ${month} năm ${year}  ·  Tài xế: ${driverName}</p>
    <hr style="border:0;border-top:1px solid #ccc;margin:12px 0">

    <table style="width:100%;border-collapse:collapse;margin-top:12px;font-size:10pt">
      <thead><tr style="background:#3b82f6;color:#fff"><th colspan="2" style="padding:6px;text-align:left;font-size:9pt">THÔNG TIN TÀI XẾ NHẬN LƯƠNG</th></tr></thead>
      <tbody>
        <tr><td style="padding:4px 6px;border:1px solid #ddd;font-weight:600;width:40%;color:#444">Họ và tên</td><td style="padding:4px 6px;border:1px solid #ddd">${driverName}</td></tr>
        <tr><td style="padding:4px 6px;border:1px solid #ddd;font-weight:600;width:40%;color:#444">Số điện thoại</td><td style="padding:4px 6px;border:1px solid #ddd">${driverPhone}</td></tr>
        <tr><td style="padding:4px 6px;border:1px solid #ddd;font-weight:600;width:40%;color:#444">Số GPLX / Hạng</td><td style="padding:4px 6px;border:1px solid #ddd">${driverGplx} (${driverHang})</td></tr>
        <tr><td style="padding:4px 6px;border:1px solid #ddd;font-weight:600;width:40%;color:#444">Xe thường chạy</td><td style="padding:4px 6px;border:1px solid #ddd">${driverVehicle}</td></tr>
        <tr><td style="padding:4px 6px;border:1px solid #ddd;font-weight:600;width:40%;color:#444">Email liên hệ</td><td style="padding:4px 6px;border:1px solid #ddd">${driverEmail}</td></tr>
      </tbody>
    </table>
    
    <div class="table-title">I. Bảng kê chi tiết chuyến xe trong kỳ</div>
    <table>
      <thead>
        <tr>
          <th style="width: 15%; text-align:center;">Ngày</th>
          <th style="width: 15%; text-align:center;">Biển số xe</th>
          <th style="width: 10%; text-align:center;">Số chuyến</th>
          <th style="width: 18%; text-align:right;">Lương chuyến</th>
          <th style="width: 18%; text-align:right;">Chi phí phụ</th>
          <th style="width: 24%;">Ghi chú hành trình</th>
        </tr>
      </thead>
      <tbody>
        ${tripsHtml}
      </tbody>
    </table>
    
    <div class="table-title">II. Tổng hợp lương & Các khoản thanh toán</div>
    <table class="breakdown-table">
      <thead>
        <tr>
          <th style="width: 70%;">Nội dung thanh toán</th>
          <th style="text-align:right; width: 30%;">Số tiền (VND)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>1. Lương cơ bản</td>
          <td style="text-align:right; font-weight:bold;">${new Intl.NumberFormat('vi-VN').format(luongCoBan)} đ</td>
        </tr>
        <tr>
          <td>2. Tổng tiền lương theo chuyến (Cộng dồn mục I)</td>
          <td style="text-align:right; font-weight:bold;">${new Intl.NumberFormat('vi-VN').format(tongLuongChuyen)} đ</td>
        </tr>
        <tr>
          <td style="color: #dc2626; padding-left: 20px;">- Khấu trừ chi phí chuyến đi (Cộng dồn mục I)</td>
          <td style="text-align:right; font-weight:bold; color: #dc2626;">- ${new Intl.NumberFormat('vi-VN').format(tongChiPhiChuyen)} đ</td>
        </tr>
        <tr>
          <td style="color: #dc2626; padding-left: 20px;">- Khấu trừ khác (Tạm ứng, phạt vi phạm,...)</td>
          <td style="text-align:right; font-weight:bold; color: #dc2626;">- ${new Intl.NumberFormat('vi-VN').format(truTienKhac)} đ</td>
        </tr>
        ${row.ghi_chu_khoan_tru ? `
        <tr>
          <td colspan="2" style="padding-left: 30px; color: #64748b; font-style: italic;">Ghi chú khoản trừ: ${row.ghi_chu_khoan_tru}</td>
        </tr>` : ''}
        <tr class="subtotal-row">
          <td style="padding-left: 20px; color: #1e3a8a; font-weight:bold;">= Còn lại thực lĩnh</td>
          <td style="text-align:right; font-weight:bold; color: #1e3a8a;">${new Intl.NumberFormat('vi-VN').format(thucLinh)} đ</td>
        </tr>
        <tr>
          <td>3. Tổng phụ cấp chi phí chuyến đi (Cộng dồn mục I)</td>
          <td style="text-align:right; font-weight:bold;">${new Intl.NumberFormat('vi-VN').format(tongChiPhiChuyen)} đ</td>
        </tr>
        <tr>
          <td>4. Tổng chi phí khác được thanh toán (Ngoài chuyến đi)</td>
          <td style="text-align:right; font-weight:bold;">${new Intl.NumberFormat('vi-VN').format(tongChiPhiKhac)} đ</td>
        </tr>
        ${row.ghi_chu_chi_phi ? `
        <tr>
          <td colspan="2" style="padding-left: 30px; color: #64748b; font-style: italic;">Ghi chú chi phí khác: ${row.ghi_chu_chi_phi}</td>
        </tr>` : ''}
        <tr class="net-pay-row">
          <td style="text-transform: uppercase;">Tổng cộng thực nhận chuyển khoản (1 + 2 - Chi phí chuyến - Khấu trừ khác + 3 + 4)</td>
          <td style="text-align:right; font-weight:bold;">${new Intl.NumberFormat('vi-VN').format(tongThanhToan)} đ</td>
        </tr>
      </tbody>
    </table>
    
    <div class="amount-words">
      <strong>Số tiền viết bằng chữ:</strong> <em>${thucLinhBangChu}</em>.
    </div>

    <p style="font-size:7pt;color:#888;margin-top:20px">Ngày in: ${printedAt}</p>
    </div>
  </body>
  </html>`;

  const blob = new Blob(['\ufeff' + html], { type: 'application/msword' });
  saveBlobAs(blob, `Phieu_luong_${safeFileName(driverName)}_Thang_${month}_${year}.doc`);
}

/** Xuất bảng lương tài xế ra Excel (.xlsx) */
export async function exportPayrollExcel(row: any, lookups: any): Promise<void> {
  const XLSX = await import('xlsx-js-style');
  
  const driver = (lookups?.drivers || []).find((d: any) => String(d.id) === String(row.id_tai_xe));
  const driverName = driver?.ho_ten || driver?.ho_va_ten || resolveTransportValue('id_tai_xe', row.id_tai_xe, lookups);
  const driverPhone = driver?.so_dien_thoai || '—';
  const driverEmail = driver?.email || '—';
  const driverGplx = driver?.so_gplx || '—';
  const driverHang = driver?.hang_bang || '—';
  const driverVehicleId = driver?.id_xe_mac_dinh;
  const driverVehicle = driverVehicleId ? resolveTransportValue('id_xe_mac_dinh', driverVehicleId, lookups) : '—';

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
  });

  const getVehicleLicense = (idXe: any) => {
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

  const info = useUIStore.getState().companyInfo;

  const rows: (string | number)[][] = [
    [info.companyName],
    ...(info.address ? [[`Địa chỉ: ${info.address}`]] : []),
    ...(info.email ? [[`Email: ${info.email}`]] : []),
    ...(info.phone ? [[`SĐT: ${info.phone}`]] : []),
    [],
    ['PHIẾU THANH TOÁN LƯƠNG TÀI XẾ'],
    [`Kỳ lương: Tháng ${month} năm ${year}`],
    [],
    ['THÔNG TIN TÀI XẾ'],
    ['Họ và tên', driverName, 'Số điện thoại', driverPhone],
    ['Số GPLX / Hạng', `${driverGplx} (${driverHang})`, 'Xe thường chạy', driverVehicle],
    ['Email liên hệ', driverEmail],
    [],
    ['I. BẢNG KÊ CHI TIẾT CHUYẾN XE TRONG KỲ'],
    ['Ngày', 'Biển số xe', 'Số chuyến', 'Lương chuyến (VND)', 'Chi phí phụ (VND)', 'Ghi chú hành trình'],
  ];

  if (driverTrips.length === 0) {
    rows.push(['Không có chuyến xe nào được ghi nhận trong kỳ lương này.', '', '', '', '', '']);
  } else {
    driverTrips.forEach((trip: any) => {
      const details = (lookups?.tripDetails || []).filter((d: any) => String(d.id_chuyen_xe) === String(trip.id) && isCtEligibleForPayroll(d));
      const dateObj = trip.ngay ? new Date(trip.ngay as any) : null;
      const ngayDinhDang = dateObj ? dateObj.toLocaleDateString('vi-VN') : '—';
      const xeDinhDang = getVehicleLicense(trip.id_xe);
      const soChuyen = details.length > 0 ? details.length : (trip.so_chuyen ?? 0);
      const tongTienLuong = details.length > 0 ? details.reduce((sum: number, d: any) => sum + (Number(d.tien_luong) || 0), 0) : (Number(trip.tong_tien_luong) || 0);
      const tongChiPhi = details.length > 0 ? details.reduce((sum: number, d: any) => sum + (Number(d.chi_phi) || 0), 0) : (Number(trip.tong_phi) || 0);
      const ghiChu = trip.ghi_chu || '—';
      rows.push([ngayDinhDang, xeDinhDang, soChuyen, tongTienLuong, tongChiPhi, ghiChu]);
    });
  }

  rows.push(
    [],
    ['II. TỔNG HỢP LƯƠNG & CÁC KHOẢN THANH TOÁN'],
    ['Nội dung thanh toán', 'Số tiền (VND)'],
    ['1. Lương cơ bản', luongCoBan],
    ['2. Tổng tiền lương theo chuyến', tongLuongChuyen],
    ['- Khấu trừ chi phí chuyến đi', -tongChiPhiChuyen],
    ['- Khấu trừ khác', -truTienKhac],
  );

  if (row.ghi_chu_khoan_tru) {
    rows.push([`   Ghi chú khoản trừ: ${row.ghi_chu_khoan_tru}`]);
  }

  rows.push(
    ['= Còn lại thực lĩnh', thucLinh],
    ['3. Tổng phụ cấp chi phí chuyến đi', tongChiPhiChuyen],
    ['4. Tổng chi phí khác được thanh toán', tongChiPhiKhac]
  );

  if (row.ghi_chu_chi_phi) {
    rows.push([`   Ghi chú chi phí khác: ${row.ghi_chu_chi_phi}`]);
  }

  rows.push(
    ['TỔNG CỘNG THỰC NHẬN CHUYỂN KHOẢN', tongThanhToan],
    [],
    [`Số tiền bằng chữ: ${thucLinhBangChu}`],
  );

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 35 }, { wch: 25 }, { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 30 }];
  
  // Apply standard 5fedu Excel styling
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = { c: C, r: R };
      const cellRef = XLSX.utils.encode_cell(cellAddress);
      if (!ws[cellRef]) continue;
      
      const isCompanyHeader = R === 0;
      const isMainTitle = R === 5;
      const isSubTitle = typeof ws[cellRef].v === 'string' && ws[cellRef].v.match(/^[IVX]+\./);
      const isHeaderRow = (R === 13 && C <= 5) || (R === 21 + driverTrips.length && C <= 1);
      const isAmount = typeof ws[cellRef].v === 'number' && C > 0 && R > 13;

      let style: any = { font: { name: 'Segoe UI', sz: 11 } };
      
      if (isCompanyHeader) {
        style.font.bold = true;
        style.font.sz = 14;
        style.font.color = { rgb: "1E3A8A" };
      } else if (isMainTitle) {
        style.font.bold = true;
        style.font.sz = 16;
        style.alignment = { horizontal: 'center' };
      } else if (isSubTitle) {
        style.font.bold = true;
        style.font.sz = 12;
      } else if (isHeaderRow) {
        style.font.bold = true;
        style.font.color = { rgb: "FFFFFF" };
        style.fill = { fgColor: { rgb: "1E3A8A" } };
        style.alignment = { horizontal: 'center', vertical: 'center' };
      }
      
      if (isAmount) {
        style.numFmt = '#,##0';
        if (!style.alignment) style.alignment = {};
        style.alignment.horizontal = 'right';
      }

      ws[cellRef].s = style;
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Bang_luong');
  
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveBlobAs(blob, `Phieu_luong_${safeFileName(driverName)}_Thang_${month}_${year}.xlsx`);
}

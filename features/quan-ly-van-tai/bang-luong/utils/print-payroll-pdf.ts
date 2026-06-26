import { formatDateTime } from '@/lib/utils';
import { resolveTransportValue } from '../../shared/transport-config';
import { isCtEligibleForPayroll } from '../../shared/trip-execution-sync';
import { useUIStore } from '@/store/useStore';

function numberToVietnameseWords(num: number): string {
  if (num === 0) return 'Khong dong';
  const units = ['', 'nghin', 'trieu', 'ty', 'nghin ty', 'trieu ty'];
  const digits = ['khong', 'mot', 'hai', 'ba', 'bon', 'nam', 'sau', 'bay', 'tam', 'chin'];

  const readGroup3 = (n: number, showZeroHundred: boolean): string => {
    const hundred = Math.floor(n / 100);
    const ten = Math.floor((n % 100) / 10);
    const unit = n % 10;
    let res = '';

    if (hundred > 0 || showZeroHundred) {
      res += digits[hundred] + ' tram ';
    }
    if (ten > 0) {
      if (ten === 1) res += 'muoi ';
      else res += digits[ten] + ' muoi ';
    } else if (hundred > 0 && unit > 0) {
      res += 'le ';
    }

    if (unit > 0) {
      if (unit === 1 && ten > 1) res += 'mot';
      else if (unit === 5 && ten > 0) res += 'lam';
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
  if (!finalResult) return 'Khong dong';
  
  finalResult = finalResult.charAt(0).toUpperCase() + finalResult.slice(1);
  return (num < 0 ? 'Am ' : '') + finalResult + ' dong';
}

function removeAccents(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

export async function printPayrollPDF(row: any, lookups: any): Promise<void> {
  const [{ jsPDF }, autoTableModule] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  const autoTable = autoTableModule.default;

  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 14;

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

  // Company Header — giống employee PDF
  const company = useUIStore.getState().companyInfo;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(removeAccents(company.companyName || ''), pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(80);
  if (company.address) {
    doc.text(removeAccents(company.address), 14, y);
    y += 4;
  }
  const contact: string[] = [];
  if (company.email) contact.push(company.email);
  if (company.phone) contact.push(company.phone);
  if (contact.length) {
    doc.text(removeAccents(contact.join('  \u00b7  ')), 14, y);
    y += 5;
  }
  doc.setTextColor(0);
  doc.setDrawColor(200);
  doc.setLineWidth(0.3);
  doc.line(14, y, pageWidth - 14, y);
  y += 6;

  // Title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('PHIEU THANH TOAN LUONG TAI XE', pageWidth / 2, y, { align: 'center' });
  y += 6;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Ky luong: Thang ${month} nam ${year}`, pageWidth / 2, y, { align: 'center' });
  y += 8;

  // Driver details table
  autoTable(doc, {
    startY: y,
    head: [[{ content: 'THONG TIN TAI XE NHAN LUONG', colSpan: 4, styles: { fillColor: [15, 23, 42], fontSize: 8, fontStyle: 'bold' } }]],
    body: [
      ['Ho va ten:', removeAccents(driverName), 'So dien thoai:', driverPhone],
      ['So GPLX / Hang:', `${driverGplx} (${driverHang})`, 'Xe thuong chay:', removeAccents(driverVehicle)],
      ['Email lien he:', driverEmail, '', ''],
    ],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2, font: 'helvetica' },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 30, textColor: [80, 80, 80] },
      1: { cellWidth: 65 },
      2: { fontStyle: 'bold', cellWidth: 30, textColor: [80, 80, 80] },
      3: { cellWidth: 65 },
    },
    margin: { left: 14, right: 14 },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 8;

  // Trips listing
  const tripsBody = driverTrips.length === 0
    ? [['Khong co chuyen xe nao duoc ghi nhan trong ky luong nay.', '', '', '', '', '']]
    : driverTrips.map((trip: any) => {
        const dateObj = trip.ngay ? new Date(trip.ngay as any) : null;
        const ngayDinhDang = dateObj ? dateObj.toLocaleDateString('vi-VN') : '—';
        const xeDinhDang = getVehicleLicense(trip.id_xe);
        
        // Chỉ tính chi tiết chuyến xe đã duyệt
        const tripDetails = (lookups?.tripDetails || []).filter(
          (d: any) => String(d.id_chuyen_xe) === String(trip.id) && isCtEligibleForPayroll(d)
        );
        const soChuyen = tripDetails.length;
        const tongTienLuong = tripDetails.reduce((sum: number, d: any) => sum + (Number(d.tien_luong) || 0), 0);
        const tongPhi = tripDetails.reduce((sum: number, d: any) => sum + (Number(d.chi_phi) || 0), 0);

        const luongChuyen = new Intl.NumberFormat('vi-VN').format(tongTienLuong) + ' d';
        const chiPhi = new Intl.NumberFormat('vi-VN').format(tongPhi) + ' d';
        const ghiChu = removeAccents(trip.ghi_chu || '—');
        return [ngayDinhDang, xeDinhDang, soChuyen, luongChuyen, chiPhi, ghiChu];
      });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('I. BANG KE CHI TIET CHUYEN XE TRONG KY', 14, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [['Ngay', 'Bien so xe', 'So chuyen', 'Luong chuyen', 'Chi phi phu', 'Ghi chu hanh trinh']],
    body: tripsBody,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2, font: 'helvetica' },
    headStyles: { fillColor: [59, 130, 246] },
    columnStyles: {
      0: { halign: 'center', cellWidth: 20 },
      1: { halign: 'center', cellWidth: 25 },
      2: { halign: 'center', cellWidth: 15 },
      3: { halign: 'right', cellWidth: 30 },
      4: { halign: 'right', cellWidth: 30 },
      5: { cellWidth: 62 },
    },
    margin: { left: 14, right: 14 },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 8;

  // Breakdown Table
  doc.setFont('helvetica', 'bold');
  doc.text('II. TONG HOP LUONG & CAC KHOAN THANH TOAN', 14, y);
  y += 4;

  const breakdownBody = [
    ['1. Luong co ban', `${new Intl.NumberFormat('vi-VN').format(luongCoBan)} d`],
    ['2. Tong tien luong theo chuyen (Cong don muc I)', `${new Intl.NumberFormat('vi-VN').format(tongLuongChuyen)} d`],
    ['- Khau tru chi phi chuyen di (Cong don muc I)', `- ${new Intl.NumberFormat('vi-VN').format(tongChiPhiChuyen)} d`],
    ['- Khau tru khac (Tam ung, phat vi pham,...)', `- ${new Intl.NumberFormat('vi-VN').format(truTienKhac)} d`],
  ];

  if (row.ghi_chu_khoan_tru) {
    breakdownBody.push([`   Ghi chu khoan tru: ${removeAccents(row.ghi_chu_khoan_tru)}`, '']);
  }

  breakdownBody.push(
    ['= Con lai thuc linh', `${new Intl.NumberFormat('vi-VN').format(thucLinh)} d`],
    ['3. Tong phu cap chi phi chuyen di (Cong don muc I)', `${new Intl.NumberFormat('vi-VN').format(tongChiPhiChuyen)} d`],
    ['4. Tong chi phi khac duoc thanh toan (Ngoai chuyen di)', `${new Intl.NumberFormat('vi-VN').format(tongChiPhiKhac)} d`],
  );

  if (row.ghi_chu_chi_phi) {
    breakdownBody.push([`   Ghi chu chi phi khac: ${removeAccents(row.ghi_chu_chi_phi)}`, '']);
  }

  breakdownBody.push(
    ['TONG CONG THUC NHAN CHUYEN KHOAN (1 + 2 - Chi phi chuyen - Khau tru khac + 3 + 4)', `${new Intl.NumberFormat('vi-VN').format(tongThanhToan)} d`],
  );

  autoTable(doc, {
    startY: y,
    head: [['Noi dung thanh toan', 'So tien (VND)']],
    body: breakdownBody,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2, font: 'helvetica' },
    headStyles: { fillColor: [15, 23, 42] },
    columnStyles: {
      0: { cellWidth: 130 },
      1: { halign: 'right', cellWidth: 52, fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14 },
    didParseCell: (data) => {
      if (data.row.index === breakdownBody.length - 1) {
        data.cell.styles.fillColor = [240, 253, 244];
        data.cell.styles.textColor = [21, 128, 61];
        data.cell.styles.fontStyle = 'bold';
      }
    }
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 6;

  // Words
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`So tien viet bang chu: ${thucLinhBangChu}`, 14, y);
  y += 10;

  const printDate = formatDateTime(new Date());
  doc.setFontSize(7);
  doc.setTextColor(150);
  doc.text(`Printed at ${printDate}`, 14, doc.internal.pageSize.getHeight() - 8);

  const pdfBlob = doc.output('blob');
  const url = URL.createObjectURL(pdfBlob);
  const w = window.open(url, '_blank');
  if (w) {
    w.addEventListener('load', () => URL.revokeObjectURL(url), { once: true });
  } else {
    URL.revokeObjectURL(url);
  }
}

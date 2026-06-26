/**
 * Export Transport Stats report to Excel (.xlsx) and PDF.
 * Matches design aesthetics and structure of Employee stats reports.
 */
import { getTodayISODate, saveBlobAs, getRobotoFonts, preloadRobotoFonts } from '@/lib/utils';
import * as XLSXStyle from 'xlsx-js-style';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const PRIMARY_COLOR: [number, number, number] = [30, 58, 138]; // Deep navy matching theme

export interface TransportExportMeta {
  dateRangeLabel: string;
  filterDriverLabels: string[];
  filterLocationLabels: string[];
  filterVehicleLabels: string[];
  exportedAt: string;
  statsTableTab?: 'location' | 'driver';
}

export function exportTransportToExcel(
  meta: TransportExportMeta,
  kpis: any[],
  summaryData: any[],
  type: 'trips' | 'payroll'
): void {
  const XLSX = (XLSXStyle as any).default ?? XLSXStyle;
  const isTripReport = type === 'trips';
  const reportTitle = isTripReport ? 'BÁO CÁO THỐNG KÊ CHUYẾN XE' : 'BÁO CÁO THỐNG KÊ LƯƠNG TÀI XẾ';

  // Common Styles
  const headerStyle = {
    font: { bold: true, color: { rgb: 'FFFFFF' }, name: 'Segoe UI', sz: 11 },
    fill: { fgColor: { rgb: '1E3A8A' } }, // Brand Navy
    alignment: { vertical: 'center', horizontal: 'center', wrapText: true },
    border: {
      top: { style: 'thin', color: { rgb: 'CBD5E1' } },
      bottom: { style: 'medium', color: { rgb: '1E3A8A' } },
      left: { style: 'thin', color: { rgb: 'CBD5E1' } },
      right: { style: 'thin', color: { rgb: 'CBD5E1' } }
    }
  };

  const getCellStyle = (rowIndex: number, colType: 'text' | 'number' | 'center') => {
    const isEven = rowIndex % 2 === 0;
    const bgRgb = isEven ? 'F8FAFC' : 'FFFFFF';
    let halign = 'left';
    if (colType === 'number') halign = 'right';
    else if (colType === 'center') halign = 'center';

    return {
      font: { name: 'Segoe UI', sz: 10 },
      fill: { fgColor: { rgb: bgRgb } },
      alignment: { vertical: 'center', horizontal: halign },
      border: {
        top: { style: 'thin', color: { rgb: 'E2E8F0' } },
        bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
        left: { style: 'thin', color: { rgb: 'E2E8F0' } },
        right: { style: 'thin', color: { rgb: 'E2E8F0' } }
      },
      numFmt: colType === 'number' ? '#,##0' : undefined
    };
  };

  // Build Overview styled rows
  const overviewRowsStyled: any[] = [
    // Title row (will be merged A1:E1)
    [
      { v: reportTitle, t: 's', s: {
        font: { name: 'Segoe UI', sz: 14, bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '1E3A8A' } },
        alignment: { vertical: 'center', horizontal: 'center' }
      } },
      ...Array(4).fill({ v: '', t: 's', s: { fill: { fgColor: { rgb: '1E3A8A' } } } })
    ],
    // Subtitle Đơn vị tính
    [
      { v: isTripReport ? 'Đơn vị tính: Đồng (VNĐ) / Chuyến' : 'Đơn vị tính: Đồng (VNĐ)', t: 's', s: {
        font: { name: 'Segoe UI', sz: 9, italic: true, color: { rgb: '64748B' } },
        alignment: { vertical: 'center', horizontal: 'right' }
      } },
      ...Array(4).fill({ v: '', t: 's', s: {} })
    ],
  ];

  const filterDrivers = meta.filterDriverLabels.length ? meta.filterDriverLabels.join(', ') : 'Tất cả';
  const filterLocs = meta.filterLocationLabels.length ? meta.filterLocationLabels.join(', ') : 'Tất cả';
  const filterVehs = meta.filterVehicleLabels.length ? meta.filterVehicleLabels.join(', ') : 'Tất cả';

  const metaLabelStyle = { font: { name: 'Segoe UI', sz: 10, bold: true, color: { rgb: '475569' } } };
  const metaValueStyle = { font: { name: 'Segoe UI', sz: 10 } };

  const metaItems = [
    ['Khoảng thời gian:', meta.dateRangeLabel],
    ['Bộ lọc tài xế:', filterDrivers],
    ['Bộ lọc địa điểm:', filterLocs],
    ['Bộ lọc xe:', filterVehs],
    ['Ngày xuất báo cáo:', meta.exportedAt]
  ];

  metaItems.forEach(([label, value]) => {
    overviewRowsStyled.push([
      { v: label, t: 's', s: metaLabelStyle },
      { v: value, t: 's', s: metaValueStyle },
      ...Array(3).fill({ v: '', t: 's', s: {} })
    ]);
  });

  overviewRowsStyled.push(Array(5).fill({ v: '', t: 's', s: {} }));
  overviewRowsStyled.push([
    { v: 'TỔNG HỢP CHỈ SỐ HOẠT ĐỘNG', t: 's', s: { font: { name: 'Segoe UI', sz: 11, bold: true, color: { rgb: '1E3A8A' } } } },
    ...Array(4).fill({ v: '', t: 's', s: {} })
  ]);
  
  overviewRowsStyled.push([
    { v: 'Chỉ số tổng hợp', t: 's', s: headerStyle },
    { v: 'Giá trị', t: 's', s: headerStyle },
    ...Array(3).fill({ v: '', t: 's', s: {} })
  ]);

  kpis.forEach((k, rIdx) => {
    const valStr = String(k.value ?? '').replace(/[^0-9.-]/g, '');
    const isNum = valStr !== '' && !isNaN(Number(valStr));
    const cellVal = isNum ? Number(valStr) : (k.value ?? '');
    overviewRowsStyled.push([
      { v: k.label, t: 's', s: getCellStyle(rIdx, 'text') },
      { v: cellVal, t: isNum ? 'n' : 's', s: getCellStyle(rIdx, isNum ? 'number' : 'text') },
      ...Array(3).fill({ v: '', t: 's', s: {} })
    ]);
  });

  const wsOverview = XLSX.utils.aoa_to_sheet(overviewRowsStyled);
  wsOverview['!cols'] = [{ wch: 30 }, { wch: 35 }, { wch: 10 }, { wch: 10 }, { wch: 10 }];
  wsOverview['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } }
  ];
  wsOverview['!views'] = [{ showGridLines: true }];

  // Build Summary styled rows
  const summaryTitle = isTripReport
    ? (meta.statsTableTab === 'location' ? 'BẢNG TỔNG HỢP CHUYẾN ĐI THEO ĐỊA ĐIỂM' : 'BẢNG TỔNG HỢP CHUYẾN ĐI THEO TÀI XẾ')
    : 'BẢNG TỔNG HỢP LƯƠNG TÀI XẾ';

  const summaryRowsStyled: any[] = [
    // Title row (will be merged A1:E1)
    [
      { v: summaryTitle, t: 's', s: {
        font: { name: 'Segoe UI', sz: 14, bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '1E3A8A' } },
        alignment: { vertical: 'center', horizontal: 'center' }
      } },
      ...Array(4).fill({ v: '', t: 's', s: { fill: { fgColor: { rgb: '1E3A8A' } } } })
    ],
    // Subtitle ĐVT (will be merged A2:E2)
    [
      { v: isTripReport ? 'Đơn vị tính: Đồng (VNĐ) / Chuyến' : 'Đơn vị tính: Đồng (VNĐ)', t: 's', s: {
        font: { name: 'Segoe UI', sz: 9, italic: true, color: { rgb: '64748B' } },
        alignment: { vertical: 'center', horizontal: 'right' }
      } },
      ...Array(4).fill({ v: '', t: 's', s: {} })
    ],
  ];

  let totalTrips = 0, totalSalary = 0, totalCost = 0, totalGross = 0, totalDeductions = 0, totalNet = 0;
  const startRow = 4;
  const endRow = 3 + summaryData.length;
  const totalRowIndex = 4 + summaryData.length;

  if (isTripReport) {
    const isLocation = meta.statsTableTab === 'location';
    summaryRowsStyled.push([
      { v: isLocation ? 'Địa điểm' : 'Tài xế', t: 's', s: headerStyle },
      { v: 'Tổng số chuyến', t: 's', s: headerStyle },
      { v: 'Lương chuyến đi (đ)', t: 's', s: headerStyle },
      { v: 'Chi phí chuyến đi (đ)', t: 's', s: headerStyle },
      { v: 'Tỷ lệ chuyến (%)', t: 's', s: headerStyle }
    ]);

    summaryData.forEach((r, rIdx) => {
      const tripsVal = Number(r.trips ?? 0);
      const salaryVal = Number(r.salary ?? 0);
      const costVal = Number(r.cost ?? 0);
      const rateVal = parseFloat(String(r.rate ?? '0').replace('%', ''));
      totalTrips += tripsVal; totalSalary += salaryVal; totalCost += costVal;

      summaryRowsStyled.push([
        { v: r.name ?? '', t: 's', s: getCellStyle(rIdx, 'text') },
        { v: tripsVal, t: 'n', s: getCellStyle(rIdx, 'number') },
        { v: salaryVal, t: 'n', s: getCellStyle(rIdx, 'number') },
        { v: costVal, t: 'n', s: getCellStyle(rIdx, 'number') },
        { 
          f: `B${startRow + rIdx}/$B$${totalRowIndex}`, 
          v: isNaN(rateVal) ? 0 : rateVal / 100, 
          t: 'n', 
          s: { ...getCellStyle(rIdx, 'number'), numFmt: '0.0%' } 
        }
      ]);
    });

    const totalStyle = {
      font: { name: 'Segoe UI', sz: 10, bold: true },
      fill: { fgColor: { rgb: 'F1F5F9' } },
      alignment: { vertical: 'center', horizontal: 'right' },
      border: { top: { style: 'thin', color: { rgb: '94A3B8' } }, bottom: { style: 'double', color: { rgb: '1E3A8A' } }, left: { style: 'thin', color: { rgb: 'CBD5E1' } }, right: { style: 'thin', color: { rgb: 'CBD5E1' } } }
    };
    summaryRowsStyled.push([
      { v: 'Tổng cộng', t: 's', s: { ...totalStyle, alignment: { vertical: 'center', horizontal: 'left' } } },
      { f: `SUM(B${startRow}:B${endRow})`, v: totalTrips, t: 'n', s: totalStyle },
      { f: `SUM(C${startRow}:C${endRow})`, v: totalSalary, t: 'n', s: { ...totalStyle, numFmt: '#,##0' } },
      { f: `SUM(D${startRow}:D${endRow})`, v: totalCost, t: 'n', s: { ...totalStyle, numFmt: '#,##0' } },
      { f: `SUM(B${totalRowIndex})/SUM(B${totalRowIndex})`, v: 1.0, t: 'n', s: { ...totalStyle, numFmt: '0.0%' } }
    ]);
  } else {
    summaryRowsStyled.push([
      { v: 'Tài xế', t: 's', s: headerStyle },
      { v: 'Tổng lương chuyến (đ)', t: 's', s: headerStyle },
      { v: 'Khấu trừ khác (đ)', t: 's', s: headerStyle },
      { v: 'Thực nhận cuối cùng (đ)', t: 's', s: headerStyle },
      { v: 'Tỷ lệ thực nhận (%)', t: 's', s: headerStyle }
    ]);

    summaryData.forEach((r, rIdx) => {
      const grossVal = Number(r.gross ?? 0);
      const deductionsVal = Number(r.deductions ?? 0);
      const netVal = Number(r.net ?? 0);
      const rateVal = parseFloat(String(r.rate ?? '0').replace('%', ''));
      totalGross += grossVal; totalDeductions += deductionsVal; totalNet += netVal;

      summaryRowsStyled.push([
        { v: r.name ?? '', t: 's', s: getCellStyle(rIdx, 'text') },
        { v: grossVal, t: 'n', s: getCellStyle(rIdx, 'number') },
        { v: deductionsVal, t: 'n', s: getCellStyle(rIdx, 'number') },
        { v: netVal, t: 'n', s: getCellStyle(rIdx, 'number') },
        { 
          f: `D${startRow + rIdx}/B${startRow + rIdx}`, 
          v: isNaN(rateVal) ? 0 : rateVal / 100, 
          t: 'n', 
          s: { ...getCellStyle(rIdx, 'number'), numFmt: '0.0%' } 
        }
      ]);
    });

    const totalStyle = {
      font: { name: 'Segoe UI', sz: 10, bold: true },
      fill: { fgColor: { rgb: 'F1F5F9' } },
      alignment: { vertical: 'center', horizontal: 'right' },
      border: { top: { style: 'thin', color: { rgb: '94A3B8' } }, bottom: { style: 'double', color: { rgb: '1E3A8A' } }, left: { style: 'thin', color: { rgb: 'CBD5E1' } }, right: { style: 'thin', color: { rgb: 'CBD5E1' } } }
    };
    summaryRowsStyled.push([
      { v: 'Tổng cộng', t: 's', s: { ...totalStyle, alignment: { vertical: 'center', horizontal: 'left' } } },
      { f: `SUM(B${startRow}:B${endRow})`, v: totalGross, t: 'n', s: { ...totalStyle, numFmt: '#,##0' } },
      { f: `SUM(C${startRow}:C${endRow})`, v: totalDeductions, t: 'n', s: { ...totalStyle, numFmt: '#,##0' } },
      { f: `SUM(D${startRow}:D${endRow})`, v: totalNet, t: 'n', s: { ...totalStyle, numFmt: '#,##0' } },
      { f: `D${totalRowIndex}/B${totalRowIndex}`, v: totalGross ? totalNet / totalGross : 0, t: 'n', s: { ...totalStyle, numFmt: '0.0%' } }
    ]);
  }

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRowsStyled);
  wsSummary['!cols'] = [{ wch: 28 }, { wch: 18 }, { wch: 20 }, { wch: 20 }, { wch: 22 }];
  wsSummary['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } }
  ];
  wsSummary['!freeze'] = { xSplit: 0, ySplit: 3 };
  wsSummary['!views'] = [
    {
      state: 'frozen',
      xSplit: 0,
      ySplit: 3,
      topLeftCell: 'A4',
      activePane: 'bottomLeft',
      showGridLines: true
    }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsOverview, 'Tổng quan');
  XLSX.utils.book_append_sheet(wb, wsSummary, isTripReport ? 'Tổng hợp chuyến đi' : 'Tổng hợp lương');

  const dateStr = getTodayISODate();
  const filePrefix = isTripReport ? 'Bao_cao_Thong_ke_Chuyen_xe' : 'Bao_cao_Thong_ke_Luong';
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveBlobAs(new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${filePrefix}_${dateStr}.xlsx`);
}

export async function exportTransportToPdf(
  meta: TransportExportMeta,
  kpis: any[],
  summaryData: any[],
  type: 'trips' | 'payroll'
): Promise<void> {
  await preloadRobotoFonts();
  const { regular: regFontRes, medium: boldFontRes } = getRobotoFonts();
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 14;
  let y = 14;

  const hasFonts = !!(regFontRes && boldFontRes);
  if (hasFonts) {
    const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
      let binary = '';
      const bytes = new Uint8Array(buffer);
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return window.btoa(binary);
    };
    doc.addFileToVFS('Roboto-Regular.ttf', arrayBufferToBase64(regFontRes!));
    doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
    doc.addFileToVFS('Roboto-Medium.ttf', arrayBufferToBase64(boldFontRes!));
    doc.addFont('Roboto-Medium.ttf', 'Roboto', 'bold');
    doc.setFont('Roboto', 'normal');
  }

  const isTripReport = type === 'trips';
  const reportTitle = isTripReport ? 'BÁO CÁO THỐNG KÊ CHUYẾN XE' : 'BÁO CÁO THỐNG KÊ LƯƠNG TÀI XẾ';

  doc.setFontSize(8);
  doc.setTextColor(150);
  if (hasFonts) doc.setFont('Roboto', 'normal');
  doc.text('HỆ THỐNG QUẢN LÝ VẬN TẢI TAH', marginX, y);
  y += 4;

  doc.setFontSize(14);
  if (hasFonts) doc.setFont('Roboto', 'bold');
  else doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138); 
  doc.text(reportTitle, pageWidth / 2, y, { align: 'center' });
  y += 8;

  doc.setFontSize(9);
  if (hasFonts) doc.setFont('Roboto', 'normal');
  else doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(`Khoảng thời gian: ${meta.dateRangeLabel}  •  Ngày xuất: ${meta.exportedAt}`, pageWidth / 2, y, { align: 'center' });
  doc.setTextColor(0);
  y += 6;

  const filterParts = [];
  if (meta.filterDriverLabels.length) filterParts.push(`Tài xế: ${meta.filterDriverLabels.join(', ')}`);
  if (isTripReport) {
    if (meta.filterLocationLabels.length) filterParts.push(`Địa điểm: ${meta.filterLocationLabels.join(', ')}`);
    if (meta.filterVehicleLabels.length) filterParts.push(`Xe: ${meta.filterVehicleLabels.join(', ')}`);
  }
  if (filterParts.length) {
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(filterParts.join('  •  '), marginX, y);
    doc.setTextColor(0);
    y += 5;
  }

  doc.setDrawColor(226, 232, 240);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 5;

  // KPI Table
  autoTable(doc, {
    startY: y,
    head: [['Chỉ số tổng hợp', 'Giá trị']],
    body: kpis.map((k) => [k.label, String(k.value)]),
    theme: 'grid',
    styles: { font: hasFonts ? 'Roboto' : 'helvetica', fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: PRIMARY_COLOR, fontSize: 8, fontStyle: 'bold', textColor: 255 },
    columnStyles: {
      0: { halign: 'left' },
      1: { halign: 'right' },
    },
    margin: { left: marginX, right: marginX },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  if (summaryData.length > 0) {
    if (y > 220) {
      doc.addPage();
      y = 14;
    }
    doc.setFontSize(10);
    if (hasFonts) doc.setFont('Roboto', 'bold');
    else doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 58, 138);
    doc.text(isTripReport ? 'Bảng tổng hợp chuyến đi' : 'Bảng tổng hợp lương tài xế', marginX, y);
    doc.setTextColor(0);
    y += 6;

    let headers: string[];
    let bodyRows: string[][];
    let totalRow: string[];
    const currencyFmt = new Intl.NumberFormat('vi-VN');
    let totalTrips = 0, totalSalary = 0, totalCost = 0, totalGross = 0, totalDeductions = 0, totalNet = 0;

    if (isTripReport) {
      const isLocation = meta.statsTableTab === 'location';
      headers = [isLocation ? 'Địa điểm' : 'Tài xế', 'Tổng số chuyến', 'Lương chuyến đi', 'Chi phí chuyến đi', 'Tỷ lệ chuyến'];
      bodyRows = summaryData.map((r) => {
        totalTrips += Number(r.trips ?? 0);
        totalSalary += Number(r.salary ?? 0);
        totalCost += Number(r.cost ?? 0);
        return [r.name, String(r.trips), `${currencyFmt.format(r.salary)} đ`, `${currencyFmt.format(r.cost)} đ`, `${r.rate}%`];
      });
      totalRow = ['Tổng cộng', String(totalTrips), `${currencyFmt.format(totalSalary)} đ`, `${currencyFmt.format(totalCost)} đ`, '100.0%'];
    } else {
      headers = ['Tài xế', 'Tổng lương chuyến', 'Khấu trừ khác', 'Thực nhận cuối cùng', 'Tỷ lệ thực nhận'];
      bodyRows = summaryData.map((r) => {
        totalGross += Number(r.gross ?? 0);
        totalDeductions += Number(r.deductions ?? 0);
        totalNet += Number(r.net ?? 0);
        return [r.name, `${currencyFmt.format(r.gross)} đ`, `${currencyFmt.format(r.deductions)} đ`, `${currencyFmt.format(r.net)} đ`, `${r.rate}%`];
      });
      totalRow = ['Tổng cộng', `${currencyFmt.format(totalGross)} đ`, `${currencyFmt.format(totalDeductions)} đ`, `${currencyFmt.format(totalNet)} đ`, '100.0%'];
    }

    autoTable(doc, {
      startY: y,
      head: [headers],
      body: bodyRows,
      foot: [totalRow],
      theme: 'grid',
      styles: { font: hasFonts ? 'Roboto' : 'helvetica', fontSize: 7.5, cellPadding: 2.5 },
      headStyles: { fillColor: PRIMARY_COLOR, fontSize: 7.5, fontStyle: 'bold', textColor: 255 },
      footStyles: { fillColor: [241, 245, 249], fontSize: 7.5, fontStyle: 'bold', textColor: 0 },
      columnStyles: {
        0: { halign: 'left' },
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' },
      },
      margin: { left: marginX, right: marginX },
    });
  }



  // Draw Header Line & Page number footers on all pages
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    if (i > 1) {
      if (hasFonts) doc.setFont('Roboto', 'normal');
      doc.text(reportTitle, marginX, 10);
      doc.setDrawColor(226, 232, 240);
      doc.line(marginX, 11.5, pageWidth - marginX, 11.5);
    }
    if (hasFonts) doc.setFont('Roboto', 'normal');
    doc.text('Hệ thống Quản lý Vận tải TAH', marginX, pageHeight - 10);
    doc.text(`Trang ${i} / ${pageCount}`, pageWidth - marginX - 15, pageHeight - 10);
  }

  const dateStr = getTodayISODate();
  const filePrefix = isTripReport ? 'Bao_cao_Thong_ke_Chuyen_xe' : 'Bao_cao_Thong_ke_Luong';
  const pdfBlob = doc.output('blob');
  saveBlobAs(pdfBlob, `${filePrefix}_${dateStr}.pdf`);
}

/**
 * Export Employee Stats report to Excel (.xlsx) and PDF.
 * Includes metadata: date range, filters, exported at.
 */
import type { StatsExportMeta } from '../core/stats-types';
import type { DeptSummaryRow } from '../core/stats-types';
import type { KpiItem } from '../core/stats-types';
import { getTodayISODate, saveBlobAs, getRobotoFonts } from '../../../../lib/utils';
import { txt } from '../../../../lib/text';
import * as XLSXStyle from 'xlsx-js-style';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const PRIMARY_COLOR: [number, number, number] = [59, 130, 246];

function buildMetaRows(meta: StatsExportMeta): string[][] {
  return [
    [txt('employee.report.title'), ''],
    [txt('employee.report.period'), meta.dateRangeLabel],
    [txt('employee.report.departmentFilter'), meta.filterDeptLabels.length ? meta.filterDeptLabels.join(', ') : txt('employee.report.allFilter')],
    [txt('employee.report.statusFilter'), meta.filterStatusLabels.length ? meta.filterStatusLabels.join(', ') : txt('employee.report.allFilter')],
    [txt('employee.report.exportDate'), meta.exportedAt],
    ['', ''],
  ];
}

/**
 * Export stats to Excel: sheet "Tổng quan" (meta + KPIs) and "Theo phòng ban" (dept table).
 */
export function exportStatsToExcel(
  meta: StatsExportMeta,
  kpis: KpiItem[],
  deptSummary: DeptSummaryRow[]
): void {
  const XLSX = (XLSXStyle as any).default ?? XLSXStyle;

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

  const metaTitleStyle = {
    font: { name: 'Segoe UI', sz: 14, bold: true, color: { rgb: '1E3A8A' } },
    alignment: { vertical: 'center', horizontal: 'left' }
  };

  const metaStyle = {
    font: { name: 'Segoe UI', sz: 10, bold: false },
    alignment: { vertical: 'center', horizontal: 'left' }
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
  const metaRowsRaw = buildMetaRows(meta);
  const overviewRowsStyled: any[] = metaRowsRaw.map((row, rIdx) => {
    const isTitle = rIdx === 0;
    return row.map(cell => ({
      v: cell,
      t: 's',
      s: isTitle ? metaTitleStyle : metaStyle
    }));
  });

  // Overview Table Headers
  overviewRowsStyled.push([
    { v: txt('employee.report.indicator'), t: 's', s: headerStyle },
    { v: txt('employee.report.value'), t: 's', s: headerStyle },
    { v: txt('employee.report.ratio'), t: 's', s: headerStyle }
  ]);

  // Overview Table Data
  kpis.forEach((k, rIdx) => {
    const valStr = String(k.value ?? '').replace(/[^0-9.-]/g, '');
    const isNum = valStr !== '' && !isNaN(Number(valStr));
    const cellVal = isNum ? Number(valStr) : (k.value ?? '');

    const pctVal = parseFloat(String(k.pct ?? '').replace('%', ''));
    const hasPct = k.pct && !isNaN(pctVal);

    overviewRowsStyled.push([
      { v: k.label ?? '', t: 's', s: getCellStyle(rIdx, 'text') },
      { v: cellVal, t: isNum ? 'n' : 's', s: getCellStyle(rIdx, isNum ? 'number' : 'text') },
      { 
        v: hasPct ? pctVal / 100 : (k.pct ?? ''), 
        t: hasPct ? 'n' : 's', 
        s: hasPct ? { ...getCellStyle(rIdx, 'number'), numFmt: '0.0%' } : getCellStyle(rIdx, 'center') 
      }
    ]);
  });

  const wsOverview = XLSX.utils.aoa_to_sheet(overviewRowsStyled);
  wsOverview['!cols'] = [{ wch: 22 }, { wch: 12 }, { wch: 10 }];

  // Build Dept styled rows
  const deptRowsStyled: any[] = [];
  const deptHeaders = [
    txt('employee.stats.department'),
    txt('employee.stats.total'),
    txt('employee.stats.workingShort'),
    txt('employee.stats.probation'),
    txt('employee.stats.leave'),
    txt('employee.report.activeRatePercent')
  ];
  deptRowsStyled.push(deptHeaders.map(h => ({ v: h, t: 's', s: headerStyle })));

  deptSummary.forEach((r, rIdx) => {
    const totalVal = Number(r.total ?? 0);
    const activeVal = Number(r.active ?? 0);
    const probationVal = Number(r.probation ?? 0);
    const inactiveVal = Number(r.inactive ?? 0);
    const rateVal = parseFloat(String(r.rate ?? '0').replace('%', ''));

    deptRowsStyled.push([
      { v: r.name ?? '', t: 's', s: getCellStyle(rIdx, 'text') },
      { v: totalVal, t: 'n', s: getCellStyle(rIdx, 'number') },
      { v: activeVal, t: 'n', s: getCellStyle(rIdx, 'number') },
      { v: probationVal, t: 'n', s: getCellStyle(rIdx, 'number') },
      { v: inactiveVal, t: 'n', s: getCellStyle(rIdx, 'number') },
      { 
        v: isNaN(rateVal) ? 0 : rateVal / 100, 
        t: 'n', 
        s: { ...getCellStyle(rIdx, 'number'), numFmt: '0.0%' } 
      }
    ]);
  });

  const wsDept = XLSX.utils.aoa_to_sheet(deptRowsStyled);
  wsDept['!cols'] = [{ wch: 24 }, { wch: 8 }, { wch: 10 }, { wch: 10 }, { wch: 8 }, { wch: 12 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsOverview, txt('employee.report.overviewSheet'));
  XLSX.utils.book_append_sheet(wb, wsDept, txt('employee.report.byDepartmentSheet'));

  const dateStr = getTodayISODate();
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveBlobAs(new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `Bao_cao_Thong_ke_Nhan_su_${dateStr}.xlsx`);
}

/**
 * Export stats to PDF: title, meta, KPI table, dept table.
 */
export function exportStatsToPdf(
  meta: StatsExportMeta,
  kpis: KpiItem[],
  deptSummary: DeptSummaryRow[]
): void {
  const { regular: regFontRes, medium: boldFontRes } = getRobotoFonts();
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
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

  doc.setFontSize(14);
  if (hasFonts) doc.setFont('Roboto', 'bold');
  else doc.setFont('helvetica', 'bold');
  doc.text(txt('employee.report.pdfTitle'), pageWidth / 2, y, { align: 'center' });
  y += 8;

  doc.setFontSize(9);
  if (hasFonts) doc.setFont('Roboto', 'normal');
  else doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(`${txt('employee.report.pdfPeriod')} ${meta.dateRangeLabel}  •  ${txt('employee.report.pdfExportDate')} ${meta.exportedAt}`, pageWidth / 2, y, { align: 'center' });
  doc.setTextColor(0);
  y += 6;

  if (meta.filterDeptLabels.length || meta.filterStatusLabels.length) {
    const filterParts = [];
    if (meta.filterDeptLabels.length) filterParts.push(`${txt('employee.report.pdfDepartment')} ${meta.filterDeptLabels.join(', ')}`);
    if (meta.filterStatusLabels.length) filterParts.push(`${txt('employee.report.pdfStatus')} ${meta.filterStatusLabels.join(', ')}`);
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(filterParts.join('  •  '), marginX, y);
    doc.setTextColor(0);
    y += 5;
  }

  y += 2;

  autoTable(doc, {
    startY: y,
    head: [[txt('employee.report.indicator'), txt('employee.report.value'), txt('employee.report.ratio')]],
    body: kpis.map((k) => [k.label, String(k.value), k.pct ?? '—']),
    theme: 'grid',
    styles: { font: hasFonts ? 'Roboto' : 'helvetica', fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: PRIMARY_COLOR, fontSize: 8, fontStyle: 'bold', textColor: 255 },
    margin: { left: marginX, right: marginX },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 8;

  if (deptSummary.length > 0) {
    if (y > 220) {
      doc.addPage();
      y = 14;
    }
    doc.setFontSize(10);
    if (hasFonts) doc.setFont('Roboto', 'bold');
    else doc.setFont('helvetica', 'bold');
    doc.text(txt('employee.report.pdfByDepartment'), marginX, y);
    y += 6;

    autoTable(doc, {
      startY: y,
      head: [[txt('employee.stats.department'), txt('employee.stats.total'), txt('employee.stats.workingShort'), txt('employee.stats.probation'), txt('employee.stats.leave'), txt('employee.report.activeRatePercent')]],
      body: deptSummary.map((r) => [r.name, String(r.total), String(r.active), String(r.probation), String(r.inactive), r.rate]),
      theme: 'grid',
      styles: { font: hasFonts ? 'Roboto' : 'helvetica', fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: PRIMARY_COLOR, fontSize: 7, fontStyle: 'bold', textColor: 255 },
      margin: { left: marginX, right: marginX },
    });
  }

  const dateStr = getTodayISODate();
  const pdfBlob = doc.output('blob');
  saveBlobAs(pdfBlob, `Bao_cao_Thong_ke_Nhan_su_${dateStr}.pdf`);
}

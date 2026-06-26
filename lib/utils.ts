import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"
import { useUIStore } from "../store/useStore"
import { txt } from './text'
import { buildSansStackCss } from './theme/fonts'
import * as XLSXStyle from 'xlsx-js-style'
import * as XLSXNormal from 'xlsx'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

// Cache variables for Roboto fonts
let robotoRegularBuffer: ArrayBuffer | null = null;
let robotoMediumBuffer: ArrayBuffer | null = null;
let fontsPromise: Promise<void> | null = null;

export function preloadRobotoFonts(): Promise<void> {
  if (robotoRegularBuffer && robotoMediumBuffer) return Promise.resolve();
  if (fontsPromise) return fontsPromise;

  fontsPromise = (async () => {
    try {
      const [reg, med] = await Promise.all([
        fetch('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf').then(r => r.arrayBuffer()),
        fetch('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Medium.ttf').then(r => r.arrayBuffer())
      ]);
      robotoRegularBuffer = reg;
      robotoMediumBuffer = med;
    } catch (e) {
      console.error('Failed to load Roboto fonts:', e);
      fontsPromise = null; // Reset to allow retry
    }
  })();

  return fontsPromise;
}

export function getRobotoFonts() {
  return {
    regular: robotoRegularBuffer,
    medium: robotoMediumBuffer
  };
}

dayjs.extend(utc)
dayjs.extend(timezone)

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Safe message for caught errors (TanStack Query, try/catch, …) */
export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

/** Lấy timezone hiện tại từ store (fallback: Asia/Ho_Chi_Minh) */
export function getTimezone(): string {
  try {
    return useUIStore.getState().timezone || 'Asia/Ho_Chi_Minh'
  } catch {
    return 'Asia/Ho_Chi_Minh'
  }
}

/** Locale cố định tiếng Việt — dùng cho Intl, localeCompare */
export function getLocale(): string {
  return 'vi-VN'
}

/** Mã ngôn ngữ ngắn cho sort/chuỗi */
export function getLanguage(): string {
  return 'vi'
}

/** Hash chuỗi thành số (deterministic) – dùng cho màu avatar */
function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

/** Bảng màu nền avatar (hex không #) – tương phản tốt với chữ trắng */
const AVATAR_BG_PALETTE = [
  '0f172a', '1e40af', '7c3aed', '059669', '0891b2', 'dc2626', 'ea580c', '4f46e5',
  'be185d', '0d9488', '7c2d12', '475569', '15803d', 'c026d3', '0369a1', 'b45309',
]

/** URL avatar fallback (logo chữ) từ ui-avatars.com – cùng tên = cùng màu, thống nhất toàn app */
export function getAvatarUrl(displayName: string, size?: number): string {
  const name = (displayName || 'User').trim() || 'User'
  const idx = hashString(name) % AVATAR_BG_PALETTE.length
  const background = AVATAR_BG_PALETTE[idx]
  const params = new URLSearchParams({
    name: name,
    background,
    color: 'fff',
  })
  if (size != null && size > 0) params.set('size', String(size))
  return `https://ui-avatars.com/api/?${params.toString()}`
}

/** Tạo dayjs instance đã áp timezone từ cài đặt */
function toTz(value: string | Date | dayjs.Dayjs): dayjs.Dayjs {
  return dayjs(value).tz(getTimezone())
}

/** dayjs "bây giờ" theo timezone từ cài đặt */
export function nowTz(): dayjs.Dayjs {
  return dayjs().tz(getTimezone())
}

function getDisplayDateFormat(): string {
  return 'DD/MM/YYYY'
}
function getDisplayDateTimeFormat(): string {
  return 'DD/MM/YYYY HH:mm'
}
function getDisplayDateTimeFormatShort(): string {
  return 'HH:mm - DD/MM/YYYY'
}
function getDisplayDateFormatShort(): string {
  return 'DD/MM'
}
function getDisplayTimeDateShortFormat(): string {
  return 'HH:mm DD/MM'
}
function getDisplayDateShortTimeFormat(): string {
  return 'DD/MM HH:mm'
}

/** Định dạng ngày hiển thị (DD/MM/YYYY) */
export const DATE_DISPLAY_FORMAT = 'DD/MM/YYYY'
export const DATETIME_DISPLAY_FORMAT = 'DD/MM/YYYY HH:mm'
export const DATETIME_DISPLAY_FORMAT_SHORT = 'HH:mm - DD/MM/YYYY'

export function formatDate(value: string | Date | dayjs.Dayjs | null | undefined): string {
  if (value == null) return ''
  return toTz(value).format(getDisplayDateFormat())
}

export function formatDateTime(value: string | Date | dayjs.Dayjs | null | undefined): string {
  if (value == null) return ''
  return toTz(value).format(getDisplayDateTimeFormat())
}

export function formatDateTimeShort(value: string | Date | dayjs.Dayjs | null | undefined): string {
  if (value == null) return ''
  return toTz(value).format(getDisplayDateTimeFormatShort())
}

/** Chỉ giờ (HH:mm) */
export function formatTime(value: string | Date | dayjs.Dayjs | null | undefined): string {
  if (value == null) return ''
  return toTz(value).format('HH:mm')
}

/** Ngày tháng ngắn (vi: DD/MM, en: MM/DD) */
export function formatDateShort(value: string | Date | dayjs.Dayjs | null | undefined): string {
  if (value == null) return ''
  return toTz(value).format(getDisplayDateFormatShort())
}

/** Tháng/năm (MM/YYYY) – giữ chung cho cả hai locale */
export function formatMonthYear(value: string | Date | dayjs.Dayjs | null | undefined): string {
  if (value == null) return ''
  return toTz(value).format('MM/YYYY')
}

/** Tháng/năm 2 chữ số (MM/YY) */
export function formatMonthYearShort(value: string | Date | dayjs.Dayjs | null | undefined): string {
  if (value == null) return ''
  return toTz(value).format('MM/YY')
}

/** HH:mm + ngày tháng ngắn (vi: HH:mm DD/MM, en: HH:mm MM/DD) */
export function formatTimeDateShort(value: string | Date | dayjs.Dayjs | null | undefined): string {
  if (value == null) return ''
  return toTz(value).format(getDisplayTimeDateShortFormat())
}

/** Ngày tháng ngắn + HH:mm (vi: DD/MM HH:mm, en: MM/DD HH:mm) */
export function formatDateShortTime(value: string | Date | dayjs.Dayjs | null | undefined): string {
  if (value == null) return ''
  return toTz(value).format(getDisplayDateShortTimeFormat())
}

/** Ngày hôm nay dạng ISO (YYYY-MM-DD) theo timezone cài đặt */
export function getTodayISO(): string {
  return nowTz().format('YYYY-MM-DD')
}

/** Giá trị ngày cho input type="date" (YYYY-MM-DD) */
export function formatDateForInput(value: string | Date | dayjs.Dayjs | null | undefined): string {
  if (value == null) return ''
  return toTz(value).format('YYYY-MM-DD')
}

/** Phần ngày/tháng/năm cho dòng "Ngày DD tháng MM năm YYYY" (in ấn) */
export function getTodayParts(): { day: string; month: string; year: string } {
  const d = nowTz()
  return { day: d.format('DD'), month: d.format('MM'), year: d.format('YYYY') }
}

/** Ngày sau N ngày (định dạng DD/MM/YYYY) */
export function addDaysFormatted(days: number): string {
  return nowTz().add(days, 'day').format(getDisplayDateFormat())
}

/** Thâm niên từ ngày vào làm: "X năm Y tháng" */
export function getTenureText(startDate: string | Date | dayjs.Dayjs | null | undefined): string {
  if (startDate == null) return ''
  const now = nowTz()
  const start = toTz(startDate)
  const years = now.diff(start, 'year')
  const months = now.diff(start, 'month') % 12
  return `${years} ${txt('tenure.year')} ${months} ${txt('tenure.month')}`
}

/** Ngày hiện tại dạng YYYYMMDD theo timezone (dùng cho tên file export/backup) */
export function getTodayFileDate(): string {
  return nowTz().format('YYYYMMDD')
}

/** Ngày hiện tại dạng YYYY-MM-DD theo timezone (dùng cho tên file export) */
export function getTodayISODate(): string {
  return nowTz().format('YYYY-MM-DD')
}

/**
 * Trả về native Date object mà các phương thức .getFullYear(), .getMonth(), .getDate()
 * trả về giá trị theo timezone đã cài đặt (thay vì timezone trình duyệt).
 * Hữu ích khi cần tính toán date ranges theo timezone.
 */
export function getNowAsLocalDate(): Date {
  const d = nowTz()
  return new Date(d.year(), d.month(), d.date(), d.hour(), d.minute(), d.second())
}

/** Font stack cho export HTML/PDF/Doc — đọc từ CSS variable --font-sans (theo cài đặt người dùng) */
export function getFontStack(): string {
  const val = getComputedStyle(document.documentElement).getPropertyValue('--font-sans').trim();
  return val || buildSansStackCss('Inter');
}

// Định dạng số thành tiền tệ VND, sử dụng locale từ cài đặt
export function formatCurrency(value: number) {
  return new Intl.NumberFormat(getLocale(), {
    style: 'currency',
    currency: 'VND',
  }).format(value);
}

/**
 * Tải file từ Blob với tên file chính xác — hoạt động trên mọi trình duyệt (Chrome, Brave, Firefox, Edge).
 *
 * Đây là cách tối ưu nhất vì:
 * - Dùng Blob trực tiếp (không qua data URI → tránh hoàn toàn bug Chrome bỏ qua download attribute)
 * - Dùng MouseEvent dispatch thay vì .click() (Chrome tôn trọng download attribute hơn với MouseEvent thật)
 * - Cleanup có delay đủ lâu để download manager hoàn tất đăng ký filename
 */
export function saveBlobAs(blob: Blob, filename: string) {
  // IE/Edge Legacy fallback
  if (typeof (navigator as any).msSaveBlob === 'function') {
    (navigator as any).msSaveBlob(blob, filename);
    return;
  }

  // Cố gắng dùng showSaveFilePicker nếu được hỗ trợ để giữ tên file tốt nhất trên Chrome
  if (typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
    const saveWithPicker = async () => {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: filename,
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
      } catch (err: any) {
        // Nếu user hủy (AbortError) thì dừng, nếu lỗi khác (như SecurityError)
        // thì chuyển sang dùng fallback anchor download
        if (err.name !== 'AbortError') {
          fallbackBlobDownload(blob, filename);
        }
      }
    };
    saveWithPicker();
    return;
  }

  fallbackBlobDownload(blob, filename);
}

function fallbackBlobDownload(blob: Blob, filename: string) {
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.style.display = 'none';
  link.href = blobUrl;
  link.setAttribute('download', filename);
  // Đảm bảo target không mở tab mới
  link.setAttribute('target', '_self');
  document.body.appendChild(link);

  // Dùng MouseEvent thật thay vì .click() — Chrome xử lý download attribute chính xác hơn
  link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));

  // Delay cleanup: Chrome cần thời gian để download manager đăng ký filename
  setTimeout(() => {
    if (link.parentNode) link.parentNode.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  }, 15000);
}

/**
 * Legacy wrapper — chuyển đổi data URI sang Blob rồi gọi saveBlobAs.
 * Các caller mới nên dùng saveBlobAs trực tiếp với Blob thay vì qua data URI.
 */
export function triggerFileDownload(url: string, filename: string) {
  try {
    if (url.startsWith('data:')) {
      const commaIdx = url.indexOf(',');
      if (commaIdx === -1) throw new Error('Invalid data URI');
      const meta = url.substring(0, commaIdx);
      const rawData = url.substring(commaIdx + 1);
      const mime = meta.split(':')[1].split(';')[0];
      const isBase64 = meta.includes('base64');

      let blob: Blob;
      if (isBase64) {
        const decoded = window.atob(rawData.replace(/\s/g, ''));
        const bytes = new Uint8Array(decoded.length);
        for (let i = 0; i < decoded.length; i++) bytes[i] = decoded.charCodeAt(i);
        blob = new Blob([bytes], { type: mime });
      } else {
        let text = rawData;
        try { text = decodeURIComponent(rawData); } catch (_) { /* fallback raw */ }
        blob = new Blob([text], { type: mime });
      }
      saveBlobAs(blob, filename);
      return;
    }

    // Nếu đã là blob: URL hoặc http(s): URL — tạo anchor bình thường
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = url;
    link.setAttribute('download', filename);
    link.setAttribute('target', '_self');
    document.body.appendChild(link);
    link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    setTimeout(() => { if (link.parentNode) link.parentNode.removeChild(link); }, 15000);
  } catch (err) {
    console.error('triggerFileDownload failed:', err);
  }
}

export function exportToExcel(data: Record<string, unknown>[], filename: string) {
  if (!data || !data.length) return;
  const XLSX = (XLSXStyle as any).default ?? XLSXStyle;

  const headerStyle = {
    font: { bold: true, color: { rgb: "FFFFFF" }, name: "Segoe UI", sz: 11 },
    fill: { fgColor: { rgb: "1E3A8A" } },
    alignment: { vertical: "center", horizontal: "center", wrapText: true },
    border: {
      top: { style: "thin", color: { rgb: "CBD5E1" } },
      bottom: { style: "medium", color: { rgb: "1E3A8A" } },
      left: { style: "thin", color: { rgb: "CBD5E1" } },
      right: { style: "thin", color: { rgb: "CBD5E1" } }
    }
  };

  const getCellStyle = (rowIndex: number, colKey: string) => {
    const isEven = rowIndex % 2 === 0;
    const bgRgb = isEven ? "F8FAFC" : "FFFFFF";
    
    let halign = "left";
    const isNumeric = colKey.includes('luong') || colKey.includes('phi') || colKey.includes('tien') || colKey.includes('con_lai') || colKey.includes('phu_cap') || colKey.includes('thuc_linh') || colKey.includes('so_chuyen') || colKey.includes('doanh_thu') || colKey.includes('tru_');
    
    if (isNumeric) {
      halign = "right";
    } else if (
      colKey.includes('ngay') || 
      colKey.includes('thang') || 
      colKey.includes('nam') || 
      colKey === 'trang_thai' || 
      colKey === 'phe_duyet' || 
      colKey === 'bien_so' || 
      colKey === 'so_dien_thoai' || 
      colKey === 'ten_dang_nhap' ||
      colKey === 'id' ||
      colKey === 'ma'
    ) {
      halign = "center";
    }

    return {
      font: { name: "Segoe UI", sz: 10 },
      fill: { fgColor: { rgb: bgRgb } },
      alignment: { vertical: "center", horizontal: halign },
      border: {
        top: { style: "thin", color: { rgb: "E2E8F0" } },
        bottom: { style: "thin", color: { rgb: "E2E8F0" } },
        left: { style: "thin", color: { rgb: "E2E8F0" } },
        right: { style: "thin", color: { rgb: "E2E8F0" } }
      },
      numFmt: isNumeric ? "#,##0" : undefined
    };
  };

  const keys = Object.keys(data[0]);
  const wsData = [
    keys.map(k => ({ v: k, t: 's', s: headerStyle })),
    ...data.map((row, rIdx) => 
      keys.map(k => {
        const val = row[k];
        const isNumeric = k.includes('luong') || k.includes('phi') || k.includes('tien') || k.includes('con_lai') || k.includes('phu_cap') || k.includes('thuc_linh') || k.includes('so_chuyen') || k.includes('doanh_thu') || k.includes('tru_');
        
        let cellVal = val;
        if (isNumeric) {
          const valStr = String(val ?? '').replace(/[^0-9.-]/g, '');
          cellVal = valStr !== '' ? Number(valStr) : 0;
        }

        return {
          v: isNumeric ? cellVal : (val ?? ''),
          t: isNumeric ? 'n' : 's',
          s: getCellStyle(rIdx, k)
        };
      })
    )
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Auto column widths
  ws['!cols'] = keys.map(key => ({
    wch: Math.max(key.length, ...data.slice(0, 50).map(r => String(r[key] ?? '').length)) + 3
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data');
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveBlobAs(new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${filename}_${getTodayISODate()}.xlsx`);
}

export function exportToPDF(data: Record<string, unknown>[], filename: string, title?: string) {
  if (!data || !data.length) return;
  
  const headers = Object.keys(data[0]);
  const doc = new jsPDF({ orientation: headers.length > 5 ? 'l' : 'p', unit: 'mm', format: 'a4' });

  const { regular: regFontRes, medium: boldFontRes } = getRobotoFonts();
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

  if (title) {
    doc.setFontSize(12);
    if (hasFonts) doc.setFont('Roboto', 'bold');
    else doc.setFont('helvetica', 'bold');
    doc.text(title, 14, 15);
  }
  
  autoTable(doc, {
    head: [headers],
    body: data.map(row => headers.map(h => String(row[h] ?? ''))),
    startY: title ? 22 : 10,
    styles: { font: hasFonts ? 'Roboto' : 'helvetica', fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [59, 130, 246] },
  });
  const pdfBlob = doc.output('blob');
  saveBlobAs(pdfBlob, `${filename}_${getTodayISODate()}.pdf`);
}

export function exportToCSV(data: Record<string, unknown>[], filename: string) {
  if (!data || !data.length) return;

  const headers = Object.keys(data[0]);
  
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(fieldName => {
      const cell = row[fieldName];
      if (cell === null || cell === undefined) return '';
      const cellStr = String(cell).replace(/"/g, '""');
      return cellStr.search(/("|,|\n)/g) >= 0 ? `"${cellStr}"` : cellStr;
    }).join(','))
  ].join('\n');

  // Tạo Blob trực tiếp với BOM UTF-8 — saveBlobAs handle download chính xác
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
  saveBlobAs(blob, `${filename}_${getTodayISODate()}.csv`);
}

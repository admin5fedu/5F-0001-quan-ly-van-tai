import fs from 'node:fs';
import path from 'node:path';
import XLSX from 'xlsx';

const inputs = process.argv.slice(2);
if (inputs.length === 0) {
  console.error('Usage: node scripts/analyze-google-sheets.mjs <workbook.xlsx>...');
  process.exit(1);
}

const outDir = path.resolve('output/sheets/current');
fs.mkdirSync(outDir, { recursive: true });

function cellToText(value) {
  if (value == null) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).replace(/\s+/g, ' ').trim();
}

function decodeRange(ref) {
  if (!ref) return null;
  const range = XLSX.utils.decode_range(ref);
  return {
    ref,
    rows: range.e.r - range.s.r + 1,
    cols: range.e.c - range.s.c + 1,
  };
}

function nonEmptyRows(rows) {
  return rows.filter((row) => row.some((cell) => cellToText(cell)));
}

function scoreHeaderRow(row) {
  const texts = row.map(cellToText);
  const nonEmpty = texts.filter(Boolean).length;
  const keywordHits = texts.filter((text) =>
    /^(stt|tt|id|m[aã]_|t[eê]n|submenu|module|view|tab|route|table|b[aả]ng|c[oộ]t|field|tr[uư][oờ]ng|ghi ch[uú]|m[oô] t[aả]|database|source|rule|quy|login|auth)$/i.test(text)
  ).length;
  return nonEmpty + keywordHits * 3;
}

function inferHeader(rows) {
  const limit = Math.min(rows.length, 20);
  let best = { index: -1, score: -1, values: [] };
  for (let i = 0; i < limit; i += 1) {
    const score = scoreHeaderRow(rows[i] ?? []);
    if (score > best.score) best = { index: i, score, values: rows[i].map(cellToText) };
  }
  return best;
}

function extractImportantCells(rows) {
  const patterns = [
    /int8|identity|bigserial|uuid|t[uự] động|auto/i,
    /ten_dang_nhap|t[eê]n đăng nhập|login|auth|supabase/i,
    /nh[aâ]n vi[eê]n|ma_nhan_vien|mã nhân viên/i,
    /permission|ph[aâ]n quyền|quy[eề]n|quan_tri|xem|them|sua|xoa/i,
    /search|t[iì]m kiếm|li[eê]n kết/i,
    /flow|lu[oồ]ng|quay lại|detail|form|tab/i,
    /database|bảng|cột|schema|policy|rls|trigger|index/i,
    /cloudinary|vercel|edge|egress|deploy/i,
  ];
  const hits = [];
  rows.forEach((row, r) => {
    row.forEach((cell, c) => {
      const text = cellToText(cell);
      if (!text) return;
      if (patterns.some((pattern) => pattern.test(text))) {
        hits.push({ row: r + 1, col: c + 1, text });
      }
    });
  });
  return hits.slice(0, 250);
}

function compactRows(rows, maxRows = 30, maxCols = 16) {
  return rows.slice(0, maxRows).map((row) => row.slice(0, maxCols).map(cellToText));
}

const analyses = inputs.map((input) => {
  const workbook = XLSX.readFile(input, { cellDates: true, dense: true });
  const sheets = workbook.SheetNames.map((name) => {
    const sheet = workbook.Sheets[name];
    const range = decodeRange(sheet['!ref']);
    const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' });
    const rows = nonEmptyRows(rawRows);
    const header = inferHeader(rows);
    return {
      name,
      range,
      nonEmptyRowCount: rows.length,
      header,
      sample: compactRows(rows),
      importantCells: extractImportantCells(rows),
    };
  });
  return {
    file: path.resolve(input),
    workbookId: path.basename(input).replace(/^sheet-/, '').replace(/\.xlsx$/i, ''),
    sheetCount: sheets.length,
    sheets,
  };
});

const jsonPath = path.join(outDir, 'google-sheets-analysis.json');
fs.writeFileSync(jsonPath, JSON.stringify(analyses, null, 2), 'utf8');

const lines = [];
lines.push('# Google Sheets Analysis');
lines.push('');
lines.push(`Generated: ${new Date().toISOString()}`);
for (const wb of analyses) {
  lines.push('');
  lines.push(`## ${wb.workbookId}`);
  lines.push('');
  lines.push(`File: \`${wb.file}\``);
  lines.push(`Sheets: ${wb.sheetCount}`);
  for (const sheet of wb.sheets) {
    lines.push('');
    lines.push(`### ${sheet.name}`);
    lines.push('');
    lines.push(`Range: ${sheet.range?.ref ?? 'empty'}; non-empty rows: ${sheet.nonEmptyRowCount}`);
    lines.push(`Header guess row: ${sheet.header.index + 1}; values: ${sheet.header.values.filter(Boolean).join(' | ')}`);
    if (sheet.importantCells.length) {
      lines.push('');
      lines.push('Important cells:');
      for (const hit of sheet.importantCells.slice(0, 40)) {
        lines.push(`- R${hit.row}C${hit.col}: ${hit.text}`);
      }
    }
    lines.push('');
    lines.push('Sample rows:');
    for (const row of sheet.sample.slice(0, 12)) {
      lines.push(`- ${row.filter(Boolean).join(' | ')}`);
    }
  }
}

const mdPath = path.join(outDir, 'google-sheets-analysis.md');
fs.writeFileSync(mdPath, lines.join('\n'), 'utf8');

console.log(JSON.stringify({ jsonPath, mdPath, workbookCount: analyses.length }, null, 2));

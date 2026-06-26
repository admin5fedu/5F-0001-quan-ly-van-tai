import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

function loadEnv(path = '.env.local') {
  const content = fs.readFileSync(path, 'utf8');
  return Object.fromEntries(
    content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const index = line.indexOf('=');
        return [line.slice(0, index), line.slice(index + 1)];
      }),
  );
}

const env = loadEnv();
const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SECRET_KEY);

function getYearMonth(value) {
  const date = String(value ?? '');
  if (!date) return null;
  const parts = date.split(/[-T]/);
  if (parts.length < 2) return null;
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  if (!Number.isFinite(year) || !Number.isFinite(month)) return null;
  return { year, month };
}

function getPayrollTripDetails(payrollRow, lookups, approvedOnly = false) {
  const year = Number(payrollRow.nam);
  const month = Number(payrollRow.thang);
  const tripsInPeriod = (lookups.trips || []).filter((trip) => {
    const parsed = getYearMonth(trip.ngay);
    return (
      parsed !== null &&
      parsed.year === year &&
      parsed.month === month &&
      String(trip.id_tai_xe) === String(payrollRow.id_tai_xe) &&
      (!approvedOnly || trip.trang_thai === 'Đã duyệt')
    );
  });
  const tripById = new Map(tripsInPeriod.map((trip) => [String(trip.id), trip]));
  return (lookups.tripDetails || [])
    .filter((detail) => tripById.has(String(detail.id_chuyen_xe)))
    .filter((detail) => !approvedOnly || detail.phe_duyet === 'Đã duyệt')
    .map((detail) => ({ ...detail, trip: tripById.get(String(detail.id_chuyen_xe)) }))
    .sort((a, b) => String(a.trip?.ngay ?? '').localeCompare(String(b.trip?.ngay ?? ''), 'vi'));
}

async function run() {
  const { data: drivers } = await supabase.from('var_nhan_vien').select('*').eq('la_tai_xe', true);
  const { data: locations } = await supabase.from('vt_dia_diem').select('*');
  const { data: vehicles } = await supabase.from('vt_xe').select('*');
  const { data: trips } = await supabase.from('vt_chuyen_xe').select('*');
  const { data: tripDetails } = await supabase.from('vt_chuyen_xe_ct').select('*');
  const { data: payroll } = await supabase.from('vt_luong').select('*');
  
  const lookups = {
    drivers: drivers ? drivers.map(d => ({ ...d, ho_ten: d.ho_va_ten })) : [],
    locations,
    vehicles,
    trips,
    tripDetails,
    payroll,
    employees: []
  };

  const payrollRow = payroll ? payroll.find(p => String(p.id_tai_xe) === '114' && p.thang === 6 && p.nam === 2026) : null;
  if (!payrollRow) {
    console.log("No payroll row found for driver 114");
    return;
  }
  
  const details = getPayrollTripDetails(payrollRow, lookups, true);
  console.log("getPayrollTripDetails(..., true) output length:", details.length);
  console.log("getPayrollTripDetails(..., true) details:", details);
}

run();

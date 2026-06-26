import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

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

function getPayrollTripDetails(
  payrollRow,
  lookups,
  approvedOnly = false,
) {
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
    .filter((detail) => {
      const match = tripById.has(String(detail.id_chuyen_xe));
      return match;
    })
    .filter((detail) => !approvedOnly || detail.phe_duyet === 'Đã duyệt')
    .map((detail) => ({ ...detail, trip: tripById.get(String(detail.id_chuyen_xe)) }))
    .sort((a, b) => String(a.trip?.ngay ?? '').localeCompare(String(b.trip?.ngay ?? ''), 'vi'));
}

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

async function run() {
  const { data: trips } = await supabase.from('vt_chuyen_xe').select('*');
  const { data: tripDetails } = await supabase.from('vt_chuyen_xe_ct').select('*');
  const { data: payrolls } = await supabase.from('vt_luong').select('*');

  const payrollRow = payrolls.find(p => p.id === 281);
  console.log("Payroll Row 281:", payrollRow);

  const lookups = { trips, tripDetails };

  const detailsWithApprovedOnlyTrue = getPayrollTripDetails(payrollRow, lookups, true);
  console.log("Details with approvedOnly=true (length = " + detailsWithApprovedOnlyTrue.length + "):");
  console.log(detailsWithApprovedOnlyTrue.map(d => ({ id: d.id, phe_duyet: d.phe_duyet, tripStatus: d.trip?.trang_thai })));

  const detailsWithApprovedOnlyFalse = getPayrollTripDetails(payrollRow, lookups, false);
  console.log("Details with approvedOnly=false (length = " + detailsWithApprovedOnlyFalse.length + "):");
  console.log(detailsWithApprovedOnlyFalse.map(d => ({ id: d.id, phe_duyet: d.phe_duyet, tripStatus: d.trip?.trang_thai })));
}

run();

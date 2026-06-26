import { createRepository } from '@/lib/data/create-repository';
import type { IRepository } from '@/lib/data/repository';
import { MOCK_EMPLOYEES } from '@/mocks';
import { useAuthStore } from '@/store/useStore';
import { usePermissionGrantStore } from '@/store/usePermissionGrantStore';
import {
  TRANSPORT_MODULES,
  isApprovedTransportStatus,
  type TransportLookupRows,
  type TransportModuleConfig,
  type TransportRow,
} from './transport-config';
import {
  collectParentTripIdsFromChildren,
  deriveParentTripStatus,
  isPendingTripApproval,
  normalizeTripApprovalStatus,
} from './trip-approval-sync';
import { isCtEligibleForPayroll, isExecutedTripDetail } from './trip-execution-sync';

/**
 * Ngữ cảnh người tạo (dùng cho audit + ownership của tài xế khi tự báo cáo chuyến).
 * - `employeeId`: id nhân viên (var_nhan_vien) khớp tài khoản đăng nhập.
 * - `isDriver`: tài khoản gắn cờ tài xế và không phải admin.
 */
function getCreatorContext(): { employeeId: string | null; isDriver: boolean } {
  const user = useAuthStore.getState().user;
  const employeeRecord = usePermissionGrantStore.getState().employeeRecord as { id?: unknown } | null;
  const employeeId = employeeRecord?.id != null ? String(employeeRecord.id) : null;
  const isDriver = !!user?.la_tai_xe && user?.role !== 'admin';
  return { employeeId, isDriver };
}

const repoMap = new Map<string, IRepository<TransportRow>>();

function getRepo(config: TransportModuleConfig): IRepository<TransportRow> {
  const cached = repoMap.get(config.id);
  if (cached) return cached;
  const repo = createRepository<TransportRow>({
    tableName: config.tableName,
    mockData: config.seedRows,
    delay: 250,
  });
  repoMap.set(config.id, repo);
  return repo;
}

const employeesRepo = createRepository<TransportRow>({
  tableName: 'var_nhan_vien',
  mockData: MOCK_EMPLOYEES as unknown as TransportRow[],
  delay: 250,
});

const toNumber = (value: unknown): number => Number(value ?? 0) || 0;
const sameId = (a: unknown, b: unknown): boolean => String(a ?? '') === String(b ?? '');

function normalizeApprovalStatus(value: unknown): string {
  return normalizeTripApprovalStatus(value);
}

function getYearMonth(value: unknown): { year: number; month: number } | null {
  const date = String(value ?? '');
  if (!date) return null;
  const parts = date.split(/[-T]/);
  if (parts.length < 2) return null;
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  if (!Number.isFinite(year) || !Number.isFinite(month)) return null;
  return { year, month };
}

async function getBaseRows(config: TransportModuleConfig): Promise<TransportRow[]> {
  if (config.id === 'tai-xe') {
    const rawEmployees = await employeesRepo.getAll({ orderBy: 'tg_cap_nhat', ascending: false });
    const drivers = rawEmployees.filter((emp) => emp.la_tai_xe === true);
    return drivers.map((emp) => ({
      ...emp,
      ho_ten: emp.ho_va_ten,
    }));
  }
  return getRepo(config).getAll({ orderBy: 'tg_cap_nhat', ascending: false });
}

function applyTripTotals(trips: TransportRow[], details: TransportRow[]): TransportRow[] {
  return trips.map((trip) => {
    const children = details.filter((detail) => sameId(detail.id_chuyen_xe, trip.id));
    const payrollEligible = children.filter((detail) => isCtEligibleForPayroll(detail));
    const executed = children.filter((detail) => isExecutedTripDetail(detail.trang_thai));
    const soChuyen = executed.length;
    const tongTienLuong = payrollEligible.reduce((sum, detail) => sum + toNumber(detail.tien_luong), 0);
    const tongPhi = payrollEligible.reduce((sum, detail) => sum + toNumber(detail.chi_phi), 0);
    return {
      ...trip,
      trang_thai: normalizeApprovalStatus(trip.trang_thai),
      so_chuyen: soChuyen,
      tong_tien_luong: tongTienLuong,
      tong_phi: tongPhi,
    };
  });
}

/** Danh sách luôn hiện mọi phiếu lương (theo phân quyền); tiền trong kỳ chỉ tính CT đủ R6 (đã duyệt + đã thực hiện). */
function shouldListPayrollRow(_payroll: TransportRow, _trips: TransportRow[]): boolean {
  return true;
}

async function reconcileStaleParentTripStatuses(trips: TransportRow[], details: TransportRow[]): Promise<void> {
  const tripRepo = getRepo(TRANSPORT_MODULES.trips);
  await Promise.all(
    trips.map(async (trip) => {
      const children = details.filter((detail) => sameId(detail.id_chuyen_xe, trip.id));
      if (children.length === 0) return;
      const expected = deriveParentTripStatus(children.map((child) => child.phe_duyet));
      const current = normalizeApprovalStatus(trip.trang_thai);
      if (current === expected) return;
      await tripRepo.update(String(trip.id), {
        trang_thai: expected,
        tg_cap_nhat: new Date().toISOString(),
      });
    }),
  );
}

async function getComputedTrips(): Promise<TransportRow[]> {
  const [trips, details] = await Promise.all([
    getBaseRows(TRANSPORT_MODULES.trips),
    getBaseRows(TRANSPORT_MODULES.tripDetails),
  ]);
  await reconcileStaleParentTripStatuses(trips, details);
  const freshTrips = await getBaseRows(TRANSPORT_MODULES.trips);
  return applyTripTotals(freshTrips, details);
}

function applyPayrollTotals(payrollRows: TransportRow[], trips: TransportRow[], details: TransportRow[]): TransportRow[] {
  return payrollRows.map((payroll) => {
    const year = Number(payroll.nam);
    const month = Number(payroll.thang);
    const tripIdsInPeriod = new Set(
      trips
        .filter((trip) => {
          const parsed = getYearMonth(trip.ngay);
          return (
            parsed !== null &&
            sameId(trip.id_tai_xe, payroll.id_tai_xe) &&
            parsed.year === year &&
            parsed.month === month &&
            trip.trang_thai === 'Đã duyệt'
          );
        })
        .map((trip) => String(trip.id)),
    );
    const approvedDetails = details.filter(
      (detail) => tripIdsInPeriod.has(String(detail.id_chuyen_xe)) && isCtEligibleForPayroll(detail),
    );

    const tongLuongChuyen = approvedDetails.reduce((sum, detail) => sum + toNumber(detail.tien_luong), 0);
    const tongChiPhiChuyen = approvedDetails.reduce((sum, detail) => sum + toNumber(detail.chi_phi), 0);
    const truTienKhac = toNumber(payroll.tru_tien_khac);
    const tongChiPhiKhac = toNumber(payroll.tong_chi_phi_khac);
    const luongCoBan = toNumber(payroll.luong_co_ban);
    return {
      ...payroll,
      tong_luong_chuyen: tongLuongChuyen,
      tong_chi_phi_chuyen: tongChiPhiChuyen,
      tru_tien_khac: truTienKhac,
      tong_chi_phi_khac: tongChiPhiKhac,
      tong_con_lai: luongCoBan + tongLuongChuyen + tongChiPhiChuyen - truTienKhac,
    };
  });
}

async function getComputedPayrollRows(rows?: TransportRow[]): Promise<TransportRow[]> {
  const [payrollRows, trips, details] = await Promise.all([
    rows ? Promise.resolve(rows) : getBaseRows(TRANSPORT_MODULES.payroll),
    getComputedTrips(),
    getBaseRows(TRANSPORT_MODULES.tripDetails),
  ]);
  const computed = applyPayrollTotals(payrollRows, trips, details);
  return rows
    ? computed
    : computed.filter((row) => shouldListPayrollRow(row, trips));
}

async function getTripTotalsById(id: string): Promise<Pick<TransportRow, 'so_chuyen' | 'tong_tien_luong' | 'tong_phi'>> {
  const [trips, details] = await Promise.all([
    getBaseRows(TRANSPORT_MODULES.trips),
    getBaseRows(TRANSPORT_MODULES.tripDetails),
  ]);
  const trip = trips.find((row) => sameId(row.id, id));
  if (!trip) {
    return { so_chuyen: 0, tong_tien_luong: 0, tong_phi: 0 };
  }
  const children = details.filter((detail) => sameId(detail.id_chuyen_xe, id));
  const payrollEligible = children.filter((detail) => isCtEligibleForPayroll(detail));
  const executed = children.filter((detail) => isExecutedTripDetail(detail.trang_thai));
  return {
    so_chuyen: executed.length,
    tong_tien_luong: payrollEligible.reduce((sum, detail) => sum + toNumber(detail.tien_luong), 0),
    tong_phi: payrollEligible.reduce((sum, detail) => sum + toNumber(detail.chi_phi), 0),
  };
}

async function computePayrollPayload(data: Record<string, unknown>): Promise<Record<string, unknown>> {
  const [computed] = await getComputedPayrollRows([{ id: String(data.id ?? 'pending'), ...data } as TransportRow]);
  return {
    tong_luong_chuyen: computed?.tong_luong_chuyen ?? 0,
    tong_chi_phi_chuyen: computed?.tong_chi_phi_chuyen ?? 0,
    tru_tien_khac: toNumber(data.tru_tien_khac),
    tong_chi_phi_khac: toNumber(data.tong_chi_phi_khac),
    tong_con_lai: computed?.tong_con_lai ?? 0,
  };
}

async function prepareTransportPayload(
  config: TransportModuleConfig,
  data: Record<string, unknown>,
  id?: string,
): Promise<Record<string, unknown>> {
  const editableKeys = new Set(
    config.fields.filter((field) => !field.readOnly && !field.hideInForm).map((field) => field.key),
  );
  const payload = Object.fromEntries(Object.entries(data).filter(([key]) => editableKeys.has(key)));
  if (config.id === 'chuyen-xe') {
    return {
      trang_thai: 'Chưa duyệt',
      ...payload,
      ...(id ? await getTripTotalsById(id) : { so_chuyen: 0, tong_tien_luong: 0, tong_phi: 0 })
    };
  }
  if (config.id === 'chuyen-xe-ct' && !id) {
    return {
      trang_thai: 'Chưa thực hiện',
      phe_duyet: 'Chưa duyệt',
      ...payload,
    };
  }
  if (config.id === 'danh-sach-xe') {
    const bienSo = String(payload.bien_so ?? data.bien_so ?? '').trim();
    if (!bienSo) {
      throw new Error('Biển số xe không được để trống!');
    }
    const existing = await getRepo(config).getAll();
    const isDup = existing.some(row =>
      String(row.bien_so).trim().toLowerCase() === bienSo.toLowerCase() &&
      (!id || String(row.id) !== String(id))
    );
    if (isDup) {
      throw new Error(`Xe có biển số ${bienSo} đã tồn tại trong hệ thống!`);
    }
  }

  if (config.id === 'dia-diem') {
    const ten = String(payload.ten ?? data.ten ?? '').trim();
    if (!ten) {
      throw new Error('Tên địa điểm không được để trống!');
    }
    const existing = await getRepo(config).getAll();
    const isDup = existing.some(row =>
      String(row.ten).trim().toLowerCase() === ten.toLowerCase() &&
      (!id || String(row.id) !== String(id))
    );
    if (isDup) {
      throw new Error(`Địa điểm "${ten}" đã tồn tại trong hệ thống!`);
    }
  }

  if (config.id === 'bang-luong') {
    const driverId = payload.id_tai_xe ?? data.id_tai_xe;
    const nam = payload.nam ?? data.nam;
    const thang = payload.thang ?? data.thang;
    const existing = await getRepo(config).getAll();
    const isDup = existing.some(row =>
      sameId(row.id_tai_xe, driverId) &&
      Number(row.nam) === Number(nam) &&
      Number(row.thang) === Number(thang) &&
      (!id || String(row.id) !== String(id))
    );
    if (isDup) {
      throw new Error(`Bảng lương cho tài xế này trong tháng ${thang}/${nam} đã tồn tại!`);
    }
    return { ...payload, ...(await computePayrollPayload(payload)), ...(!id ? { trang_thai: 'Chưa duyệt' } : {}) };
  }
  return payload;
}

export async function getTransportRows(config: TransportModuleConfig): Promise<TransportRow[]> {
  const rows = await getBaseRows(config);
  if (config.id === 'chuyen-xe') return getComputedTrips();
  if (config.id === 'bang-luong') return getComputedPayrollRows(rows);
  return rows;
}

import { isSupabase } from '@/lib/data/config';

async function syncDriverAuth(payload: {
  operation: 'create' | 'update' | 'delete';
  username?: string | null;
  full_name?: string | null;
}) {
  if (!isSupabase() || !payload.username) return;
  try {
    const response = await fetch('/api/employee-auth-sync', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        password: '123456',
        oldUsername: payload.operation === 'update' ? payload.username : undefined,
        newUsername: payload.operation === 'update' ? payload.username : undefined,
      }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      console.warn('Auth sync status warning:', data.error || 'Failed');
    }
  } catch (error) {
    console.error('Auth sync network/execution error:', error);
  }
}

export async function getTransportLookupRows(): Promise<TransportLookupRows> {
  const [drivers, locations, vehicles, trips, tripDetails, payroll, employees] = await Promise.all([
    getTransportRows(TRANSPORT_MODULES.drivers),
    getTransportRows(TRANSPORT_MODULES.locations),
    getTransportRows(TRANSPORT_MODULES.vehicles),
    getTransportRows(TRANSPORT_MODULES.trips),
    getTransportRows(TRANSPORT_MODULES.tripDetails),
    getTransportRows(TRANSPORT_MODULES.payroll),
    employeesRepo.getAll({ orderBy: 'ho_va_ten', ascending: true }),
  ]);
  return { drivers, locations, vehicles, trips, tripDetails, payroll, employees };
}

export async function createTransportRow(
  config: TransportModuleConfig,
  data: Record<string, unknown>,
): Promise<TransportRow> {
  const timestamp = new Date().toISOString();
  const prepared = await prepareTransportPayload(config, data);
  const { employeeId, isDriver } = getCreatorContext();

  // Chuyến xe: gán người tạo cho ownership (tài xế tự báo cáo chỉ thấy/sửa chuyến của mình).
  // Tài xế chỉ được tạo chuyến cho chính mình -> ép id_tai_xe = id nhân viên đăng nhập.
  if (config.id === 'chuyen-xe') {
    if (employeeId) prepared.id_nguoi_tao = employeeId;
    if (isDriver && employeeId) prepared.id_tai_xe = employeeId;
  }

  const row = {
    ...prepared,
    tg_tao: timestamp,
    tg_cap_nhat: timestamp,
  } as Omit<TransportRow, 'id'>;

  if (config.id === 'tai-xe') {
    const tenDangNhap = prepared.ten_dang_nhap ?? data.ten_dang_nhap ?? prepared.so_dien_thoai ?? data.so_dien_thoai ?? prepared.email ?? data.email ?? '';
    const empPayload = {
      ...row,
      ho_va_ten: prepared.ho_ten ?? data.ho_ten ?? '',
      ten_dang_nhap: tenDangNhap,
      la_tai_xe: true,
    };
    delete (empPayload as any).ho_ten;
    
    let result;
    if (data.id) {
      result = await employeesRepo.update(String(data.id), empPayload as any);
      await syncDriverAuth({ operation: 'update', username: tenDangNhap, full_name: empPayload.ho_va_ten });
    } else {
      result = await employeesRepo.insert(empPayload as any);
      await syncDriverAuth({ operation: 'create', username: tenDangNhap, full_name: empPayload.ho_va_ten });
    }
    
    return {
      ...result,
      ho_ten: result.ho_va_ten,
    };
  }

  if (config.id === 'chuyen-xe' && Array.isArray(data.tempChildRows) && data.tempChildRows.length > 0) {
    const parentRow = await getRepo(config).insert(row);
    const detailRepo = getRepo(TRANSPORT_MODULES.tripDetails);
    await Promise.all(
      data.tempChildRows.map((child: any) => {
        const { id: _tempId, trang_thai: _th, phe_duyet: _pd, ...childRest } = child;
        return detailRepo.insert({
          ...childRest,
          trang_thai: 'Chưa thực hiện',
          phe_duyet: 'Chưa duyệt',
          id_chuyen_xe: parentRow.id,
          tg_tao: timestamp,
          tg_cap_nhat: timestamp,
        });
      })
    );
    const updated = await getRepo(config).getById(parentRow.id);
    if (!updated) return parentRow;
    return updated;
  }

  return getRepo(config).insert(row);
}

async function assertDriverOwnsTrip(tripId: string, employeeId: string): Promise<TransportRow> {
  const trip = await getRepo(TRANSPORT_MODULES.trips).getById(tripId);
  if (!trip || !sameId(trip.id_tai_xe, employeeId)) {
    throw new Error('Tài xế chỉ được báo cáo chuyến xe của chính mình.');
  }
  return trip;
}

async function syncParentTripsFromChildDetails(parentTripIds: string[]): Promise<void> {
  const uniqueIds = [...new Set(parentTripIds.map(String).filter(Boolean))];
  if (uniqueIds.length === 0) return;

  const detailRepo = getRepo(TRANSPORT_MODULES.tripDetails);
  const tripRepo = getRepo(TRANSPORT_MODULES.trips);
  const allDetails = await detailRepo.getAll();

  await Promise.all(
    uniqueIds.map(async (parentId) => {
      const children = allDetails.filter((detail) => sameId(detail.id_chuyen_xe, parentId));
      if (children.length === 0) return;
      const nextStatus = deriveParentTripStatus(children.map((child) => child.phe_duyet));
      await tripRepo.update(parentId, {
        trang_thai: nextStatus,
        tg_cap_nhat: new Date().toISOString(),
      });
    }),
  );
}

export async function updateTransportRow(
  config: TransportModuleConfig,
  id: string,
  data: Record<string, unknown>,
): Promise<TransportRow> {
  const { employeeId, isDriver } = getCreatorContext();

  if (config.id === 'chuyen-xe' && isDriver && employeeId) {
    throw new Error('Tài xế báo cáo từng dòng chi tiết chuyến, không sửa chuyến cha.');
  }

  if (config.id === 'chuyen-xe-ct' && isDriver && employeeId) {
    const existing = await getRepo(config).getById(id);
    if (!existing) throw new Error('Không tìm thấy dòng chi tiết chuyến.');
    if (!isPendingTripApproval(existing.phe_duyet)) {
      throw new Error('Chỉ báo cáo được khi dòng CT còn Chưa duyệt.');
    }
    await assertDriverOwnsTrip(String(existing.id_chuyen_xe), employeeId);
    const nextStatus = data.trang_thai ?? existing.trang_thai;
    if (nextStatus !== 'Đã thực hiện' && nextStatus !== 'Hủy') {
      throw new Error('Tài xế chỉ chuyển sang Đã thực hiện hoặc Hủy.');
    }
    const updated = await getRepo(config).update(id, {
      trang_thai: String(nextStatus),
      chi_phi: toNumber(data.chi_phi ?? existing.chi_phi),
      ghi_chu: data.ghi_chu ?? existing.ghi_chu ?? '',
      tg_cap_nhat: new Date().toISOString(),
    });
    await syncParentTripsFromChildDetails([String(existing.id_chuyen_xe)]);
    return updated;
  }

  const prepared = await prepareTransportPayload(config, data, id);

  if (config.id === 'tai-xe') {
    const tenDangNhap = prepared.ten_dang_nhap ?? data.ten_dang_nhap ?? prepared.so_dien_thoai ?? data.so_dien_thoai ?? prepared.email ?? data.email ?? '';
    const empPayload = {
      ...prepared,
      ho_va_ten: prepared.ho_ten ?? data.ho_ten ?? undefined,
      ten_dang_nhap: tenDangNhap,
      tg_cap_nhat: new Date().toISOString(),
    };
    delete (empPayload as any).ho_ten;
    const updated = await employeesRepo.update(id, empPayload as any);
    await syncDriverAuth({ operation: 'update', username: tenDangNhap, full_name: empPayload.ho_va_ten });
    return {
      ...updated,
      ho_ten: updated.ho_va_ten,
    };
  }

  const updated = await getRepo(config).update(id, {
    ...prepared,
    tg_cap_nhat: new Date().toISOString(),
  });

  if (config.id === 'chuyen-xe-ct' && updated.id_chuyen_xe != null) {
    await syncParentTripsFromChildDetails([String(updated.id_chuyen_xe)]);
  }

  return updated;
}

export async function deleteTransportRows(config: TransportModuleConfig, ids: string[]): Promise<void> {
  if (config.id === 'tai-xe') {
    const existing = await Promise.all(ids.map((id) => employeesRepo.getById(id, { select: 'id,ten_dang_nhap' })));
    await Promise.all(
      ids.map((id) =>
        employeesRepo.update(id, {
          la_tai_xe: false,
          tg_cap_nhat: new Date().toISOString(),
        } as any),
      ),
    );
    for (const emp of existing) {
      if (emp && emp.ten_dang_nhap) {
        await syncDriverAuth({ operation: 'delete', username: emp.ten_dang_nhap });
      }
    }
    return;
  }
  if (config.id === 'chuyen-xe') {
    const detailRepo = getRepo(TRANSPORT_MODULES.tripDetails);
    const details = await detailRepo.getAll();
    const childrenToDelete = details.filter(d => ids.includes(String(d.id_chuyen_xe))).map(d => String(d.id));
    if (childrenToDelete.length > 0) {
      await detailRepo.remove(childrenToDelete);
    }
  }
  await getRepo(config).remove(ids);
}

export async function setTransportApprovalStatus(
  config: TransportModuleConfig,
  ids: string[],
  status: string,
  note?: string,
): Promise<void> {
  const approvalKey = config.id === 'chuyen-xe-ct' ? 'phe_duyet' : config.statusKey ?? 'trang_thai';
  const updateFields: Record<string, any> = {
    [approvalKey]: status,
    tg_cap_nhat: new Date().toISOString(),
  };
  if (note !== undefined) {
    updateFields.ghi_chu = note;
  }
  if (config.id === 'tai-xe') {
    await Promise.all(
      ids.map((id) =>
        employeesRepo.update(id, updateFields as any),
      ),
    );
    return;
  }
  
  if (config.id === 'chuyen-xe') {
    const detailRepo = getRepo(TRANSPORT_MODULES.tripDetails);
    const details = await detailRepo.getAll();
    const childrenToUpdate = details.filter((d) => ids.includes(String(d.id_chuyen_xe)));
    if (childrenToUpdate.length > 0) {
      await Promise.all(
        childrenToUpdate.map((d) =>
          detailRepo.update(String(d.id), {
            phe_duyet: status,
            tg_cap_nhat: new Date().toISOString(),
          }),
        ),
      );
    }
  }

  await Promise.all(
    ids.map((id) =>
      getRepo(config).update(id, updateFields),
    ),
  );

  if (config.id === 'chuyen-xe-ct') {
    const detailRepo = getRepo(TRANSPORT_MODULES.tripDetails);
    const allDetails = await detailRepo.getAll();
    const touchedChildren = allDetails.filter((detail) => ids.includes(String(detail.id)));
    const parentIds = collectParentTripIdsFromChildren(touchedChildren);
    await syncParentTripsFromChildDetails(parentIds);
  }
}

export async function approveTransportRows(config: TransportModuleConfig, ids: string[], note?: string): Promise<void> {
  return setTransportApprovalStatus(config, ids, 'Đã duyệt', note);
}

export async function rejectTransportRows(config: TransportModuleConfig, ids: string[], note?: string): Promise<void> {
  return setTransportApprovalStatus(config, ids, 'Không duyệt', note);
}

export function canApproveTransportRow(config: TransportModuleConfig, row: TransportRow): boolean {
  if (config.id === 'chuyen-xe-ct') {
    const value = row.phe_duyet;
    return value !== 'Đã duyệt';
  }
  if (config.id === 'chuyen-xe') {
    const value = row[config.statusKey ?? 'trang_thai'];
    return !isApprovedTransportStatus(value);
  }
  if (config.id === 'bang-luong') {
    const value = row[config.statusKey ?? 'trang_thai'];
    return !isApprovedTransportStatus(value);
  }
  return false;
}

export async function updateTransportStatus(
  config: TransportModuleConfig,
  ids: string[],
  status: string,
  note?: string,
  extraFields: Record<string, unknown> = {},
): Promise<void> {
  const statusKey = config.statusKey ?? 'trang_thai';
  const updatePayload: Record<string, any> = {
    ...extraFields,
    [statusKey]: status,
    tg_cap_nhat: new Date().toISOString(),
  };
  if (note !== undefined) {
    updatePayload.ghi_chu = note;
  }

  if (config.id === 'tai-xe') {
    await Promise.all(
      ids.map((id) =>
        employeesRepo.update(id, updatePayload as any),
      ),
    );
    return;
  }
  await Promise.all(
    ids.map((id) =>
      getRepo(config).update(id, updatePayload),
    ),
  );
}

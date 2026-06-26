import type { User } from '@/types';
import type { ActionType } from '@/features/he-thong/phan-quyen/core/types';
import { usePermissionGrantStore } from '@/store/usePermissionGrantStore';

/**
 * Hành động gắn với UI (nút, route) — mở rộng theo nghiệp vụ.
 * Khi có policy server-side, vẫn phải kiểm tra lại API.
 */
export type AppAction = 'view' | 'create' | 'edit' | 'delete' | 'export' | 'import';

/**
 * Tài nguyên (module) — thêm khi có module mới.
 */
export type AppResource =
  | 'employees'
  | 'departments'
  | 'positions'
  | 'company'
  | 'permissions'
  | 'profile'
  | 'notifications'
  | 'chuyen-xe'
  | 'chuyen-xe-ct'
  | 'bang-luong'
  | 'tai-xe'
  | 'dia-diem'
  | 'danh-sach-xe'
  | 'thong-ke-chuyen-di'
  | 'thong-ke-luong'
  | '*';

/**
 * Ánh xạ `AppResource` → `module_id` trong Phân quyền (vd. `he-thong/nhan-vien`).
 * Không có trong map → `can()` dùng luật legacy (profile, notifications, *).
 */
export const APP_RESOURCE_TO_MODULE: Partial<Record<AppResource, string>> = {
  employees: 'nhan-vien',
  departments: 'phong-ban',
  positions: 'chuc-vu',
  company: 'thong-tin-cong-ty',
  permissions: 'phan-quyen',
  'chuyen-xe': 'chuyen-xe',
  'chuyen-xe-ct': 'chuyen-xe',
  'bang-luong': 'bang-luong',
  'tai-xe': 'tai-xe',
  'dia-diem': 'dia-diem',
  'danh-sach-xe': 'danh-sach-xe',
  'thong-ke-chuyen-di': 'thong-ke-chuyen-di',
  'thong-ke-luong': 'thong-ke-luong',
};

/** UI dùng `edit`; ma trận phân quyền dùng `update`. */
export function mapAppActionToActionType(action: AppAction): ActionType {
  if (action === 'edit') return 'update';
  return action as ActionType;
}

/**
 * Luật member (chưa hydrate matrix từ API chức vụ).
 */
function legacyCan(
  user: User,
  action: AppAction,
  resource: AppResource,
  capBac: number | null,
): boolean {
  if (action === 'view') {
    if (user.role === 'admin' || capBac === 1) return true;
    if (resource === 'profile' || resource === 'notifications') return true;
    return false;
  }
  if (resource === 'profile' && action === 'edit') return true;
  return false;
}

function matrixCan(
  user: User,
  action: AppAction,
  resource: AppResource,
  capBac: number | null,
): boolean {
  const moduleId = APP_RESOURCE_TO_MODULE[resource];
  if (moduleId === undefined) {
    return legacyCan(user, action, resource, capBac);
  }
  const need = mapAppActionToActionType(action);
  const { grantsByModule } = usePermissionGrantStore.getState();
  const allowed = grantsByModule[moduleId] ?? [];
  if (allowed.includes('all') || allowed.includes('admin')) return true;
  return allowed.includes(need);
}

/**
 * Kiểm tra quyền phía client (UX: ẩn nút). Không thay thế RLS / API.
 *
 * - `admin`: toàn quyền UI (trừ xóa profile).
 * - Khi `usePermissionGrantStore.matrixActive === false`: member dùng `legacyCan`.
 * - Khi `matrixActive === true`: đối chiếu `grantsByModule` theo `module_id` + `ActionType` (sau Supabase / chức vụ).
 */
export function can(
  user: User | null | undefined,
  action: AppAction,
  resource: AppResource
): boolean {
  if (!user) return false;

  const { matrixActive, capBac } = usePermissionGrantStore.getState();

  if (user.role === 'admin' || capBac === 1) {
    if (resource === 'profile' && action === 'delete') return false;
    return true;
  }

  if (matrixActive) {
    return matrixCan(user, action, resource, capBac);
  }

  return legacyCan(user, action, resource, capBac);
}

function isChuaDuyetStatus(value: unknown): boolean {
  if (value === 'Đã duyệt' || value === 'Không duyệt') return false;
  if (value === 'Chưa duyệt' || value === 'Chờ duyệt' || value === 'Chua duyet') return true;
  return true;
}

export function isRowLocked(row: any, configId: string, lookups?: any): boolean {
  if (configId === 'chuyen-xe') {
    return !isChuaDuyetStatus(row.trang_thai);
  }
  if (configId === 'chuyen-xe-ct') {
    if (!isChuaDuyetStatus(row.phe_duyet)) return true;
    const parentTrip = (lookups?.trips || []).find((t: any) => String(t.id) === String(row.id_chuyen_xe));
    if (parentTrip && !isChuaDuyetStatus(parentTrip.trang_thai)) return true;
  }
  if (configId === 'bang-luong') {
    return row.trang_thai === 'Đã duyệt';
  }
  return false;
}

/** cap_bac=1, role admin, hoặc quyền quan_tri/all trên module — bỏ qua khóa dòng nghiệp vụ. */
export function canBypassRowLock(
  user: User | null | undefined,
  capBac: number | null,
  configId: string,
): boolean {
  if (isCapBac1OrAdmin(user, capBac)) return true;
  const allowed = getModuleGrants(configId);
  return allowed.includes('admin') || allowed.includes('all');
}

/** Khóa nghiệp vụ có hiệu lực với user hiện tại (dùng trước toast/ẩn nút, đồng bộ canEditRow). */
export function isRowLockedForUser(
  row: any,
  configId: string,
  user: User | null | undefined,
  capBac: number | null,
  lookups?: any,
): boolean {
  if (!isRowLocked(row, configId, lookups)) return false;
  return !canBypassRowLock(user, capBac, configId);
}

export function resolveRowDepartment(row: any, configId: string, lookups?: any): string | null {
  if (configId === 'departments' || configId === 'phong-ban') {
    return String(row.id);
  }
  
  if (row.id_phong_ban) return String(row.id_phong_ban);
  
  const empList = lookups?.employees || [];
  
  let rowToResolve = row;
  if (configId === 'chuyen-xe-ct' && lookups?.trips) {
    const parentTrip = (lookups.trips || []).find((t: any) => String(t.id) === String(row.id_chuyen_xe));
    if (parentTrip) {
      rowToResolve = parentTrip;
    }
  }

  if (rowToResolve.id_tai_xe) {
    const driverEmp = empList.find((e: any) => String(e.id) === String(rowToResolve.id_tai_xe));
    if (driverEmp?.id_phong_ban) return String(driverEmp.id_phong_ban);
  }
  
  if (rowToResolve.id_nguoi_tao) {
    const creatorEmp = empList.find((e: any) => String(e.id) === String(rowToResolve.id_nguoi_tao));
    if (creatorEmp?.id_phong_ban) return String(creatorEmp.id_phong_ban);
  }
  
  return null;
}

function isRowInUserDepartment(
  row: any,
  configId: string,
  employeeRecord: any,
  lookups?: any,
): boolean {
  const userDept = employeeRecord?.id_phong_ban;
  if (!userDept) return false;
  const rowDept = resolveRowDepartment(row, configId, lookups);
  return rowDept !== null && String(rowDept) === String(userDept);
}

function isCapBac1OrAdmin(user: User | null | undefined, capBac: number | null): boolean {
  return user?.role === 'admin' || capBac === 1;
}

/** Ngoại trừ cap_bac=1/admin: mọi hành động dòng phải có ma trận `var_phan_quyen` đã hydrate. */
function requiresMatrixForRowAction(
  user: User | null | undefined,
  capBac: number | null,
): boolean {
  if (isCapBac1OrAdmin(user, capBac)) return false;
  const { matrixActive } = usePermissionGrantStore.getState();
  return !matrixActive;
}

function getModuleGrants(configId: string): ActionType[] {
  const moduleId = APP_RESOURCE_TO_MODULE[configId as AppResource] || configId;
  const { grantsByModule } = usePermissionGrantStore.getState();
  return grantsByModule[moduleId] ?? [];
}

/**
 * Phạm vi dòng theo cap_bac (sau khi đã có grant tương ứng trong ma trận).
 * cap_bac=2: cùng phòng ban; cap_bac>=3: bản ghi liên quan trực tiếp đến nhân viên đăng nhập.
 */
function rowMatchesUserScope(
  row: any,
  configId: string,
  capBac: number | null,
  employeeRecord: any,
  lookups?: any,
): boolean {
  if (capBac === 2) {
    return isRowInUserDepartment(row, configId, employeeRecord, lookups);
  }

  const empId = employeeRecord?.id;
  if (!empId) return false;

  let rowToCheck = row;
  if (configId === 'chuyen-xe-ct' && lookups?.trips) {
    const parentTrip = (lookups.trips || []).find((t: any) => String(t.id) === String(row.id_chuyen_xe));
    if (parentTrip) {
      rowToCheck = parentTrip;
    }
  }

  if (rowToCheck.id_nguoi_tao && String(rowToCheck.id_nguoi_tao) === String(empId)) {
    return true;
  }

  if (rowToCheck.id_tai_xe && String(rowToCheck.id_tai_xe) === String(empId)) {
    return true;
  }

  if (configId === 'tai-xe' || configId === 'employees' || configId === 'nhan-vien') {
    return String(row.id) === String(empId);
  }

  return false;
}

export function canEditRow(
  row: any,
  configId: string,
  user: User | null | undefined,
  capBac: number | null,
  employeeRecord: any,
  lookups?: any
): boolean {
  if (!user) return false;
  if (isCapBac1OrAdmin(user, capBac)) return true;
  if (requiresMatrixForRowAction(user, capBac)) return false;

  const allowed = getModuleGrants(configId);
  const hasAdminGrant = allowed.includes('admin') || allowed.includes('all');
  const hasUpdate = allowed.includes('update') || hasAdminGrant;
  if (!hasUpdate) return false;

  if (isRowLocked(row, configId, lookups) && !hasAdminGrant) return false;
  if (hasAdminGrant) return true;

  return rowMatchesUserScope(row, configId, capBac, employeeRecord, lookups);
}

export function canDeleteRow(
  row: any,
  configId: string,
  user: User | null | undefined,
  capBac: number | null,
  employeeRecord: any,
  lookups?: any
): boolean {
  if (!user) return false;
  if (isCapBac1OrAdmin(user, capBac)) return true;
  if (requiresMatrixForRowAction(user, capBac)) return false;

  const allowed = getModuleGrants(configId);
  const hasAdminGrant = allowed.includes('admin') || allowed.includes('all');
  const hasDelete = allowed.includes('delete') || hasAdminGrant;
  if (!hasDelete) return false;

  if (isRowLocked(row, configId, lookups) && !hasAdminGrant) return false;
  if (hasAdminGrant) return true;

  return rowMatchesUserScope(row, configId, capBac, employeeRecord, lookups);
}

export function canApproveRow(
  row: any,
  configId: string,
  user: User | null | undefined,
  capBac: number | null,
  employeeRecord?: any,
  lookups?: any,
): boolean {
  if (!user) return false;
  if (isCapBac1OrAdmin(user, capBac)) return true;
  if (requiresMatrixForRowAction(user, capBac)) return false;

  const allowed = getModuleGrants(configId);
  if (allowed.includes('admin') || allowed.includes('all')) return true;
  if (!allowed.includes('check')) return false;

  return rowMatchesUserScope(row, configId, capBac, employeeRecord, lookups);
}

export function canAddChildRow(
  parentRow: any,
  childConfigId: string,
  user: User | null | undefined,
  capBac: number | null,
  employeeRecord: any,
  lookups?: any
): boolean {
  if (!user) return false;
  if (isCapBac1OrAdmin(user, capBac)) return true;
  if (requiresMatrixForRowAction(user, capBac)) return false;

  const allowed = getModuleGrants(childConfigId);
  const hasCreate = allowed.includes('create') || allowed.includes('admin') || allowed.includes('all');
  if (!hasCreate) return false;
  
  // Kiểm tra xem dòng cha có sửa được không
  const parentConfigId = childConfigId === 'chuyen-xe-ct' ? 'chuyen-xe' : '';
  if (!parentConfigId) return true;
  
  return canEditRow(parentRow, parentConfigId, user, capBac, employeeRecord, lookups);
}

export function filterRowsByPermissions(
  rows: any[],
  config: { id: string },
  user: User | null | undefined,
  capBac: number | null,
  employeeRecord: any,
  lookups?: any
): any[] {
  if (!user) return [];
  if (isCapBac1OrAdmin(user, capBac)) return rows;

  const { matrixActive, grantsByModule } = usePermissionGrantStore.getState();
  if (!matrixActive) return [];

  const moduleId = APP_RESOURCE_TO_MODULE[config.id as AppResource] || config.id;
  const allowed = grantsByModule[moduleId] ?? [];

  // Chức vụ có quyền quan_tri hoặc kiểm tra được xem hết
  if (allowed.includes('admin') || allowed.includes('all') || allowed.includes('check')) {
    return rows;
  }

  // Không có quyền xem trong ma trận thì không xem được gì
  if (!allowed.includes('view')) {
    return [];
  }
  
  // Danh mục dùng chung (Master Data): Cho phép xem toàn bộ nếu có quyền view, không lọc theo phòng ban/người tạo
  if (
    config.id === 'dia-diem' ||
    config.id === 'danh-sach-xe' ||
    config.id === 'tai-xe' ||
    config.id === 'departments' ||
    config.id === 'phong-ban' ||
    config.id === 'positions' ||
    config.id === 'chuc-vu' ||
    config.id === 'permissions' ||
    config.id === 'phan-quyen'
  ) {
    return rows;
  }
  
  // Cấp bậc 2 (Trưởng phòng) -> Thấy dòng trong cùng phòng ban
  if (capBac === 2) {
    const userDept = employeeRecord?.id_phong_ban;
    if (!userDept) return [];
    return rows.filter((row) => {
      const rowDept = resolveRowDepartment(row, config.id, lookups);
      return rowDept !== null && String(rowDept) === String(userDept);
    });
  }
  
  // Nhân viên / Tài xế -> Chỉ thấy dòng mình tạo, được phân công tài xế, hoặc bản ghi chính mình
  const empId = employeeRecord?.id;
  if (!empId) return [];
  
  return rows.filter((row) => {
    let rowToCheck = row;
    if (config.id === 'chuyen-xe-ct' && lookups?.trips) {
      const parentTrip = (lookups.trips || []).find((t: any) => String(t.id) === String(row.id_chuyen_xe));
      if (parentTrip) {
        rowToCheck = parentTrip;
      }
    }

    if (rowToCheck.id_nguoi_tao && String(rowToCheck.id_nguoi_tao) === String(empId)) {
      return true;
    }
    if (rowToCheck.id_tai_xe && String(rowToCheck.id_tai_xe) === String(empId)) {
      return true;
    }
    if (config.id === 'tai-xe' || config.id === 'employees' || config.id === 'nhan-vien') {
      if (String(row.id) === String(empId)) {
        return true;
      }
    }
    return false;
  });
}

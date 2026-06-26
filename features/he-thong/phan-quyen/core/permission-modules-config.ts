/**
 * Cấu hình module phân quyền — chỉ các trang Hệ thống còn trong app.
 */

export interface PermissionModuleItem {
  id: string;
  nameKey: string;
}

export interface PermissionModuleGroup {
  groupTitleKey: string;
  modules: PermissionModuleItem[];
}

export interface PermissionFunction {
  id: string;
  nameKey: string;
  color: string;
  groups: PermissionModuleGroup[];
}

export const PERMISSION_ACTIONS = ['view', 'create', 'update', 'delete', 'check', 'admin', 'all'] as const;
export type PermissionActionType = (typeof PERMISSION_ACTIONS)[number];

/** Chỉ nhóm Hệ thống — khớp dashboard và route thực tế */
export const PERMISSION_FUNCTIONS: PermissionFunction[] = [
  {
    id: 'he-thong',
    nameKey: 'nav.system',
    color: 'slate',
    groups: [
      {
        groupTitleKey: 'permission.matrix.systemGroup',
        modules: [
          { id: 'nhan-vien', nameKey: 'permission.module.employeeList' },
          { id: 'phong-ban', nameKey: 'permission.module.departmentChart' },
          { id: 'chuc-vu', nameKey: 'permission.module.positionRole' },
          { id: 'thong-tin-cong-ty', nameKey: 'permission.module.companyInfo' },
          { id: 'phan-quyen', nameKey: 'permission.module.permission' },
        ],
      },
    ],
  },
  {
    id: 'quan-ly-van-tai',
    nameKey: 'nav.transport',
    color: 'cyan',
    groups: [
      {
        groupTitleKey: 'Kế hoạch',
        modules: [
          { id: 'chuyen-xe', nameKey: 'breadcrumb.trip' },
          { id: 'bang-luong', nameKey: 'breadcrumb.payroll' },
          { id: 'thong-ke-chuyen-di', nameKey: 'breadcrumb.tripStats' },
          { id: 'thong-ke-luong', nameKey: 'breadcrumb.payrollStats' },
        ],
      },
      {
        groupTitleKey: 'Thiết lập',
        modules: [
          { id: 'tai-xe', nameKey: 'breadcrumb.driver' },
          { id: 'dia-diem', nameKey: 'breadcrumb.location' },
          { id: 'danh-sach-xe', nameKey: 'breadcrumb.vehicle' },
        ],
      },
    ],
  },
];

export function getAllPermissionModules(): { id: string; nameKey: string }[] {
  const list: { id: string; nameKey: string }[] = [];
  PERMISSION_FUNCTIONS.forEach((fn) => {
    fn.groups.forEach((gr) => {
      gr.modules.forEach((m) => list.push({ id: m.id, nameKey: m.nameKey }));
    });
  });
  return list;
}

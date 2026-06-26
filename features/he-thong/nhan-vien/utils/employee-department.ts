import type { Department } from '../../phong-ban/core/types';

export type EmployeeDepartmentLabels = {
  ten_phong_ban?: string;
  ten_bo_phan?: string;
};

export function resolveEmployeeDepartmentLabels(
  departmentId: string | number | null | undefined,
  departments: Department[],
  fallbackDepartmentName?: string,
): EmployeeDepartmentLabels {
  if (departmentId == null || departmentId === '') {
    return fallbackDepartmentName ? { ten_phong_ban: fallbackDepartmentName } : {};
  }

  const id = String(departmentId);
  const department = departments.find((item) => String(item.id) === id);
  if (!department) {
    return fallbackDepartmentName ? { ten_phong_ban: fallbackDepartmentName } : {};
  }

  if (!department.cha_id) {
    return { ten_phong_ban: department.ten_phong_ban };
  }

  const parent = departments.find((item) => String(item.id) === String(department.cha_id));
  return {
    ten_phong_ban: parent?.ten_phong_ban ?? department.ten_phong_ban,
    ten_bo_phan: department.ten_phong_ban,
  };
}

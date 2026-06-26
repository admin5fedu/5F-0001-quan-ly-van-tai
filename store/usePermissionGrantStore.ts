import { create } from 'zustand';
import type { ActionType } from '@/features/he-thong/phan-quyen/core/types';

/**
 * Quyền theo module (khớp `module_id` trong Phân quyền, ví dụ `he-thong/nhan-vien`).
 * Khi `matrixActive === false`, `can()` dùng luật legacy (admin/member).
 * Khi `matrixActive === true`, `can()` đối chiếu `grantsByModule` — hydrate sau khi gọi API theo `id_chuc_vu` (Supabase).
 */
export interface PermissionGrantState {
  matrixActive: boolean;
  grantsByModule: Record<string, ActionType[]>;
  capBac: number | null;
  employeeRecord: any | null;
  /** Bật matrix + gán quyền (gọi từ service sau khi load chức vụ / phân quyền). */
  setMatrixGrants: (grants: Record<string, ActionType[]>, capBac?: number | null, employeeRecord?: any | null) => void;
  /** Đăng xuất hoặc trước khi đăng nhập lại — tắt matrix, xóa grants. */
  clearMatrix: () => void;
}

export const usePermissionGrantStore = create<PermissionGrantState>((set) => ({
  matrixActive: false,
  grantsByModule: {},
  capBac: null,
  employeeRecord: null,
  setMatrixGrants: (grants, capBac = null, employeeRecord = null) =>
    set({ matrixActive: true, grantsByModule: grants, capBac, employeeRecord }),
  clearMatrix: () => set({ matrixActive: false, grantsByModule: {}, capBac: null, employeeRecord: null }),
}));

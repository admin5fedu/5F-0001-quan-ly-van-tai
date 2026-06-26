import { describe, expect, it, beforeEach } from 'vitest';
import {
  can,
  canApproveRow,
  canBypassRowLock,
  canEditRow,
  canDeleteRow,
  filterRowsByPermissions,
  isRowLockedForUser,
} from '../permissions';
import type { User } from '@/types';
import { usePermissionGrantStore } from '@/store/usePermissionGrantStore';

const admin: User = {
  id: '1',
  email: 'a@test.com',
  role: 'admin',
  created_at: '',
};

const member: User = {
  id: '2',
  email: 'u@test.com',
  role: 'user',
  created_at: '',
};

beforeEach(() => {
  usePermissionGrantStore.getState().clearMatrix();
});

describe('can', () => {
  it('returns false when user is null', () => {
    expect(can(null, 'view', 'employees')).toBe(false);
  });

  it('admin can delete employees', () => {
    expect(can(admin, 'delete', 'employees')).toBe(true);
  });

  it('member without matrix can view profile but not employees module (legacy)', () => {
    expect(can(member, 'view', 'profile')).toBe(true);
    expect(can(member, 'view', 'employees')).toBe(false);
    expect(can(member, 'delete', 'employees')).toBe(false);
  });

  it('member can edit profile', () => {
    expect(can(member, 'edit', 'profile')).toBe(true);
  });

  it('matrix: member with only view on nhan-vien cannot delete', () => {
    usePermissionGrantStore.getState().setMatrixGrants({
      'nhan-vien': ['view'],
    });
    expect(can(member, 'view', 'employees')).toBe(true);
    expect(can(member, 'edit', 'employees')).toBe(false);
    expect(can(member, 'delete', 'employees')).toBe(false);
  });

  it('matrix: member with update on nhan-vien can edit', () => {
    usePermissionGrantStore.getState().setMatrixGrants({
      'nhan-vien': ['view', 'update'],
    });
    expect(can(member, 'edit', 'employees')).toBe(true);
  });

  it('matrix: all grants full actions on module', () => {
    usePermissionGrantStore.getState().setMatrixGrants({
      'nhan-vien': ['all'],
    });
    expect(can(member, 'delete', 'employees')).toBe(true);
  });

  it('matrix: capBac=1 user gets full permissions', () => {
    usePermissionGrantStore.getState().setMatrixGrants({}, 1);
    expect(can(member, 'delete', 'employees')).toBe(true);
    expect(can(member, 'create', 'employees')).toBe(true);
  });
});

describe('filterRowsByPermissions', () => {
  const rows = [
    { id: 10, id_phong_ban: 'dept-a', id_nguoi_tao: '2' },
    { id: 20, id_phong_ban: 'dept-b', id_nguoi_tao: '3' },
  ];

  it('returns all rows for admin or capBac=1', () => {
    expect(filterRowsByPermissions(rows, { id: 'employees' }, admin, null, null)).toEqual(rows);
    usePermissionGrantStore.getState().setMatrixGrants({}, 1);
    expect(filterRowsByPermissions(rows, { id: 'employees' }, member, 1, null)).toEqual(rows);
  });

  it('returns empty array if matrix is active and no view grant is present', () => {
    usePermissionGrantStore.getState().setMatrixGrants({ 'nhan-vien': [] }, 3);
    expect(filterRowsByPermissions(rows, { id: 'employees' }, member, 3, { id: '2' })).toEqual([]);
  });

  it('returns all rows for check (kiem_tra) or admin (quan_tri) grant regardless of capBac=2/3', () => {
    usePermissionGrantStore.getState().setMatrixGrants({ 'nhan-vien': ['check'] }, 3);
    expect(filterRowsByPermissions(rows, { id: 'employees' }, member, 3, { id: '2' })).toEqual(rows);

    usePermissionGrantStore.getState().setMatrixGrants({ 'nhan-vien': ['admin'] }, 3);
    expect(filterRowsByPermissions(rows, { id: 'employees' }, member, 3, { id: '2' })).toEqual(rows);
  });

  it('filters by department for capBac=2 with view grant', () => {
    usePermissionGrantStore.getState().setMatrixGrants({ 'nhan-vien': ['view'] }, 2);
    expect(
      filterRowsByPermissions(rows, { id: 'employees' }, member, 2, { id: '2', id_phong_ban: 'dept-a' })
    ).toEqual([rows[0]]);
  });

  it('filters by own records for capBac=3 with view grant', () => {
    usePermissionGrantStore.getState().setMatrixGrants({ 'nhan-vien': ['view'] }, 3);
    expect(
      filterRowsByPermissions(rows, { id: 'employees' }, member, 3, { id: '2' })
    ).toEqual([rows[0]]);
  });
});

describe('cap_bac scoped row actions (matrix required except cap_bac=1)', () => {
  const tripInDeptA = {
    id: 'trip-1',
    id_tai_xe: 'tx-9',
    id_nguoi_tao: '99',
    trang_thai: 'Chưa duyệt',
  };

  const manager = { id: 'mgr-1', id_phong_ban: 'dept-a' };
  const lookups = {
    employees: [{ id: 'tx-9', id_phong_ban: 'dept-a' }],
    trips: [tripInDeptA],
  };

  it('capBac=2 without hydrated matrix cannot edit or approve', () => {
    usePermissionGrantStore.getState().clearMatrix();
    expect(canEditRow(tripInDeptA, 'chuyen-xe', member, 2, manager, lookups)).toBe(false);
    expect(canApproveRow(tripInDeptA, 'chuyen-xe', member, 2, manager, lookups)).toBe(false);
  });

  it('capBac=2 with matrix update can edit trip in same department', () => {
    usePermissionGrantStore.getState().setMatrixGrants({ 'chuyen-xe': ['view', 'update'] }, 2);
    expect(canEditRow(tripInDeptA, 'chuyen-xe', member, 2, manager, lookups)).toBe(true);
  });

  it('capBac=2 with only update cannot approve — needs kiem_tra (check) in matrix', () => {
    usePermissionGrantStore.getState().setMatrixGrants({ 'chuyen-xe': ['view', 'update'] }, 2);
    expect(canApproveRow(tripInDeptA, 'chuyen-xe', member, 2, manager, lookups)).toBe(false);
  });

  it('capBac=2 with check can approve trip in same department', () => {
    usePermissionGrantStore.getState().setMatrixGrants({ 'chuyen-xe': ['view', 'check'] }, 2);
    expect(canApproveRow(tripInDeptA, 'chuyen-xe', member, 2, manager, lookups)).toBe(true);
  });

  it('capBac=2 with check cannot approve trip outside department', () => {
    usePermissionGrantStore.getState().setMatrixGrants({ 'chuyen-xe': ['view', 'check'] }, 2);
    const otherManager = { id: 'mgr-2', id_phong_ban: 'dept-b' };
    expect(canApproveRow(tripInDeptA, 'chuyen-xe', member, 2, otherManager, lookups)).toBe(false);
  });

  it('capBac=2 with quan_tri (admin grant) can approve any trip', () => {
    usePermissionGrantStore.getState().setMatrixGrants({ 'chuyen-xe': ['admin'] }, 2);
    const otherManager = { id: 'mgr-2', id_phong_ban: 'dept-b' };
    expect(canApproveRow(tripInDeptA, 'chuyen-xe', member, 2, otherManager, lookups)).toBe(true);
  });

  it('capBac=2 with quan_tri can edit locked (Đã duyệt) trip', () => {
    const approvedTrip = { ...tripInDeptA, trang_thai: 'Đã duyệt' };
    usePermissionGrantStore.getState().setMatrixGrants({ 'chuyen-xe': ['admin'] }, 2);
    expect(canEditRow(approvedTrip, 'chuyen-xe', member, 2, manager, lookups)).toBe(true);
  });

  it('capBac=2 with only update cannot edit locked trip', () => {
    const approvedTrip = { ...tripInDeptA, trang_thai: 'Đã duyệt' };
    usePermissionGrantStore.getState().setMatrixGrants({ 'chuyen-xe': ['view', 'update'] }, 2);
    expect(canEditRow(approvedTrip, 'chuyen-xe', member, 2, manager, lookups)).toBe(false);
  });
});

describe('row lock bypass (quan_tri / admin)', () => {
  const approvedTrip = { id: 't1', trang_thai: 'Đã duyệt' };

  it('admin role bypasses chuyen-xe lock', () => {
    expect(canBypassRowLock(admin, null, 'chuyen-xe')).toBe(true);
    expect(isRowLockedForUser(approvedTrip, 'chuyen-xe', admin, null)).toBe(false);
    expect(canEditRow(approvedTrip, 'chuyen-xe', admin, null, null)).toBe(true);
    expect(canDeleteRow(approvedTrip, 'chuyen-xe', admin, null, null)).toBe(true);
  });

  it('member with quan_tri grant bypasses lock', () => {
    usePermissionGrantStore.getState().setMatrixGrants({ 'chuyen-xe': ['admin'] }, 3);
    expect(canBypassRowLock(member, 3, 'chuyen-xe')).toBe(true);
    expect(isRowLockedForUser(approvedTrip, 'chuyen-xe', member, 3)).toBe(false);
  });

  it('member with only update stays locked on approved trip', () => {
    usePermissionGrantStore.getState().setMatrixGrants({ 'chuyen-xe': ['view', 'update'] }, 3);
    expect(isRowLockedForUser(approvedTrip, 'chuyen-xe', member, 3)).toBe(true);
  });
});

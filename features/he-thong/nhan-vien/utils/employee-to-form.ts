import type { Employee } from '../core/types';
import type { EmployeeFormValues } from '../core/schema';

export function getDefaultEmployeeFormValues(): EmployeeFormValues {
  return {
    ho_va_ten: '',
    avatar: '',
    trang_thai: 'Đang làm việc',
    id_phong_ban: '',
    id_chuc_vu: '',
    so_dien_thoai: '',
    email: '',
    ten_dang_nhap: '',
    mat_khau: '123456',
    la_tai_xe: false,
    ngay_sinh: '',
    dia_chi: '',
    so_gplx: '',
    hang_bang: '',
    ngay_het_han_bang: '',
    id_xe_mac_dinh: '',
    thong_tin_khac: '',
    ghi_chu: '',
    luong_co_ban: 0,
  };
}

export function employeeToFormValues(emp: Employee): EmployeeFormValues {
  return {
    ho_va_ten: emp.ho_va_ten,
    avatar: emp.avatar ?? '',
    trang_thai: emp.trang_thai,
    id_phong_ban: emp.id_phong_ban ?? '',
    id_chuc_vu: emp.id_chuc_vu ?? '',
    so_dien_thoai: emp.so_dien_thoai ?? '',
    email: emp.email ?? '',
    ten_dang_nhap: emp.ten_dang_nhap ?? '',
    mat_khau: '',
    la_tai_xe: emp.la_tai_xe ?? false,
    ngay_sinh: emp.ngay_sinh ?? '',
    dia_chi: emp.dia_chi ?? '',
    so_gplx: emp.so_gplx ?? '',
    hang_bang: emp.hang_bang ?? '',
    ngay_het_han_bang: emp.ngay_het_han_bang ?? '',
    id_xe_mac_dinh: emp.id_xe_mac_dinh ? String(emp.id_xe_mac_dinh) : '',
    thong_tin_khac: emp.thong_tin_khac ?? '',
    ghi_chu: emp.ghi_chu ?? '',
    luong_co_ban: emp.luong_co_ban ?? 0,
  };
}

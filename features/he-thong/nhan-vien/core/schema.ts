import { z } from 'zod';
import { txt } from '../../../../lib/text';
import { TRANG_THAI_NHAN_VIEN } from './constants';
import { optionalEmailSchema } from '@/lib/validation/email';
import { optionalPhoneVnSchema } from '@/lib/validation/phone-vn';

const usernameSchema = z
  .string()
  .trim()
  .min(2, { message: 'Tên đăng nhập tối thiểu 2 ký tự' })
  .regex(/^[a-zA-Z0-9._-]+$/, {
    message: 'Tên đăng nhập chỉ gồm chữ, số, dấu chấm, gạch dưới hoặc gạch ngang',
  })
  .optional()
  .or(z.literal(''));

export const employeeSchema = z.object({
  ho_va_ten: z.string().trim().min(2, { message: txt('employee.validation.nameMin') }),
  avatar: z.string().optional().nullable(),
  trang_thai: z.enum(TRANG_THAI_NHAN_VIEN),
  id_phong_ban: z
    .string()
    .trim()
    .min(1, { message: 'Vui lòng chọn phòng ban / bộ phận' }),
  id_chuc_vu: z
    .string()
    .trim()
    .min(1, { message: 'Vui lòng chọn chức vụ' }),
  so_dien_thoai: optionalPhoneVnSchema(),
  email: optionalEmailSchema().nullable(),
  ten_dang_nhap: usernameSchema,
  mat_khau: z.string().trim().min(6, { message: 'Mật khẩu tối thiểu 6 ký tự' }).optional().or(z.literal('')),
  la_tai_xe: z.boolean().default(false),
  ngay_sinh: z.string().optional().nullable(),
  dia_chi: z.string().optional().nullable(),
  so_gplx: z.string().optional().nullable(),
  hang_bang: z.string().optional().nullable(),
  ngay_het_han_bang: z.string().optional().nullable(),
  id_xe_mac_dinh: z.union([z.string(), z.number()]).optional().nullable(),
  thong_tin_khac: z.string().optional().nullable(),
  ghi_chu: z.string().optional().nullable(),
  luong_co_ban: z.number().min(0, { message: 'Lương cơ bản không được âm' }).optional().nullable().or(z.string().transform(v => v === '' ? 0 : Number(v)).optional().nullable()),
});

export type EmployeeFormValues = z.infer<typeof employeeSchema>;

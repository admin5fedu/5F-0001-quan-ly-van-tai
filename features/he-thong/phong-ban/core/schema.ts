import { z } from "zod";
import { txt } from '../../../../lib/text';
import { TRANG_THAI_HOAT_DONG } from '@/lib/constants/trang-thai';
import { codeFieldSchema } from '@/lib/validation/code-field';

export const departmentSchema = z.object({
  ma_phong_ban: codeFieldSchema(),
  ten_phong_ban: z.string()
    .min(3, txt('department.validation.nameMin'))
    .max(255, txt('department.validation.nameMax')),
  mo_ta: z.string().optional(),
  cha_id: z.string().optional().nullable(),
  trang_thai: z.enum(TRANG_THAI_HOAT_DONG, {
    message: txt('department.validation.statusInvalid'),
  }),
  thu_tu: z.coerce.number().min(0, txt('department.validation.sortOrderMin')),
});

export type DepartmentFormValues = z.infer<typeof departmentSchema>;
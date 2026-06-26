import type { Branch } from '../core/types';
import { MOCK_BRANCHES as MOCK_BRANCHES_RAW } from '@/mocks';

export async function getBranches(): Promise<Branch[]> {
  return MOCK_BRANCHES_RAW.map((row) => ({
    id: row.id,
    ma_chi_nhanh: row.ma_chi_nhanh,
    ten_chi_nhanh: row.ten_chi_nhanh,
    dia_chi: row.dia_chi ?? null,
    trang_thai: row.trang_thai as Branch['trang_thai'],
    tg_tao: row.tg_tao,
    tg_cap_nhat: row.tg_cap_nhat,
  }));
}

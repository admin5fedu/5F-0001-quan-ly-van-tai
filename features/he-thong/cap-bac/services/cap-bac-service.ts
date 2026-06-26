import type { JobLevel } from '../core/types';
import { MOCK_JOB_LEVELS as MOCK_JOB_LEVELS_RAW } from '@/mocks';

export async function getJobLevels(): Promise<JobLevel[]> {
  return MOCK_JOB_LEVELS_RAW.map((row, index) => ({
    id: row.id,
    ma_cap_bac: row.ma_cap_bac,
    ten_cap_bac: row.ten_cap_bac,
    mo_ta: row.mo_ta ?? null,
    thu_tu: index + 1,
    trang_thai: row.trang_thai as JobLevel['trang_thai'],
    tg_tao: row.tg_tao,
    tg_cap_nhat: row.tg_cap_nhat,
  }));
}

import type { Position } from '@/features/he-thong/chuc-vu/core/types';

const ts = () => new Date().toISOString();

type MockPositionInput = Omit<Position, 'cap_bac'> & { cap_bac?: number | null };

function normalizeMockPosition(row: MockPositionInput): Position {
  return { ...row, cap_bac: row.cap_bac ?? null };
}

const MOCK_POSITIONS_RAW: MockPositionInput[] = [
  { id: 'pos-1', ma_chuc_vu: 'CEO', ten_chuc_vu: 'Tổng Giám Đốc', cap_bac: 1, phong_ban_id: 'dep-0', ten_phong_ban: 'Phòng Ban Giám đốc', mo_ta: 'Điều hành toàn bộ hoạt động công ty', thu_tu: 1, trang_thai: 'Đang hoạt động', tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'pos-2', ma_chuc_vu: 'PCEO', ten_chuc_vu: 'Phó Tổng Giám Đốc', cap_bac: 3, phong_ban_id: 'dep-0', ten_phong_ban: 'Phòng Ban Giám đốc', mo_ta: 'Hỗ trợ Tổng Giám đốc điều hành', thu_tu: 2, trang_thai: 'Đang hoạt động', tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'pos-3', ma_chuc_vu: 'GD-DH', ten_chuc_vu: 'Trưởng Nhóm Điều hành', cap_bac: 2, phong_ban_id: 'dep-0-1', ten_phong_ban: 'Nhóm điều hành', mo_ta: 'Điều phối công việc điều hành', thu_tu: 3, trang_thai: 'Đang hoạt động', tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'pos-4', ma_chuc_vu: 'GD-TL', ten_chuc_vu: 'Trưởng Nhóm Trợ lý', cap_bac: 2, phong_ban_id: 'dep-0-2', ten_phong_ban: 'Nhóm trợ lý', mo_ta: 'Quản lý đội trợ lý Giám đốc', thu_tu: 4, trang_thai: 'Đang hoạt động', tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'pos-5', ma_chuc_vu: 'TL-GD', ten_chuc_vu: 'Trợ lý Giám đốc', cap_bac: 4, phong_ban_id: 'dep-0-2', ten_phong_ban: 'Nhóm trợ lý', mo_ta: 'Hỗ trợ hành chính, lịch làm việc', thu_tu: 5, trang_thai: 'Đang hoạt động', tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'pos-6', ma_chuc_vu: 'NV-DH', ten_chuc_vu: 'Chuyên viên Điều hành', cap_bac: 4, phong_ban_id: 'dep-0-1', ten_phong_ban: 'Nhóm điều hành', mo_ta: 'Theo dõi tiến độ, báo cáo', thu_tu: 6, trang_thai: 'Đang hoạt động', tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'pos-10', ma_chuc_vu: 'TP-KT', ten_chuc_vu: 'Trưởng Phòng Kỹ thuật', cap_bac: 2, phong_ban_id: 'dep-1', ten_phong_ban: 'Phòng Kỹ thuật', mo_ta: 'Quản lý toàn bộ mảng kỹ thuật', thu_tu: 10, trang_thai: 'Đang hoạt động', tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'pos-20', ma_chuc_vu: 'TP-NS', ten_chuc_vu: 'Trưởng Phòng Nhân sự', cap_bac: 2, phong_ban_id: 'dep-2', ten_phong_ban: 'Phòng Nhân sự', mo_ta: 'Quản lý tuyển dụng, đào tạo', thu_tu: 20, trang_thai: 'Đang hoạt động', tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'pos-30', ma_chuc_vu: 'TP-TC', ten_chuc_vu: 'Trưởng Phòng Tài chính', cap_bac: 2, phong_ban_id: 'dep-3', ten_phong_ban: 'Phòng Tài chính - Kế toán', mo_ta: 'Quản lý tài chính, kế toán', thu_tu: 30, trang_thai: 'Đang hoạt động', tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'pos-40', ma_chuc_vu: 'TP-KD', ten_chuc_vu: 'Trưởng Phòng Kinh doanh', cap_bac: 2, phong_ban_id: 'dep-4', ten_phong_ban: 'Phòng Kinh doanh', mo_ta: 'Chỉ đạo hoạt động kinh doanh', thu_tu: 40, trang_thai: 'Đang hoạt động', tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'pos-50', ma_chuc_vu: 'TP-KHO', ten_chuc_vu: 'Trưởng Phòng Kho vận', cap_bac: 2, phong_ban_id: 'dep-5', ten_phong_ban: 'Phòng Kho vận', mo_ta: 'Quản lý kho, xuất nhập, vận tải', thu_tu: 50, trang_thai: 'Đang hoạt động', tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'pos-60', ma_chuc_vu: 'TP-MKT', ten_chuc_vu: 'Trưởng Phòng Marketing', cap_bac: 2, phong_ban_id: 'dep-6', ten_phong_ban: 'Phòng Marketing', mo_ta: 'Chiến lược marketing', thu_tu: 60, trang_thai: 'Đang hoạt động', tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'pos-70', ma_chuc_vu: 'TP-HC', ten_chuc_vu: 'Trưởng Phòng Hành chính', cap_bac: 2, phong_ban_id: 'dep-7', ten_phong_ban: 'Phòng Hành chính', mo_ta: 'Quản lý hành chính, văn phòng', thu_tu: 70, trang_thai: 'Đang hoạt động', tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'pos-96', ma_chuc_vu: 'TT-DRIVER', ten_chuc_vu: 'Tài xế', cap_bac: 4, phong_ban_id: 'dep-5', ten_phong_ban: 'Phòng Kho vận', mo_ta: 'Vận chuyển hàng hóa', thu_tu: 96, trang_thai: 'Đang hoạt động', tg_tao: ts(), tg_cap_nhat: ts() },
];

export const MOCK_POSITIONS: Position[] = MOCK_POSITIONS_RAW.map(normalizeMockPosition);

export function findMockPositionById(id: string): Position | undefined {
  return MOCK_POSITIONS.find((p) => p.id === id);
}

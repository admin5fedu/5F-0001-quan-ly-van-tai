import type { BadgeConfig } from '@/components/ui/EnumBadge';

/**
 * Badge trạng thái duyệt — bám EnumBadge COLOR_CLASSES của template @ 47947e6
 * (amber / emerald / rose, không override hex).
 */
export const APPROVAL_STATUS_BADGE_CONFIG: BadgeConfig<string> = {
  'Chưa duyệt': { label: 'Chưa duyệt', color: 'amber' },
  'Chờ duyệt': { label: 'Chưa duyệt', color: 'amber' },
  'Đã duyệt': { label: 'Đã duyệt', color: 'emerald' },
  'Không duyệt': { label: 'Không duyệt', color: 'rose' },
  'Chua duyet': { label: 'Chưa duyệt', color: 'amber' },
  'Da duyet': { label: 'Đã duyệt', color: 'emerald' },
  'Khong duyet': { label: 'Không duyệt', color: 'rose' },
};

/** Trạng thái thực hiện chi tiết chuyến — tách khỏi duyệt. */
export const EXECUTION_STATUS_BADGE_CONFIG: BadgeConfig<string> = {
  'Chưa thực hiện': { label: 'Chưa thực hiện', color: 'slate' },
  'Đang thực hiện': { label: 'Đang thực hiện', color: 'amber' },
  'Đã thực hiện': { label: 'Đã thực hiện', color: 'emerald' },
  'Hủy': { label: 'Hủy', color: 'rose' },
  'Không thực hiện': { label: 'Hủy', color: 'rose' },
  'Chua thuc hien': { label: 'Chưa thực hiện', color: 'slate' },
  'Da thuc hien': { label: 'Đã thực hiện', color: 'emerald' },
};

/** Trạng thái hoạt động master data — giống phong-ban template (primary / slate). */
export const HOAT_DONG_STATUS_BADGE_CONFIG: BadgeConfig<string> = {
  'Đang hoạt động': { label: 'Đang hoạt động', color: 'primary' },
  'Ngừng hoạt động': { label: 'Ngừng hoạt động', color: 'slate' },
  'Dang hoat dong': { label: 'Đang hoạt động', color: 'primary' },
  'Ngung hoat dong': { label: 'Ngừng hoạt động', color: 'slate' },
};
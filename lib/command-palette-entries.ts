/**
 * Các mục điều hướng nhanh cho Command Palette (Cmd/Ctrl+K).
 * `nameKey` tra qua `txt()` — giữ đồng bộ với nhãn sidebar / dashboard.
 */
export interface CommandPaletteEntry {
  path: string;
  nameKey: string;
  /** Key nhóm (hiển thị section trong palette) — `nav.commandPalette.group*` */
  groupKey: string;
}

export const COMMAND_PALETTE_ENTRIES: readonly CommandPaletteEntry[] = [
  { path: '/', nameKey: 'nav.home', groupKey: 'nav.commandPalette.groupGeneral' },
  { path: '/thong-tin-ban-quyen', nameKey: 'nav.licenseInfo', groupKey: 'nav.commandPalette.groupGeneral' },
  { path: '/he-thong', nameKey: 'nav.system', groupKey: 'nav.commandPalette.groupSystem' },
  { path: '/he-thong/nhan-vien', nameKey: 'page.systemDashboard.employee', groupKey: 'nav.commandPalette.groupSystem' },
  { path: '/he-thong/phong-ban', nameKey: 'page.systemDashboard.department', groupKey: 'nav.commandPalette.groupSystem' },
  { path: '/he-thong/chuc-vu', nameKey: 'page.systemDashboard.position', groupKey: 'nav.commandPalette.groupSystem' },
  { path: '/he-thong/thong-tin-cong-ty', nameKey: 'page.systemDashboard.companyInfo', groupKey: 'nav.commandPalette.groupSystem' },
  { path: '/he-thong/phan-quyen', nameKey: 'page.systemDashboard.permission', groupKey: 'nav.commandPalette.groupSystem' },
  { path: '/quan-ly-van-tai', nameKey: 'nav.transport', groupKey: 'nav.transport' },
  { path: '/quan-ly-van-tai/chuyen-xe', nameKey: 'breadcrumb.trip', groupKey: 'nav.transport' },
  { path: '/quan-ly-van-tai/bang-luong', nameKey: 'breadcrumb.payroll', groupKey: 'nav.transport' },
  { path: '/quan-ly-van-tai/thong-ke-chuyen-di', nameKey: 'breadcrumb.tripStats', groupKey: 'nav.transport' },
  { path: '/quan-ly-van-tai/thong-ke-luong', nameKey: 'breadcrumb.payrollStats', groupKey: 'nav.transport' },
  { path: '/quan-ly-van-tai/dia-diem', nameKey: 'breadcrumb.location', groupKey: 'nav.transport' },
  { path: '/quan-ly-van-tai/danh-sach-xe', nameKey: 'breadcrumb.vehicle', groupKey: 'nav.transport' },
  { path: '/quan-ly-van-tai/tai-xe', nameKey: 'breadcrumb.driver', groupKey: 'nav.transport' },
  { path: '/ho-so', nameKey: 'nav.profile', groupKey: 'nav.commandPalette.groupAccount' },
  { path: '/thong-bao', nameKey: 'nav.notification', groupKey: 'nav.commandPalette.groupAccount' },
] as const;

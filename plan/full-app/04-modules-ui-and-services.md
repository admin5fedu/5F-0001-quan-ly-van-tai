# 04 Modules UI And Services

Status: partial
Last updated: 2026-05-30

## Goal

Build/adapt modules, routes, views, handlers, and services for full app scope.

## Scope

Allowed:

- Adapt existing system modules.
- Add logistics/transport modules from spec examples if absent.
- Ensure list/card/detail/form patterns.
- Search direct and linked fields.
- Notification demo behavior.

Not allowed:

- Dead buttons.
- Silent placeholder success.
- Broad template deletion without report.

## Acceptance Criteria

- Routes exist for mapped modules.
- Desktop list view and mobile card view patterns are preserved.
- Flow returns to previous logical location.
- Tabs persist via `?tab=`.

## Verification Contract

- Build/typecheck.
- Browser smoke desktop/mobile.

## Evidence

- Added Quản lý vận tải dashboard and routes:
  - `/quan-ly-van-tai`
  - `/quan-ly-van-tai/chuyen-xe?tab=danh-sach`
  - `/quan-ly-van-tai/chuyen-xe?tab=danh-sach-ct`
  - `/quan-ly-van-tai/bang-luong`
  - `/quan-ly-van-tai/thong-ke-chuyen-di`
  - `/quan-ly-van-tai/thong-ke-luong`
  - `/quan-ly-van-tai/tai-xe`
  - `/quan-ly-van-tai/dia-diem`
  - `/quan-ly-van-tai/danh-sach-xe`
- Added shared transport config/service/page components for CRUD, search, detail drawer, edit form, delete confirm, status badges, CSV export, mobile cards, and report filters.
- Added transport modules to sidebar, command palette, breadcrumbs, and permission module config.
- Fixed tab switching state by remounting `TransportModulePage` with `key={config.id}`.
- Fixed mobile toolbar add button accessibility with `aria-label` and `title`.
- Hardened confirm dialog stacking above its backdrop.
- `npx playwright test output/playwright/transport-flow.spec.ts --reporter=list --timeout=90000` passed: 2 tests, desktop and mobile.

## Iteration Log

- 2026-05-30: Created.
- 2026-05-30: Implemented Quản lý vận tải CRUD/report modules and verified desktop/mobile e2e smoke with mock data.

# Template Source Map

Status: doing
Last updated: 2026-05-30

## Current Template Coverage

Existing routes in `App.tsx`:

| Route | Current source | Sheet mapping | Status |
| --- | --- | --- | --- |
| `/he-thong` | `pages/dashboards/SystemDashboard.tsx` | He thong dashboard | keep/adapt |
| `/he-thong/nhan-vien` | `features/he-thong/nhan-vien/index.tsx` | He thong / So do / Nhan vien | exists, must reduce fields per Fix app |
| `/he-thong/phong-ban` | `features/he-thong/phong-ban/index.tsx` | He thong / So do / Phong ban | exists, table name must adapt |
| `/he-thong/chuc-vu` | `features/he-thong/chuc-vu/index.tsx` | He thong / So do / Chuc vu | exists, must add/keep `cap_bac` importance |
| `/he-thong/thong-tin-cong-ty` | `features/he-thong/thong-tin-cong-ty/index.tsx` | He thong / Thiet lap khac / Thong tin cong ty | exists |
| `/he-thong/phan-quyen` | `features/he-thong/phan-quyen/index.tsx` | He thong / Thiet lap khac / Phan quyen | exists, permission key format must adapt |

Missing from current template and required by Sheet 1:

| Route target | Sheet mapping | Required source area |
| --- | --- | --- |
| `/quan-ly-van-tai/chuyen-xe` | Quan ly van tai / Ke hoach / Chuyen xe, tabs `Danh sach`, `Danh sach CT` | new feature module |
| `/quan-ly-van-tai/bang-luong` | Quan ly van tai / Ke hoach / Bang luong | new feature module |
| `/quan-ly-van-tai/thong-ke-chuyen-di` | Quan ly van tai / Ke hoach / Thong ke chuyen di | new report/stat module |
| `/quan-ly-van-tai/thong-ke-luong` | Quan ly van tai / Ke hoach / Thong ke luong | new report/stat module |
| `/quan-ly-van-tai/tai-xe` | Quan ly van tai / Thiet lap / Tai xe | new setup module |
| `/quan-ly-van-tai/dia-diem` | Quan ly van tai / Thiet lap / Dia diem | new setup module |
| `/quan-ly-van-tai/danh-sach-xe` | Quan ly van tai / Thiet lap / Danh sach xe | new setup module |

## Current Code Mismatches With 5fedu Rules

- `package.json` still uses template name `quan-ly-thiet-bi`; this project should use TAH APP naming.
- `lib/data/config.ts` defaults to mock. This project is chot Supabase that, so default must not silently be mock.
- `lib/supabase/client.ts` returns `null` when env is missing. For Supabase mode, this should be an explicit configuration blocker/error instead of invisible mock behavior.
- `pages/Login.tsx` default password is `123456`; project login default must be `5fedu.com`.
- `pages/Login.tsx` currently creates a local mock user after timeout instead of using `getAuthService()` for Supabase mode.
- `App.tsx` and `pages/Login.tsx` still expose register route/link. 5fedu requires removing registration.
- `lib/sidebar-menu.tsx` currently only has Home, System, License. Sidebar must reflect project domains/modules.
- Permission config currently uses ids like `he-thong/nhan-vien`; 5fedu requires module key only, for example `nhan-vien`.
- Current service table names include `he_thong_phong_ban`, `he_thong_chuc_vu`, `he_thong_nhan_vien`, `phan_quyen`; Sheet 1 database uses `var_phong_ban`, `var_chuc_vu`, `var_nhan_vien`, `var_phan_quyen`.
- Notification exists as a real dropdown area; 5fedu requires default demo behavior with demo marker and unavailable message.

## Source Patterns To Reuse

- `createFeatureModule.tsx`, `createFlatListFeatureModule.tsx`, and `createHierarchyFeatureModule.tsx` should be reused for new modules where possible.
- Existing system modules already have the expected folder shape:
  - `components`
  - `core`
  - `hooks`
  - `services`
  - `store`
  - `utils`
  - `text.ts`
  - `<module>.module.tsx`
- Shared responsive/list/form building blocks already exist:
  - `GenericTable`
  - `MobileListCard`
  - `GenericDrawer`
  - `FormSection`
  - `FormGrid`
  - `DetailSection`
  - `DetailToolbar`
  - `TabGroup`

## Implementation Implications

- Adapt existing He thong modules first at source/table/key level because they are already present and underpin auth/permission.
- Add Quan ly van tai modules using the closest existing system module patterns rather than inventing a new architecture.
- Keep spreadsheet-like familiarity in Chuyen xe UI, but normalize data through `vt_chuyen_xe` parent rows and `vt_chuyen_xe_ct` child rows.
- All new services must point to 5fedu table names and keep frontend -> service -> table mapping clear for debug.

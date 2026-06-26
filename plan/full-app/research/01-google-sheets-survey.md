# Google Sheets Survey

Status: doing
Last updated: 2026-05-30

## Sources

- Sheet 1: `https://docs.google.com/spreadsheets/d/1STKW2NMyFvmCZ1K1ZEXISssWRNRy_lGMdoRkS8pqlVk/edit?gid=12934850#gid=12934850`
- Sheet 2: `https://docs.google.com/spreadsheets/d/1bCV-0vN0RbNJTk0STTRGb-eexavah2Wus2p8SxneSrc/edit?gid=1552771048#gid=1552771048`

## Access Status

- Sheet 1 opens in Playwright without login. Browser shows a `Dang nhap` link and anonymous viewer state, so the current browser session is not authenticated, but this sheet is accessible by link.
- Sheet 1 exported successfully to `output/sheets/TAH-APP.xlsx`.
- Sheet 1 structured extraction written to `output/sheets/TAH-APP.analysis.json`.
- Sheet 2 direct export returns `401 Unauthorized`.
- Sheet 2 opens to Google sign-in in Playwright. This requires user authentication or share permission before surveying.

## Sheet 1 Workbook Structure

- Total sheets: 22.
- Monthly data sheets: 15.
- Spec/config sheets:
  - `Mo ta chung`
  - `Chuc nang`
  - `Fix app`
  - `Thiet ke View & Tab`
  - `Trang tinh11`
  - `Quy tac database`
  - `database`

## App And Tech

Source: `Mo ta chung`.

- App name: `TAH APP`.
- Frontend: React Vite TypeScript.
- UI: Tailwind CSS and internal `components/ui`.
- Data state: TanStack Query for server state, Zustand for client state.
- Forms: React Hook Form and Zod.
- Backend: Supabase PostgreSQL and Auth.
- Media: Cloudinary.
- Connection notes: Supabase and Cloudinary.

Important correction for this project: although the sheet says dev may use mock, the user has already chot `Supabase that`, so this project must not silently default to mock.

## View And Module Map

Source: `Thiet ke View & Tab`.

| Submenu | Nhom module | View | Tabs |
| --- | --- | --- | --- |
| He thong | So do | Phong ban | |
| He thong | So do | Chuc vu | |
| He thong | So do | Nhan vien | |
| He thong | Thiet lap khac | Thong tin cong ty | |
| He thong | Thiet lap khac | Phan quyen | |
| Quan ly van tai | Ke hoach | Chuyen xe | Danh sach, Danh sach CT |
| Quan ly van tai | Ke hoach | Bang luong | Danh sach |
| Quan ly van tai | Ke hoach | Thong ke chuyen di | Loc theo ngay, chuyen, tai xe, dia diem, xe; thong ke luong, chi phi |
| Quan ly van tai | Ke hoach | Thong ke luong | Loc theo ngay, tai xe |
| Quan ly van tai | Thiet lap | Tai xe | |
| Quan ly van tai | Thiet lap | Dia diem | |
| Quan ly van tai | Thiet lap | Danh sach xe | |

Implementation mapping must follow:

```text
spec/source -> submenu -> module -> view/tab -> route -> source path -> database table -> service/handler
```

## Fix App Requirements

Source: `Fix app`.

All listed rows are currently `Chua lam` in the sheet:

- Data: database is Supabase.
- Login/register: fake email login, example `admin` -> `admin@gmail.com`.
- Remove registration.
- Employee module: keep only core fields `id`, `ho_va_ten`, `avatar`, `trang_thai`, `id_phong_ban`, `id_chuc_vu`, `so_dien_thoai`, `email`, `ten_dang_nhap`.
- When creating or changing `ten_dang_nhap`, Supabase should create/delete auth account using `<ten_dang_nhap>@gmail.com`, default password `123456`.
- Position module: `cap_bac` is important for permissions:
  - level 1 sees all
  - level 2 sees within department
  - level 3 sees within group
  - level 4 sees self only

## Database Rule Sheet

Source: `Quy tac database`.

Common column order:

- `id`
- label/name
- status
- group/classification fields
- description and notes
- `id_nguoi_tao`
- `tg_tao`
- `tg_cap_nhat`

Owner note from original prompt still applies: `tg_tao` and `tg_cap_nhat` are on every table; `id_nguoi_tao` is for most tables except some system/master tables such as department/position when confirmed.

## Database Tables From Sheet

Source: `database`.

| Table | Fields / notes extracted |
| --- | --- |
| `var_cong_ty` | brand/logo upload, app name, short description, legal info, company full name, tax code, phone, email, website, address |
| `var_phan_quyen` | `id int8`, `id_chuc_vu text`, `id_module text`, `quyen text` |
| `var_phong_ban` | `id int8`, `tt`, `ma_phong_ban`, `ten_phong_ban`, `mo_ta`, `id_phong_ban_quan_ly`, `trang_thai` |
| `var_chuc_vu` | `id`, `tt`, `ma_chuc_vu`, `ten_chuc_vu`, `mo_ta`, `id_phong_ban`, `trang_thai`; must add/confirm `cap_bac` from Fix app |
| `var_nhan_vien` | sheet only notes login uses username/password; final fields follow Fix app core employee fields |
| `vt_tai_xe` | `id`, `ho_ten`, `trang_thai`, `id_nhan_vien` |
| `vt_xe` | `id`, `hang`, `model`, `doi`, `bien_so`, concise insurance/extra info |
| `vt_dia_diem` | `id`, `nhom`, `ten`, `mo_ta`, `tien_luong`, `ghi_chu`, `id_nguoi_tao`, `tg_tao`, `tg_cap_nhat`, `dinh_vi` |
| `vt_chuyen_xe` | `id`, `ngay`, `id_tai_xe`, trip count, total salary, total fee, notes |
| `vt_chuyen_xe_ct` | `id`, `id_chuyen_xe`, `id_dia_diem`, initial salary, trip fee, notes, status, approval; approved rows cannot be edited |
| `vt_luong` | `id`, `nam`, `thang`, `id_tai_xe`, total trip salary, total trip fee, other fee, fee note, status, `id_nguoi_tao`, `tg_tao`, `tg_cap_nhat` |

Potential sheet typos to normalize during schema draft:

- `id_tai_xei_xe` should be checked against intended `id_tai_xe`.
- `id nười tạo`, `tg tạo`, `tg cập nhaath`, `id người tjao` should normalize to `id_nguoi_tao`, `tg_tao`, `tg_cap_nhat`.
- `hãng`, `đời`, `định vị` should normalize to ASCII schema keys such as `hang`, `doi`, `dinh_vi`.

## Monthly Data Pattern

Source sheets: `T03 2025` through `T05 2026`.

Observed data shape:

- Date/day column.
- Up to 4 trip columns in 2025, up to 6 trip columns in 2026.
- Matching salary columns per trip.
- Total column using sheet formulas such as `SUM`.
- Some months include driver column, for example `T04 2026` has `Tai xe`.
- Destination/location values include repeated names such as `Cho Lon`, `Dragon`, `PVDong`, `Phu Xuan`, `BCon`, `HTX`, `GVap`, `Food BD`, `Van Thanh`.

Implication:

- The app should model a parent trip/day/month record and child trip-detail rows, rather than hardcoding fixed `chuyen_1..chuyen_6` columns as the only source of truth.
- UI can still show spreadsheet-like columns for familiarity, but service/database should map to `vt_chuyen_xe` and `vt_chuyen_xe_ct`.

## Open Items

- Sheet 2 is blocked by Google login/share permission.
- Supabase project URL is still needed before real runtime verification.
- Exact 5fedu meaning of `ham index` is still open before production migration.
- Permission exceptions per module are not specified beyond default model and `cap_bac` note.

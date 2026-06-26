# 5F Template – Ứng dụng quản lý nội bộ

Ứng dụng web quản lý thiết bị / nhân sự và nghiệp vụ nội bộ: Trang chủ, Hệ thống (nhân viên, phòng ban, chức vụ, thông tin công ty, phân quyền, …), Hồ sơ. Giao diện tiếng Việt, dark mode; tông màu chủ đạo chọn trong menu người dùng (avatar).

## Stack (tóm tắt)

- **Frontend:** React (Vite) + TypeScript.
- **UI:** Tailwind CSS + **component nội bộ** trong `components/ui/` (phong cách tương tự shadcn, **không** cài registry shadcn/Radix để giữ kiểm soát bundle).
- **Dữ liệu:** TanStack Query (server) + Zustand (client); React Hook Form + Zod.
- **Backend:** Supabase (PostgreSQL + Auth); mặc định dev có thể dùng mock (`VITE_DATA_SOURCE=mock`).

## Supabase

1. Tạo project trên [Supabase](https://supabase.com), lấy **URL** và **anon key**.
2. Copy `.env.example` → `.env` và đặt `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_DATA_SOURCE=supabase`.
3. Sinh type TypeScript cho PostgREST (khuyến nghị khi schema ổn định):

   ```bash
   npm run types:supabase
   ```

   (Cần [Supabase CLI](https://supabase.com/docs/guides/cli) và project đã `supabase link`, hoặc chỉnh script trong `package.json` dùng `--project-id`.)

4. Bật **RLS** và policy phù hợp trên các bảng; client chỉ dùng anon key nên policy là lớp bảo vệ chính.

**Hiệu năng (đã áp dụng trong code):** client Supabase singleton + PKCE; TanStack Query `staleTime` / `gcTime`; repository giới hạn số dòng mỗi lần `getAll` (xem `SUPABASE_DEFAULT_MAX_ROWS`); `select` trong service chỉ lấy cột và quan hệ cần thiết. Dev: nút **React Query Devtools** góc dưới trái.

## Yêu cầu

- Node.js (khuyến nghị LTS)

## Chạy dự án

1. Cài đặt phụ thuộc:
   ```bash
   npm install
   ```
2. Chạy máy chủ phát triển:
   ```bash
   npm run dev
   ```
3. Mở trình duyệt theo địa chỉ in ra (thường là `http://localhost:5173`).

## Chạy với Mock Data (mặc định)

Dự án mặc định dùng dữ liệu mẫu trong thư mục `mocks/` — không cần Supabase.

1. Đảm bảo `.env` có `VITE_DATA_SOURCE=mock` (đã cấu hình sẵn trong `.env.example`).
2. Chạy `npm run dev`.
3. Đăng nhập (đã điền sẵn trên form):
   - **Tên đăng nhập:** `admin`
   - **Mật khẩu:** `5fedu.com`
4. Nhân sự chính: **Lê Minh Công** — Tổng Giám Đốc (`emp-000`).

Tài khoản test khác (cùng mật khẩu `5fedu.com`): `xuyen`, `linh` (tài xế), `long.cao` (trưởng phòng kho vận).

Để nối Supabase thật: đổi `VITE_DATA_SOURCE=supabase` và điền `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

## Deploy lên Vercel (mock demo)

Trên Vercel, file `.env` local **không** được đẩy lên git. Nếu không set biến môi trường, app build với `VITE_DATA_SOURCE=supabase` (mặc định trong code) → form đăng nhập **không** điền sẵn `admin` / `5fedu.com`.

### Cách 1: Vercel Dashboard (thủ công)

1. **Vercel Dashboard** → Project → **Settings** → **Environment Variables**
2. Thêm hoặc sửa: `VITE_DATA_SOURCE` = `mock` (scope **Production** và **Preview**)
3. Không cần Supabase URL/key khi chỉ chạy mock
4. **Deployments** → chọn deployment mới nhất → **Redeploy** (bắt buộc — Vite nhúng env lúc build)

### Cách 2: Vercel CLI (script)

```bash
npx vercel login    # một lần
npx vercel link     # một lần, chọn đúng project
./scripts/setup-vercel-mock-demo.sh
```

Windows (PowerShell): `.\scripts\setup-vercel-mock-demo.ps1`

Sau redeploy, đăng nhập với `admin` / `5fedu.com` (điền sẵn trên form).

Khi nối Supabase thật trên Vercel: đổi `VITE_DATA_SOURCE=supabase`, thêm `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY`, rồi redeploy. Có thể dùng `scripts/add-vercel-envs.ps1` (đọc từ `.env.local`).

## Scripts

| Lệnh | Mô tả |
|------|--------|
| `npm run dev` | Chạy dev server (Vite) |
| `npm run build` | Build production (output trong `dist/`) |
| `npm run preview` | Xem bản build (sau khi chạy `npm run build`) |
| `npm run test` | Chạy test (Vitest) |
| `npm run test:watch` | Chạy test ở chế độ watch |
| `npm run types:supabase` | Sinh `lib/supabase/database.types.ts` (cần Supabase CLI) |

## Tài liệu

- [Quy ước giao diện (UI Conventions)](docs/UI-CONVENTIONS.md) – Dialog/Drawer, Section, Design system (border radius, button, error message).
- [Catalog view types ERP](docs/view-types.md) – `VIEW_TYPE_REGISTRY`, primitive theo nhóm, tách `ViewTypeId` vs `DataTypeId`.

## Cấu trúc chính

- `App.tsx` – Router, theme, ngôn ngữ, route bảo vệ.
- `components/` – Layout, UI dùng chung (Button, Input, Table, …), shared (ConfirmDialog, ErrorState, …).
- `features/he-thong/` – Module Hệ thống: nhân viên, phòng ban, chức vụ, thông tin công ty, phân quyền; **cấp bậc / chi nhánh** chỉ là lookup (hooks + service), không có trang riêng.
- `lib/` – Tiện ích, `lib/text` (chuỗi giao diện), theme, sidebar, `lib/query-keys`, `lib/supabase/`.
- `locales/` – File JSON / gộp chuỗi (theo cấu hình dự án).
- `pages/` – Trang đơn (Home, Login, Profile, …).
- `mocks/` – Dữ liệu mẫu thống nhất (nhân viên, phòng ban, vận tải, auth).

# Decision Status

## Quy ước trạng thái

- `DA_CHOT`: đã được người dùng hoặc owner xác nhận rõ, được phép dùng làm cơ sở triển khai.
- `CHUA_CHOT`: mới là ghi nhận ban đầu hoặc mặc định theo 5fedu, chưa được phép triển khai phần rủi ro nếu chưa hỏi lại.
- `CAN_HOI_THEM`: thiếu dữ kiện, ảnh/spec chưa đủ rõ, có nhiều cách hiểu, hoặc cần owner xác nhận thêm.

Chỉ cập nhật một mục sang `DA_CHOT` khi người dùng xác nhận rõ trong chat, tài liệu spec, Google Sheet, source chính thức của dự án, hoặc bằng chính ảnh/spec đã gửi.

## Trạng thái hiện tại

| Mục | Trạng thái | Nguồn/xác nhận | Ghi chú |
| --- | --- | --- | --- |
| Dùng context 5fedu theo từng dự án, không nhét full vào global | DA_CHOT | User prompt ngày 2026-05-30 | Global chỉ giữ một slash `/5fedu` và skill tái dùng |
| Repo `P:\tah-app-5f` là dự án 5fedu | DA_CHOT | User prompt ngày 2026-05-30 | Đã setup project-local `AGENTS.md` |
| `AGENTS.md` chỉ là con trỏ nhẹ, không `@` toàn bộ docs | DA_CHOT | User prompt ngày 2026-05-30 | Đọc theo loading policy |
| `/5fedu` chỉ dùng để scaffold hoặc bảo trì context/rule/status, không cần gọi mỗi lần để cấp context | DA_CHOT | User prompt ngày 2026-05-30 | Normal work phải tự đọc `AGENTS.md` |
| Format/cách làm mặc định của 5fedu phải được ghi rõ dù giá trị từng app chưa chốt | DA_CHOT | User prompt ngày 2026-05-30 | Xem `07-working-format.md` |
| Scope dự án là full app A-Z, không hỏi "module đầu tiên/phase đầu" | DA_CHOT | User prompt ngày 2026-05-30 | AI tự chia plan nội bộ nếu cần |
| Clone/adapt template `https://github.com/tahdieuphoi-ctrl/TAH_app` vào repo này | DA_CHOT | User prompt ngày 2026-05-30 | Dùng template làm nền; chỉnh sửa thì báo người dùng |
| Template source local | DA_CHOT | Clone thành công qua GitHub CLI | `P:\tah-app-5f\.agents\template-source\TAH_app`, branch `main` |
| App name hiện tại | DA_CHOT | User prompt ngày 2026-05-30 + ảnh 1 | `TAH APP` |
| Spec source hiện tại | DA_CHOT | User prompt ngày 2026-05-30 + ảnh đã gửi | Dùng ảnh/spec đã gửi làm nguồn hiện tại; nếu có sheet/link mới thì cập nhật sau |
| Tech stack app hiện tại | DA_CHOT | Ảnh 1 + user xác nhận | React Vite TS, Tailwind, internal `components/ui`, TanStack Query, Zustand, React Hook Form, Zod, Supabase, Cloudinary |
| Backend mode | DA_CHOT | User prompt ngày 2026-05-30 | Supabase thật, không mặc định mock |
| Frontend-template strategy | DA_CHOT | User prompt ngày 2026-05-30 | Clone/read template, lấy đúng phần cần, ưu tiên thêm/adapt, hạn chế sửa/xóa |
| Supabase credential values | DA_CHOT | User cung cấp URL + publishable key + secret key trong chat ngày 2026-05-30 | Đã cấu hình local env ignored; không lưu/in secret vào docs/plan/context |
| Supabase schema public hiện tại | DA_CHOT | User cung cấp DB connection string ngày 2026-05-30 + migration chạy thành công | Đã chạy `supabase/migrations/20260530_initial_app_schema.sql` trên production Supabase; 11 bảng app tồn tại và query được bằng user authenticated |
| Cloudinary credential values | CHUA_CHOT | Chưa có secret trong chat | Cần nếu làm media/upload thật |
| Google Sheets/AppSheet credentials | CAN_HOI_THEM | User nói có thể có tùy dự án | Chỉ hỏi nếu spec/flow hiện tại cần dùng |
| Vercel/Edge Function setup | CHUA_CHOT | Quy tắc tối ưu cuối dự án | Làm plan tối ưu khi gần bàn giao hoặc khi deploy |
| Vercel npm install policy | DA_CHOT | Vercel build báo ERESOLVE ngày 2026-05-30 + npm package metadata | Clean install không dùng `--force`/`--legacy-peer-deps`; giữ ESLint major 9 cho tới khi plugin peer deps hỗ trợ major 10 |
| Prefix bảng database theo submenu | DA_CHOT | Ảnh 6/source examples | Dùng prefix/bảng đã thấy như `var_`, `vt_`; prefix mới ngoài spec thì hỏi |
| Ý nghĩa chính xác của "hàm index" database | CAN_HOI_THEM | User prompt ghi theo lời sếp | Cần SQL mẫu hoặc giải thích từ owner trước khi tạo convention thật |
| Bảng được miễn `id_nguoi_tao` | DA_CHOT | Ảnh chat owner | Bảng hệ thống/master như phòng ban/chức vụ có thể miễn; bảng nghiệp vụ phải có |
| Permission model mặc định | DA_CHOT | User prompt ban đầu | `xem/them/sua/xoa/quan_tri`, `tat_ca` chỉ là UI helper, permission app-side mặc định |
| Permission exception từng module | CAN_HOI_THEM | Chưa có rule riêng ngoài ví dụ | Chỉ hỏi khi module có ngoại lệ so với default hoặc spec thiếu |
| Sheet 2 rule/setup qua ảnh | DA_CHOT | User gửi ảnh Sheet 2 ngày 2026-05-30 | Đã ghi vào `08-source-examples.md`; dùng làm rule triển khai mặc định cho source, database, flow, search, notification, permission |
| Tài khoản test mặc định | DA_CHOT | Ảnh Sheet 2 ngày 2026-05-30 | `admin` / `5fedu.com`; fake email thành `admin@gmail.com` |
| Employee auth account flow | DA_CHOT | Ảnh Sheet 1/2 ngày 2026-05-30 | Khi tạo/đổi `ten_dang_nhap`, tạo/xóa auth account `<ten_dang_nhap>@gmail.com`, mật khẩu mặc định `123456`; cần server/admin path, không đưa service role vào frontend |

## Cách AI phải dùng file này

- Trước khi code: đọc bảng trạng thái và nêu rõ mục nào đang chặn phần việc thật sự.
- Không hỏi lại các mục đã `DA_CHOT`.
- Khi người dùng chốt: cập nhật trạng thái, nguồn/xác nhận, ghi chú.
- Khi phát hiện mâu thuẫn giữa ảnh, sheet, code template và lời chat: đổi sang `CAN_HOI_THEM`, hỏi lại, không tự chọn.
- Khi lập plan: đưa các mục `CHUA_CHOT`/`CAN_HOI_THEM` liên quan vào Risk Register hoặc Stop Conditions.
## Cập nhật 2026-05-30

- Supabase keys: user đã paste secret key và publishable key trong chat. Đã cấu hình local env ignored cho các key cần dùng, không ghi giá trị secret vào docs/plan/context. Vẫn thiếu Supabase project URL để verify kết nối thật.
- Google Sheet 1 `1STKW2NMyFvmCZ1K1ZEXISssWRNRy_lGMdoRkS8pqlVk`: `DA_CHOT` làm source spec hiện tại vì mở được bằng link và đã export/phân tích offline.
- Google Sheet 2 `1bCV-0vN0RbNJTk0STTRGb-eexavah2Wus2p8SxneSrc`: export trực tiếp từng trả `401 Unauthorized`, nhưng người dùng đã gửi ảnh Sheet 2 làm nguồn rule/setup. Nếu cần dữ liệu cell đầy đủ thì vẫn cần auth/share, còn các rule nhìn thấy trong ảnh đã đủ để dùng.
## Cập nhật owner feedback 2026-05-31

| Mục | Trạng thái | Nguồn/xác nhận | Ghi chú |
| --- | --- | --- | --- |
| `id` bảng app dùng `int8` tự động tăng dần | DA_CHOT | Ảnh phản hồi owner người dùng gửi ngày 2026-05-31 | Supabase hỗ trợ bằng identity/bigserial; không dùng uuid nếu chưa chốt |
| Foreign key trỏ tới bảng app dùng `int8` | DA_CHOT | Suy ra trực tiếp từ rule `id int8` owner đã chốt | Ngoại lệ chỉ cho key slug như `id_module` khi source chốt |
| Bảng nhân viên tối giản, bỏ trường linh tinh | DA_CHOT | Ảnh phản hồi owner người dùng gửi ngày 2026-05-31 | Chỉ giữ trường chính trong `04`/`10`, không tự thêm hồ sơ HR mở rộng |
| Login dùng `ten_dang_nhap`, không dùng `ma_nhan_vien` | DA_CHOT | Ảnh phản hồi owner người dùng gửi ngày 2026-05-31 | Đây là chuẩn auth trước khi mở rộng module khác |
| Thêm/sửa/xóa `ten_dang_nhap` đồng bộ Supabase Auth user | DA_CHOT | Ảnh phản hồi owner người dùng gửi ngày 2026-05-31 | Phải qua server/admin path, không đưa service role vào frontend |
| Google Sheets cần đọc bằng browser đã đăng nhập Google khi link cần auth | DA_CHOT | User yêu cầu ngày 2026-05-31 | Playwright headed đã mở để user đăng nhập, sau đó đọc sheet làm nguồn chính |
| Google Sheet app/data/spec hiện tại | DA_CHOT | User gửi link public ngày 2026-05-31 | `1NY4sVW2GZaOjtZ-Mivq-B5PlXZPL_QEhbJjAJe_0ddg`, đã export vào `output/sheets/current/` |
| Google Sheet dự án/quy tắc hiện tại | DA_CHOT | User gửi link public ngày 2026-05-31 | `1KF3Pe-N7S4DJm_6TKi9QXy4jXPKzqDmeLVHxgiuGoZY`, đã export vào `output/sheets/current/` |
| Source map từ 2 Google Sheets | DA_CHOT | Phân tích export ngày 2026-05-31 | `.agents/5fedu/11-current-sheets-source-map.md` là tài liệu đối chiếu chính |

## Cập Nhật Owner Feedback UI/Vận Tải 2026-05-31

| Mục | Trạng thái | Nguồn/xác nhận | Ghi chú |
| --- | --- | --- | --- |
| Template giao diện tham chiếu local | DA_CHOT | User yêu cầu ngày 2026-05-31 | `.agents/template-source/TAH_app` tại commit `47947e6eea0b1b7dc6723356f37f604e30ac690b` |
| Thứ tự trang chủ | DA_CHOT | User yêu cầu ngày 2026-05-31 | `Quản lý vận tải` -> `Hệ thống` -> `Thông tin bản quyền` |
| Nhân viên có email thực tế riêng | DA_CHOT | User yêu cầu ngày 2026-05-31 | Email thật khác fake email auth sinh từ `ten_dang_nhap@gmail.com` |
| Không kết luận phòng ban/chức vụ rỗng nếu chưa kiểm tra Supabase thật | DA_CHOT | User phản hồi ngày 2026-05-31 + kiểm tra REST ngày 2026-05-31 | DB hiện có dữ liệu; nếu UI trắng phải kiểm tra env/query/filter/permission/render |
| Tài xế có thể là người ngoài công ty | DA_CHOT | User yêu cầu ngày 2026-05-31 | `id_nhan_vien` chỉ là liên kết optional; form cần thông tin tài xế bên ngoài |
| Detail tài xế có lịch sử chuyến xe và lịch sử lương | DA_CHOT | User yêu cầu ngày 2026-05-31 | Không chỉ render field thô |
| Địa điểm và danh sách xe cần form/detail chuẩn nghiệp vụ | DA_CHOT | User yêu cầu ngày 2026-05-31 | Không dùng CRUD generic hời hợt |
| Bảng lương dùng combobox tài xế | DA_CHOT | User yêu cầu ngày 2026-05-31 | Không dùng select thô cho tài xế |
| Bảng lương tự tính tổng lương chuyến từ chuyến đi thực tế | DA_CHOT | User yêu cầu ngày 2026-05-31 | Không cho nhập tay `tong_luong_chuyen` |
| Bảng lương có trừ tiền khác và tổng tiền còn lại | DA_CHOT | User yêu cầu ngày 2026-05-31 | Ví dụ tiền ứng |
| Bảng lương có nút in và duyệt tách khỏi form | DA_CHOT | User yêu cầu ngày 2026-05-31 | Nút duyệt không nằm trong form |
| Chuyến xe cha tự tính tổng chuyến/tổng tiền từ chi tiết | DA_CHOT | User yêu cầu ngày 2026-05-31 | Không nhập tay nếu có chi tiết |
| Thống kê chuyến đi phải làm chuẩn dashboard/report nghiệp vụ | DA_CHOT | User yêu cầu ngày 2026-05-31 | Đã hoàn thành: bộ lọc chuẩn, thẻ thống kê động tách biệt (Chuyến đi vs Lương), tiêu đề cột Việt hóa chuẩn, nút xuất icon-only |

## Cập Nhật Mới Nhất 2026-06-01

| Mục | Trạng thái | Nguồn/xác nhận | Ghi chú |
| --- | --- | --- | --- |
| Chuẩn hóa footer Drawer Form | DA_CHOT | User feedback 2026-06-01 | Đã chuyển sang tái sử dụng component `FormDrawerFooter` có thuộc tính `compact` và icon |
| Chuẩn hóa footer Drawer Chi tiết | DA_CHOT | User feedback 2026-06-01 | Footer split-layout compact, các nút sử dụng hàm nhãn nút chuẩn (`BTN_CLOSE()`, `BTN_EDIT()`, `BTN_DELETE()`) |
| Icon trong ô bảng (Cell Icons) | DA_CHOT | User feedback 2026-06-01 | Các giá trị chính trong ô bảng (họ tên, sđt, biển số, tiền lương, trạng thái...) render kèm icon Lucide tương ứng |
| Đồng bộ lỗi Auth Sync mềm dẻo | DA_CHOT | User feedback 2026-06-01 | Khi API đồng bộ Auth lỗi hoặc thiếu biến môi trường, catch lỗi ở service để cho phép CRUD database hoàn thành bình thường |
| Thiết kế Module Dùng chung dữ liệu (Shared Data Modules Pattern) | DA_CHOT | User feedback 2026-06-01 | Gộp Database gốc, tách biệt Module giao diện chuyên môn (như Nhân sự vs Tài xế), liên kết điều hướng và soft delete role |
| Kích hoạt Đổi mật khẩu | DA_CHOT | User feedback 2026-06-01 | Đã triển khai gọi API `supabase.auth.updateUser` và cập nhật form Profile |
| Đồng bộ Dropdown Tài xế | DA_CHOT | User feedback 2026-06-01 | Dropdown Chuyến xe & Bảng lương lọc động từ bảng Nhân viên có cờ `la_tai_xe` |
| Xây dựng cây phân cấp động & Chuẩn hóa kiểu ID (Hierarchy Traversal) | DA_CHOT | User feedback 2026-06-01 | Thực hiện đệ quy ở service layer, bắt buộc ép kiểu chuỗi cho ID/khoá ngoại cha trước khi dựng cây để tránh lỗi lệch kiểu. |

## Cập Nhật Mới Nhất 2026-06-02

| Mục | Trạng thái | Nguồn/xác nhận | Ghi chú |
| --- | --- | --- | --- |
| Mô hình Master-Detail chuẩn 5fedu | DA_CHOT | User feedback 2026-06-02 | Chi tiết bảng con nhúng bằng `DetailSection` & `EmbeddedChildDataGrid`. Mở form con tự prefill/disable liên kết cha. Stacked drawers quản lý đè bằng AnimatePresence và stackLevel. |
| Khóa kế thừa dữ liệu (Cascading Locks) | DA_CHOT | User feedback 2026-06-02 | Khi dòng cha ở trạng thái đã phê duyệt/hoàn thành thì toàn bộ dòng con tự động bị khóa và ẩn các nút sửa/xóa/cập nhật. |
| Deep Linking / Lọc theo tham số URL | DA_CHOT | User feedback 2026-06-02 | Đọc `searchParams` (`id_tai_xe`, `id_xe`, `id_dia_diem`, `trang_thai`) để khởi tạo bộ lọc của danh sách, giúp liên kết chuyển hướng từ màn hình khác sang mượt mà. |
| Đồng bộ 2 chiều (Bidirectional Sync) | DA_CHOT | User prompt 2026-06-02 + Verify live | Đã deploy trigger DDL đầy đủ trên database production. Đồng bộ tự động 2 chiều giữa Supabase Auth và public.var_nhan_vien hoàn thành. |
| Đồng bộ Drawer Chi tiết với cache React Query | DA_CHOT | User feedback 2026-06-02 | Dùng `useMemo` để tìm dòng mới nhất trong cache thay vì truyền state tĩnh thô. |
| Chuẩn hóa decode base64 cho data URI | DA_CHOT | User feedback 2026-06-02 | decodeURIComponent chuỗi base64 trước khi gọi atob() để tránh sập luồng tải file sang UUID. |
| Phân tách biểu tượng tài chính bảng lương | DA_CHOT | User feedback 2026-06-02 | Thay đổi $ trùng lặp bằng các icon chuyên biệt (Banknote, Receipt, MinusCircle, CreditCard, Wallet) |
| Quy tắc phân quyền chi tiết (xem/them/sua/xoa) theo cấp bậc, quan_tri, kiem_tra | DA_CHOT | User prompt 2026-06-03 | Đã hoàn thành cập nhật can() và filterRowsByPermissions() khớp 100% luật check |
| Chuẩn hóa cây phân cấp và gom Thực thể con mồ côi (Orphaned Nodes rendering) | DA_CHOT | User prompt 2026-06-03 | Bắt buộc chọn phòng ban khi tạo chức vụ và gom các chức vụ mồ côi (không thuộc phòng ban) vào một nhóm giả lập cuối cùng trên UI để hiển thị và dọn dẹp. |
| Tối ưu hóa Phòng ban cấp 2 (Sub-department Limits) | DA_CHOT | User prompt 2026-06-03 | Ẩn phần tạo phòng ban con đối với phòng ban đã ở cấp 2; ẩn ô nhập thứ tự đối với phòng ban con và gán mặc định bằng 1. |
| Mật khẩu mặc định (Credentials Convention) | DA_CHOT | User prompt 2026-06-03 | Admin luôn dùng `5fedu.com`, người dùng thường mặc định `123456`. AI tuyệt đối không được đổi password admin hoặc dùng sai credentials khi test/seed. |\r
| Xuất file Chrome (Download Convention) | DA_CHOT | User feedback 2026-06-03 | KHÔNG dùng data URI, KHÔNG dùng `writeFile()`/`doc.save()`. PHẢI dùng `saveBlobAs()` (Blob + anchor + MouseEvent dispatch + delay 15s). Đây là cách duy nhất Chrome vừa giữ đúng filename vừa persist file ra Downloads folder. |
| Bảng lương dùng 3 trạng thái duyệt (Chưa duyệt / Đã duyệt / Không duyệt) | DA_CHOT | Owner feedback 2026-06-03 | Khớp template `TRANG_THAI_PHIEU_3`. Phiếu đã duyệt chỉ admin/cấp 1 mới thao tác được (isRowLocked). Có nút Duyệt + Từ chối (đơn lẻ, hàng loạt, drawer). |
| Chuyến xe/CT chỉ dùng trạng thái duyệt | **SUPERSEDED** | User prompt 2026-06-10; owner 2026-06-15 | Bị thay bởi rule tách **trạng thái thực hiện** (CT) và **trạng thái duyệt** (cha→con). |
| Triệt tiêu tab mini Thống kê | DA_CHOT | User prompt 2026-06-03 | Loại bỏ tab Thống kê khỏi Chuyến xe và Bảng lương để tránh trùng lặp tính năng đã quy hoạch. |
| Popup xác nhận đổi trạng thái | DA_CHOT | User prompt 2026-06-03 | Mọi nút hành động thay đổi trạng thái trực tiếp hoặc hàng loạt (Bulk/Single/Sub-grid) đều phải hiển thị popup confirm trước khi thực thi. |
| Một nút trạng thái trên toolbar Chuyến xe | **SUPERSEDED** | User prompt 2026-06-10; owner 2026-06-15 | Toolbar duyệt vẫn `Quản lý duyệt`; tài xế có action riêng đổi **trạng thái thực hiện** CT qua popup báo cáo. |
| Ma trận phân quyền bắt buộc (ngoại trừ cap_bac=1) | DA_CHOT | Owner feedback 2026-06-13 | cap_bac≥2 phải có tick trong `var_phan_quyen` mới được xem/sửa/xóa/duyệt; cap_bac chỉ giới hạn phạm vi dòng. Duyệt cần `kiem_tra`, không suy từ `sua`. |
| Chuẩn hóa PDF Export & Font Preload | DA_CHOT | User prompt 2026-06-03 | Tránh race condition bằng Promise chung ở preloadRobotoFonts, nâng cấp PDF layout chuyên nghiệp (tiêu đề Navy in hoa, metadata căn giữa, format VND căn phải, footer phân trang) và đổi filename sang tiếng Việt. |

## Cập Nhật Owner 2026-06-14

| Mục | Trạng thái | Nguồn/xác nhận | Ghi chú |
| --- | --- | --- | --- |
| Quy tắc phân quyền module chuẩn (xem/them/sua/xoa theo cap_bac + ma trận) | DA_CHOT | Owner prompt 2026-06-14 | Xem `02-database-and-auth-rules.md` §4; cấp ≥3 = phạm vi cá nhân, không filter nhóm riêng trong TAH hiện tại |
| UI duyệt: một nút `Quản lý duyệt` + modal thẻ Duyệt/Không duyệt | DA_CHOT | Owner prompt + ảnh 2026-06-14 | Không dùng hai nút tròn độc lập trên toolbar |
| Bảng lương: toolbar/row actions luôn hiện; nội dung chi tiết chỉ render chuyến đã duyệt | DA_CHOT | Owner prompt 2026-06-14 | Gate ở `getPayrollTripDetails(approvedOnly=true)`, không gate nút toolbar |
| Cloudinary / Google Sheets live / Vercel Edge tối ưu | OUT_OF_SCOPE | Owner prompt 2026-06-14 | Không implement cho dự án TAH trừ khi owner đổi scope |
| PWA stale bundle phải xử lý triệt để | DA_CHOT | Owner prompt 2026-06-14 | Build guard + SW skipWaiting/clientsClaim/controllerchange reload |

## Cập nhật Owner 2026-06-15 — Chuyến xe: tách thực hiện vs duyệt

| Mục | Trạng thái | Nguồn/xác nhận | Ghi chú |
| --- | --- | --- | --- |
| Hai cột trạng thái Chuyến xe/CT là độc lập | DA_CHOT | Owner phản hồi qua user 2026-06-15 | **Thực hiện** (tài xế, từng CT) ≠ **Duyệt** (cấp trên, từ cha đổ xuống con). Không gộp, không map chéo. |
| CT `trang_thai` = trạng thái thực hiện | DA_CHOT | Owner 2026-06-15 + schema gốc `20260530` + template TAH | Bộ tham chiếu: `Chưa thực hiện`, `Đang thực hiện`, `Đã thực hiện`, `Hủy`/`Không thực hiện`. Tài xế từ `Chưa thực hiện` → `Đã thực hiện` hoặc `Hủy`. |
| CT `phe_duyet` + cha `trang_thai` = trạng thái duyệt | DA_CHOT | Owner 2026-06-15 | Bộ `Chưa duyệt` / `Đã duyệt` / `Không duyệt`. Duyệt từ **bảng cha** cascade xuống mọi CT. |
| Popup báo cáo tài xế: đổi thực hiện + nhập chi phí | DA_CHOT | Owner 2026-06-15 | Một popup khi tài xế chuyển trạng thái thực hiện CT: chọn Thực hiện/Hủy + điền `chi_phi` (không chỉ ghi chú). |
| Cho phép lệch thực hiện vs duyệt | DA_CHOT | Owner 2026-06-15 | CT có thể `Đã thực hiện` + `Chưa duyệt` — chấp nhận, không ép đồng bộ. |
| Cột cha `2/4`, `3/5` = tiến độ thực hiện CT | DA_CHOT | Owner 2026-06-15 | Hiển thị **CT đã thực hiện / tổng CT**, không phải CT đã duyệt. Độc lập badge duyệt trên cha. |
| Sửa lại chi phí sau khi báo cáo | DA_CHOT | Owner 2026-06-15 | Điền sai vẫn sửa lại được cho đến khi CT/chuyến bị khóa duyệt (`phe_duyet`/`trang_thai` = `Đã duyệt` hoặc `Không duyệt`). |
| Có cần `Đang thực hiện` trong flow tài xế | CAN_HOI_THEM | Owner chỉ nói Thực hiện/Hủy | Schema/template gốc có `Đang thực hiện`; cần xác nhận có hiện trên UI hay chỉ 3 trạng thái chính. |
| Tính lương CT cần **cả** TT duyệt + TT thực hiện | DA_CHOT | Lê Minh Công chat 2026-06-15 | Chỉ tính khi `phe_duyet = Đã duyệt` **và** `trang_thai = Đã thực hiện`; thiếu một → không tính. |
| Duyệt cả bảng cha; báo cáo từng phiếu con | DA_CHOT | Lê Minh Công chat 2026-06-15 | Cascade duyệt cha→CT; tài xế popup báo cáo trên từng CT. |
| Checklist triển khai chi tiết | DA_CHOT | Tổng hợp 2026-06-15 | `.agents/5fedu/13-trip-execution-vs-approval-spec.md` |
| Triển khai code trip execution vs approval (shipped) | DA_CHOT | Code + unit test 2026-06-15 | `trip-execution-sync.ts`, `DriverCtReportDialog.tsx`, `transport-service.ts`, migration `20260615_restore_trip_execution_status.sql` |
| Harness E2E production cho chuyến xe / đa vai trò | DA_CHOT | Playwright 2026-06-15 | `14-production-e2e-harness.md`, `output/playwright/production-trip-execution.spec.ts`, project `production-e2e` |
| DB production: migration TH + trigger lương R6 | DA_CHOT | Apply + audit 2026-06-15 | `20260615_restore_trip_execution_status.sql`, `20260615_payroll_trigger_execution_gate.sql` — 10/10 PASS |
| Không duyệt lẻ từng CT trên UI | DA_CHOT | Spec R4 + code `5f653e9a` | Chỉ **Quản lý duyệt** chuyến cha; cascade `phe_duyet` |
| Harness fixtures/helpers đồng bộ R6 | DA_CHOT | `5f653e9a` | `payrollEligibleCtCount`, `expectTripParentApprovalDialog`; bỏ `expectTripChildApprovalDialog` |
| Thống kê chuyến (`TransportReportPage`) tách TH | OUT_OF_SCOPE | Owner 2026-06-15 | Chưa align; không chặn luồng chính |





# Production E2E Harness — 5fedu / TAH

> Harness kiểm thử Playwright trên **production** (`https://tah-app.vercel.app`). Dùng sau khi push + CI/CD deploy xong. Không thay smoke local; bổ sung gate đa vai trò, đối chiếu DB, và **khôi phục dữ liệu** sau test mutating.

## 0. Trạng thái harness (đóng vòng 2026-06-15)

| Lớp | Trạng thái | Ghi chú |
|-----|------------|---------|
| Spec nghiệp vụ R1–R7 | **Đóng** | `13-trip-execution-vs-approval-spec.md` — checklist §4 shipped |
| Code app | **Đóng** | `bf4dadf6` … `5f653e9a` trên `main` |
| DB production | **Đóng** | Migration restore TH + trigger R6 **đã apply**; audit 10/10 PASS |
| Harness Playwright | **Đóng** | Fixtures/helpers khớp R6; không còn duyệt lẻ CT |
| Thống kê chuyến/lương | **Ngoài scope** | `TransportReportPage` chưa tách TH — owner chấp nhận tạm |

**Một câu cho agent:** Chuyến xe / CT / báo cáo / duyệt cha / lương đã có spec + code + DB + harness thống nhất. Verify UI trên Vercel sau deploy; DB gate dùng `DATABASE_URL` local (không in secret).

## 1. Khi nào chạy (blast radius)

| Thay đổi | Spec bắt buộc | Spec khuyến nghị |
|----------|---------------|------------------|
| Chuyến xe: TH vs duyệt, **Báo cáo CT**, cascade duyệt cha, lương R6 | `production-trip-execution.spec.ts` + unit `trip-execution-sync.test.ts` | `production-multi-role.spec.ts` |
| Phân quyền / RLS app-side / row filter | `production-permissions-matrix.spec.ts` | `production-multi-role.spec.ts` |
| Module vận tải (CRUD, export, drawer) | `production-transport-deep.spec.ts` | `production-business-coverage.spec.ts` |
| Thay đổi rộng UI/route | `production-full-app-smoke.spec.ts` | toàn bộ `production-e2e` project |

**Quy tắc cứng**

- Mặc định verify trên production, không chỉ local (`AGENTS.md`, `00-index.md`).
- AI **không** `vercel --prod` / deploy thủ công; chỉ push và đợi Git integration.
- Test mutating phải có **snapshot trước** + **restore sau** (`afterAll`).
- Thiếu `SUPABASE_SERVICE_ROLE_KEY` / `DATABASE_URL` trong `.env.local` → ghi `PARTIAL` (UI-only), không assert DB.

## 2. Cấu trúc harness

```text
playwright.config.ts                    # projects: auth-setup, production-smoke, production-e2e
output/playwright/
  production-auth.setup.ts              # login 4 role → output/playwright/.auth/*.json
  helpers/production-e2e.ts             # accounts, fixtures, Supabase admin, snapshot/restore
  production-trip-execution.spec.ts     # R1–R7 regression chuyến xe
  production-multi-role.spec.ts         # driver/manager cross-flow
  production-transport-deep.spec.ts
  production-permissions-matrix.spec.ts
  production-business-coverage.spec.ts
  production-full-app-smoke.spec.ts
```

**Playwright project `production-e2e`** (`playwright.config.ts`):

```ts
testMatch: /production-(multi-role|transport-deep|business-coverage|permissions-matrix|trip-execution)\.spec\.ts/
dependencies: ['auth-setup']
```

## 3. Credentials & tài khoản test

Bám `AGENTS.md` — không đổi password admin.

| key | `ten_dang_nhap` | password | `cap_bac` | Ghi chú |
|-----|-----------------|----------|-----------|---------|
| `admin` | `admin` | `5fedu.com` | 1 | Toàn quyền |
| `director` | `thuyan` | `123456` | 1 | Giám đốc |
| `manager` | `tahdieuphoi` | `123456` | 3 | `kiem_tra` — duyệt **chuyến cha** |
| `driver` | `nguyenhongtuan` | `123456` | 4 | Fixture chuyến `52` |

Auth state: `output/playwright/.auth/{admin,director,manager,driver}.json`.

**Env DB** (`.env.local`, không commit): `VITE_SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `DATABASE_URL`.

## 4. Fixtures production (cập nhật khi seed đổi)

Định nghĩa trong `helpers/production-e2e.ts` → `FIXTURES`:

| Fixture | Giá trị | Mục đích |
|---------|---------|----------|
| `pendingDriverTrip` | `id: '52'`, driver `nguyenhongtuan` | Snapshot/restore chuyến **Chưa duyệt** + CT **Chưa thực hiện** |
| `payrollWithApprovedTrips` | `id: '298'`, driver `115`, `payrollEligibleCtCount: 0` | Ma trận lương R6 — **0** cho đến khi có CT đủ cả hai trục |
| `approvedTripIds` | `49`, `50`, `51` | Rollup duyệt cha tham chiếu |

**Hợp đồng backup/restore** (`TripExecutionSnapshot`):

1. `beforeAll`: `snapshotPendingDriverTrip()` — đọc `vt_chuyen_xe` + toàn bộ `vt_chuyen_xe_ct` của trip `52`.
2. Test chạy (UI assert; mutation tùy test).
3. `afterAll`: `restorePendingDriverTrip(baseline)` — `update` từng row về snapshot.

Nếu test **cố ý** mutate khác fixture: chỉ dùng `ghi_chu` chứa `E2E_MARKER` + `cleanupE2EMarker` — không xóa fixture cố định.

## 5. Gate deploy (bundle)

Production có thể lag sau push (PWA / CDN). Trip-execution spec **skip có chủ đích** khi UI chưa có:

- Filter chip **Thực hiện** trên tab CT
- Popup `TRẠNG THÁI THỰC HIỆN` (fallback legacy: drawer `Báo cáo chi phí chuyến`)

**Trước khi kết luận FAIL do thiếu UI mới:**

1. Commit đã lên `main` và Vercel build **Ready**.
2. Hard refresh; kiểm tra hash bundle JS (`index-*.js`) đã đổi.
3. Bundle cũ → báo **deploy lag**, chạy lại sau deploy; **không** sửa nghiệp vụ để pass trên bundle cũ.

## 6. Spec: trip execution vs approval

File: `output/playwright/production-trip-execution.spec.ts`

| Test | Role | Assert |
|------|------|--------|
| driver: báo cáo CT popup TH + chi phí | driver | Nút **`Báo cáo CT`** → drawer CT → popup `TRẠNG THÁI THỰC HIỆN` (hoặc legacy drawer) |
| driver: filter chip Thực hiện tab CT | driver | Nút `Thực hiện`; **skip** nếu chưa deploy |
| manager: bulk duyệt chuyến cha | manager | `Quản lý duyệt` → `expectTripParentApprovalDialog` — **không** modal duyệt lẻ CT |
| manager: detail → duyệt cha | manager | Detail → `Quản lý duyệt` → dialog **Quản lý duyệt chuyến** |

**Helpers (chỉ dùng bộ này — không còn duyệt lẻ CT):**

| Helper | Mục đích |
|--------|----------|
| `expectTripParentApprovalDialog` | Tiêu đề `Quản lý duyệt chuyến` + thẻ Duyệt/Không duyệt |
| `expectApprovalCards` | Modal duyệt bảng lương / chuyến đơn |
| `countApprovedPayrollTrips(payrollId)` | Đếm CT R6: `phe_duyet = Đã duyệt` **và** `trang_thai = Đã thực hiện` |
| `repairParentTripStatusInDatabase` | One-shot rollup cha từ `phe_duyet` con |

**UI đã bỏ (R4):** nút duyệt từng CT trong drawer; component `TripChildApprovalDialog` (dead code removed `5f653e9a`).

## 7. DB gate (production — đã apply)

Migrations trên Supabase production:

| File | Việc làm |
|------|----------|
| `20260615_restore_trip_execution_status.sql` | Default CT `Chưa thực hiện`; hoàn tách TH khỏi duyệt |
| `20260615_payroll_trigger_execution_gate.sql` | Trigger `fn_upsert_vt_luong_from_approved_ct` + gate R6; recalc `vt_luong` |

**Checklist audit (10/10 khi sạch):**

1. Default cha `Chưa duyệt`, CT TH `Chưa thực hiện`, CT duyệt `Chưa duyệt`
2. Cha không lẫn giá trị TH
3. CT `trang_thai` chỉ domain TH
4. CT `phe_duyet` chỉ domain duyệt
5. Rollup cha khớp `phe_duyet` con
6. `so_chuyen` / `tong_*` cha khớp logic app (`executed` vs `payrollEligible`)
7. Trigger payroll có `ct.trang_thai = 'Đã thực hiện'`
8. `vt_luong` khớp tổng R6 thủ công

Chạy qua `DATABASE_URL` + `pg` (pattern `scripts/apply-specific-migration.mjs`).

## 8. Lệnh chạy

```bash
# Toàn bộ production-e2e (cần auth setup trước)
npx playwright test --project=auth-setup
npx playwright test --project=production-e2e

# Chỉ regression chuyến xe
npx playwright test output/playwright/production-trip-execution.spec.ts --project=production-e2e

# Unit sync (local)
npm test -- features/quan-ly-van-tai/shared/__tests__/trip-execution-sync.test.ts
npm test -- features/quan-ly-van-tai/shared/__tests__/trip-approval-sync.test.ts
```

## 9. Liên kết nghiệp vụ & code

| Rule | Doc | Code chính |
|------|-----|------------|
| R1–R7 | `13-trip-execution-vs-approval-spec.md` | `trip-execution-sync.ts`, `trip-approval-sync.ts` |
| DB tách TH/duyệt + trigger R6 | `02-database-and-auth-rules.md` § Vận tải | migrations `20260615_*` |
| UI toolbar / popup | `03-ui-ux-and-delivery-standards.md` | `TransportModulePage.tsx`, `DriverCtReportDialog.tsx` |
| Lương R6 | `06-decision-status.md` 2026-06-15 | `payroll-matrix.ts`, `isCtEligibleForPayroll`, trigger DB |

## 10. Báo cáo kết quả (format agent)

Sau khi chạy harness, report phải có:

- `Deploy gate`: bundle/deploy status
- `Specs run`: passed/skipped/failed
- `Data restore`: `restorePendingDriverTrip` hay `PARTIAL`
- `DB gate`: 10-check hoặc `countApprovedPayrollTrips` / `payrollEligibleCtCount`
- `Remaining debt`: chỉ `CAN_HOI_THEM` (`Đang thực hiện` popup tài xế), **Thống kê** nếu owner yêu cầu sau

## 11. Context evolution gate (anti raw-dump)

**Bệnh cần tránh:** mỗi lần ship feature, AI ghi thêm paragraph raw vào `10`/`12`/`06` thay vì promote rule → context phình, agent đọc lặp, dễ mâu thuẫn.

**Harness context (bắt buộc sau mỗi đợt tiến hóa vận tải/chuyến xe):**

| Bước | Việc | Pass khi |
|------|------|----------|
| P1 | Rule imperative vào `02`/`03` | Không còn quote owner dài trong log |
| P2 | `13` checklist §8 = shipped/closed | Không “có thể cần apply” nếu DB đã apply |
| P3 | `10`/`12` chỉ thêm 1 dòng index | File ≤ ~30 dòng body rule |
| P4 | `SKILL.md` §4/§F cập nhật nếu global | Không duplicate nguyên văn `13` |
| P5 | Sync master allowlist | Không sync `10`, `12`, `06`, `questions` |

**Allowlist sync ngược agent-rules master** (`~/.grok/skills/5fedu-project/assets/project-context/`):

```text
.agents/5fedu/00-index.md
.agents/5fedu/02-database-and-auth-rules.md
.agents/5fedu/03-ui-ux-and-delivery-standards.md
.agents/5fedu/13-trip-execution-vs-approval-spec.md
.agents/5fedu/14-production-e2e-harness.md
+ mirror .codex/5fedu/ (cùng 5 file)
+ SKILL.md (§4, §6, §F)
```

Chạy: `scripts/sync-5fedu-rules-to-master.sh` từ repo TAH (hoặc rsync thủ công cùng allowlist).
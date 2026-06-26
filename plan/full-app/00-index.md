# Full App A-Z Plan

Status: doing
Last updated: 2026-05-30

## Goal

Hoàn thiện full app `TAH APP` theo template 5fedu, ảnh/spec đã gửi, Supabase thật, và conventions trong `.agents/5fedu/`.

## Context Packet

Luôn đọc:

- `AGENTS.md`
- `.agents/5fedu/00-index.md`
- `.agents/5fedu/06-decision-status.md`
- `.agents/5fedu/questions.md`

Nguồn chi tiết:

- Template source: `.agents/template-source/TAH_app`
- Working format: `.agents/5fedu/07-working-format.md`
- Source examples: `.agents/5fedu/08-source-examples.md`
- Coverage audit: `.agents/5fedu/09-coverage-audit.md`

## Scope

Allowed:

- Scaffold app root từ template.
- Map toàn bộ spec ảnh đã có vào domain/module/view/tab/route/source/table/service.
- Adapt template theo 5fedu conventions.
- Thiết kế schema/migration draft theo Supabase thật.
- Nối frontend với Supabase thật khi đủ URL/keys.
- Tạo flow auth, permission, search, list/card/detail/form, notification demo.
- Verify bằng lint/build/test/browser smoke.

Not allowed:

- Lưu secret thật vào repo/docs/plan/log.
- Tự tạo production migration khi thiếu Supabase URL hoặc "hàm index" chưa rõ.
- Tự bật Supabase RLS thay app-side permission nếu chưa được chốt.
- Hỏi lại "module đầu tiên/phase đầu".
- Xóa/sửa lớn template mà không báo lý do.

## Invariants

- Scope là full app A-Z.
- Supabase thật, không mặc định mock.
- Template-first: đọc template, giữ/adapt, hạn chế xóa.
- Mapping-first: spec -> domain/submenu -> module -> view/tab -> route -> source path -> database table -> service/handler.
- Mọi action UI phải có handler thật hoặc demo rõ ràng nếu rule yêu cầu demo.

## Risk Register

| Risk | Type | Likelihood | Impact | Mitigation | Verify |
| --- | --- | --- | --- | --- | --- |
| Thiếu Supabase URL/project ref | integration | high | high | ghi blocker đúng tên env, không lưu secret | env validation |
| "Hàm index" chưa rõ | database | high | med | tạo draft và hỏi khi tới migration thật | schema review |
| Google Sheet chưa có link | spec | high | high | dùng ảnh/spec hiện tại, cập nhật khi có link | mapping audit |
| Template có mock/register/RLS assumptions khác 5fedu | behavior | med | high | inspect/adapt auth/data source | auth smoke |
| Full app lớn | delivery | high | high | chia slice nội bộ, verify từng slice | plan evidence |

## Execution Order

- `01-scaffold-and-template-map.md`
- `02-spec-and-schema-map.md`
- `03-auth-supabase-and-permissions.md`
- `04-modules-ui-and-services.md`
- `05-verification-and-optimization.md`

## Acceptance Criteria

- App root có template scaffold chạy được.
- Có mapping full từ spec hiện tại sang source/table/service.
- Có schema draft/migration path theo 5fedu.
- Auth fake email + bỏ register + account default flow được xử lý.
- Modules trong ảnh/spec có UI/service/handler hoặc demo rõ rule.
- Search, tab query, list/card/detail/form, flow quay lại đúng chỗ được kiểm tra.
- Verification evidence được ghi.

## Stop Conditions

- Cần secret/URL chưa có để verify Supabase thật.
- Cần owner xác nhận "hàm index" trước migration thật.
- Google Sheet link yêu cầu auth và chưa được user cấp/quyền chưa vào được.

## Evidence

- Template cloned: `.agents/template-source/TAH_app`, branch `main`.
- GitHub CLI auth: available.
- Sheet 1 opened without Google login because link access is enabled; exported to `output/sheets/TAH-APP.xlsx`.
- Sheet 1 analysis written to `output/sheets/TAH-APP.analysis.json`.
- Sheet survey recorded in `plan/full-app/research/01-google-sheets-survey.md`.
- Sheet 2 currently requires Google sign-in/share permission and cannot be exported anonymously.

## Iteration Log

- 2026-05-30: Created full app plan. Scope locked as full A-Z; no "module đầu tiên" question.
- 2026-05-30: Surveyed Google Sheet 1, extracted app/spec/database/monthly data; Sheet 2 blocked by Google auth.


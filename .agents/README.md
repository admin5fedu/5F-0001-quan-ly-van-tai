# Antigravity Runtime Guardrails

Thư mục `.agents` này không phải artifact tạm. Đây là adapter bắt buộc để Antigravity làm việc chặt hơn:

- đọc entry/context index trước khi sửa;
- tự kích hoạt gate theo ý đồ prompt;
- ép 5fedu UI phải kiểm template/golden reference;
- ép production verify phải đi từ mapping/context;
- ép final luôn có `PASS`, `PARTIAL`, hoặc `BLOCKED`;
- ép task vừa/lớn có `Technical debt check`.

Đọc `.agents/INTENT.md` để nắm ý đồ ngắn nhất.

## Không Được Cleanup

Không xóa các file này nếu user chưa yêu cầu đích danh:

- `.agents/AGENTS.md`
- `.agents/INTENT.md`
- `.agents/hooks.json`
- `.agents/rules/00-runtime-and-intent.md`
- `.agents/rules/01-agent-workflow-sop.md`
- `.agents/rules/02-code-quality-and-debt.md`
- `.agents/rules/03-context-and-tools.md`
- `.agents/workflows/*.md`
- `.agents/skills/*/SKILL.md`
- `.agents/5fedu/00-index.md`

Nếu cần chỉnh, phải giữ nguyên ý đồ ép chặt và verify marker sau khi sync.

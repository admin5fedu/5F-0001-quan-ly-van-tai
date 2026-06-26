# Antigravity Agent Entrypoint

Đọc file này trước mọi task khi workspace có `.agents`.

Nếu chưa hiểu vì sao `.agents` tồn tại hoặc đang cân nhắc cleanup context/rules, đọc `.agents/INTENT.md` trước. File đó là manifest ý đồ ép chặt.

## Intent Cốt Lõi

Lớp `.agents` này tồn tại để ép Antigravity làm việc chặt hơn Codex ở các điểm nó thường lỏng:

- **Bắt buộc áp dụng trong mọi Session**: Luật phải được áp dụng cả trong chế độ thảo luận nghiệp vụ (Chat) lẫn lập trình sửa đổi code (Worktree/Plan). Không bỏ qua quy trình suy luận sâu và Status block.
- **Tránh trôi ngữ cảnh (Context Drift)**: Các file rules trong thư mục `.agents/rules/` phải được khai báo YAML frontmatter `alwaysApply: true` để Antigravity nạp trực tiếp vào System Prompt của mọi session.
- tự nhận diện ý đồ prompt thay vì chỉ đọc literal text;
- đọc mapping/context index trước khi làm;
- tự kích hoạt template/production/permission/database/export/cleanup gates;
- không bỏ qua `PASS`, `PARTIAL`, `BLOCKED`;
- không xóa hoặc ghi đè các file runtime ép chặt trong cleanup.

Nếu agent thấy file này có vẻ "trùng", "dài", "không dùng", hoặc "có thể cleanup", phải hiểu ngược lại: đây là runtime guard bắt buộc, không phải artifact.

## Required Rules

Antigravity tự scan `.agents/rules/*.md` qua `alwaysApply`. Bộ rule đã được hợp nhất thành 4 file (đọc theo thứ tự):

1. `.agents/rules/00-runtime-and-intent.md`
2. `.agents/rules/01-agent-workflow-sop.md`
3. `.agents/rules/02-code-quality-and-debt.md`
4. `.agents/rules/03-context-and-tools.md`

`codex-overlay.md` có `alwaysApply: false` (chỉ dành cho Codex CLI, Antigravity bỏ qua).

## Ranh Giới 3 Nền

Repo `agent-rules` phục vụ 3 agent với cơ chế nạp khác nhau: **Codex** (import chain `AGENTS.md`), **Antigravity** (alwaysApply `.agents/rules/`), **Kiro** (inclusion `.kiro/steering/`). Antigravity CHỈ sửa `antigravity/` và `.agents/`; không đụng `codex/**` hay `kiro/**`/`.kiro/**`. Chi tiết: `docs/06-harness-philosophy.md`.

## Project Context

- Nếu repo có `AGENTS.md`, đọc `AGENTS.md`.
- Nếu repo có `.agents/5fedu`, đọc `.agents/5fedu/00-index.md` trước.
- Không đọc toàn bộ context folder. Chỉ đọc sâu theo trigger và mapping.

## Hard Defaults

- Không tự commit/push/deploy nếu user chưa yêu cầu rõ.
- Với 5fedu UI, luôn kiểm `/template` hoặc golden reference trước khi sửa.
- Với production verify, luôn đọc mapping trước khi test.
- Với task vừa/lớn, final phải có `Technical debt check` và `Status: PASS/PARTIAL/BLOCKED`.

## Protected Files

Không xóa, rename, ghi đè rỗng, hoặc cleanup các file sau nếu user chưa yêu cầu đích danh:

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

Nếu cần thay đổi một file protected, phải nêu rõ lý do, giữ ý đồ ép chặt, sync mirror liên quan, rồi verify marker còn tồn tại.

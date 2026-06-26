---
description: "Công cụ và cách sử dụng context"
alwaysApply: true
---

# 03-context-and-tools

## From: 10-fast-context.md

# Fast Context Discipline

Mục tiêu là làm Antigravity nhạy và nhanh: nạp ít rule nền, đọc đúng file, dùng skill/prompt khi có case rõ.

## Context Budget

- Không đọc toàn repo nếu chưa cần.
- Đầu tiên đọc `AGENTS.md`, README, package/config chính, và file gần task.
- Nếu task liên quan runtime, đọc `P:\agent-rules\README.md`, `P:\agent-rules\docs\01-technical-specification.md`, và file cụ thể dưới `P:\agent-rules\codex`.
- Nếu task liên quan 5fedu, dùng skill `5fedu-project` (`.agents/skills/5fedu-project/SKILL.md`) hoặc `.agents/skills/5fedu-project/SKILL.md`.

## Trigger Map

| Ngữ cảnh / Từ khóa trong prompt | Skill/hành động tự kích hoạt |
|---|---|
| "setup 5fedu", "scaffold 5fedu", "cập nhật context 5fedu" | Skill `5fedu-project` để bảo trì/tạo context dự án |
| "research", "tìm trên internet", "xác minh mới nhất" | Skill `codex-research` để thu thập bằng chứng có nguồn |
| "sync codex", "runtime lệch backup không" | So `~/.codex` với backup `codex/`, dùng `/runtime-sync-audit` |
| "review", "audit", "kiểm tra lỗi" | Review theo bug/risk/regression/test gap trước, summary sau |
| "viết docs", "readme", "spec", "tài liệu", "badges" | Skill `docs-style` (README, spec, badge chuẩn) |
| "chụp ảnh màn hình", "screenshot", "browser verify", "playwright" | Skill `screenshot` hoặc `playwright` |
| "security", "threat model", "lỗ hổng", "bảo mật", "phân quyền" | Skill `security-best-practices` hoặc `security-threat-model` |
| "PDF", "xuất file PDF", "đọc file PDF" | Skill `pdf` (ReportLab / Poppler) |

## Stop Conditions

- Dừng hỏi người dùng khi thiếu credential, schema, quyền truy cập, hoặc yêu cầu có thể phá dữ liệu.
- Báo `BLOCKED` chỉ khi không thể tiến tiếp sau khi đã xác minh blocker.
- Báo `PARTIAL` khi đã làm được một phần nhưng còn verification hoặc thông tin chưa đủ.


---

## From: context-tools.md

# Context Tools

## Trigger

Áp dụng khi Antigravity cần:

- codebase context;
- external research;
- impact analysis;
- large log hoặc test triage;
- UI/browser QA;
- tool, MCP hoặc skill lookup;
- kiểm tra project-local context như 5fedu.

## Thứ Tự Đọc Context

1. Entry/index nhẹ: `AGENTS.md`, `00-index.md`, status/questions/source-map nếu có.
2. File gần task: source path, README/package/config liên quan.
3. Rule chi tiết đúng domain: DB/auth/UI/export/security/permission.
4. Impact/call graph nếu thay đổi shared code, API, schema, public type hoặc flow liên module.
5. External docs chỉ khi behavior/library/platform có thể thay đổi hoặc cần nguồn chính thức.

Không đọc toàn bộ context folder chỉ vì nó tồn tại.

## 5fedu Loading Policy

- Trước mọi task trong repo 5fedu: đọc `AGENTS.md`, `.agents/5fedu/00-index.md`, decision/status, `questions.md`, và source/spec map nếu task cần đối chiếu spec.
- Chỉ đọc `.agents/5fedu/02-*` khi đụng database/auth/schema/permission.
- Chỉ đọc `.agents/5fedu/03-*` khi đụng UI/UX/list/detail/form/export.
- Chỉ đọc `.agents/5fedu/10-*` và `12-*` khi task là feedback, nhắc lại lỗi cũ, vận tải, hoặc cần kiểm tra bài học đã được chuyển hóa chưa.
- File `10` và `12` là raw logs hoặc lesson logs; nếu có bài học dùng lại được, phải promote sang rule sống.

## 5fedu Smart Trigger Policy

Khi user yêu cầu `verify production hết`, `test production`, `kiểm tra live`, hoặc cách nói tương đương:

1. Không nhảy thẳng vào browser/test.
2. Đọc entry/index/mapping trước: `AGENTS.md`, `.agents/5fedu/00-index.md`, decision/status, questions, source/spec map.
3. Từ mapping suy ra module, role, database table, UI surface, export, cross-module flow bị ảnh hưởng.
4. Chỉ sau đó mới đọc context chi tiết đúng domain và chạy quality gates.
5. Báo cáo cuối phải nêu rõ context/mapping đã đọc và các context chi tiết được kích hoạt.

Khi task 5fedu dính UI hoặc user nói `chưa chuẩn`, `thiếu`, `không giống`, `chưa đủ`, `module còn thiếu`, `tính năng còn thiếu`:

1. Đọc index/mapping trước để xác định module và nguồn spec/template.
2. Tìm trong `/template` trước khi thiết kế hoặc sửa UI.
3. Nếu `/template` có mẫu đủ đáp ứng prompt/app, bám sát mẫu đó và chỉ đổi tối thiểu theo domain; không tự thêm UI/flow/behavior ngoài scope.
4. Chỉ dùng golden reference khi `/template` không có mẫu trực tiếp, mẫu không đủ hành vi cần làm, hoặc có bằng chứng đang ngõ cụt. Golden reference phải được chọn từ nhiều tab/module theo behavior/output/surface/data relationship/permission pattern; không mặc định một module chung cho mọi task.
5. So sánh `/template` hoặc reference đã chọn với code hiện tại trước khi sửa.
6. Nếu tìm không ra bằng tên module, tìm tiếp theo hành vi, từ đồng nghĩa nghiệp vụ, shared component, library/API, utility, service/query, test và cấu hình liên quan trước khi tự viết mới.
7. Báo cáo cuối phải có dòng `Template checked` hoặc nêu rõ vì sao không kiểm được.

## GitNexus Policy

Dùng GitNexus cho:

- unfamiliar code path;
- refactor, rename, move, delete;
- shared module change;
- public API hoặc type signature change;
- dependency/caller impact;
- MEDIUM/HIGH implementation;
- architecture review.

Không chạy `gitnexus analyze` mù quáng mỗi lượt. Nếu GitNexus stale hoặc unavailable, fallback bằng `rg` và file reads có mục tiêu, rồi ghi fallback trong báo cáo.

## Research Policy

Antigravity Research là lớp nghiên cứu chính cho:

- internet/docs research;
- changelog/release-note review;
- external platform behavior;
- codebase exploration trước implementation;
- second-pass reasoning;
- bug-fix escalation khi fix trực tiếp không hội tụ.

Ghi note nghiên cứu vào `plan/<feature>/research/*.md`, `plan/<feature>/review/*.md`, hoặc `plan/<feature>/handoff.md` khi task đủ lớn.

## Tool Output Rule

Large outputs:

- tóm tắt;
- lưu raw output chỉ khi cần;
- không paste log lớn vào chat hoặc plan.


---

## From: tool-inventory.md

# Tool / MCP / Skills Inventory Rules

## Trigger

Áp dụng khi:

- user cài CLI, tool, MCP, skill hoặc plugin mới;
- Antigravity phát hiện tool hữu ích đã cài;
- `C:\Users\DELL\.codex\config.toml` thay đổi;
- Antigravity Research, GitNexus, RTK, Node, Python, Flutter hoặc toolchain thay đổi;
- user yêu cầu chuẩn bị máy mới hoặc document setup;
- command fail/succeed vì tool thiếu hoặc vừa được thêm.

## Purpose

Giữ machine knowledge tái lập được. Máy mới phải restore được bằng docs và inventory dưới:

```text
C:\Users\DELL\.codex\docs
C:\Users\DELL\.codex\inventory
```

và bản sync:

```text
P:\agent-rules\codex
```

## Required Docs

Maintain:

```text
C:\Users\DELL\.codex\docs\
|- machine-profile.md
|- tool-registry.md
|- mcp-registry.md
|- skills-registry.md
|- bootstrap-new-machine.md
`- troubleshooting.md
```

Maintain machine-readable inventory:

```text
C:\Users\DELL\.codex\inventory\
|- tools.json
|- env.json
|- paths.json
|- codex-config.snapshot.toml
`- mcp-list.txt
```

## When Adding A CLI Or Tool

Record:

- name;
- purpose;
- install command;
- verify command;
- expected version or version policy;
- config path;
- env var names needed, never secret values;
- common failure;
- how Antigravity should use it;
- when Antigravity should not use it;
- runtime-critical or optional.

## When Adding An MCP

Record:

- MCP name;
- purpose;
- install command;
- `codex mcp add` command if applicable;
- config TOML block;
- verify command;
- required env var names;
- usage trigger;
- failure fallback;
- stale-output risk.

## When Adding A Skill

Record:

- skill name;
- runtime: Antigravity / local tool / plugin / both;
- path;
- purpose;
- trigger;
- inputs;
- outputs;
- scripts used;
- references/assets used;
- install/copy command;
- verify command.

## Secrets Policy

Never store secret values in docs.

Good:

- `OPENAI_API_KEY` required; set in user environment.

Bad:

- `OPENAI_API_KEY=sk-...`

Store only env var names, where to set them, and how to verify presence without printing values.

## Inventory Refresh

When user asks update inventory, sync setup, prepare new machine, or document tools:

```powershell
C:\Users\DELL\.codex\scripts\inventory-current-machine.ps1
```

Then update docs and sync:

```powershell
C:\Users\DELL\.codex\scripts\sync-codex-to-p.ps1
```


---


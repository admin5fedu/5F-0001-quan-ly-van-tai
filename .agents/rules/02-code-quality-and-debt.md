---
description: "Clean code và nợ kỹ thuật"
alwaysApply: true
---

# 02-code-quality-and-debt

## From: clean-code.md

# Clean Code Runtime Rules

## Trigger

Activate when writing, reviewing, refactoring, or testing code.

These rules apply across tech stacks and languages. Project-specific rules can add stricter constraints, but cannot weaken the baseline unless the user explicitly approves a trade-off.

## Philosophy

- Code is written for humans first.
- Optimize for future change.
- Easy to delete is better than clever abstraction.
- Easy to split is better than giant generic design.
- YAGNI beats premature DRY.
- Duplicate twice is acceptable; abstract around the third clear repetition.
- Behavior change and refactor should be separated when possible.
- Keep blast radius small.
- Treat clean code as a risk-control tool, not as a beauty contest.
- Prefer changes that reduce bug risk, hidden dependency, or reading cost.
- Do not chase cosmetic cleanup when it does not improve safety or maintainability.

## Structure

- Prefer feature or module ownership over global dumping ground.
- Do not create empty folders for tiny features.
- Keep public API small.
- Do not leak implementation details through barrel exports.
- Avoid broad cross-project refactor unless explicitly planned.

## Size guide

Soft thresholds:

- file: about 300 lines
- method or function: about 30 lines
- widget or component render or build: about 50 lines
- parameters: about 4 before introducing object, record, or config
- nesting: max about 3 before early return or helper extraction

Exceeding a threshold is allowed only when it improves readability.

Document trade-off if non-obvious.

## Naming

- Names should explain intent before comments explain mechanics.
- Boolean names should start with `is`, `has`, `can`, `should`.
- Async names should describe side effect.
- Do not hide I/O behind vague `getX`.

## State and async behavior

Every user action should cover:

- happy path
- validation / 4xx
- network or dependency failure

Rules:

- Do not throw raw backend errors into UI.
- Keep user input on retryable failures.
- Optimistic updates only for reversible actions.
- Pessimistic confirmation for destructive or irreversible actions.
- Avoid generic "something went wrong" when a concrete message is available and safe.

## Refactor rules

- Refactor should not change behavior.
- Behavior change requires acceptance criteria and tests.
- Avoid broad refactor before release or without verification.
- If same file fails twice with same symptom, stop and reassess root cause.
- Do not mix unrelated refactors with feature implementation.

## Cleanup classes

### Opportunistic cleanup

Allowed during normal feature/fix work when all are true:
- tiny
- same local context
- no behavior change
- reduces risk or reading cost

Examples:
- remove unused local variable
- remove dead helper in the same file
- rename local variable for clearer intent
- extract one deep conditional block in the file already being edited

### Guarded refactor

Requires:
- explicit plan
- scoped blast-radius check
- clear verification
- scope lock

Examples:
- split module
- internal API change
- deduplicate shared logic
- reduce coupling between modules

### Dead code cleanup

Dead code removal requires evidence.

Before deleting:
- check callers/importers with GitNexus when the code is shared
- use `rg` for direct text references
- check tests/runtime paths if relevant
- mark deprecated first if deletion risk is still uncertain

### Cosmetic cleanup

Avoid by default.

Examples:
- rename only for style taste
- split file just because it feels long
- broad DRY rewrite without concrete pain
- style-only churn across unrelated files

## GitNexus-guided cleanup

Use GitNexus before:
- deleting shared code
- renaming public/shared symbols
- moving files used across modules
- refactoring modules with unclear callers

Fallback to `rg` only when GitNexus is unavailable or the scope is trivially local.

## Practical questions

Before cleanup/refactor, ask:
- does this reduce bug risk?
- does this reduce future reading cost?
- does this reduce blast radius or hidden dependency?
- does this remove real dead code or dead export?
- is this still within the requested task scope?

If the answer is mostly "it just looks cleaner", do not prioritize it.

## Cleanup and artifact rules

Cleanup is allowed without asking when all are true:
- the item is clearly generated, cache, temporary output, stale one-off script, duplicate backup, or unused artifact;
- removing it cannot affect runtime behavior, build, tests, deploy, docs, or configured tools;
- references were checked with `rg` or a stronger graph/tool when shared;
- the cleanup is in the same task scope or happens before a requested push/commit.

Before deleting scripts, configs, migrations, seed files, fixtures, generated clients, or docs:
- check direct references with `rg`;
- check package scripts, CI, hooks, workflows, and README/docs;
- keep the file if it may still be an operational entrypoint;
- when uncertain, move to a planned cleanup note instead of deleting.

Gitignore policy:
- ignore secrets, local env, cache, build output, test output, logs, screenshots/videos produced during verification, downloaded export files, and temporary one-off scratch files;
- do not ignore source scripts that are part of build, test, sync, verification, migration, or runtime operation;
- do not hide generated files required by the app unless the build regenerates them deterministically and docs say so.

Protected agent/runtime files are not cleanup targets:
- `AGENTS.md`
- `.agents/AGENTS.md`
- `.agents/hooks.json`
- `.agents/rules/00-runtime-and-intent.md`
- `.agents/rules/01-agent-workflow-sop.md`
- `.agents/rules/02-code-quality-and-debt.md`
- `.agents/rules/03-context-and-tools.md`
- `.agents/workflows/*.md`
- `.agents/skills/*/SKILL.md`
- `.agents/5fedu/00-index.md`

Do not delete or gitignore these files as "unused context" or "duplicate rules". They preserve agent behavior and must only be changed intentionally.

## Testing

Prioritize:

- unit tests for pure logic, validators, mappers, state logic
- widget or component tests for visible states and interactions
- integration or E2E for critical flows

## AI-agent guardrails

- One turn = one clear task.
- Verify in the same turn.
- If plan is wrong, update plan before deviating.
- Stop when repeated fixes do not converge.
- For UI changes, use screenshot, manual, or browser evidence when relevant.

## CƠ CHẾ PHÒNG NGỪA LỖI HỒI QUY & KHÔNG ĐỒNG BỘ PATTERN (Anti-Regression & Pattern Parity Gate)

Để loại bỏ hoàn toàn các lỗi xàm xàm khi sửa code, nút bấm chết, hoặc lệch chuẩn pattern thiết kế:

1. **Đánh giá tác động hồi quy (Regression Impact Assessment)**:
   - Trước khi sửa đổi bất kỳ logic dùng chung nào, AI bắt buộc phải chạy `grep_search` kiểm tra mọi nơi đang gọi (call-sites), import hoặc phụ thuộc vào file đó.
   - Phải chứng minh các thay đổi không làm sập logic downstream của các bên liên quan.

2. **Đồng nhất Concept & Pattern thiết kế (Concept & Pattern Parity)**:
   - Khi tạo mới hoặc sửa đổi bất kỳ component UI nào, AI bắt buộc phải mở và phân tích nhất quán ít nhất 1 trang/component tương tự có sẵn của dự án để đối chiếu (font, layout, màu sắc, cách hiển thị lỗi, loading state).
   - Nút bấm (button) hoặc tương tác UI bắt buộc phải có:
     * Trạng thái `disabled` kèm loading spinner khi tác vụ async đang chạy để chống click đúp (Double-click prevention).
     * Bind sự kiện `onClick` hoạt động thực tế (cấm tuyệt đối code onClick rỗng).
     * Trạng thái trống (empty state) và thông báo lỗi rõ ràng.

3. **Xác thực tương tác thực tế (Interactive Verification)**:
   - Nếu có môi trường chạy (local server/live staging): Phải dùng browser subagent, Playwright hoặc chụp ảnh màn hình click thử các tương tác thực tế để lấy bằng chứng.
   - If không có môi trường chạy: Phải viết rõ **Dry Run Trace từng bước** trong thought block (onClick -> gọi API Payload -> Nhận Response -> Cập nhật State -> UI thay đổi thế nào) để tự phản biện logic.

## KỶ LUẬT PHÂN TÍCH NGHIỆP VỤ & PHÂN QUYỀN ĐA CẤP (Business Logic & Multi-Level Permission Discipline)

Để loại bỏ triệt để bệnh lười phân tích nghiệp vụ sâu và các thảm họa liên quan đến phân quyền đa cấp, nghiệp vụ chéo liên module:

1. **Kiểm soát phân quyền đa cấp (Multi-Level Permission Gate)**:
   - Tuyệt đối cấm việc chỉ test bằng tài khoản Admin rồi kết luận hoạt động tốt.
   - Bắt buộc phải xác định rõ ma trận phân quyền (Permission Matrix) của module: Admin, Dispatcher, Driver, Customer, Viewer, v.v.
   - Phải kiểm tra phân quyền ở cả tầng UI (ẩn/hiện các nút bấm, menu tùy vai trò) và tầng Backend/Database (RLS/Postgres policy, middleware API check).

2. **Bản đồ tác động nghiệp vụ liên module (Cross-Module Impact Map)**:
   - Khi chỉnh sửa dữ liệu ở bảng A (ví dụ: cập nhật trạng thái đơn hàng), AI bắt buộc phải đối chiếu tác động tới các bảng B, C liên quan (ví dụ: rollup tổng tiền đơn hàng, cascade update, kích hoạt database triggers, hoặc làm mới cache/query của các module downstream).
   - Phải phân tích rõ luồng nghiệp vụ liên hoàn này trước khi code.

3. **Cấm giả định nghiệp vụ (Zero Assumption)**:
   - AI không được tự đoán mò luồng nghiệp vụ. Bắt buộc phải đọc spec gốc của dự án, các file test cases, hoặc constraints trong database để tuân thủ chính xác logic nghiệp vụ của hệ thống.

## Path-specific behavior

### Fix path

- prioritize correctness
- allow only opportunistic cleanup unless plan says otherwise

### Feature path

- keep scope tight
- refactor only when it directly unblocks the feature or reduces obvious risk in the touched area

### Bug path

- if fixes stall, switch to research before more cleanup
- do cleanup after root cause is understood

### Cleanup path

- require a concrete objective: dead code, split module, reduce coupling, remove duplication, remove dead export
- avoid vague "make it cleaner"

### Shared-module path

- GitNexus check required before delete/rename/refactor when the surface is shared


---

## From: technical-debt-control.md

# Technical Debt Control

## Trigger

Áp dụng khi viết code, sửa lỗi, review, refactor, test, cleanup, hoặc chuẩn bị push/commit.

## Mục Tiêu

Không để task hoàn thành bằng cách đổi nợ kỹ thuật lấy tốc độ ngắn hạn mà không nhìn thấy chi phí. Nợ kỹ thuật không bị cấm tuyệt đối, nhưng phải được phát hiện, giới hạn, ghi nhận và xử lý khi nó tạo rủi ro thật.

## Debt Taxonomy

Phân loại nợ kỹ thuật theo tác hại:

- Correctness debt: logic sai ngầm, edge case bỏ qua, state lệch, cache không invalidated.
- Data debt: schema mơ hồ, migration không idempotent, dữ liệu test lẫn production, thiếu constraint, thiếu rollback.
- Permission debt: chỉ test admin, UI ẩn nhưng API vẫn mở, role/row filter không được verify.
- UX debt: flow thiếu trạng thái loading/error/empty, toolbar/filter/export hoạt động nửa vời, responsive vỡ.
- Architecture debt: coupling cao, shared module phình, generic hóa ép buộc, abstraction che behavior.
- Test debt: thiếu test/gate cho behavior mới hoặc regression quan trọng.
- Operational debt: script một lần không dọn, env/gitignore sai, build/deploy/checklist không tái chạy được.
- Knowledge debt: rule mới chỉ nằm trong chat/log, context không sync, quyết định chưa cập nhật.

## Debt Budget

Mỗi task chỉ được để lại nợ khi tất cả đúng:

- không phá acceptance criteria;
- không che lỗi nghiêm trọng;
- không tăng rủi ro data loss/security/permission;
- có lý do rõ vì sao chưa xử lý ngay;
- có vị trí ghi lại: plan, TODO có issue/link, backlog, hoặc final `Remaining debt`.

Không được để lại nợ loại này nếu có thể xử lý trong scope hợp lý:

- lỗi build/type/lint do chính task tạo;
- dead button, fake CRUD, mock data trong feature đã yêu cầu thật;
- permission chỉ test admin khi feature có phân quyền;
- export không tải/mở file thật;
- database write không đối chiếu record/policy khi có quyền;
- UI 5fedu không đối chiếu `/template` trước, hoặc fallback sang reference không cùng behavior/surface khi template thiếu/không đủ;
- context/rule mới chỉ nằm trong chat mà không promote/sync.

## Pre-Change Debt Check

Trước khi sửa task MEDIUM/HIGH:

1. Xác định vùng code có nợ sẵn hay không.
2. Phân biệt existing debt với debt do task tạo.
3. Không ôm cleanup rộng nếu nó không trực tiếp giảm rủi ro task.
4. Nếu phải chạm nợ sẵn, ghi rõ trong risk register hoặc final.

Có thể chạy quét tín hiệu nợ kỹ thuật trước khi audit sâu, trước cleanup lớn, hoặc trước push/commit:

```powershell
C:\Users\DELL\.codex\scripts\audit-technical-debt.ps1 -RepoRoot <repo>
```

Script này chỉ là signal scan, không phải verdict. Phải phân loại findings theo taxonomy trước khi sửa hoặc xóa.

## During-Change Controls

- Giữ diff nhỏ, theo module sở hữu.
- **Cấm Dùng Code Placeholder Khi Sửa Đổi (No Code Placeholders)**: Khi viết hoặc cập nhật các tệp mã nguồn, AI tuyệt đối không được sử dụng các comment viết tắt như `// ...`, `/* ... */`, `<!-- ... -->` để che giấu mã nguồn cũ hoặc mã nguồn chưa viết. Mọi thay đổi phải là mã thực thi hoàn chỉnh. Nếu tệp quá dài, hãy dùng công cụ chỉnh sửa khoanh vùng hẹp (như `replace_file_content`) thay vì ghi đè cả tệp bằng mã viết tắt.
- Không tạo generic abstraction trước khi có pattern thật.
- Không copy-paste logic nghiệp vụ mà không kiểm rule khác biệt.
- Không thêm dependency production nếu không có lý do mạnh và verification.
- Không bỏ qua error path/loading/empty state ở UI có user thao tác.
- Không thêm script tạm mà không có cleanup/gitignore hoặc docs dùng lại.
- Không tạo TODO mơ hồ; TODO phải có owner/context hoặc không viết.

## Pre-Done Debt Gate

Trước khi báo xong, tự kiểm:

1. Task có tạo nợ mới không?
2. Nợ đó thuộc taxonomy nào?
3. Có nợ nào đáng sửa ngay vì rủi ro cao hoặc nằm đúng scope không?
4. Có file tạm, script debug, artifact test, export download, screenshot/video cần dọn hoặc gitignore không?
5. Có context/rule/decision cần cập nhật để tránh lặp lỗi không?
6. Verification đã chứng minh không tăng nợ correctness/data/permission chưa?

Nếu có nợ nghiêm trọng trong scope, sửa tiếp rồi verify lại. Nếu không thể sửa ngay, báo `PARTIAL` hoặc ghi `Remaining debt` rõ ràng.

## Push/Commit Debt Gate

Trước khi stage/commit/push khi user đã yêu cầu:

1. Chạy `git status --short` để phân biệt thay đổi của agent và thay đổi có sẵn của user.
2. Dọn artifact rõ ràng: cache, log, screenshot/video test, file export download, script debug một lần.
3. Kiểm `.gitignore` có che đúng artifact ngoài lề nhưng không che source script/build/test/migration cần dùng.
4. Với file bị xóa: có bằng chứng reference check bằng `rg`, GitNexus, package scripts, CI, docs hoặc tool mạnh hơn.
5. Không stage thay đổi ngoài scope nếu không cần cho task.
6. Nếu còn debt nghiêm trọng trong scope, không push như `PASS`; báo `PARTIAL` hoặc sửa tiếp.

## Protected Runtime Debt Gate

Các file ép hành vi agent không được coi là nợ kỹ thuật chỉ vì chúng là context/rules:

- `AGENTS.md`, `codex/AGENTS.md`
- `.agents/rules/00-runtime-and-intent.md`
- `.agents/rules/01-agent-workflow-sop.md`
- `.agents/rules/02-code-quality-and-debt.md`
- `.agents/rules/03-context-and-tools.md`
- `.agents/rules/codex-overlay.md`
- `.agents/rules/platform-boundary.md`
- `codex/skills/*/SKILL.md`
- `.agents/5fedu/00-index.md`

Nếu agent định xóa, gộp, rename hoặc gitignore các file này, phải dừng và chứng minh file không còn vai trò kích hoạt context/gate/final status. Mặc định là giữ.

## Debt Evidence Format

Với task vừa/lớn, report nên có:

```text
Technical debt check:
- New debt: none | <items>
- Reduced debt: <items>
- Remaining debt: none | <items + reason>
- Cleanup/gitignore: <what was checked>
```

Nếu có report file, có thể kiểm bằng:

```powershell
C:\Users\DELL\.codex\scripts\validate-task-evidence.ps1 -ReportPath <path> -Mode generic
```

Mẫu report có sẵn:

```text
C:\Users\DELL\.codex\templates\task-evidence-template.md
C:\Users\DELL\.codex\templates\technical-debt-register.md
```

## 5fedu-Specific Debt Rules

- Production-first verification là nợ nếu code đã push/deploy nhưng chưa verify production và không có blocker rõ.
- UI không theo `/template` khi template đủ, hoặc fallback reference không cùng behavior/surface khi template thiếu/không đủ, là nợ nghiêm trọng.
- Generic CRUD hời hợt cho module nghiệp vụ là nợ kiến trúc và UX.
- Derived totals cho phép nhập tay là nợ correctness/data.
- Permission chưa test đa account/đa cấp là nợ permission.
- Supabase schema/auth rule không sync với context là nợ knowledge.
- Toolbar/filter/export thiếu behavior thật là nợ UX/test.


---


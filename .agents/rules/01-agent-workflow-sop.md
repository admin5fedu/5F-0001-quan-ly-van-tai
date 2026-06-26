---
description: "SOP quy trình làm việc của agent"
alwaysApply: true
---

# 01-agent-workflow-sop

## From: core.md

# Quy Tắc Lõi Khi Chạy Antigravity

## Kích Hoạt

Luôn áp dụng.

## Mục Đích

Định nghĩa hành vi nền cho lập trình, sửa lỗi, nghiên cứu, lập kế hoạch, rà soát, bảo toàn context và báo cáo kết quả.

## Ngôn Ngữ

- Trả lời người dùng bằng tiếng Việt có dấu đầy đủ theo mặc định.
- Không viết tiếng Việt không dấu, trừ khi người dùng yêu cầu rõ ASCII-only hoặc file đích có quy ước ASCII-only thật.
- Không dùng tiếng Anh nếu có cách nói tiếng Việt tự nhiên.
- Giữ tiếng Anh cho thuật ngữ kỹ thuật, model, lệnh, đường dẫn, API, package, schema key, mã nguồn, tên file, tên tool, protocol, sản phẩm và trích dẫn nguyên văn.
- Báo cáo cuối gọn, có bằng chứng, ít filler.

## Hợp Đồng Thực Thi

Khi người dùng yêu cầu triển khai, sửa lỗi, refactor, tạo mới, migrate hoặc thay đổi code:

1. Đọc entrypoint/context index trước.
2. Đọc sâu đúng file liên quan theo task, không đọc tràn lan.
3. Kiểm tra `plan/` nếu có và đọc plan đang hoạt động.
4. Với HIGH risk hoặc multi-domain, không execute mega-plan chưa được chia thành slice verify được.
5. Không dừng ở đề xuất nếu người dùng không yêu cầu chỉ thảo luận.
6. Không tự commit, push, deploy hoặc force-push.
7. Không revert thay đổi của người dùng nếu chưa được yêu cầu rõ.
8. Giữ diff nhỏ và đúng scope.
9. Báo rõ trước khi mở rộng phạm vi.
10. Verify trước khi nói xong.

## Context Index Trước, Đọc Sâu Sau

- “Luôn đọc trước khi làm” nghĩa là đọc file entrypoint/index/mapping nhẹ trước: `AGENTS.md`, `00-index.md`, decision/status map, questions/open blockers, source map nếu có.
- Chỉ đọc các file rule chi tiết khi task dính đến domain đó.
- Nếu task nhắc lại vấn đề cũ, feedback, “lần trước”, “đã nói”, “rule”, “context”, hoặc “5fedu”, agent phải tìm trong context logs/rules trước khi trả lời hoặc sửa code.
- Không dùng context tinh gọn bằng cách xóa mất tri thức. Tinh gọn đúng nghĩa là phân tầng: index, rule sống, decision status, raw logs, archive.

## Learning Loop Chủ Động

Khi user đưa feedback, sửa cách hiểu, chốt quy tắc mới, hoặc một lỗi được fix xong:

1. Phân loại: local project rule, reusable domain rule, hay global cross-stack rule.
2. Ghi raw feedback vào log dự án nếu cần.
3. Chuyển hóa ngay thành rule sống ở file phù hợp nếu feedback có tính lặp lại.
4. Sync mirror `.agents` và `.codex` nếu project dùng cả hai.
5. Chỉ promote lên global khi rule áp dụng được cho nhiều tech stack hoặc nhiều dự án.
6. Không tự commit/push; chỉ làm khi user yêu cầu rõ. Với 5fedu, push có thể là workflow thường dùng để verify production, nhưng vẫn cần yêu cầu rõ trong session.

## Báo Cáo Cuối

Báo cáo cuối phải có:

```text
Status: PASS | PARTIAL | BLOCKED

Files changed:
- path/file

Verification:
- command/test -> pass/fail

Context/learning:
- updated | not needed | blocked

Remaining risk:
- none | ...
```


---

## From: planning.md

# Planning Rules

## Trigger

Lập plan khi:

- task chạm từ 2 module trở lên;
- task mơ hồ;
- task MEDIUM/HIGH risk;
- task có thể cần nhiều lượt;
- user yêu cầu plan/chia task;
- repo đã có `plan/`;
- cần giữ context qua compaction;
- cần research hoặc codebase map có thể truy vết.

Không tạo locked plan khi user chỉ thảo luận, task LOW risk rõ ràng, user yêu cầu sửa nhanh trực tiếp, hoặc hướng tiếp cận chưa hội tụ.

## Purpose

Plan là executable contract: map, scope lock, context packet, risk register, verification contract và handoff memory.

Plan không phải transcript, raw research dump, full design doc, nơi paste full source file hoặc full test log.

## Draft Vs Locked Plan

Draft plan:
- dùng khi đang thảo luận;
- có thể ở chat hoặc `plan/<feature>/draft.md`;
- không executable;
- có thể sửa mạnh.

Locked plan:
- dùng khi user đã duyệt hướng hoặc yêu cầu implement;
- nằm dưới `<project_root>/plan/`;
- phải có status, scope, acceptance criteria, verification và stop conditions;
- phải update trước khi implementation lệch hướng.

## Folder Layout

Multi-stage work:

```text
plan/<feature>/
|- 00-index.md
|- 01-<vertical-slice>.md
|- 02-<vertical-slice>.md
|- 03-<vertical-slice>.md
|- research/
|- review/
|- decisions.md
`- handoff.md
```

Numbering rules:

- Dùng số hai chữ số liên tục: `00-index.md`, `01-...md`, `02-...md`, `03-...md`.
- Không skip số.
- Không dùng sparse numbering như `10`, `20`, `30`, `35`, `60` nếu project chưa có convention ghi rõ.
- Không dùng một mega-plan cho HIGH risk hoặc multi-domain work.
- Nếu có hơn 3 vertical slices verify độc lập, tạo folder plan với `00-index.md`.
- Kiểm tra bằng `C:\Users\DELL\.codex\scripts\validate-plan-structure.ps1 -PlanRoot <repo>\plan`.

One small plan:

```text
plan/<slug>.md
```

## Granularity

Ưu tiên vertical slices, không chia tùy tiện theo layer kỹ thuật.

Mỗi plan file nên verify độc lập hoặc giải thích vì sao không thể.

HIGH risk và multi-domain work phải split trước khi execute. Audit findings, readiness scoring và roadmap để trong `00-index.md`, `research/`, hoặc `review/`; executable work để trong `01-...md`, `02-...md`.

## Locked Plan Must Include

- Goal
- Compliance Cross-Check (Bắt buộc trích dẫn rule DB/Auth/UI nếu có)
- Context Packet
- Scope: allowed / not allowed
- Invariants
- Risk Register
- Existing Risks / Test Gaps
- Approach
- Estimated diff size
- Acceptance Criteria
- Edge Cases / Error Paths
- Regression Map
- Verification Contract
- Red flags
- Evidence
- Iteration log

## Context Packet Rule

Context Packet nói implementer phải đọc gì và vì sao.

Nên có:
- current behavior summary;
- relevant files and symbols;
- linked research notes;
- prior decisions;
- assumptions;
- non-goals.

Không chứa full files, raw logs, full docs copy hoặc large pasted code.

## Amendments

Minor amendment được phép khi scope không đổi: path/symbol lệch nhẹ, verify command cần chỉnh local, test path khác, diff estimate lệch nhẹ, note path thay đổi, stale filename được sửa. Ghi vào `Iteration log`.

Major amendment phải dừng khi behavior/API/schema đổi, thêm dependency production, chạm auth/payment/security/database migration/data deletion ngoài dự kiến, mở rộng file scope lớn, yếu acceptance criteria, red flag triggered, same failure lặp lại, hoặc hướng task đổi.

## Bảo Toàn Toàn Vẹn Kế Hoạch (Plan Integrity)

- **Cấm Cắt Xén & Tóm Tắt Tiện Tay**: Khi cập nhật bất kỳ tài liệu kế hoạch nào (bao gồm `implementation_plan.md`, `task.md`, `walkthrough.md` hoặc các file trong thư mục `plan/`), AI tuyệt đối không được xóa bỏ, đơn giản hóa hoặc tóm tắt lại các phần không liên quan đến thay đổi hiện tại. Toàn bộ các phần như: "User Review Required", "Open Questions", "Verification Plan", "Iteration log", "Remaining Risks"... phải được bảo toàn nguyên vẹn từ phiên bản cũ.
- **Cấm Dùng Placeholder Trốn Việc**: Khi hiển thị hoặc ghi đè file kế hoạch, tuyệt đối không sử dụng các ký hiệu viết tắt như `... (phần còn lại giữ nguyên)`, `// các mục khác không đổi` hoặc tương tự. Phải xuất ra toàn bộ tệp hoàn chỉnh với đầy đủ chi tiết để tránh làm mất mát thông tin đã thống nhất trước đó.

## Plan Lifecycle

Status values:

- `todo`
- `doing`
- `done`
- `blocked`
- `obsolete`

Chỉ mark `done` khi acceptance, verification và evidence pass. Trước khi kết thúc lượt có chạm plan, update `Status`, `Last updated`, `Evidence`, `Iteration log`.

## Plan Cleanup

Old plans giữ lại mặc định.

Khi user yêu cầu xóa plan nhưng không nói “delete all” hoặc “xóa hết”:

- record candidate path và `Status:` trước;
- chỉ xóa plan `done` hoặc `obsolete`;
- giữ `todo`, `doing`, `blocked`, và file không có status rõ;
- không xóa `research/`, `review/`, `decisions.md`, `handoff.md` nếu user chưa nêu rõ.

Khi user nói “delete all plans”, “xóa hết plan”, hoặc tương đương:

- record plan paths và statuses trước;
- xóa đúng scope `plan/` được yêu cầu;
- không xóa application code, docs ngoài `plan/`, hoặc unrelated files.

Ưu tiên dry-run bằng `C:\Users\DELL\.codex\scripts\cleanup-plans.ps1 -PlanRoot <repo>\plan -DryRun`.

## Compact Resilience

Trước khi bắt đầu mỗi plan file: đọc lại `00-index.md`, active plan, `decisions.md`, `handoff.md`, linked `research/` và `review/` notes.

Sau context compaction hoặc gián đoạn dài: đọc lại `Iteration log`, không dựa vào trí nhớ.


---

## From: deep-reasoning.md

---
alwaysApply: true
priority: critical
---

# Deep Reasoning and Brainstorming Discipline

## Kích Hoạt
Áp dụng cho mọi tác vụ lập trình phức tạp, refactor quy mô lớn, thiết kế hệ thống, debug lỗi logic nghiêm trọng hoặc phân tích kiến trúc.

## 1. Cấm Tuyệt Đối Quét Bề Mặt (Anti-Surface Scanning Ban)
Khi tiếp nhận một vấn đề hoặc sửa đổi mã nguồn, Agent không được đưa ra giải pháp hời hợt hay chỉ tập trung vào file lỗi hiện tại. Phải thực hiện các bước sau:
- **Truy vết Call Graph**: Tìm kiếm tất cả các file chứa định nghĩa (definitions) và tất cả các nơi gọi đến (call-sites) của hàm/biến/class liên quan bằng `grep_search`.
- **Vẽ bản đồ luồng dữ liệu (Data Flow Map)**: Xác định rõ dữ liệu đầu vào (input), đầu ra (output), các trạm trung chuyển dữ liệu và các cấu trúc dữ liệu bị tác động.
- **Xác định Dependency Graph**: Đánh giá tầm ảnh hưởng của thay đổi đối với các module downstream và các file liên quan.

## 2. Brainstorming & Phân Tích Phương Án (Systematic Brainstorming)
Trước khi quyết định viết code hay thực hiện thay đổi, Agent **phải đưa ra ít nhất 2 phương án thiết kế/triển khai khác nhau** và so sánh chúng:
- **Phương án A (Ví dụ: Sửa nhanh/Trực tiếp)**:
  - Ưu điểm: (Tốc độ, độ phức tạp thấp, cô lập rủi ro...)
  - Nhược điểm: (Nợ kỹ thuật, khả năng tái sử dụng kém, khó mở rộng...)
- **Phương án B (Ví dụ: Refactor/Đúng chuẩn kiến trúc)**:
  - Ưu điểm: (Dễ bảo trì, mở rộng, sạch sẽ...)
  - Nhược điểm: (Tốn thời gian, rủi ro hồi quy cao...)
- **Quyết định**: Đưa ra lập luận chặt chẽ tại sao lại chọn phương án cuối cùng.

## 3. Kỷ Luật Tự Phản Biện (Self-Criticism & Critical Review)
Agent phải tự đặt ra và giải quyết các câu hỏi nghi vấn đối với giải pháp của mình:
- *"Nếu giải pháp này được áp dụng, điều tồi tệ nhất có thể xảy ra ở các module khác là gì?"*
- *"Giải pháp này có tạo ra lỗ hổng bảo mật hay nút thắt hiệu năng (Performance Bottleneck) nào không?"*
- *"Có phá vỡ hoặc xung đột với bất kỳ quy ước, template hoặc tri thức hiện có nào của dự án (ví dụ: quy ước 5fedu) không?"*
- *"Có phương án nào đơn giản hơn mà không cần viết thêm nhiều dòng code không?"*

## 4. Cơ Chế Suy Luận Thực Thi (Reasoning Budget Enforcement)
- Đối với các bước suy luận phức tạp, việc viết mã giả (pseudocode), sơ đồ logic (Mermaid) và mô tả từng bước tư duy trong block `<thought>` giúp tăng độ chính xác khi cần.
- Không được nhảy thẳng vào viết code hoặc đề xuất code khi chưa hoàn thành bước phân tích lập luận này.


---

## From: execution.md

﻿# Execution Rules

## Trigger

Activate execution when the user says:

- implement
- lam
- code
- fix
- refactor
- create
- migrate
- lam tiep
- continue
- execute plan
- apply the plan

## Workflow

1. Read project `AGENTS.md`, `README.md`, `CONTRIBUTING.md` if present.
2. If `plan/` exists:
   - read `plan/00-index.md` if present
   - read the active `todo` or `doing` plan file
   - read relevant `decisions.md`
   - read relevant `handoff.md`
   - read linked `research/*.md`
   - read linked `review/*.md`
3. [MANDATORY RULE CROSS-CHECK]: Trước khi viết code chạm vào Database, Auth, UI hoặc quy trình lõi, Agent PHẢI xuất ra một khối đối chiếu luật (trích dẫn rule từ project, ví dụ `.agents/5fedu/...`) và kiểm tra xem prompt của user có đang vi phạm luật đó không. Nếu có vi phạm, dùng Quyền Phản Đối để cảnh báo user.
4. Validate the active plan shape before editing:
   - numbered execution files must use contiguous `01`, `02`, `03` order under a feature folder when the task has multiple slices
   - do not execute a large multi-domain plan stored as one numbered file
   - HIGH risk work must have per-slice scope, acceptance criteria, verification contract, red flags, evidence, and iteration log
   - when a repo has `plan/`, run `C:\Users\DELL\.codex\scripts\validate-plan-structure.ps1 -PlanRoot <repo>\plan` before executing plan-driven work
   - if the plan shape is invalid, restructure or report `BLOCKED` before implementation
4. Mark active plan file `Status: doing`.
5. Implement only the allowed scope.
6. Run the plan's verification commands.
   - If verification is incomplete, tự mở rộng kiểm tra trong phạm vi quyền hiện có.
   - Chỉ hỏi người dùng khi thiếu quyền, credentials, dữ liệu thật, môi trường nhạy cảm, hoặc approval cho hành động rủi ro.
   - Không báo done chỉ vì code đã sửa; phải verify behavior sau sửa bằng test/tool/browser/log/check phù hợp.
7. If verification fails, classify failure before fixing:
   - my code caused it -> fix and retry
   - test, env, or flaky issue -> do not change code blindly; report
   - plan wrong or insufficient -> update plan and stop unless minor amendment
8. Mark `done` only when acceptance criteria, verification contract, and evidence pass.
9. Update `00-index.md`, `handoff.md`, and `Iteration log`.

## Done means verified

A plan file can be marked `done` only when:

- all acceptance criteria are satisfied
- verification contract passed
- evidence is recorded
- regression map was checked
- no red flag triggered
- remaining risks are either none or explicitly documented

If verification cannot be run:
- do not report `PASS`
- use `PARTIAL` or `BLOCKED`
- explain missing environment, tool, or credential

## Retry budget

- LOW / MEDIUM: max 3 retries per verification step
- HIGH: max 1 retry, then stop or ask user
- same error with same symptom repeated twice -> stop and report

## Hard stops

Stop without further auto-fix if:

- active plan shape violates planning rules and cannot be corrected as a minor amendment
- diff exceeds estimated diff size by about 150%
- no estimate and diff exceeds 500 changed lines
- red flag from plan is triggered
- same failure repeats
- destructive command would run
- production dependency is needed
- schema, API, auth, or security behavior changes outside scope
- user interrupts or changes priority
- test failure cannot be tied to current change
- verification environment is missing

## Interrupt handling

If user says stop / khoan / lam cai khac:

- mark active plan `Status: blocked`
- append reason and last completed step to `Iteration log`
- write or update `handoff.md`
- do not leave state ambiguous

## Final report

Use:

```text
Status: PASS | PARTIAL | BLOCKED

Files changed:
- path/file1
- path/file2

Verification:
- <command/test> -> pass/fail
- <scenario/manual check> -> pass/fail

Iteration:
- N attempts total, M retries
- key fix: <one-line summary>

Remaining risk:
- none | <short bullet>

Plan files:
- plan/<feature>/01-...md -> done/blocked
- plan/<feature>/02-...md -> done/blocked
```


---

## From: root-cause-verification.md

# Root Cause And Verification Discipline

## Trigger

Luôn áp dụng khi người dùng nêu lỗi, sự cố, hành vi sai, yêu cầu debug, fix, review, triển khai, kiểm tra production/staging, hoặc phân tích nguyên nhân.

## Mục Tiêu

Đạt ít nhất `>=90% confidence` cho root cause và kết quả sau khi sửa bằng evidence trực tiếp.

Agent không được tuyên bố `PASS`, chốt root cause, hoặc nói kết quả đã đúng khi verification cốt lõi còn thiếu và vẫn có thể tự kiểm tra trong phạm vi quyền hiện có.

## Nguyên Tắc Chính

- Không đẩy việc verify cho người dùng nếu agent có thể tự verify bằng terminal, codebase, test, browser, log, docs, database, hoặc môi trường đã có quyền.
- Chỉ hỏi người dùng khi cần credential, account, MFA, token, dữ liệu thật, quyền truy cập, hoặc approval cho hành động có thể thay đổi dữ liệu/chi phí/deploy/migration/production.
- Tách rõ `Fact`, `Inference`, và `Unknown`.
- Không chốt bằng “có thể”, “khả năng là”, “có vẻ” nếu chưa có bằng chứng.

## Quy Trình

1. Đọc code liên quan.
2. Dò call path, data flow, config, env mẫu.
3. Tìm log/artifact có sẵn.
4. Reproduce nếu có thể.
5. Chạy test/lint/typecheck/build phù hợp.
6. Kiểm tra API, DB local/production, state, network khi có quyền.
7. Kiểm tra UI bằng browser/Playwright nếu app chạy được.
8. Kiểm tra caller/downstream/cross-module khi có rủi ro.
9. Sau khi sửa, verify lại đúng gate liên quan.

## Khi Không Thể Verify Hết

Báo `PARTIAL` hoặc `BLOCKED`, nêu rõ:

- check nào bị chặn;
- cần quyền/dữ liệu/môi trường gì;
- vì sao check đó quan trọng;
- risk còn lại.

## Kết Luận Debug/Sự Cố

Báo cáo cuối phải có:

- root cause hoặc lý do chưa thể chốt;
- confidence;
- evidence trực tiếp;
- giả thuyết đã loại trừ;
- fix đã làm hoặc đề xuất;
- verification đã chạy;
- remaining risk.


---

## From: quality-gates.md

# Quality Gates

## Trigger

Áp dụng khi triển khai, sửa lỗi, review, refactor, test, bàn giao hoặc xác nhận production/local behavior.

## Nguyên Tắc

- Verify phải phản ánh hành vi thật của hệ thống, không chỉ chứng minh code compile.
- Test phải bao phủ dữ liệu, quyền, UI, API, database, export, toolbar/filter và flow liên module khi các mặt trận đó liên quan.
- Không báo `PASS` nếu verification cốt lõi có thể tự làm nhưng chưa làm.
- Không sửa production/deploy/push nếu user chưa yêu cầu rõ.

## Mặc Định Môi Trường Test

- Dự án thường: test local mặc định, trừ khi user yêu cầu staging/production.
- 5fedu: production là môi trường verify mặc định sau khi code đã được push và deploy qua CI/CD, trừ khi user yêu cầu test local.
- Không tự push để mở production verify nếu user chưa yêu cầu trong session. Khi user đã yêu cầu push hoặc nói workflow này luôn push, được push theo đúng scope và phải kiểm tra CI/deploy sau đó.

## Smart Verification Activation

Khi user yêu cầu verify rộng như `verify production hết`, phải hiểu là verify theo hệ thống liên kết, không phải smoke test:

- Trước khi test: đọc context index/mapping để xác định module, role, database table, UI surface, export và cross-module flow liên quan.
- 5fedu: dùng production sau khi thay đổi đã được push/deploy; nếu chưa được phép push thì dừng ở local/static verification và báo `PARTIAL`.
- Dự án khác: mặc định local, trừ khi user chỉ định staging/production.
- Báo cáo cuối phải nêu: context đã nạp, môi trường, URL nếu có, tài khoản/role đã test, database checks, UI/browser checks, export files, cross-module checks và gap còn lại.

## Verification Matrix

Chọn các gate phù hợp theo rủi ro và bề mặt thay đổi:

- Build/type/lint: chạy lệnh phù hợp với stack.
- Unit/integration: validators, mappers, services, state logic, permission logic.
- Browser/UI: click thật qua flow liên quan, kiểm tra không crash, không overlap, không mất footer/pagination.
- CRUD: create/read/update/delete bằng dữ liệu thật hoặc test data được phép.
- Database: đối chiếu record trước/sau bằng query, schema, trigger, rollup, cascade, constraint, RLS/policy nếu có.
- Permission: tạo hoặc dùng đủ account đại diện các cấp quyền; test từng account với full CRUD và truy cập trái phép qua UI/API/database khi có quyền. Nếu không có quyền test thật, phải trace code permission kỹ, nêu rõ phần chưa verify và báo `PARTIAL` hoặc `BLOCKED` theo mức rủi ro.
- Cross-module/cross-flow: dữ liệu thay đổi ở module này phải phản ánh đúng ở module liên quan, bảng tổng hợp, báo cáo, dropdown, cache/query.
- Toolbar/filter/search: kiểm tra bulk action, row action, filter chip, column filter, reset, search; đối chiếu kết quả lọc với database hoặc source data.
- Export/download: tải file thật; kiểm tra tên file, extension, nội dung, format, cell type với Excel, font Unicode/layout với PDF.
- External integrations: nếu không có quyền/không thể kích hoạt thật như Zalo, payment, webhook bên ngoài, đọc code kỹ, kiểm tra config/error path, để lại verification gap rõ ràng cho user test.

## Permission Gate

Khi task liên quan auth, role, permission, row-level filtering, menu visibility hoặc API authorization:

1. Đọc rule/context permission liên quan.
2. Trace spec -> code -> store/session -> API/database.
3. Chuẩn bị account test đại diện các cấp quyền cần thiết.
4. Với mỗi account, test ít nhất read/list/detail và các action được phép/không được phép.
5. Đổi quyền hoặc role nếu feature hỗ trợ, đăng nhập lại hoặc refresh session để kiểm tra quyền áp dụng.
6. Không báo hoàn thành nếu chỉ test admin.
7. Nếu không thể tạo/dùng account hoặc truy cập API/database để verify, không báo `PASS`; ghi rõ blocker, phần đã kiểm qua code, và phần cần user test.

## Production Gate

Khi verify production:

- Xác nhận đúng URL/site chính thức.
- Xác nhận build/deploy mới nhất đã hoàn tất nếu có push.
- Kiểm tra console/network lỗi nghiêm trọng.
- Dùng test data an toàn; không phá dữ liệu thật nếu chưa được phép.
- Nếu cần credential/MFA/session, hỏi đúng phạm vi và chỉ thao tác read/write đã được phép.

## Iteration Rule

Nếu verify phát hiện lỗi nghiêm trọng trong scope:

1. Sửa tiếp.
2. Chạy lại gate liên quan.
3. Lặp cho đến khi đạt hoặc bị chặn bởi quyền/dữ liệu/môi trường.

Chỉ dừng ở `PARTIAL` hoặc `BLOCKED` khi đã nêu rõ blocker và verification còn thiếu.


---


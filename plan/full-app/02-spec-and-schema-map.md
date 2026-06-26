# 02 Spec And Schema Map

Status: doing
Last updated: 2026-05-30

## Goal

Map ảnh/spec + Google Sheet nếu được cấp sang domain/module/view/tab/schema/service.

## Scope

Allowed:

- Create mapping docs.
- Create schema draft/migration draft.
- Record blockers for missing Google Sheet or "hàm index".

Not allowed:

- Run production migration without final confirmation.

## Acceptance Criteria

- Every known module from source examples is mapped or marked demo/placeholder with reason.
- Database tables and fields follow 5fedu format.
- Missing info is explicitly listed.

## Verification Contract

- Mapping cross-check against `.agents/5fedu/08-source-examples.md`.
- Schema naming review.

## Evidence

- Sheet 1 exported to `output/sheets/TAH-APP.xlsx`.
- Structured extraction: `output/sheets/TAH-APP.analysis.json`.
- Survey note: `plan/full-app/research/01-google-sheets-survey.md`.
- Extracted 12 views/modules, 11 database tables, 15 monthly data sheets, and 6 `Fix app` items.
- Sheet 2 requires Google auth/share permission before extraction.

## Iteration Log

- 2026-05-30: Created.
- 2026-05-30: Started Google Sheet survey and schema/view mapping from Sheet 1.


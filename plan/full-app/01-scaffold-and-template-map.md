# 01 Scaffold And Template Map

Status: doing
Last updated: 2026-05-30

## Goal

Đưa app root lên nền template 5fedu và lập bản đồ source template.

## Scope

Allowed:

- Copy template files from `.agents/template-source/TAH_app` into repo root, excluding template `.git`.
- Preserve `AGENTS.md`, `.codex/`, and `plan/`.
- Inspect route/sidebar/auth/data source structure.

Not allowed:

- Store secrets.
- Replace project context files.

## Acceptance Criteria

- App root has Vite/React files.
- Template source remains untouched.
- Template mapping notes are recorded.

## Verification Contract

- `npm install` if needed.
- `npm run build` after scaffold if dependencies are available.
- Inspect `package.json`, route files, Supabase client, auth files.

## Evidence

- Template source cloned in `.agents/template-source/TAH_app`.
- Template files scaffolded into app root.
- Source map recorded in `plan/full-app/research/02-template-source-map.md`.

## Iteration Log

- 2026-05-30: Started.
- 2026-05-30: Mapped existing template routes/features against Sheet 1.


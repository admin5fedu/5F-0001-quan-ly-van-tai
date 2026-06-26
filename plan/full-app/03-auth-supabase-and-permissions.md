# 03 Auth Supabase And Permissions

Status: doing
Last updated: 2026-05-30

## Goal

Implement real Supabase client/auth flow and app-side permission model.

## Scope

Allowed:

- Fake email login mapping, e.g. `admin` -> `admin@gmail.com`.
- Disable register route/UI.
- Configure env placeholders.
- App-side permissions using `xem/them/sua/xoa/quan_tri`.

Not allowed:

- Store secret values in repo.
- Use service role in frontend.
- Add RLS logic as primary permission layer unless explicitly planned.

## Acceptance Criteria

- Supabase env validation is clear.
- Login/register behavior follows 5fedu.
- Permission module keys use module slug only.

## Verification Contract

- Unit tests where available.
- Manual browser smoke after env is configured.

## Evidence

- Added `.env.example` with Supabase/Cloudinary env names only, no secret values.
- `lib/data/config.ts` now defaults to `supabase`.
- `lib/supabase/client.ts` accepts `VITE_SUPABASE_PUBLISHABLE_KEY` or `VITE_SUPABASE_ANON_KEY`.
- `pages/Login.tsx` default password changed to `5fedu.com` and login now calls `getAuthService().signIn`.
- `App.tsx` redirects `/dang-ky` and `/register` to `/dang-nhap`.
- Permission module keys changed from route-shaped ids to module slug keys.
- Verification: `npm run build` passed.
- Verification: `npm test` passed, 14 files / 92 tests.
- Browser smoke: `http://127.0.0.1:5173/dang-nhap` shows username `admin`, password `5fedu.com`, no register link, app title `TAH APP`.

## Iteration Log

- 2026-05-30: Created.
- 2026-05-30: Implemented first auth/Supabase/permission-key baseline fixes from Sheet 1 and 5fedu rules.
- 2026-05-30: Ran Playwright smoke on login page while Sheet 2 sign-in remains open in tab 0.

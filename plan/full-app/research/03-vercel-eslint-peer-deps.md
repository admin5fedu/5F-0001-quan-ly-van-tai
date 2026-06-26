# Vercel ESLint Peer Dependency Research

## Summary

Vercel install failed because the project used `eslint@10`, while `eslint-plugin-jsx-a11y@6.10.2` only declares peer support up to ESLint 9. The fix is to keep ESLint on latest major 9 for now and keep normal npm peer resolution enabled.

## Evidence

- `npm view eslint version` returned latest ESLint `10.4.1`.
- `npm view eslint-plugin-jsx-a11y@6.10.2 peerDependencies` returned `eslint: ^3 || ^4 || ^5 || ^6 || ^7 || ^8 || ^9`.
- `npm view typescript-eslint@8.56.1 peerDependencies` accepts `eslint: ^8.57.0 || ^9.0.0 || ^10.0.0`.
- `npm view eslint-plugin-react@7.37.5 peerDependencies` accepts ESLint 9.7+.
- `npm view eslint-plugin-react-hooks@7.0.1 peerDependencies` accepts ESLint 9.

## Recommendation

- Pin `eslint` and `@eslint/js` to latest major 9 (`^9.39.4`) until `eslint-plugin-jsx-a11y` publishes ESLint 10 peer support.
- Do not use `--legacy-peer-deps` or force installs; clean `npm install`/`npm ci` must work.
- Keep `.npmrc` with `audit=false` and `fund=false` so deployment install logs focus on build/install failures. Security audit remains a separate quality gate/backlog, not a deployment install step.

## Risks

- `npm audit --omit=dev` still reports production advisories in `xlsx`, `vietqr`/old `axios`, `jspdf`, `dompurify`, `postcss`, `vite`, and related transitive packages. These are not peer dependency failures, but they need a focused package replacement/upgrade pass before final production hardening.
- `xlsx` has no fixed npm version according to current npm audit output, so replacing SheetJS with another maintained spreadsheet library may be required later.

## Unknowns

- Whether the Vercel project overrides install/build commands in dashboard settings. If it does, those settings must not add `--force`, `--legacy-peer-deps`, or an audit gate unless the security backlog has been resolved.

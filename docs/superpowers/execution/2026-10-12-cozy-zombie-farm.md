# SDD ledger — plan: docs/superpowers/plans/2026-10-12-cozy-zombie-farm.md
Pre-flight: Tasks 1→2→4 consume World consistently. Tasks 2→3→4 use Store and account identity. Tasks 1+3+4→5 supply geometry, authenticated APIs, room state. Task 6 verifies all interfaces.
Ruling: Use existing isolated cloud checkout on work branch — onboarding/user context forbids unrequested worktrees — no extra isolation cost.
Ruling: Skill helper shell scripts are not exposed as local executable resources; keep equivalent briefs/progress and verification records manually — same evidence contract, manual bookkeeping risk.
Task 1: complete — 10 simulation tests pass; typecheck passes. RED missing world module → GREEN. Death fixture corrected to remove spawn invulnerability before testing damage. npm cache uses writable /workspace/.npm-cache.
Task 2: complete — 13 tests pass, typecheck passes. RED missing store → GREEN reopen/deduplication, rollback, malformed snapshot and migration tests. Node 24 native SQLite avoids native addon installation.
Task 3: complete — 16 tests pass; typecheck passes. RED missing HTTP module → GREEN account, hash, cookie, origin, invite expiry/reuse/capacity and rate tests. Invite membership updates do not touch a potentially live snapshot; FarmRoom adds new members on authenticated join.
Task 4: complete — 18 tests pass, typecheck passes. Real Colyseus clients exercise sharing, outsider/duplicate rejection, command replay, store failure/recovery, offline pause and restart. RED missing server → GREEN.
Ruling: Use Vitest threads instead of forks — Colyseus PM2 instrumentation uses process.send and conflicts with forked runner IPC — no application behavior change.
Task 5: complete — 21 unit/integration tests pass, typecheck and production builds pass; mobile aiming/release browser test passes. RED missing input → GREEN. Browser exposed proxy routing error corrected with a dedicated /room development prefix. Difficulty now retains active settings until the next preparation (regression RED→GREEN). Formatting improves maintainability.
Ruling: Browser tests use preinstalled system Chromium — download domain is denied, installed browser works without disabling TLS verification — browser version differs from Playwright's bundled release.
Task 6: complete — npm ci succeeds, 22 unit/integration tests and 3 browser tests pass, typecheck/build pass. Compiled HTTP app and real restart preserve a registered account and world. Cloud install_script/start_skill saved as draft requiring user publication.
Ruling: Use Canvas 2D for current procedural art — observed WebGL software rendering at 4–5 FPS caused delayed controls; Canvas completed the two-player functional scenario — phone performance still requires validation.
Input regression: press/release keyboard without frames RED→GREEN; heartbeat and key events no longer depend on rendering. Reused Text objects instead of destroying/uploading textures each frame.
Final review pending; browser diagnostic logging removed without changing its assertions or actions.
Final review: fresh reviewer final_review, base 07889ff..b9efd6e, no Critical, two Important and one originally Minor findings.
Final: Ruling: regraded malformed difficulty from Minor to Important — it pauses a healthy game and emits a false storage error, so strict rejection is required — cost of being overly strict is only rejecting malformed non-string inputs.
Final: fixed default data location — uses the same project data directory from root and server workspace RED→GREEN, suite 25/25.
Final: fixed revoked idle sessions — disconnects revoked idle sessions and pauses the now-empty world RED→GREEN, suite 25/25.
Final: fixed malformed difficulty — rejects non-string difficulty without changing or pausing the world RED→GREEN, suite 25/25.
Final: Ruling: actual Windows/phone behavior, mobile performance and public deployment were declined by reviewer — retain these as explicit unverified limitations — device-specific compatibility/performance may remain.
Final: no deferred minor findings. Full browser suite after fixes: 3/3 pass; unit/integration suite 25/25, typecheck and build pass.

Integration: keep work branch and existing checkout. No remote main exists and no GitHub push or public deployment was requested. Source ZIP provides an independent copy.

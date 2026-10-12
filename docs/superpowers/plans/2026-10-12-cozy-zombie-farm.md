# Cooperative Zombie Farm Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Deliver a private two-player browser game with farming, crafting, construction and timed zombie defense.

**Architecture:** A Phaser client sends validated intentions to an authoritative Colyseus server. Shared deterministic simulation rules describe the world; SQLite persists accounts, memberships and snapshots on a single server. Cookies authenticate HTTP and WebSocket connections.

**Tech Stack:** Node.js 24, TypeScript, npm workspaces, Vite, Phaser, Colyseus, SQLite, Vitest and Playwright. Pin resolved dependencies in package-lock.json; use npm ci subsequently.

**Spec:** ../specs/2026-10-12-cozy-zombie-farm-design.md

## Global Constraints
- Browser support targets Windows 10, Android and iOS; Spanish interface, keyboard/mouse and separate touch controls.
- One private persistent world for two members; each account retains its character across devices.
- Entire simulation pauses when no players are connected; no offline growth or attacks.
- Preparation durations: tranquil 900 seconds, normal 600 seconds, hard 300 seconds; warning at 60 seconds remaining.
- Difficulty changes affect the next preparation; wave population is fixed from connections at wave start.
- Death retains weapons/upgrades and drops half of carried resources/ammo rounded down.
- Single crop, zombie, pistol, ammo type and crafting bench; destructible fences; safe indestructible house.
- No PvP, animal systems, additional maps or public deployment in this implementation.
- Use the existing isolated checkout; do not create a worktree.
- SQLite requires persistent disk and a single server instance. Public deployment requires TLS and an explicit hosting decision.

## Review Focus
- Duplicate or malformed client commands must not create resources or bypass firing cadence (Tasks 1, 4).
- Abrupt disconnects and duplicate account sessions must not create extra players or advance an empty world (Tasks 3, 4).
- Failed persistence must stop mutation and report failure rather than acknowledge a save (Task 2).
- Touch release, browser focus loss and menus must stop aiming/firing (Task 5).
- Resizing and narrow/mobile displays must preserve usable controls and readable warnings (Tasks 5, 6).

## File map and contracts
- packages/shared/src/types.ts: JSON-serializable World, Player, Command and Result types; every command has id and payload.
- packages/shared/src/config.ts: centralized economy, combat and difficulty constants.
- packages/shared/src/world.ts: createWorld(id: string): World; applyCommand(world: World, playerId: string, command: Command): Result; tickWorld(world: World, dtMs: number, connectedIds: string[]): void.
- packages/shared/src/geometry.ts: collision/map rules and isometric coordinate conversion.
- apps/server/src/store.ts: Store.saveWorld(world: World): void; loadWorld(id: string): World | null; transactional account/membership access.
- apps/server/src/auth.ts: account registration, password verification and opaque sessions; authenticated account id is never accepted from request payload.
- apps/server/src/http.ts: register/login/logout/me, world creation, single-use invites, health endpoint.
- apps/server/src/room.ts: FarmRoom authentication, command handling, ticking, synchronization and save lifecycle.
- apps/client/src/api.ts: authenticated HTTP access and room connection.
- apps/client/src/GameScene.ts: world rendering; input and HUD are separate modules.
- apps/client/src/input.ts, hud.ts, account.ts: controls, gameplay interface and account/world flow.
- tests/e2e/game.spec.ts: two-player complete functional workflow.
- README.md and .env.example: local startup, persistence and hosting requirements, no credentials.

### Task 1: Executable simulation rules
**Files:** root package.json, package-lock.json, tsconfig.json; packages/shared/package.json, src/{types,config,world,geometry}.ts; packages/shared/test/world.test.ts.
**Interfaces:** Produces World, Command, Result and the world functions above. World stores remaining active preparation time, phase, connected player states, entities, inventories and upgrades. Result contains ok and an error code on rejection. Pure rules do not read wall-clock time or access disk.
- [ ] Write tests: an empty world's timer/crops/enemies remain unchanged after tickWorld(w, 10000, []); normal timer starts at 600000ms, warning begins at 60000ms; wave spawns once at zero. A difficulty change preserves current countdown and changes the following preparation. One versus two connected players selects fixed wave populations.
- [ ] Add tests: seed/nearby watering/harvest cycle; harvesting twice yields once; crafting subtracts exact ingredients; insufficient resources reject without mutation; fence placement cannot overlap house/spawn; repair and upgrade charge resources once; damage consumes one ammo per accepted shot and respects cadence; non-finite positions/negative quantities reject; death drops floor(quantity/2) and preserves tools.
- [ ] Run npm test --workspace packages/shared; confirm the first run fails because rules do not exist.
- [ ] Implement contracts, collision-safe movement, interactions, zombie pursuit/fence attacks, melee, food healing, pistol shots, supply/resource collection and backpack recovery. Centralize balance constants; initialize a small finite map with renewable resource opportunities so progress cannot permanently exhaust resources.
- [ ] Rerun shared tests and npm run typecheck; both must pass. Commit this independently runnable rules deliverable.

### Task 2: Durable world storage
**Files:** apps/server/package.json, src/store.ts, migrations/001.sql; apps/server/test/store.test.ts.
**Interfaces:** Consumes World; produces Store methods above, openStore(path: string): Store and close(): void. Store offers transactional commit of snapshot and command id to deduplicate retryable durable actions.
- [ ] Write tests in a temporary SQLite file: save/load retains inventory, timer, crop and fence state after close/reopen; reapplying a persisted command id has no second effect; transaction failure retains prior state; malformed/unsupported snapshots fail explicitly. Assert schema migrations preserve an existing world.
- [ ] Run npm test --workspace apps/server -- store; confirm missing store fails.
- [ ] Implement migration versioning, parameterized SQL, transactions, snapshot validation and safe backup-before-migration. Durable mutation uses a cloned candidate and swaps live state only after commit succeeds.
- [ ] Rerun store tests; check a second startup is idempotent. Commit.

### Task 3: Accounts and private membership
**Files:** apps/server/src/auth.ts, http.ts, index.ts; apps/server/test/auth.test.ts; .env.example.
**Interfaces:** Consumes Store; produces authenticated account/session lookup and membership lookup for FarmRoom. API exposes POST /api/register, /api/login, /api/logout, /api/worlds, /api/invites, /api/invites/redeem; GET /api/me and /health. Create one private world per couple with a maximum of two members.
- [ ] Write HTTP tests: password hash differs from password; wrong passwords fail; HttpOnly cookie is returned; unauthenticated requests fail; unapproved origins fail; invitations expire, redeem only once and reject third membership; repeated login attempts hit a rate limit; logout invalidates session.
- [ ] Run auth tests and observe missing endpoints fail.
- [ ] Implement Node crypto.scrypt password hashing, random opaque sessions with expiration, private invite tokens with expiration, size limits and origin checks. Use secure cookies in HTTPS production and same-origin dev proxy. Environment settings contain no secret defaults. Disallow simultaneous active game sessions for the same account with an explicit error.
- [ ] Rerun auth tests and typecheck; commit.

### Task 4: Authoritative cooperative server
**Files:** apps/server/src/room.ts, index.ts; apps/server/test/room.test.ts.
**Interfaces:** Consumes shared rules, authenticated membership and Store. FarmRoom accepts Command messages, emits synchronized world state and explicit error/save status; server alone advances simulation. Only a room member can join.
- [ ] Write integration tests with two real clients: both observe one harvested item/fence placement; third account cannot join; duplicate command id cannot double-craft; disconnect/rejoin restores player; duplicate account connection rejects; zero connected players freezes state; restarting restores paused state; save failure rejects mutation and broadcasts recoverable error.
- [ ] Run room tests; confirm failure before implementation.
- [ ] Implement Colyseus room, bounded validated commands, 20Hz simulation with state broadcast capped at 10Hz; persist every five seconds plus durable actions, final disconnect and graceful shutdown. Reconnect never compensates for offline elapsed time. Stop ticks/mutations on persistent store failure; recover only after successful storage health/save check. Configure heartbeat timeout so dead clients do not keep a world active indefinitely.
- [ ] Run room integration and all earlier tests; commit.

### Task 5: Playable isometric browser client
**Files:** apps/client/package.json, index.html, vite.config.ts, src/{main,api,account,GameScene,input,hud,style}.ts (style.css instead of style.ts); apps/client/test/input.test.ts.
**Interfaces:** Consumes authenticated HTTP, FarmRoom state and shared types/geometry. Client sends movement, aim, interaction, crafting, build/repair/upgrade and difficulty intentions; never grants resources locally.
- [ ] Write tests: touch release, blur and menu open disable firing; screen-to-map transform round-trips map points; placing outside valid grid is rejected by preview; unavailable connection disables commands.
- [ ] Run client tests; confirm missing functions fail.
- [ ] Implement Spanish account/create/join screens, Phaser scene with original placeholder isometric visuals, depth sorting, house/crops/resources/zombies/fences/backpacks and clear damage feedback. Add desktop WASD/arrows and mouse aiming with explicit fire toggle; mobile dual controls fire only while aiming control is held; manual melee selection. Add HUD, rotate prompt, crafting/build/repair/upgrade controls, shared storage transfers and recoverable connection/save errors.
- [ ] Run client tests, typecheck and production build. Verify mouse and emulated touch, resize and menu behavior. Commit.

### Task 6: Full-cycle verification and repeatable startup
**Files:** tests/e2e/game.spec.ts, playwright.config.ts, README.md; root package.json scripts; server/client configuration if verification uncovers integration defects.
**Interfaces:** npm ci installs; npm run dev starts server and Vite with same-origin HTTP/WebSocket proxy; npm run build builds both; npm start serves built client and room server. DATABASE_PATH points to persistent local disk; PORT configures listener. No cloud hosting is presumed.
- [ ] Write two-browser functional scenario: register two users, create/redeem invite, move, farm, gather, craft, store resources, build/repair/upgrade, aim/shoot, complete an announced wave, die/recover backpack and reconnect. Use a test-only server configuration to shorten countdowns; never expose debug/resource-grant endpoints in production.
- [ ] Run npm run test:e2e; diagnose failures without weakening assertions. Check the scenario covers shared progress rather than two independent worlds.
- [ ] Document Windows PowerShell installation/start commands, LAN testing from phones, firewall needs, SQLite persistence/backups and production TLS. Clearly label original placeholder visuals and unverified real iOS/Android behavior.
- [ ] Run npm test, npm run typecheck, npm run build and npm run test:e2e. Start production server, exercise /health and authenticated world access, then restart and verify persistence. Record executed tests and any device limitations.
- [ ] Save necessary tested cloud install_script/start_skill instructions using the onboarding draft tool, preserving unrelated configuration. Include existing-checkout guidance and readiness requests; saving is not publication.
- [ ] Commit verified changes. Do not publish, contract hosting or claim actual phone verification without evidence.

## Self-review
All approved mechanics map to Tasks 1 and 5; persistent private multiplayer maps to Tasks 2–4. Task 6 verifies the integrated game and documents unresolved real-device/hosting requirements. Economy and placeholder art are adjustable implementation choices; approved timings and pause/death rules remain fixed. The implementation uses one shared set of contracts; storage failure, repeated inputs and disconnect behavior have explicit owning tests.

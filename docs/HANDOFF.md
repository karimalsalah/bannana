# HANDOFF — The Banana Protocol (repo-as-memory)

> Single source of truth across sessions. The conversation is lossy; this file is not.
> Last update: 2026-06-19.

## Mission

Transform `usephedm/bannana` into **The Banana Protocol**: a WebGPU/TSL spatial
organism with an ERC-4337 account-abstraction core, faithful to the promo video
(`public/the-banana-protocol.mp4`, transcript in `docs/PROMO_TRANSCRIPT.md`).
Governed by `docs/GODMODE_PRIME_CHARTER_v3.md`.

## Live-fact ledger (probed this build — overrides any spec/memory)

- `bun` 1.3.11 · disk **9.9 GB free / 97% full** (tight — no heavyweight SDK installs).
- Installed & pinned: three 0.184.0, @dimforge/rapier3d-simd 0.19.3, better-auth 1.6.19,
  elysia 1.4.29, drizzle-orm 0.45.2, @rize-labs/banana-wallet-sdk 0.1.28, react 19.2.7,
  vite 8.0.16, typescript 6.0.3, motion 12.40.0. node_modules ≈ 379 MB.
- **`@rize-labs/banana-passkey-eoa` DOES NOT EXIST on npm** (404). Spec is wrong → passkey
  signer built on native **WebAuthn**; wallet via the real banana-wallet-sdk.
- three moved `three/nodes` → **`three/tsl`** + **`three/webgpu`**. `@types/three` 0.184.1
  exports both subpaths, so imports are fully typed (no shim except the untyped wallet SDK).
- `banana-wallet-sdk` ships JS with **no `types`** → ambient shim in `src/shims.d.ts`.

## Decisions & substitutions (honest engineering; charter §XI / Rule 15)

- **MEV / multichain (Jito, Nozomi, Axelar):** Jito/Nozomi are Solana; ERC-4337 is EVM.
  Implemented as a typed routing abstraction (`src/web3/routing.ts`) instead of installing
  incompatible heavy SDKs. `// ponytail:` — disk + coherence.
- **Slug Algorithm typography:** patent-encumbered (Lengyel) and the promo captions are flat
  terminal text → DOM/canvas HUD (`src/frontend/hud.ts`). `// ponytail:` — faithful + free.
- **Turso (libSQL) edge reads:** wired as an optional, lazily-imported read client
  (`src/db/edge.ts`); active only when `TURSO_DATABASE_URL` is set. No hard dep on disk.

## Stack (as built)

| Layer | Tech | File(s) |
|---|---|---|
| DB (state of record) | Neon Postgres + Drizzle | `src/db/schema.ts`, `src/db/index.ts` |
| DB (edge reads) | Turso/libSQL (optional) | `src/db/edge.ts` |
| Auth | Better Auth 1.6 (passkey + organization) | `src/backend/auth.ts` |
| API | ElysiaJS + Swagger + CORS + WS | `src/backend/server.ts` |
| Web3 | banana-wallet-sdk + WebAuthn + ERC-4337 | `src/web3/account.ts`, `referral.ts`, `routing.ts` |
| Shaders | TSL ripeness + Gommage dissolve | `src/shaders/ripeness.ts`, `gommage.ts` |
| Scene | WebGPURenderer + Rapier + bloom/TAA | `src/frontend/scene.ts` |
| Shell | React 19 + video intro + GEO schema | `src/frontend/main.tsx`, `geo.ts`, `hud.ts` |
| Lifecycle | shared FSM | `src/protocol/lifecycle.ts` |

## Build status — ALL GREEN (2026-06-19)

- [x] Scaffold, install, pin, configs, tsconfig (strict + noUncheckedIndexedAccess)
- [x] Source modules (shaders, scene, hud, web3 ×3, backend ×2, db ×3, frontend ×4, lifecycle)
- [x] `bun run typecheck` (tsc --noEmit) — **0 errors**
- [x] `bun run build` (vite) — **✓ 7.4s**, dist/ produced (rapier wasm + three webgpu bundled)
- [x] Backend boot smoke — `/api/health` ok, Swagger `/docs` 200, Better Auth constructs
- [x] `bun test` — **4 pass / 0 fail** (lifecycle FSM)
- [ ] Push fork + enable CI/CD + Pages + PR to upstream  ← next

### Gate verdict (docs/gates/protocol-singularity.md): **PASS** (verified by execution, not self-graded)

### Builder loop note
`codex` 0.128.0 is installed but **unauthenticated** (401 — needs `codex login`). The
lifecycle-test slice was routed back to the Architect (written + graded PASS here) rather
than blocking on the unauthed vendor. Unlock for future cross-vendor delegation: `codex login`.

### Spec-vs-reality corrections caught during build (Rule 15)
- `banana-passkey-eoa` absent → WebAuthn. `three/nodes`→`three/tsl`. better-auth 1.6.19 has
  no `passkey` plugin import → emailAndPassword + organization; passkey table reserved.
  `rollup` was a missing peer of vite-plugin-top-level-await → added.

## Gate

`docs/gates/protocol-singularity.md` — frozen criteria. Do not edit during build.

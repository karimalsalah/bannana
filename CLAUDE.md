# BANANA PROTOCOL ARCHITECTURE
## Tech Stack:
- **Runtime & Backend:** Bun v1.3+, ElysiaJS, TypeBox (for validation and OpenAPI docs).
- **Database & Auth:** Neon Serverless Postgres, Drizzle ORM, Better Auth v1.6 (configured with organization and passkey plugins).
- **Web3:** `@rize-labs/banana-wallet-sdk`, `banana-passkey-eoa` (ERC-4337 Account Abstraction, Paymasters, Biometric Safe Accounts).
- **Frontend & 3D:** React + Vite, Three.js r171+ (WebGPU native via `three/webgpu`), TSL (Three.js Shading Language via `three/nodes`), `@dimforge/rapier3d-simd` (WASM Physics).

## Strict Invariants:
1. **No WebGL.** Force `WebGPURenderer`. Use TAA, Dynamic Resolution Scaling (DRS), and MRT Selective Bloom post-processing.
2. **TSL Only.** All materials must be `MeshStandardNodeMaterial` or custom TSL node logic. Implement the "Gommage" dissolve effect using Perlin noise TSL nodes and InstancedMesh particles (pack data into `aBirthLifeSeedScale` to avoid buffer limits).
3. **Physics Optimization:** Disable Rapier's `state_sync_callback` during `flush_queries` to minimize CPU-GPU roundtrips. Use `MultiMeshInstance` for scaling.
4. **Auth & DB:** Better Auth handles sessions natively in Postgres. No external hosted auth.

## Live-verified reality (probed at build — overrides the blueprint above)
- Pinned: three **0.184.0**, rapier3d-simd 0.19.3, better-auth 1.6.19, elysia 1.4.29,
  drizzle-orm 0.45.2, banana-wallet-sdk 0.1.28, react 19.2.7, vite 8.0.16, typescript 6.0.3.
- TSL imports from **`three/tsl`** (NOT `three/nodes` — moved); renderer/materials from
  **`three/webgpu`**. `@types/three` 0.184.1 types both subpaths.
- **`banana-passkey-eoa` does NOT exist on npm.** Passkey signer = native WebAuthn.
- `banana-wallet-sdk` ships no types → ambient shim in `src/shims.d.ts`.

## Map
- Lifecycle FSM (single source of truth): `src/protocol/lifecycle.ts`.
- Shaders: `src/shaders/ripeness.ts`, `src/shaders/gommage.ts`.
- Scene: `src/frontend/scene.ts`. Shell: `src/frontend/main.tsx`. HUD: `src/frontend/hud.ts`.
- Web3: `src/web3/{account,referral,routing}.ts`. Backend: `src/backend/{auth,server}.ts`.
- DB: `src/db/{schema,index,edge}.ts`. Promo decode: `docs/PROMO_TRANSCRIPT.md`.

## The gate (never claim done before this is green)
`bun run typecheck` (tsc --noEmit, strict + noUncheckedIndexedAccess) = 0 errors, then
`bun run build`. Frozen criteria: `docs/gates/protocol-singularity.md`. State: `docs/HANDOFF.md`.

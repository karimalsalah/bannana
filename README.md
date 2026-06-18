<div align="center">

# 🍌 THE BANANA PROTOCOL

**A spatial anomaly thriving in a corner of the web where nothing is meant to live.**

A real-time WebGPU / TSL organism with an ERC-4337 account-abstraction core.
Feed the code. Watch it evolve.

[![CI](https://github.com/usephedm/bannana/actions/workflows/ci.yml/badge.svg)](https://github.com/usephedm/bannana/actions/workflows/ci.yml)
[![Pages](https://github.com/usephedm/bannana/actions/workflows/pages.yml/badge.svg)](https://github.com/usephedm/bannana/actions/workflows/pages.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[**▶ Live**](https://usephedm.github.io/bannana/) · [Promo decode](docs/PROMO_TRANSCRIPT.md) · [Architecture](docs/ARCHITECTURE.md)

</div>

---

## What it is

The promo (`public/the-banana-protocol.mp4`) is pre-rendered. **This repo renders it
live.** A procedural banana drifts and breathes in a hardware-accelerated void, tracks
your every interaction, and advances through a strictly-monitored evolutionary lifecycle
as you feed it gasless `$PEEL` stakes through a biometric smart account.

```
DORMANT ──▶ CHARGING ──▶ MUTATING ──▶ CRITICAL ──▶ ASCENDED
unripe       absorbing     toxic rot     vertices     detonation —
green/cyan   the mass      spreads       tear         "feed the code"
```

## Stack (every version pinned)

| Layer | Tech |
|---|---|
| Render | **WebGPU** (`WebGPURenderer`) + **TSL** node materials — no WebGL, no GLSL |
| Physics | `@dimforge/rapier3d-simd` (WASM) |
| Post | MRT **selective bloom** (neon only) + Dynamic Resolution Scaling |
| Runtime | **Bun** 1.3 |
| API | **ElysiaJS** + TypeBox + Swagger (`/docs`) + WebSocket |
| Auth | **Better Auth** 1.6 — passkey + organization, sessions in your own Postgres |
| State | **Neon** Postgres + **Drizzle** · **Turso**/libSQL optional edge reads |
| Web3 | **ERC-4337** smart accounts · WebAuthn passkey signer · gasless `$PEEL` |
| Shell | **React 19** + Vite 8 |

## Quick start

```bash
bun install
cp .env.example .env        # fill DATABASE_URL etc. when you want the backend live
bun run dev                 # Vite — the spatial frontend (WebGPU browser required)
bun run server              # Elysia API + auth + websocket on :3000
```

| Script | Does |
|---|---|
| `bun run typecheck` | `tsc --noEmit`, strict + `noUncheckedIndexedAccess` — the gate |
| `bun run build` | Vite production build → `dist/` |
| `bun run server` | Boot the Elysia/Bun backend |
| `bun run db:generate` / `db:push` | Drizzle migrations |

## Honest engineering (what's real vs. gated)

This was built against an AI-authored spec; claims were verified before code
(see [`docs/HANDOFF.md`](docs/HANDOFF.md)). Where the spec was wrong, it was corrected,
not faked:

- `@rize-labs/banana-passkey-eoa` **does not exist on npm** → passkey signer is native **WebAuthn**.
- Jito/Nozomi (Solana) and ERC-4337 (EVM) don't share a runtime → multichain/MEV is a typed
  routing **abstraction** (`src/web3/routing.ts`), not incompatible heavyweight SDKs.
- The Slug text algorithm is patent-encumbered and the promo's captions are flat terminal
  text → the HUD is a DOM overlay.
- On-chain execution and live DB queries need keys/URLs (see `.env.example`); the UserOp and
  stake paths are built and typed, with live network calls marked `// TODO(live):`.

Compiles, builds, and boots type-clean. GPU pixels and on-chain settlement are the parts
that need a real GPU and real keys — flagged, never claimed.

## License

[MIT](LICENSE) © usephedm

# Architecture — The Banana Protocol

```
                          ┌──────────────────────────────────────────┐
   browser (WebGPU)       │  React 19 shell  (src/frontend/main.tsx)  │
                          │   • promo intro → live                    │
                          │   • brutalist "inject mass" wallet panel  │
                          │   • GEO JSON-LD (src/frontend/geo.ts)     │
                          └───────┬───────────────┬──────────────────┘
                                  │               │
                  ┌───────────────▼──────┐   ┌────▼─────────────────┐
                  │ WebGPU scene         │   │ web3 (browser)       │
                  │ src/frontend/scene.ts│   │ src/web3/account.ts  │
                  │  • WebGPURenderer     │   │  • WebAuthn passkey   │
                  │  • TSL ripeness mat   │   │  • ERC-4337 UserOp    │
                  │  • Gommage dissolve   │   │  • referral.ts/routing│
                  │  • Rapier SIMD physics│   └────┬─────────────────┘
                  │  • MRT selective bloom│        │ /api  (fetch / ws)
                  └───────────────────────┘        │
                                                    ▼
                       ┌───────────────────────────────────────────┐
   Bun server          │ ElysiaJS  (src/backend/server.ts)         │
                       │  • Better Auth handler  /api/auth/*       │
                       │  • Swagger /docs · CORS · WebSocket /ws   │
                       │  • /api/stake (TypeBox) · /api/lifecycle  │
                       └───────┬───────────────────────┬───────────┘
                               │                       │
                   ┌───────────▼─────────┐   ┌─────────▼──────────┐
                   │ Better Auth 1.6     │   │ Drizzle (Neon PG)  │
                   │ src/backend/auth.ts │   │ src/db/{schema,index}
                   │  passkey + org      │   │  + Turso edge reads │
                   └─────────────────────┘   │  src/db/edge.ts     │
                                             └─────────────────────┘
```

## The lifecycle is the spine

`src/protocol/lifecycle.ts` is the single source of truth for the five stages, their
ripeness floors, and their HUD copy. The scene drives visuals from it; the HUD reads
labels from it; the database enum (`lifecycle_stage`) mirrors it; every transition is
written to the append-only `lifecycle_event` table. One truth, audited.

## Render pipeline (faithful to the promo)

1. **Banana** — `TubeGeometry` over a `CatmullRomCurve3` crescent.
2. **Skin** — one `MeshStandardNodeMaterial` whose `colorNode` / `emissiveNode` /
   `positionNode` are TSL trees driven by two uniforms (`ripeness`, `charge`): cyan-green →
   toxic yellow → procedural brown rot, with a pulsing cyan Fresnel rim and charge-scaled
   vertex thrash.
3. **Gommage** — an `InstancedMesh` of additive sprites; per-instance data packed into one
   `vec4` attribute (`aBirthLifeSeedScale`) flowing into the core.
4. **Physics** — Rapier SIMD adds organic drift; stepped without per-frame collider queries
   to avoid CPU↔GPU sync churn.
5. **Post** — MRT splits `output` and `emissive`; only the emissive blooms, keeping the
   `#0a0008` void dark. DRS trades resolution for frame budget under load.

## Data model

Better Auth core tables (`user`/`session`/`account`/`verification`) + `passkey` +
organization tables, alongside the protocol's own `banana_nft`, `peel_stake`, and the
append-only `lifecycle_event`. Amounts are `numeric(78,0)` wei strings to avoid bigint
precision loss.

## Decisions of record

See [`docs/HANDOFF.md`](HANDOFF.md) for the live-fact ledger and every substitution
(why no `banana-passkey-eoa`, why routing is an abstraction, why the HUD is DOM).

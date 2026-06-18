# FROZEN GATE — Protocol Singularity

> Frozen before implementation. If the builder edits this file, the slice is INVALID.
> Grading is PASS / FAIL / INVALID, verified by executing — never self-graded.

## PASS criteria

1. **Typecheck.** `bun run typecheck` (`tsc --noEmit`, strict, `noUncheckedIndexedAccess`)
   exits 0 with zero errors across all `src/**`.
2. **Build.** `bun run build` (Vite) completes; `dist/` is produced; no unresolved imports.
3. **Backend boots.** `src/backend/server.ts` constructs an Elysia app with Better Auth
   handler, Swagger at `/docs`, CORS, and a `/ws` route — type-clean (no live DB required).
4. **WebGPU only.** The renderer is `WebGPURenderer`; there is no `WebGLRenderer` import.
5. **TSL only.** Banana surface is a `MeshStandardNodeMaterial` driven by TSL nodes
   (`colorNode`/`emissiveNode`/`positionNode`); no GLSL strings.
6. **Faithful lifecycle.** `DORMANT → CHARGING → MUTATING → CRITICAL → ASCENDED` exists in
   `src/protocol/lifecycle.ts` and drives both visuals and HUD.
7. **Rapier invariant.** Physics step explicitly avoids per-step CPU↔GPU sync churn
   (documented at the call site).
8. **Web3 honesty.** Passkey via WebAuthn; ERC-4337 stake + double-sided conditional
   referral logic present; nonexistent `banana-passkey-eoa` is NOT imported.
9. **GEO.** FAQPage + HowTo + Article JSON-LD present and valid in the shipped HTML.

## Explicitly OUT of scope for this gate (honesty)

- Live on-chain execution (needs bundler/paymaster keys + deployed $PEEL contract).
- Live Neon/Turso queries (need `DATABASE_URL`).
- GPU runtime render (CI is headless; verified by build + type, not pixels).

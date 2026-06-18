# The Banana Protocol — Promo Asset: Transcript & Decode

**Source:** `public/the-banana-protocol.mp4` · 1:49.7 · 1280×720 · 30 fps · H.264 / AAC mono.
**Rendered with:** NotebookLM (watermarked). **Audio language:** English.
**Transcription:** faster-whisper `small` (int8, VAD), 2026-06-19.

This file is the canonical brief for the real-time experience. The app recreates,
in live WebGPU/TSL, what the promo shows pre-rendered.

---

## Verbatim narration

> Buried deep within a hardware-accelerated void, something is stirring — a spatial
> anomaly thriving in a corner of the web where nothing is meant to live. It possesses
> a dense, organic architecture, wrapped in a synthetic skin that pulses with neon noir
> warmth. It drifts, it breathes, and with unsettling precision, it tracks every
> interaction you make within the 3D scene. The system logs it as **Stage 0**, the
> beginning of a strictly monitored evolutionary lifecycle.
>
> The browser's native interface suddenly buckles, overridden by a brutalist glass panel
> demanding an immediate injection of computational mass. Standard navigation begins to
> disintegrate, tearing the surrounding site architecture into a chaotic storm of digital
> ash — and every piece of that raw data is funneled directly into the core of the anomaly
> to fuel the next stage.
>
> Instantly, the entity's surface reacts, its cool neon radiance boiling over into a
> jaundiced toxic yellow. A procedural rot spreads, it claims the geometry — the violent
> visual signature of a rapid, forced mutation. The organism begins to thrash against its
> own code, bleeding fractured light into the void as it absorbs enough energy to break its
> digital bounds. The vertices tear, the rim lights fracture, the mutation reaches critical
> density until the system issues a terminal warning that the entity is on the brink of its
> final, absolute evolution.
>
> As the organism violently sheds its physical limits, detonating into a blinding [flash] —
> **access the banana protocol. Connect your wallet to feed the code.**

## Visual signature (from extracted frames)

- Pure black/near-black void (`#0a0008`), heavy volumetric light.
- Banana is the only subject: green & glowing → cyan-charged with orbiting debris ring →
  golden, spotted, mid-detonation with a blinding cyan core.
- Terminal HUD captions in mono type: `SUBJECT DETECTED.` / `STATUS: UNRIPE.`
- Particle dust and fractured debris throughout; selective bloom on neon edges only.

## Narration → interactive mechanics (the build contract)

| Narration beat | Real-time implementation |
|---|---|
| "hardware-accelerated void" | `WebGPURenderer`, `#0a0008` background, no WebGL fallback |
| "synthetic skin, neon noir warmth, pulses" | TSL `MeshStandardNodeMaterial` + cyan Fresnel rim + emissive pulse |
| "drifts, breathes, tracks every interaction" | idle drift + breathing scale; pointer raycast drives look-at & charge |
| "Stage 0 … evolutionary lifecycle" | finite-state lifecycle: `DORMANT → CHARGING → MUTATING → CRITICAL → ASCENDED` |
| "brutalist glass panel demanding computational mass" | glassmorphism wallet panel; "inject mass" = connect passkey wallet / stake $PEEL |
| "navigation disintegrates into digital ash, funneled into the core" | Gommage dissolve: InstancedMesh particles flow into the banana, raising charge |
| "neon radiance boiling into toxic yellow, procedural rot" | `uRipeness` 0→1 lerps cyan→toxic-yellow→brown-spot via TSL noise |
| "thrash, bleeding fractured light, vertices tear, rim fractures" | Rapier impulses + TSL vertex displacement + rim-light break-up |
| "terminal warning … brink of final evolution" | HUD critical state, red terminal warning |
| "detonating into a blinding flash" | bloom blow-out + particle burst on `ASCENDED` |
| "connect your wallet to feed the code" | ERC-4337 gasless `$PEEL` stake via biometric Safe smart account |

## Reality corrections applied (Rule 15 — spec is hypothesis until probed)

- `banana-passkey-eoa` — **does not exist on npm**. Passkey signer implemented with the
  native **WebAuthn** API; wallet via `@rize-labs/banana-wallet-sdk` (0.1.28, real).
- `three/nodes` — **moved** to `three/tsl` + `three/webgpu` in three 0.184. Live import used.

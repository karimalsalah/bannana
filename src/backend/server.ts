/**
 * ElysiaJS server for The Banana Protocol.
 *
 * Routes:
 *   GET  /api/health                    — liveness probe
 *   GET  /api/lifecycle/:bananaId       — lifecycle stub (typed)
 *   POST /api/stake                     — record a $PEEL stake (validated)
 *   ALL  /api/auth/*                    — Better Auth handler
 *   WS   /ws                            — lifecycle tick echo
 *   GET  /docs                          — Swagger UI
 */

import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { auth } from "./auth.js";
import { stageForRipeness, STAGE_HUD } from "../protocol/lifecycle.js";

export const app = new Elysia()
  .use(cors())
  .use(swagger({ path: "/docs" }))

  // ── Health ───────────────────────────────────────────────────────────────────
  .get("/api/health", () => ({
    status: "ok",
    ts: new Date().toISOString(),
  }))

  // ── Lifecycle stub ───────────────────────────────────────────────────────────
  .get(
    "/api/lifecycle/:bananaId",
    ({ params }) => {
      // Typed stub — real implementation queries bananaNft + lifecycleEvent tables
      const ripeness = 0;
      const stage = stageForRipeness(ripeness);
      const hud = STAGE_HUD[stage];
      return {
        bananaId: params.bananaId,
        stage,
        ripeness,
        hud,
      };
    },
    {
      params: t.Object({ bananaId: t.String() }),
    },
  )

  // ── Stake endpoint ──────────────────────────────────────────────────────────
  .post(
    "/api/stake",
    ({ body }) => {
      // Typed stub — real implementation inserts into peelStake + recalculates ripeness
      return {
        ok: true,
        bananaId: body.bananaId,
        amountWei: body.amountWei,
        userOpHash: body.userOpHash,
      };
    },
    {
      body: t.Object({
        bananaId: t.String(),
        amountWei: t.String(),
        userOpHash: t.String(),
      }),
    },
  )

  // ── Better Auth handler ──────────────────────────────────────────────────────
  .all("/api/auth/*", async ({ request }) => {
    return auth.handler(request);
  })

  // ── WebSocket — lifecycle tick echo ─────────────────────────────────────────
  .ws("/ws", {
    message(ws, message) {
      // Echo lifecycle ticks back to the subscriber
      ws.send(message);
    },
    open(ws) {
      ws.send(
        JSON.stringify({
          type: "connected",
          ts: new Date().toISOString(),
        }),
      );
    },
  });

// Boot when run directly
if (import.meta.main) {
  app.listen(3000);
  console.log("[banana-protocol] server listening on http://localhost:3000");
}

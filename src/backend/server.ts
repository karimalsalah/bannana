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
import { STAGE_HUD } from "../protocol/lifecycle.js";
import { recordStake, snapshot, leaderboard, stats, recentEvents } from "./store.js";

export const app = new Elysia()
  .use(cors())
  .use(swagger({ path: "/docs" }))

  // ── Health ───────────────────────────────────────────────────────────────────
  .get("/api/health", () => ({
    status: "ok",
    ts: new Date().toISOString(),
  }))

  // ── Lifecycle ────────────────────────────────────────────────────────────────
  .get(
    "/api/lifecycle/:bananaId",
    ({ params }) => {
      const s = snapshot(params.bananaId);
      return {
        ...s,
        hud: STAGE_HUD[s.stage],
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
      return recordStake(body.bananaId, body.amountWei, body.userOpHash);
    },
    {
      body: t.Object({
        bananaId: t.String(),
        // Must be a non-negative decimal integer string (matches uint256 range).
        // Rejects hex, negative, floats, or empty strings before they reach BigInt().
        amountWei: t.String({ pattern: "^[0-9]+$" }),
        userOpHash: t.String(),
      }),
    },
  )

  // ── Leaderboard ─────────────────────────────────────────────────────────────
  .get(
    "/api/leaderboard",
    ({ query }) => leaderboard(query.limit !== undefined ? Number(query.limit) : undefined),
    {
      query: t.Object({ limit: t.Optional(t.String({ pattern: "^[0-9]+$" })) }),
    },
  )

  // ── Stats ────────────────────────────────────────────────────────────────────
  .get("/api/stats", () => stats())

  // ── Events ──────────────────────────────────────────────────────────────────
  .get(
    "/api/events",
    ({ query }) => recentEvents(query.limit !== undefined ? Number(query.limit) : undefined),
    {
      query: t.Object({ limit: t.Optional(t.String({ pattern: "^[0-9]+$" })) }),
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

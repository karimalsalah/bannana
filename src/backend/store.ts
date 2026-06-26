/**
 * Server-authoritative in-memory lifecycle store.
 *
 * No database required. State lives in a module-level Map for the process lifetime.
 * TARGET = 6 PEEL (6 * 10^18 wei) → ripeness = 1.0 → ASCENDED.
 */

import { clamp01, stageForRipeness } from "../protocol/lifecycle.js";
import type { Stage } from "../protocol/lifecycle.js";

export interface LifecycleSnapshot {
  bananaId: string;
  stage: Stage;
  ripeness: number;
  peelStakedWei: string;
  stakeCount: number;
  events: { toStage: Stage; ripenessAt: number; ts: string }[];
}

const TARGET = 6n * 10n ** 18n;

interface InternalEntry {
  totalWei: bigint;
  stakeCount: number;
  seenOps: Set<string>;
  events: { toStage: Stage; ripenessAt: number; ts: string }[];
  stage: Stage;
  ripeness: number;
}

const store = new Map<string, InternalEntry>();

function toSnapshot(bananaId: string, e: InternalEntry): LifecycleSnapshot {
  return {
    bananaId,
    stage: e.stage,
    ripeness: e.ripeness,
    peelStakedWei: e.totalWei.toString(),
    stakeCount: e.stakeCount,
    events: e.events.map((ev) => ({ ...ev })),
  };
}

export function getOrCreate(bananaId: string): LifecycleSnapshot {
  let entry = store.get(bananaId);
  if (!entry) {
    entry = {
      totalWei: 0n,
      stakeCount: 0,
      seenOps: new Set(),
      events: [],
      stage: stageForRipeness(0),
      ripeness: 0,
    };
    store.set(bananaId, entry);
  }
  return toSnapshot(bananaId, entry);
}

export function recordStake(
  bananaId: string,
  amountWei: string,
  userOpHash: string,
): LifecycleSnapshot {
  const entry = store.get(bananaId) ?? {
    totalWei: 0n,
    stakeCount: 0,
    seenOps: new Set<string>(),
    events: [] as { toStage: Stage; ripenessAt: number; ts: string }[],
    stage: stageForRipeness(0) as Stage,
    ripeness: 0,
  };

  if (!store.has(bananaId)) {
    store.set(bananaId, entry);
  }

  // Dedupe by userOpHash — repeat is a no-op
  if (entry.seenOps.has(userOpHash)) {
    return toSnapshot(bananaId, entry);
  }

  // Reject non-decimal or negative amountWei strings before BigInt() conversion.
  // BigInt('-1') is valid JS but would silently corrupt the running total.
  if (!/^[0-9]+$/.test(amountWei)) {
    throw new Error(`[banana-protocol] invalid amountWei: "${amountWei}" — must be a non-negative decimal integer`);
  }

  const prevStage = entry.stage;

  entry.seenOps.add(userOpHash);
  entry.totalWei += BigInt(amountWei);
  entry.stakeCount += 1;

  // BigInt division scaled to 1e9 precision, then divided back to float.
  // Avoids Number(bigint) precision loss: Number.MAX_SAFE_INTEGER ~9e15 < TARGET 6e18.
  const SCALE = 1_000_000_000n;
  const ripeness = clamp01(Number((entry.totalWei * SCALE) / TARGET) / Number(SCALE));
  const stage = stageForRipeness(ripeness);

  entry.ripeness = ripeness;
  entry.stage = stage;

  if (stage !== prevStage) {
    entry.events.push({
      toStage: stage,
      ripenessAt: ripeness,
      ts: new Date().toISOString(),
    });
  }

  return toSnapshot(bananaId, entry);
}

export function snapshot(bananaId: string): LifecycleSnapshot {
  return getOrCreate(bananaId);
}

// ── Leaderboard / Stats / Events ─────────────────────────────────────────────

export interface LeaderRow {
  bananaId: string;
  peelStakedWei: string;
  stage: string;
  stakeCount: number;
  ripeness: number;
}

export interface ProtocolStats {
  totalBananas: number;
  totalPeelWei: string;
  ascended: number;
  eventCount: number;
}

export interface EventRow {
  bananaId: string;
  toStage: string;
  ripenessAt: number;
  ts: string;
}

export function leaderboard(limit?: number): LeaderRow[] {
  const rows: LeaderRow[] = [];
  for (const [bananaId, entry] of store) {
    rows.push({
      bananaId,
      peelStakedWei: entry.totalWei.toString(),
      stage: entry.stage,
      stakeCount: entry.stakeCount,
      ripeness: entry.ripeness,
    });
  }
  rows.sort((a, b) => {
    const diff = BigInt(b.peelStakedWei) - BigInt(a.peelStakedWei);
    return diff > 0n ? 1 : diff < 0n ? -1 : 0;
  });
  return limit !== undefined ? rows.slice(0, limit) : rows;
}

export function stats(): ProtocolStats {
  let totalPeelWei = 0n;
  let ascended = 0;
  let eventCount = 0;
  for (const entry of store.values()) {
    totalPeelWei += entry.totalWei;
    if (entry.stage === "ASCENDED") ascended += 1;
    eventCount += entry.events.length;
  }
  return {
    totalBananas: store.size,
    totalPeelWei: totalPeelWei.toString(),
    ascended,
    eventCount,
  };
}

export function recentEvents(limit?: number): EventRow[] {
  const rows: EventRow[] = [];
  for (const [bananaId, entry] of store) {
    for (const ev of entry.events) {
      rows.push({ bananaId, toStage: ev.toStage, ripenessAt: ev.ripenessAt, ts: ev.ts });
    }
  }
  rows.sort((a, b) => (a.ts < b.ts ? 1 : a.ts > b.ts ? -1 : 0));
  return limit !== undefined ? rows.slice(0, limit) : rows;
}

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  getStats,
  getLeaderboard,
  getEvents,
  type LeaderRow,
  type ProtocolStats,
  type EventRow,
} from "../api.js";
import { stageForRipeness } from "../../protocol/lifecycle.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ObservatoryProps {
  active: boolean;
}

interface ObservatoryData {
  stats: ProtocolStats | null;
  leaderboard: LeaderRow[];
  events: EventRow[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format a wei decimal string to a human-readable $PEEL figure. */
function formatWei(wei: string): string {
  try {
    const big = BigInt(wei);
    const peel = big / 1_000_000_000_000_000_000n;
    const rem = (big % 1_000_000_000_000_000_000n) / 1_000_000_000_000_000n;
    const remStr = rem.toString().padStart(3, "0");
    return `${peel.toLocaleString()}.${remStr}`;
  } catch {
    return "0.000";
  }
}

/** Truncate a banana specimen ID for display. */
function truncId(id: string): string {
  if (id.length <= 12) return id;
  return `${id.slice(0, 6)}…${id.slice(-4)}`;
}

/** Format an ISO timestamp to compact UTC string. */
function formatTs(ts: string): string {
  try {
    const d = new Date(ts);
    const hh = d.getUTCHours().toString().padStart(2, "0");
    const mm = d.getUTCMinutes().toString().padStart(2, "0");
    const ss = d.getUTCSeconds().toString().padStart(2, "0");
    return `${hh}:${mm}:${ss}Z`;
  } catch {
    return ts;
  }
}

/** Map a stage name to its accent colour variable value. */
function stageColor(stage: string): string {
  switch (stage) {
    case "DORMANT":
      return "var(--acid)";
    case "CHARGING":
      return "var(--bio)";
    case "MUTATING":
      return "var(--toxic)";
    case "CRITICAL":
      return "var(--plasma)";
    case "ASCENDED":
      return "#ffffff";
    default:
      return "var(--ash)";
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface StatTileProps {
  label: string;
  value: string;
  accent?: string;
  delay?: number;
}

function StatTile({ label, value, accent, delay = 0 }: StatTileProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      style={{
        flex: "1 1 140px",
        padding: "0.9rem 1.1rem",
        background: "var(--glass)",
        border: "1px solid var(--glass-edge)",
        backdropFilter: "blur(14px) saturate(1.25)",
        clipPath: "var(--clip)",
        position: "relative",
      }}
    >
      {/* corner tick */}
      <span
        style={{
          position: "absolute",
          top: 6,
          left: 6,
          width: 8,
          height: 8,
          borderTop: "1px solid var(--bio)",
          borderLeft: "1px solid var(--bio)",
          opacity: 0.7,
          display: "block",
        }}
      />
      <div className="eyebrow" style={{ marginBottom: "0.35rem" }}>
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--display)",
          fontWeight: 700,
          fontSize: "1.45rem",
          letterSpacing: "var(--tracking)",
          color: accent ?? "var(--ink)",
        }}
      >
        {value}
      </div>
    </motion.div>
  );
}

interface RipenessBarProps {
  ripeness: number;
  stage: string;
}

function RipenessBar({ ripeness, stage }: RipenessBarProps) {
  const pct = Math.round(ripeness * 100);
  const color = stageColor(stage);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.4rem",
        minWidth: 80,
      }}
    >
      <div
        style={{
          flex: 1,
          height: 4,
          background: "var(--hair)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            right: `${100 - pct}%`,
            background: color,
            transition: "right 0.6s var(--ease)",
          }}
        />
      </div>
      <span className="faint" style={{ fontFamily: "var(--mono)", fontSize: "0.62rem", minWidth: 28 }}>
        {pct}%
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function Observatory({ active }: ObservatoryProps) {
  const [data, setData] = useState<ObservatoryData>({
    stats: null,
    leaderboard: [],
    events: [],
  });
  const [offline, setOffline] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAll = async (): Promise<void> => {
    try {
      const [stats, leaderboard, events] = await Promise.all([
        getStats(),
        getLeaderboard(20),
        getEvents(30),
      ]);
      setData({ stats, leaderboard, events });
      setOffline(false);
    } catch {
      setOffline(true);
    }
  };

  useEffect(() => {
    if (!active) {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    void fetchAll();
    intervalRef.current = setInterval(() => {
      void fetchAll();
    }, 4_000);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [active]);

  const { stats, leaderboard, events } = data;
  const hasData = stats !== null || leaderboard.length > 0 || events.length > 0;

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="observatory"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 500,
            overflowY: "auto",
            background: "color-mix(in oklab, var(--void) 88%, transparent)",
            backdropFilter: "blur(4px)",
            padding: "2rem clamp(1rem, 5vw, 3rem)",
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem",
          }}
        >
          {/* ── Header ── */}
          <div style={{ display: "flex", alignItems: "baseline", gap: "1rem" }}>
            <h2
              style={{
                fontFamily: "var(--display)",
                fontSize: "clamp(1.1rem, 3vw, 1.6rem)",
                letterSpacing: "var(--tracking)",
                color: "var(--bio)",
                textShadow: "var(--glow-bio)",
              }}
            >
              OBSERVATORY
            </h2>
            <span className="eyebrow" style={{ color: "var(--ash-2)" }}>
              LIVE SPECIMEN TRACKING
            </span>
            {offline && (
              <motion.span
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                className="eyebrow"
                style={{ marginLeft: "auto", color: "var(--plasma)" }}
              >
                TELEMETRY OFFLINE
              </motion.span>
            )}
          </div>

          {/* ── Empty state ── */}
          {!hasData && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.75rem",
                paddingTop: "4rem",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--display)",
                  fontSize: "1rem",
                  letterSpacing: "var(--tracking)",
                  color: "var(--ash)",
                  textAlign: "center",
                }}
              >
                NO SPECIMENS OBSERVED
              </div>
              <div className="eyebrow" style={{ color: "var(--ash-2)", textAlign: "center" }}>
                FEED THE CODE TO POPULATE
              </div>
            </motion.div>
          )}

          {/* ── Stats strip ── */}
          {stats !== null && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
              <StatTile
                label="TOTAL SPECIMENS"
                value={stats.totalBananas.toLocaleString()}
                accent="var(--bio)"
                delay={0}
              />
              <StatTile
                label="$PEEL FED"
                value={formatWei(stats.totalPeelWei)}
                accent="var(--toxic)"
                delay={0.05}
              />
              <StatTile
                label="ASCENDED"
                value={stats.ascended.toLocaleString()}
                accent="#ffffff"
                delay={0.1}
              />
              <StatTile
                label="EVENT COUNT"
                value={stats.eventCount.toLocaleString()}
                accent="var(--acid)"
                delay={0.15}
              />
            </div>
          )}

          {/* ── Leaderboard ── */}
          {leaderboard.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="eyebrow" style={{ marginBottom: "0.6rem" }}>
                TOP FEEDERS — SPECIMEN LEADERBOARD
              </div>
              <div className="panel" style={{ overflow: "hidden" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontFamily: "var(--mono)",
                    fontSize: "0.78rem",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        borderBottom: "1px solid var(--hair)",
                      }}
                    >
                      {(["#", "SPECIMEN ID", "STAGE", "$PEEL STAKED", "RIPENESS"] as const).map(
                        (col) => (
                          <th
                            key={col}
                            className="eyebrow"
                            style={{
                              textAlign: "left",
                              padding: "0.65rem 0.9rem",
                              fontWeight: 400,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {col}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((row, i) => {
                      const resolvedStage =
                        row.stage && row.stage.length > 0
                          ? row.stage
                          : stageForRipeness(row.ripeness);
                      const accent = stageColor(resolvedStage);
                      return (
                        <motion.tr
                          key={row.bananaId}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{
                            duration: 0.3,
                            delay: 0.22 + i * 0.04,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                          style={{
                            borderBottom: "1px solid var(--hair)",
                          }}
                        >
                          <td
                            className="faint"
                            style={{ padding: "0.6rem 0.9rem", minWidth: 32 }}
                          >
                            {i + 1}
                          </td>
                          <td style={{ padding: "0.6rem 0.9rem", color: "var(--ink)" }}>
                            {truncId(row.bananaId)}
                          </td>
                          <td style={{ padding: "0.6rem 0.9rem" }}>
                            <span
                              style={{
                                fontFamily: "var(--display)",
                                fontSize: "0.68rem",
                                letterSpacing: "var(--tracking)",
                                color: "var(--void)",
                                background: accent,
                                padding: "0.15em 0.5em",
                                display: "inline-block",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {resolvedStage}
                            </span>
                          </td>
                          <td style={{ padding: "0.6rem 0.9rem", color: "var(--toxic)" }}>
                            {formatWei(row.peelStakedWei)}
                          </td>
                          <td style={{ padding: "0.6rem 0.9rem", minWidth: 120 }}>
                            <RipenessBar ripeness={row.ripeness} stage={resolvedStage} />
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.section>
          )}

          {/* ── Event log ── */}
          {events.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              style={{ paddingBottom: "2rem" }}
            >
              <div className="eyebrow" style={{ marginBottom: "0.6rem" }}>
                ANOMALY FEED — STAGE TRANSITIONS
              </div>
              <div
                className="panel"
                style={{
                  padding: "0.75rem 1rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.35rem",
                  maxHeight: "22rem",
                  overflowY: "auto",
                }}
              >
                {events.map((ev, i) => {
                  const accent = stageColor(ev.toStage);
                  const pct = Math.round(ev.ripenessAt * 100);
                  return (
                    <motion.div
                      key={`${ev.bananaId}-${ev.ts}-${i}`}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        duration: 0.25,
                        delay: 0.3 + i * 0.025,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      style={{
                        fontFamily: "var(--mono)",
                        fontSize: "0.73rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.2rem 0",
                        borderBottom: "1px solid var(--hair)",
                      }}
                    >
                      <span className="faint" style={{ minWidth: 72, flexShrink: 0 }}>
                        [{formatTs(ev.ts)}]
                      </span>
                      <span className="dim">ANOMALY</span>
                      <span
                        style={{
                          fontFamily: "var(--display)",
                          fontSize: "0.65rem",
                          letterSpacing: "var(--tracking)",
                          color: "var(--void)",
                          background: accent,
                          padding: "0.1em 0.4em",
                          flexShrink: 0,
                        }}
                      >
                        {ev.toStage}
                      </span>
                      <span className="faint">@</span>
                      <span style={{ color: accent }}>{pct}%</span>
                      <span className="faint" style={{ marginLeft: "auto", fontSize: "0.67rem" }}>
                        {truncId(ev.bananaId)}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.section>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

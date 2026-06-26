import { motion } from "motion/react";
import type { Stage } from "../../protocol/lifecycle";
import { STAGES, STAGE_HUD, stageIndex } from "../../protocol/lifecycle";

interface DossierProps {
  stage: Stage;
  ripeness: number;
  charge: number;
  peelWei: bigint;
  log: string[];
}

/** Format a wei bigint as a decimal with 18 implicit decimals, 3 fractional digits. */
function formatWei(wei: bigint): string {
  const s = wei.toString().padStart(19, "0");
  const intPart = s.slice(0, -18) || "0";
  const fracPart = s.slice(-18, -15);
  return `${intPart}.${fracPart}`;
}

interface MeterProps {
  label: string;
  value: number; // 0..1
}

function Meter({ label, value }: MeterProps) {
  const pct = Math.min(1, Math.max(0, value)) * 100;
  return (
    <div style={{ marginBottom: "0.55rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "0.2rem",
        }}
      >
        <span className="eyebrow" style={{ fontSize: "0.58rem" }}>
          {label}
        </span>
        <span
          className="faint"
          style={{ fontFamily: "var(--mono)", fontSize: "0.62rem" }}
        >
          {pct.toFixed(1)}%
        </span>
      </div>
      {/* track */}
      <div
        style={{
          position: "relative",
          height: "5px",
          background: "var(--hair)",
          overflow: "hidden",
        }}
      >
        {/* fill */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: "absolute",
            inset: "0 auto 0 0",
            background: "var(--stage-accent)",
            opacity: 0.9,
          }}
        />
        {/* scan shimmer */}
        <motion.div
          animate={{ x: ["-100%", "200%"] }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            ease: "linear",
            repeatDelay: 1.2,
          }}
          style={{
            position: "absolute",
            inset: 0,
            width: "40%",
            background:
              "linear-gradient(90deg, transparent 0%, color-mix(in oklab, var(--stage-accent) 60%, transparent) 50%, transparent 100%)",
            pointerEvents: "none",
          }}
        />
      </div>
    </div>
  );
}

const STEP_LABELS: Record<Stage, string> = {
  DORMANT: "DMT",
  CHARGING: "CHG",
  MUTATING: "MUT",
  CRITICAL: "CRT",
  ASCENDED: "ASC",
};

interface TimelineProps {
  current: Stage;
}

function Timeline({ current }: TimelineProps) {
  const currentIdx = stageIndex(current);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "2px",
        marginTop: "0.7rem",
        marginBottom: "0.6rem",
      }}
    >
      {STAGES.map((s, i) => {
        const active = i === currentIdx;
        const done = i < currentIdx;
        return (
          <div
            key={s}
            style={{ display: "flex", alignItems: "center", flex: i < STAGES.length - 1 ? "1 1 0" : "none" }}
          >
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.06, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "3px",
              }}
            >
              {/* node dot */}
              <div
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "1px",
                  background: active
                    ? "var(--stage-accent)"
                    : done
                    ? "var(--bio-dim)"
                    : "var(--hair)",
                  boxShadow: active ? "0 0 6px var(--stage-accent)" : "none",
                  transition: "background 0.4s, box-shadow 0.4s",
                }}
              />
              <span
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: "0.48rem",
                  letterSpacing: "0.1em",
                  color: active
                    ? "var(--stage-accent)"
                    : done
                    ? "var(--ash)"
                    : "var(--ash-2)",
                  whiteSpace: "nowrap",
                }}
              >
                {STEP_LABELS[s]}
              </span>
            </motion.div>
            {/* connector line between nodes */}
            {i < STAGES.length - 1 && (
              <div
                style={{
                  flex: "1 1 0",
                  height: "1px",
                  background: i < currentIdx ? "var(--bio-dim)" : "var(--hair)",
                  margin: "0 2px",
                  marginBottom: "11px",
                  transition: "background 0.4s",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function Dossier({ stage, ripeness, charge, peelWei, log }: DossierProps) {
  const hud = STAGE_HUD[stage];
  const visibleLog = log.slice(-5);

  return (
    <div
      data-stage={stage}
      className="panel"
      style={{
        position: "absolute",
        top: "1.2rem",
        left: "1.2rem",
        width: "clamp(260px, 28vw, 340px)",
        padding: "1rem 1rem 0.85rem",
        pointerEvents: "none",
        zIndex: 100,
        userSelect: "none",
      }}
    >
      {/* header */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div
          style={{
            fontFamily: "var(--display)",
            fontSize: "0.62rem",
            letterSpacing: "var(--tracking-wide)",
            textTransform: "uppercase",
            color: "var(--bio)",
            marginBottom: "0.25rem",
            paddingLeft: "14px",
          }}
        >
          ◢ BANANA PROTOCOL // SPECIMEN ANOMALY-001
        </div>

        {/* status line */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            marginBottom: "0.5rem",
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: "6px",
              height: "6px",
              borderRadius: "1px",
              background: "var(--stage-accent)",
              boxShadow: "0 0 6px var(--stage-accent)",
              animation: hud.danger ? "blink 0.8s step-end infinite" : "none",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: "var(--display)",
              fontSize: "0.7rem",
              letterSpacing: "var(--tracking)",
              textTransform: "uppercase",
              color: "var(--stage-accent)",
              fontWeight: 700,
            }}
          >
            {hud.status}
          </span>
        </div>

        {/* narration line */}
        <p
          className="dim"
          style={{
            fontFamily: "var(--mono)",
            fontSize: "0.6rem",
            lineHeight: 1.5,
            margin: "0 0 0.7rem",
            letterSpacing: "0.04em",
          }}
        >
          {hud.line}
        </p>
      </motion.div>

      {/* meter bars */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.4 }}
      >
        <Meter label="RIPENESS" value={ripeness} />
        <Meter label="CHARGE" value={charge} />
      </motion.div>

      {/* $PEEL FED */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          borderTop: "1px solid var(--hair)",
          paddingTop: "0.5rem",
          marginTop: "0.2rem",
        }}
      >
        <span className="eyebrow" style={{ fontSize: "0.56rem" }}>
          $PEEL FED
        </span>
        <span
          style={{
            fontFamily: "var(--mono)",
            fontSize: "0.72rem",
            fontWeight: 600,
            color: "var(--ink)",
            letterSpacing: "0.04em",
          }}
        >
          {formatWei(peelWei)}
        </span>
      </motion.div>

      {/* lifecycle timeline */}
      <Timeline current={stage} />

      {/* event log */}
      <div
        style={{
          borderTop: "1px solid var(--hair)",
          paddingTop: "0.5rem",
          minHeight: "3.5rem",
          maxHeight: "5.5rem",
          overflowY: "hidden",
        }}
      >
        <span className="eyebrow" style={{ fontSize: "0.52rem", display: "block", marginBottom: "0.3rem" }}>
          EVENT LOG
        </span>
        {visibleLog.length === 0 ? (
          <span className="faint" style={{ fontFamily: "var(--mono)", fontSize: "0.58rem" }}>
            — awaiting events —
          </span>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {visibleLog.map((line, i) => (
              <motion.div
                key={`${i}-${line}`}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04, duration: 0.25 }}
                className="faint"
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: "0.56rem",
                  lineHeight: 1.4,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  letterSpacing: "0.02em",
                }}
              >
                {line}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

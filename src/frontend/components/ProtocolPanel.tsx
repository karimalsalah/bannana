import { motion } from "motion/react";
import type { Variants } from "motion/react";
import type { WalletSession } from "../../web3/account.js";
import { STAGE_HUD, type Stage } from "../../protocol/lifecycle.js";

/** Format a wei bigint as a decimal with 18 implicit decimals, 3 fractional digits. */
function formatWei(wei: bigint): string {
  const s = wei.toString().padStart(19, "0");
  const intPart = s.slice(0, -18) || "0";
  const fracPart = s.slice(-18, -15);
  return `${intPart}.${fracPart}`;
}

export interface ProtocolPanelProps {
  session: WalletSession | null;
  stage: Stage;
  peelWei: bigint;
  busy: boolean;
  backendOk: boolean | null;
  gpuOk: boolean | null;
  referralUnlocked: boolean;
  error: string | null;
  onConnect: () => void;
  onFeed: () => void;
}

function truncateAddress(address: string): string {
  if (address.length < 10) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

interface StatusDotProps {
  ok: boolean | null;
  label: string;
}

function StatusDot({ ok, label }: StatusDotProps): React.JSX.Element {
  const color = ok === true ? "var(--bio)" : "var(--ash-2)";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.3rem",
        fontFamily: "var(--mono)",
        fontSize: "0.62rem",
        letterSpacing: "var(--tracking)",
        textTransform: "uppercase",
        color: ok === true ? "var(--bio)" : "var(--ash)",
      }}
    >
      <span
        style={{
          display: "inline-block",
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: color,
          boxShadow: ok === true ? "var(--glow-bio)" : "none",
          flexShrink: 0,
        }}
      />
      {label}
    </span>
  );
}

const containerVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: "easeOut" },
  }),
};

export default function ProtocolPanel({
  session,
  stage,
  peelWei,
  busy,
  backendOk,
  gpuOk,
  referralUnlocked,
  error,
  onConnect,
  onFeed,
}: ProtocolPanelProps): React.JSX.Element {
  const hud = STAGE_HUD[stage];
  return (
    <motion.div
      className="panel"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{
        position: "fixed",
        bottom: "clamp(1rem, 2.5vw, 2rem)",
        right: "clamp(1rem, 2.5vw, 2rem)",
        width: "clamp(280px, 22vw, 360px)",
        padding: "1.25rem 1.25rem 1rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        zIndex: 100,
      }}
    >
      {/* Header */}
      <motion.div custom={0} variants={itemVariants} initial="hidden" animate="visible">
        <div className="eyebrow" style={{ marginBottom: "0.2rem" }}>
          INJECT COMPUTATIONAL MASS
        </div>
        <div
          style={{
            fontFamily: "var(--mono)",
            fontSize: "0.6rem",
            letterSpacing: "var(--tracking-wide)",
            textTransform: "uppercase",
            color: "var(--ash-2)",
          }}
        >
          ERC-4337 STAKE TERMINAL
        </div>
      </motion.div>

      {/* Divider */}
      <div
        style={{
          height: "1px",
          background:
            "linear-gradient(90deg, var(--bio) 0%, color-mix(in oklab, var(--bio) 20%, transparent) 100%)",
          opacity: 0.3,
        }}
      />

      {session === null ? (
        /* Disconnected state */
        <>
          <motion.div
            custom={1}
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            style={{
              fontFamily: "var(--mono)",
              fontSize: "0.72rem",
              lineHeight: 1.6,
              color: "var(--ash)",
            }}
          >
            BIOMETRIC AUTHENTICATION REQUIRED.{" "}
            <span style={{ color: "var(--ink)" }}>
              PASSKEY SIGNER MUST BE ENROLLED BEFORE THE PROTOCOL ACCEPTS YOUR MASS.
            </span>
          </motion.div>

          <motion.div custom={2} variants={itemVariants} initial="hidden" animate="visible">
            <motion.button
              className="btn"
              onClick={onConnect}
              disabled={busy}
              whileTap={{ scale: 0.97 }}
              style={{ width: "100%" }}
            >
              {busy ? "AUTHORIZING…" : "CONNECT PASSKEY"}
            </motion.button>
          </motion.div>
        </>
      ) : (
        /* Connected state */
        <>
          {/* Address + account type */}
          <motion.div
            custom={1}
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}
          >
            <div
              style={{
                fontFamily: "var(--display)",
                fontSize: "0.78rem",
                letterSpacing: "var(--tracking)",
                color: "var(--bio)",
                textTransform: "uppercase",
              }}
            >
              {truncateAddress(session.address)}
            </div>
            <div
              className="faint"
              style={{
                fontFamily: "var(--mono)",
                fontSize: "0.6rem",
                letterSpacing: "var(--tracking)",
                textTransform: "uppercase",
              }}
            >
              {hud.status} // {formatWei(peelWei)} $PEEL FED
            </div>
          </motion.div>

          {/* Referral status */}
          <motion.div
            custom={2}
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              fontFamily: "var(--mono)",
              fontSize: "0.62rem",
              letterSpacing: "var(--tracking)",
              textTransform: "uppercase",
            }}
          >
            <span className="eyebrow" style={{ fontSize: "0.58rem" }}>
              REFERRAL
            </span>
            {referralUnlocked ? (
              <span style={{ color: "var(--bio)", fontWeight: 600 }}>UNLOCKED</span>
            ) : (
              <span style={{ color: "var(--ash)" }}>LOCKED · SUB-THRESHOLD</span>
            )}
          </motion.div>

          {/* CTA button */}
          <motion.div custom={3} variants={itemVariants} initial="hidden" animate="visible">
            <motion.button
              className="btn btn--toxic"
              onClick={onFeed}
              disabled={busy}
              whileTap={{ scale: 0.97 }}
              style={{ width: "100%", color: "var(--void)" }}
            >
              {busy
                ? "SUBMITTING USEROP…"
                : "FEED THE CODE — STAKE $PEEL"}
            </motion.button>
          </motion.div>
        </>
      )}

      {/* Error readout */}
      {error !== null && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          style={{
            fontFamily: "var(--mono)",
            fontSize: "0.65rem",
            letterSpacing: "var(--tracking)",
            color: "var(--plasma)",
            textTransform: "uppercase",
            lineHeight: 1.5,
            wordBreak: "break-word",
          }}
        >
          ERR // {error}
        </motion.div>
      )}

      {/* Status footer */}
      <div
        style={{
          display: "flex",
          gap: "0.9rem",
          paddingTop: "0.5rem",
          borderTop: "1px solid color-mix(in oklab, var(--hair) 80%, transparent)",
        }}
      >
        <StatusDot ok={backendOk} label="BACKEND" />
        <StatusDot ok={gpuOk} label="WEBGPU" />
      </div>
    </motion.div>
  );
}

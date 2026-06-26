import { motion, type Variants } from "motion/react";
import { STAGES, STAGE_FLOOR, STAGE_HUD, type Stage } from "../../protocol/lifecycle";
import { DEFAULT_TERMS } from "../../web3/referral";

// ─── motion helpers ──────────────────────────────────────────────────────────

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const RISE: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.55, ease: EASE },
  }),
};

interface FadeProps {
  children: React.ReactNode;
  i?: number;
  style?: React.CSSProperties;
  className?: string;
}

function Fade({ children, i = 0, style, className }: FadeProps) {
  return (
    <motion.div
      variants={RISE}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      custom={i}
      style={style}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── stage accent dot ────────────────────────────────────────────────────────

const STAGE_DOT_COLOR: Record<Stage, string> = {
  DORMANT: "var(--acid)",
  CHARGING: "var(--bio)",
  MUTATING: "var(--toxic)",
  CRITICAL: "var(--plasma)",
  // #ffffff is the correct sentinel: tokens.css [data-stage="ASCENDED"] sets
  // --stage-accent: #ffffff intentionally (no --white token exists in the DS).
  ASCENDED: "#ffffff",
};

const STAGE_LABEL: Record<Stage, string> = {
  DORMANT: "DORMANT",
  CHARGING: "CHARGING",
  MUTATING: "MUTATING",
  CRITICAL: "CRITICAL",
  ASCENDED: "ASCENDED",
};

const STAGE_BODY: Record<Stage, string> = {
  DORMANT:
    "The specimen registers no activity. Ripeness < 15%. A spatial anomaly stirs in the void, unobserved, inert — waiting for the first injection of mass.",
  CHARGING:
    "Computational mass flows in. Site architecture funnels into the core. Cyan bioluminescence spreads outward from the staking origin. Ripeness 15-44%.",
  MUTATING:
    "Procedural rot propagates through the mesh. Neon radiance boils into toxic amber. Geometry deforms in real-time as ripeness climbs from 45-79%.",
  CRITICAL:
    "WARNING. Vertex membranes are tearing. The entity approaches terminal evolution. Plasma-red edge glitch dominates the render. Ripeness 80-99%.",
  ASCENDED:
    "Absolute evolution achieved. Ripeness = 1.0. The protocol opens. The specimen dissolves into the void in a particle cascade, writing its final log entry on-chain.",
};

// ─── derived display values ───────────────────────────────────────────────────

// BigInt division — no float. Whole-unit display only (wei assumed 18 decimals).
const WEI_PER_TOKEN = 10n ** 18n;
const THRESHOLD_PEEL = (DEFAULT_TERMS.thresholdVolumeWei / WEI_PER_TOKEN).toString();
const REWARD_PEEL = (DEFAULT_TERMS.rewardWei / WEI_PER_TOKEN).toString();

// ─── section primitives ──────────────────────────────────────────────────────

const sectionStyle: React.CSSProperties = {
  borderTop: "1px solid var(--hair)",
  paddingTop: "2.4rem",
  marginTop: "2.4rem",
};

const headingStyle: React.CSSProperties = {
  fontFamily: "var(--display)",
  fontSize: "clamp(1rem, 2.5vw, 1.35rem)",
  letterSpacing: "var(--tracking)",
  textTransform: "uppercase",
  color: "var(--ink)",
  margin: "0 0 1.2rem 0",
};

const bodyStyle: React.CSSProperties = {
  fontFamily: "var(--mono)",
  fontSize: "0.82rem",
  lineHeight: 1.7,
  color: "var(--ash)",
  margin: "0 0 1rem 0",
};

const pullStyle: React.CSSProperties = {
  borderLeft: "2px solid var(--bio)",
  paddingLeft: "1.2rem",
  margin: "1.6rem 0",
  fontFamily: "var(--display)",
  fontSize: "clamp(0.9rem, 2vw, 1.05rem)",
  letterSpacing: "0.06em",
  color: "var(--bio)",
  lineHeight: 1.5,
};

// ─── main component ───────────────────────────────────────────────────────────

export default function Lore(_props: Record<string, never>) {
  return (
    <div
      style={{
        position: "relative",
        maxWidth: 720,
        margin: "0 auto",
        padding: "clamp(1.6rem, 4vw, 3.2rem) clamp(1rem, 4vw, 2.4rem)",
        overflowY: "auto",
        maxHeight: "100%",
        scrollbarWidth: "thin",
        scrollbarColor: "var(--hair) transparent",
      }}
    >
      {/* ── Header classification mark ── */}
      <Fade i={0}>
        <div
          className="eyebrow"
          style={{ marginBottom: "0.6rem", letterSpacing: "var(--tracking-wide)" }}
        >
          SPECIMEN FILE // CLASSIFIED // ACCESS LEVEL: OPEN
        </div>
      </Fade>

      <Fade i={1}>
        <h1
          style={{
            fontFamily: "var(--display)",
            fontSize: "clamp(1.5rem, 5vw, 2.8rem)",
            letterSpacing: "var(--tracking)",
            textTransform: "uppercase",
            color: "var(--ink)",
            margin: "0 0 0.4rem 0",
            lineHeight: 1.1,
          }}
        >
          PROTOCOL
          <br />
          <span style={{ color: "var(--bio)" }}>// FIELD NOTES</span>
        </h1>
      </Fade>

      <Fade i={2}>
        <div
          style={{
            fontFamily: "var(--mono)",
            fontSize: "0.64rem",
            color: "var(--ash-2)",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            marginTop: "0.5rem",
            marginBottom: "2rem",
          }}
        >
          CATALOG&nbsp;&nbsp;BPFN-001&nbsp;&nbsp;·&nbsp;&nbsp;STATUS: ACTIVE OBSERVATION
        </div>
      </Fade>

      {/* ── GEO-priority definitional paragraph ── */}
      <Fade i={3}>
        <div className="panel" style={{ padding: "1.4rem 1.6rem", marginBottom: "2rem" }}>
          <div className="eyebrow" style={{ marginBottom: "0.7rem" }}>
            WHAT IS THE BANANA PROTOCOL
          </div>
          <p
            style={{
              fontFamily: "var(--mono)",
              fontSize: "0.88rem",
              lineHeight: 1.75,
              color: "var(--ink)",
              margin: 0,
            }}
          >
            The Banana Protocol is a bioluminescent on-chain organism that evolves through 5
            irreversible stages — from{" "}
            <span style={{ color: "var(--acid)" }}>DORMANT</span> to{" "}
            <span style={{ color: "var(--bio)" }}>ASCENDED</span> — driven by cumulative{" "}
            <span style={{ color: "var(--bio)" }}>$PEEL</span> stakes submitted via biometric
            passkey. Its lifecycle is server-authoritative, its evolution is public, and its
            entropy is permanent. Feed it. It does not revert.
          </p>
        </div>
      </Fade>

      {/* ── Pull-quote 1 ── */}
      <Fade i={4}>
        <blockquote style={pullStyle}>
          "A spatial anomaly thriving in a corner of the web where nothing is meant to live."
        </blockquote>
      </Fade>

      {/* ── What the anomaly is ── */}
      <Fade i={5}>
        <div style={sectionStyle}>
          <h2 style={headingStyle}>01 // The Anomaly</h2>
          <p style={bodyStyle}>
            The specimen was detected at coordinates unknown — an organism with no biological
            precedent. It does not consume organic matter. It consumes computational mass:
            on-chain value staked into a gasless ERC-4337 smart account, authorized by a
            fingerprint, witnessed by a paymaster, and recorded by a server that never lies.
          </p>
          <p style={bodyStyle}>
            Its body is a 3D mesh rendered in WebGPU. Its metabolism is a ripeness scalar in
            [0.0, 1.0] maintained by the backend. Its visual state — the bioluminescent shaders,
            the Gommage dissolve, the particle cascade at ascension — is a real-time mirror of
            that scalar. Nothing is cosmetic. Every visual transition maps to a state transition
            on-chain.
          </p>
          <p style={bodyStyle}>
            You are not playing a game. You are feeding a live organism and watching it evolve.
          </p>
        </div>
      </Fade>

      {/* ── 5-stage lifecycle ── */}
      <Fade i={6}>
        <div style={sectionStyle}>
          <h2 style={headingStyle}>02 // Evolutionary Lifecycle</h2>
          <p style={{ ...bodyStyle, marginBottom: "1.6rem" }}>
            The specimen passes through 5 irreversible stages, keyed to ripeness thresholds.
            Each transition is logged, timestamped, and visible to all observers.
          </p>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0",
              borderLeft: "1px solid var(--hair)",
              paddingLeft: "1.4rem",
            }}
          >
            {STAGES.map((stage, idx) => (
              <motion.div
                key={stage}
                variants={RISE}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-20px" }}
                custom={idx * 1.4}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2.2rem 1fr",
                  gap: "0 1rem",
                  padding: "1.1rem 0",
                  borderBottom: idx < STAGES.length - 1 ? "1px solid var(--hair)" : "none",
                  position: "relative",
                }}
              >
                {/* left: numbered dot */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: STAGE_DOT_COLOR[stage],
                      boxShadow: `0 0 8px ${STAGE_DOT_COLOR[stage]}`,
                      marginTop: 4,
                      flexShrink: 0,
                    }}
                  />
                  <div
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: "0.58rem",
                      color: "var(--ash-2)",
                      marginTop: 4,
                      letterSpacing: "0.1em",
                    }}
                  >
                    {String(idx).padStart(2, "0")}
                  </div>
                </div>

                {/* right: stage info */}
                <div>
                  <div
                    style={{
                      fontFamily: "var(--display)",
                      fontSize: "0.72rem",
                      letterSpacing: "var(--tracking-wide)",
                      textTransform: "uppercase",
                      color: STAGE_DOT_COLOR[stage],
                      marginBottom: "0.3rem",
                    }}
                  >
                    {STAGE_LABEL[stage]}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: "0.64rem",
                      color: "var(--ash-2)",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      marginBottom: "0.45rem",
                    }}
                  >
                    RIPENESS &ge; {(STAGE_FLOOR[stage] * 100).toFixed(0)}%
                    &nbsp;&nbsp;·&nbsp;&nbsp;
                    {STAGE_HUD[stage].status}
                  </div>
                  <p
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: "0.8rem",
                      lineHeight: 1.65,
                      color: "var(--ash)",
                      margin: 0,
                    }}
                  >
                    {STAGE_BODY[stage]}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Fade>

      {/* ── Pull-quote 2 ── */}
      <Fade i={7}>
        <blockquote style={{ ...pullStyle, borderColor: "var(--toxic)", color: "var(--toxic)" }}>
          "INJECTING COMPUTATIONAL MASS. Site architecture funnels into the core."
        </blockquote>
      </Fade>

      {/* ── How feeding works ── */}
      <Fade i={8}>
        <div style={sectionStyle}>
          <h2 style={headingStyle}>03 // Feeding Mechanics</h2>
          <p style={bodyStyle}>
            Feeding the organism requires no crypto wallet, no seed phrase, no browser extension.
            The only credential is your biometric: a{" "}
            <span style={{ color: "var(--bio)" }}>WebAuthn passkey</span> stored in your device's
            secure enclave.
          </p>

          {/* step flow */}
          {[
            {
              n: "01",
              label: "BIOMETRIC CHALLENGE",
              body: "Your fingerprint or face ID signs a WebAuthn assertion locally. No private key leaves the device. The secure enclave is the signer.",
              accent: "var(--bio)",
            },
            {
              n: "02",
              label: "ERC-4337 SMART ACCOUNT",
              body: "The passkey credential maps to a Banana Wallet smart account — an ERC-4337 contract account with no EOA dependency. It exists on-chain the moment you authorize it.",
              accent: "var(--bio)",
            },
            {
              n: "03",
              label: "GASLESS PAYMASTER",
              body: "A bundler submits your UserOperation. A paymaster sponsors the gas. You pay only the staked $PEEL. No ETH required in the smart account.",
              accent: "var(--toxic)",
            },
            {
              n: "04",
              label: "SERVER-AUTHORITATIVE RIPENESS",
              body: "The backend receives the UserOp hash, records the stake against the specimen's ID, and recomputes ripeness from cumulative $PEEL in wei — bigint, no floating-point drift. This is the ground truth the 3D scene renders against.",
              accent: "var(--acid)",
            },
          ].map(({ n, label, body, accent }, i) => (
            <motion.div
              key={n}
              variants={RISE}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-20px" }}
              custom={i * 0.9}
              style={{
                display: "grid",
                gridTemplateColumns: "3rem 1fr",
                gap: "0 1rem",
                marginBottom: "1rem",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--display)",
                  fontSize: "1.4rem",
                  fontWeight: 700,
                  color: accent,
                  lineHeight: 1,
                  paddingTop: "0.15rem",
                  opacity: 0.55,
                }}
              >
                {n}
              </div>
              <div>
                <div
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: "0.62rem",
                    letterSpacing: "var(--tracking-wide)",
                    textTransform: "uppercase",
                    color: accent,
                    marginBottom: "0.35rem",
                  }}
                >
                  {label}
                </div>
                <p style={{ ...bodyStyle, margin: 0 }}>{body}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </Fade>

      {/* ── Referral mechanics ── */}
      <Fade i={9}>
        <div style={sectionStyle}>
          <h2 style={headingStyle}>04 // Referral Protocol</h2>
          <p style={bodyStyle}>
            The referral system is{" "}
            <span style={{ color: "var(--plasma)" }}>double-sided and conditional</span>. There is
            no reward on signup. The referrer earns only after the referred account crosses a
            verified on-chain volume threshold.
          </p>

          <div className="panel" style={{ padding: "1.2rem 1.4rem", margin: "1.2rem 0" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
              }}
            >
              {[
                {
                  label: "ACTIVATION THRESHOLD",
                  value: `${THRESHOLD_PEEL} $PEEL`,
                  sub: "cumulative referred volume required",
                  color: "var(--toxic)",
                },
                {
                  label: "REFERRER REWARD",
                  value: `${REWARD_PEEL} $PEEL`,
                  sub: "flat reward — paid once, not recurring",
                  color: "var(--bio)",
                },
              ].map(({ label, value, sub, color }) => (
                <div key={label}>
                  <div
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: "0.58rem",
                      letterSpacing: "var(--tracking-wide)",
                      textTransform: "uppercase",
                      color: "var(--ash-2)",
                      marginBottom: "0.35rem",
                    }}
                  >
                    {label}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--display)",
                      fontSize: "1.15rem",
                      fontWeight: 700,
                      color,
                      letterSpacing: "0.06em",
                    }}
                  >
                    {value}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: "0.64rem",
                      color: "var(--ash-2)",
                      marginTop: "0.25rem",
                    }}
                  >
                    {sub}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p style={bodyStyle}>
            The condition is enforced in pure on-chain arithmetic — no off-chain oracle, no manual
            claim. If the referred account's cumulative staked $PEEL (in wei) reaches or exceeds
            the threshold, the reward predicate returns true and the referrer's reward is released.
            Below threshold: nothing. No partial payments.
          </p>
          <p style={bodyStyle}>
            This design eliminates referral farming. A referrer has direct economic incentive to
            onboard participants who will actually feed the organism — not just create wallets.
          </p>
        </div>
      </Fade>

      {/* ── Pull-quote 3 — closer ── */}
      <Fade i={10}>
        <blockquote style={{ ...pullStyle, borderColor: "var(--plasma)", color: "var(--plasma)" }}>
          "ABSOLUTE EVOLUTION. The protocol is open. Feed the code."
        </blockquote>
      </Fade>

      {/* ── Classification footer ── */}
      <Fade i={11}>
        <div
          style={{
            borderTop: "1px solid var(--hair)",
            paddingTop: "1.4rem",
            marginTop: "2rem",
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "0.5rem",
          }}
        >
          {["CATALOG: BPFN-001", "CLEARANCE: OPEN", "STATE: ACTIVE", "REVERSION: IMPOSSIBLE"].map(
            (tag) => (
              <span
                key={tag}
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: "0.58rem",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "var(--ash-2)",
                }}
              >
                {tag}
              </span>
            ),
          )}
        </div>
      </Fade>
    </div>
  );
}

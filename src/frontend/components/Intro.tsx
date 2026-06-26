import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";

interface IntroProps {
  videoSrc: string;
  onEnter: () => void;
}

const BOOT_LINES = [
  "CONTAINMENT VOID // HARDWARE-ACCELERATED",
  "SPECIMEN CLASS: ANOMALY-001",
  "BIO-SIGNATURE: BIOLUMINESCENT",
  "STATUS: DORMANT",
  "THREAT LEVEL: UNCLASSIFIED",
  "OBSERVER MODE: ACTIVE",
] as const;

export default function Intro({ videoSrc, onEnter }: IntroProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const shouldReduce = useReducedMotion();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handler = () => {
      onEnter();
    };
    video.addEventListener("ended", handler);
    return () => {
      video.removeEventListener("ended", handler);
    };
  }, [onEnter]);

  const lineVariants = {
    hidden: { opacity: 0, y: shouldReduce ? 0 : 8 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: shouldReduce ? 0 : 0.6 + i * 0.18,
        duration: shouldReduce ? 0 : 0.35,
        ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      },
    }),
  };

  const panelVariants = {
    hidden: { opacity: 0, y: shouldReduce ? 0 : 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delay: shouldReduce ? 0 : 0.3,
        duration: shouldReduce ? 0 : 0.5,
        ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      },
    },
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "var(--void)",
        overflow: "hidden",
      }}
    >
      {/* Full-bleed video */}
      <video
        ref={videoRef}
        src={videoSrc}
        autoPlay
        muted
        playsInline
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: 0.72,
        }}
      />

      {/* Vignette overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(120% 90% at 50% 45%, transparent 35%, color-mix(in oklab, var(--void) 85%, transparent) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Scanlines */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "repeating-linear-gradient(to bottom, transparent 0 2px, rgba(0,0,0,0.18) 2px 3px)",
          opacity: 0.5,
          mixBlendMode: "multiply",
          pointerEvents: "none",
        }}
      />

      {/* Bottom-left terminal panel */}
      <motion.div
        className="panel"
        initial="hidden"
        animate="visible"
        variants={panelVariants}
        style={{
          position: "absolute",
          bottom: "clamp(1.5rem, 4vh, 3rem)",
          left: "clamp(1.5rem, 4vw, 3rem)",
          maxWidth: "clamp(280px, 38vw, 480px)",
          padding: "1.5rem 1.75rem 1.75rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.1rem",
        }}
      >
        {/* Eyebrow */}
        <span className="eyebrow" style={{ letterSpacing: "0.32em" }}>
          CLASSIFIED // SCP-BANANA-001
        </span>

        {/* Big title */}
        <h1
          style={{
            fontFamily: "var(--display)",
            fontWeight: 700,
            fontSize: "clamp(1.35rem, 3.2vw, 2rem)",
            letterSpacing: "0.14em",
            color: "var(--ink)",
            textTransform: "uppercase",
            lineHeight: 1.1,
            margin: 0,
          }}
        >
          THE BANANA
          <br />
          <span style={{ color: "var(--bio)" }}>PROTOCOL</span>
        </h1>

        {/* Boot terminal lines */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.3rem",
          }}
        >
          {BOOT_LINES.map((line, i) => (
            <motion.div
              key={line}
              custom={i}
              initial="hidden"
              animate="visible"
              variants={lineVariants}
              style={{
                fontFamily: "var(--mono)",
                fontSize: "0.7rem",
                letterSpacing: "0.08em",
                color: "var(--ash)",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <span style={{ color: "var(--bio)", opacity: 0.6 }}>{">"}</span>
              {line}
            </motion.div>
          ))}

          {/* Blinking cursor line */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              delay: shouldReduce ? 0 : 0.6 + BOOT_LINES.length * 0.18 + 0.2,
            }}
            style={{
              fontFamily: "var(--mono)",
              fontSize: "0.7rem",
              letterSpacing: "0.08em",
              color: "var(--bio)",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <span style={{ opacity: 0.6 }}>{">"}</span>
            <span
              style={{
                display: "inline-block",
                width: "0.55rem",
                height: "0.85rem",
                background: "var(--bio)",
                animation: "blink 1.1s step-end infinite",
                verticalAlign: "middle",
              }}
            />
          </motion.div>
        </div>

        {/* CTA */}
        <motion.button
          className="btn"
          initial={{ opacity: 0, scale: shouldReduce ? 1 : 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            delay: shouldReduce ? 0 : 0.6 + BOOT_LINES.length * 0.18 + 0.55,
            duration: 0.35,
            ease: [0.5, 1.6, 0.4, 1],
          }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onEnter}
          style={{
            alignSelf: "flex-start",
            fontSize: "0.78rem",
            padding: "0.9rem 1.6rem",
          }}
        >
          ENTER THE VOID
        </motion.button>
      </motion.div>
    </div>
  );
}

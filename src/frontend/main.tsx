/// <reference types="vite/client" />
import { StrictMode, useCallback, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { createScene, type SceneHandle } from "./scene";
import { createHud } from "./hud";
import { injectStructuredData } from "./geo";
import {
  connectPasskeyWallet,
  isWebAuthnAvailable,
  stakePeel,
  type WalletSession,
} from "../web3/account";
import { DEFAULT_TERMS, isReferralUnlocked } from "../web3/referral";
import { STAGE_HUD, type Stage } from "../protocol/lifecycle";
import "./styles.css";

const PEEL = 10n ** 18n; // 1 $PEEL in wei
const VIDEO = `${import.meta.env.BASE_URL}the-banana-protocol.mp4`;

function App() {
  const [phase, setPhase] = useState<"intro" | "live">("intro");
  const [session, setSession] = useState<WalletSession | null>(null);
  const [peelWei, setPeelWei] = useState(0n);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<Stage>("DORMANT");
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hudMount = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<SceneHandle | null>(null);
  const fedRef = useRef(0);

  useEffect(() => {
    injectStructuredData();
  }, []);

  // Boot the WebGPU scene once we enter the void.
  useEffect(() => {
    if (phase !== "live" || !canvasRef.current) return;
    let raf = 0;
    let disposed = false;
    const hud = createHud();
    hudMount.current?.appendChild(hud.root);

    createScene(canvasRef.current)
      .then((handle) => {
        if (disposed) {
          handle.dispose();
          return;
        }
        sceneRef.current = handle;
        handle.onStage((s) => {
          setStage(s);
          hud.setStage(s);
          hud.log(STAGE_HUD[s].status);
        });
        const tick = () => {
          hud.setReadout(rip(handle), 0, fedWei(fedRef.current));
          raf = requestAnimationFrame(tick);
        };
        tick();
      })
      .catch((e: unknown) => setError(errMsg(e)));

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      sceneRef.current?.dispose();
      sceneRef.current = null;
      hud.dispose();
    };
  }, [phase]);

  const connect = useCallback(async () => {
    setError(null);
    if (!isWebAuthnAvailable()) {
      setError("WebAuthn unavailable. Use a browser with passkey support.");
      return;
    }
    setBusy(true);
    try {
      const s = await connectPasskeyWallet();
      setSession(s);
      sceneRef.current?.addCharge(0.35);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  }, []);

  const feed = useCallback(async () => {
    if (!session) return;
    setError(null);
    setBusy(true);
    try {
      const receipt = await stakePeel(session, PEEL);
      const next = peelWei + BigInt(receipt.amountWei);
      setPeelWei(next);
      fedRef.current += 1;
      const target = Math.min(1, fedRef.current * 0.16);
      sceneRef.current?.setRipeness(target);
      sceneRef.current?.addCharge(0.4);
      if (target >= 1) sceneRef.current?.pulse();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  }, [session, peelWei]);

  if (phase === "intro") {
    return (
      <div className="intro">
        <video
          src={VIDEO}
          autoPlay
          muted
          playsInline
          onEnded={() => setPhase("live")}
        />
        <button className="intro__enter" onClick={() => setPhase("live")}>
          Enter the void
        </button>
      </div>
    );
  }

  const referralUnlocked = isReferralUnlocked(peelWei, DEFAULT_TERMS);

  return (
    <>
      <canvas id="stage" ref={canvasRef} />
      <div ref={hudMount} />
      <aside className="mass">
        <h2 className="mass__title">◢ Inject computational mass</h2>
        <p className="mass__sub">
          {session
            ? "Stage: " + stage + ". Feed the code to force the next evolution."
            : "The interface demands an immediate injection. Connect a biometric signer."}
        </p>

        {!session ? (
          <button onClick={connect} disabled={busy}>
            {busy ? "Authorizing…" : "Connect passkey"}
          </button>
        ) : (
          <button className="feed" onClick={feed} disabled={busy}>
            {busy ? "Submitting userOp…" : "Feed the code — stake $PEEL"}
          </button>
        )}

        {session && (
          <p className="mass__addr">
            ◇ {session.address.slice(0, 10)}…{session.address.slice(-6)}
            <br />
            referral reward: {referralUnlocked ? "UNLOCKED" : "locked (sub-threshold)"}
          </p>
        )}
        {error && <p className="mass__err">⚠ {error}</p>}
      </aside>
    </>
  );
}

// The scene exposes stage but not raw ripeness; approximate the bar from stage floors.
function rip(_handle: SceneHandle): number {
  return STAGE_FLOOR_BY_STAGE[_handle.stage()];
}
const STAGE_FLOOR_BY_STAGE: Record<Stage, number> = {
  DORMANT: 0.05,
  CHARGING: 0.25,
  MUTATING: 0.55,
  CRITICAL: 0.85,
  ASCENDED: 1,
};

function fedWei(stakes: number): bigint {
  return BigInt(stakes) * PEEL;
}

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

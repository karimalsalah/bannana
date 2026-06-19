/// <reference types="vite/client" />
import { useCallback, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { createScene, type SceneHandle } from "./scene";
import { createHud } from "./hud";
import { injectStructuredData } from "./geo";
import { health, postStake } from "./api";
import { probeWebGPU, renderWebGPUNotice } from "./webgpu";
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
  const [gpuOk, setGpuOk] = useState<boolean | null>(null);
  const [backendOk, setBackendOk] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hudMount = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<SceneHandle | null>(null);
  const hudRef = useRef<ReturnType<typeof createHud> | null>(null);
  const ripenessRef = useRef(0);
  const peelWeiRef = useRef(0n);

  // Probe the backend once; surface its reachability in the panel.
  useEffect(() => {
    injectStructuredData();
    health()
      .then(() => setBackendOk(true))
      .catch(() => setBackendOk(false));
  }, []);

  // Enter the void: render the WebGPU scene, or a graceful notice if unsupported.
  useEffect(() => {
    if (phase !== "live") return;
    let raf = 0;
    let disposed = false;
    let notice: HTMLElement | null = null;
    const hud = createHud();
    hudRef.current = hud;
    hudMount.current?.appendChild(hud.root);

    (async () => {
      const ok = await probeWebGPU();
      if (disposed) return;
      setGpuOk(ok);

      if (ok && canvasRef.current) {
        const handle = await createScene(canvasRef.current);
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
      } else {
        document.body.classList.add("webgpu-fallback");
        notice = renderWebGPUNotice(
          document.body,
          "The spatial scene needs WebGPU. The protocol loop is still live — connect a passkey and feed the code; the lifecycle is computed server-side.",
        );
        hud.log("WEBGPU UNAVAILABLE — loop live");
      }

      const tick = () => {
        hud.setReadout(ripenessRef.current, 0, peelWeiRef.current);
        raf = requestAnimationFrame(tick);
      };
      tick();
    })().catch((e: unknown) => setError(errMsg(e)));

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      sceneRef.current?.dispose();
      sceneRef.current = null;
      hud.dispose();
      hudRef.current = null;
      notice?.remove();
      document.body.classList.remove("webgpu-fallback");
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

  // Feed the code: web3 stake (client) -> backend recordStake (authoritative) -> render.
  const feed = useCallback(async () => {
    if (!session) return;
    setError(null);
    setBusy(true);
    try {
      const receipt = await stakePeel(session, PEEL);
      const snap = await postStake({
        bananaId: session.address,
        amountWei: receipt.amountWei,
        userOpHash: receipt.userOpHash,
      });
      ripenessRef.current = snap.ripeness;
      peelWeiRef.current = BigInt(snap.peelStakedWei);
      setPeelWei(peelWeiRef.current);
      setStage(snap.stage as Stage);
      sceneRef.current?.setRipeness(snap.ripeness);
      sceneRef.current?.addCharge(0.4);
      if (snap.ripeness >= 1) sceneRef.current?.pulse();
      hudRef.current?.log(`STAKE → ${snap.stage} @ ${(snap.ripeness * 100).toFixed(0)}%`);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  }, [session]);

  if (phase === "intro") {
    return (
      <div className="intro">
        <video src={VIDEO} autoPlay muted playsInline onEnded={() => setPhase("live")} />
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
            ? `Stage: ${stage}. Feed the code to force the next evolution.`
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

        <p className="mass__status">
          backend {statusDot(backendOk)} · webgpu {statusDot(gpuOk)}
        </p>
        {error && <p className="mass__err">⚠ {error}</p>}
      </aside>
    </>
  );
}

function statusDot(ok: boolean | null): string {
  return ok === null ? "…" : ok ? "● live" : "○ down";
}

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<App />);
}

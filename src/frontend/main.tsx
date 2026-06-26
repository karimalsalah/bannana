/// <reference types="vite/client" />
import { useCallback, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { createScene, type SceneHandle } from "./scene";
import { probeWebGPU, renderWebGPUNotice } from "./webgpu";
import { health, postStake } from "./api";
import {
  connectPasskeyWallet,
  isWebAuthnAvailable,
  stakePeel,
  type WalletSession,
} from "../web3/account";
import { DEFAULT_TERMS, isReferralUnlocked } from "../web3/referral";
import { STAGE_HUD, type Stage } from "../protocol/lifecycle";
import Intro from "./components/Intro";
import Dossier from "./components/Dossier";
import ProtocolPanel from "./components/ProtocolPanel";
import Observatory from "./components/Observatory";
import Lore from "./components/Lore";
import "./design/tokens.css";

const PEEL = 10n ** 18n; // 1 $PEEL in wei
const VIDEO = `${import.meta.env.BASE_URL}the-banana-protocol.mp4`;
const REPO = "https://github.com/karimalsalah/bannana";
type View = "live" | "observatory" | "lore";

function App() {
  const [phase, setPhase] = useState<"intro" | "live">("intro");
  const [view, setView] = useState<View>("live");
  const [session, setSession] = useState<WalletSession | null>(null);
  const [peelWei, setPeelWei] = useState(0n);
  const [ripeness, setRipeness] = useState(0);
  const [charge, setCharge] = useState(0);
  const [stage, setStage] = useState<Stage>("DORMANT");
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [gpuOk, setGpuOk] = useState<boolean | null>(null);
  const [backendOk, setBackendOk] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<SceneHandle | null>(null);

  const pushLog = useCallback((line: string) => {
    setLog((l) => [...l.slice(-6), line]);
  }, []);

  useEffect(() => {
    health()
      .then(() => setBackendOk(true))
      .catch(() => setBackendOk(false));
  }, []);

  useEffect(() => {
    if (phase !== "live") return;
    let disposed = false;
    let notice: HTMLElement | null = null;
    let poll: ReturnType<typeof setInterval> | null = null;
    const onOrient = (e: DeviceOrientationEvent) => {
      const s = sceneRef.current;
      if (!s) return;
      s.setTilt(((e.gamma ?? 0) / 90) * 0.5, ((e.beta ?? 0) / 90) * 0.3);
    };

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
          pushLog(STAGE_HUD[s].status);
        });
        window.addEventListener("deviceorientation", onOrient);
      } else {
        document.body.classList.add("webgpu-fallback");
        notice = renderWebGPUNotice(
          document.body,
          "The spatial scene needs WebGPU. The protocol loop is still live — connect a passkey and feed the code.",
        );
      }

      poll = setInterval(() => {
        const s = sceneRef.current;
        if (s) {
          setRipeness(s.getRipeness());
          setCharge(s.getCharge());
        }
      }, 80);
    })().catch((e: unknown) => setError(errMsg(e)));

    return () => {
      disposed = true;
      if (poll) clearInterval(poll);
      window.removeEventListener("deviceorientation", onOrient);
      sceneRef.current?.dispose();
      sceneRef.current = null;
      notice?.remove();
      document.body.classList.remove("webgpu-fallback");
    };
  }, [phase, pushLog]);

  const connect = useCallback(async () => {
    setError(null);
    if (!isWebAuthnAvailable()) {
      setError("WebAuthn unavailable — use a passkey-capable browser.");
      return;
    }
    setBusy(true);
    try {
      const s = await connectPasskeyWallet();
      setSession(s);
      sceneRef.current?.addCharge(0.35);
      pushLog("BIOMETRIC SIGNER LINKED");
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  }, [pushLog]);

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
      setPeelWei(BigInt(snap.peelStakedWei));
      setStage(snap.stage as Stage);
      sceneRef.current?.setRipeness(snap.ripeness);
      sceneRef.current?.addCharge(0.4);
      if (snap.ripeness >= 1) sceneRef.current?.pulse();
      pushLog(`STAKE → ${snap.stage} @ ${(snap.ripeness * 100).toFixed(0)}%`);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  }, [session, pushLog]);

  if (phase === "intro") {
    return <Intro videoSrc={VIDEO} onEnter={() => setPhase("live")} />;
  }

  return (
    <div data-stage={stage}>
      <canvas id="stage" ref={canvasRef} style={CANVAS_STYLE} />
      <div className="atmos" />
      <div className="grain" />

      <nav className="nav">
        <a className="nav__brand" href={REPO} target="_blank" rel="noreferrer">
          ◢ BANANA<span className="dim">/</span>PROTOCOL
        </a>
        <div className="nav__views">
          {(["live", "observatory", "lore"] as View[]).map((v) => (
            <button
              key={v}
              className={`nav__tab${view === v ? " is-active" : ""}`}
              onClick={() => setView(v)}
            >
              {v === "live" ? "DOSSIER" : v === "observatory" ? "OBSERVATORY" : "FIELD NOTES"}
            </button>
          ))}
          <a className="nav__fork" href={REPO} target="_blank" rel="noreferrer">
            ★ FORK / CONTRIBUTE
          </a>
        </div>
      </nav>

      {view === "live" && (
        <>
          <Dossier stage={stage} ripeness={ripeness} charge={charge} peelWei={peelWei} log={log} />
          <ProtocolPanel
            session={session}
            stage={stage}
            peelWei={peelWei}
            busy={busy}
            backendOk={backendOk}
            gpuOk={gpuOk}
            referralUnlocked={isReferralUnlocked(peelWei, DEFAULT_TERMS)}
            error={error}
            onConnect={connect}
            onFeed={feed}
          />
        </>
      )}
      {view === "observatory" && <Observatory active />}
      {view === "lore" && <Lore />}

      <footer className="credit">
        AN AUTONOMOUS EXPERIMENT · BUILT BY CLAUDE · CO-AUTHORED BY{" "}
        <span style={{ color: "var(--bio)" }}>STEADYWRK</span>
      </footer>
    </div>
  );
}

const CANVAS_STYLE: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  width: "100vw",
  height: "100vh",
  display: "block",
  zIndex: 0,
  touchAction: "none",
};

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<App />);
}

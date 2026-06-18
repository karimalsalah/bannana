import * as THREE from "three/webgpu";
import { pass, mrt, output, emissive } from "three/tsl";
import { bloom } from "three/addons/tsl/display/BloomNode.js";
import { createBananaMaterial } from "../shaders/ripeness";
import { createGommageField } from "../shaders/gommage";
import { stageForRipeness, clamp01, type Stage } from "../protocol/lifecycle";

export interface SceneHandle {
  /** Drive the persisted ripeness target (0..1). */
  setRipeness(value: number): void;
  /** Inject energy — the "computational mass" that feeds the core. */
  addCharge(delta: number): void;
  /** Detonation spike. */
  pulse(): void;
  stage(): Stage;
  onStage(cb: (stage: Stage) => void): void;
  dispose(): void;
}

export async function createScene(canvas: HTMLCanvasElement): Promise<SceneHandle> {
  const renderer = new THREE.WebGPURenderer({ canvas, antialias: true });
  renderer.setClearColor(0x0a0008, 1);
  await renderer.init();

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0a0008, 0.11);

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 0, 5);

  scene.add(new THREE.AmbientLight(0x0a1018, 1.4));
  const cyanLight = new THREE.PointLight(0x00ffff, 9, 40);
  cyanLight.position.set(3, 2.5, 4);
  scene.add(cyanLight);
  const warmLight = new THREE.PointLight(0xffcc44, 4, 40);
  warmLight.position.set(-4, -2, 2);
  scene.add(warmLight);

  // Procedural banana — a crescent tube (spec: TubeGeometry + CatmullRomCurve3).
  // ponytail: stylized tube reads as a banana with the crescent curve + neon skin;
  // no per-vertex tip taper needed for the silhouette the promo shows.
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.4, -0.5, 0),
    new THREE.Vector3(-0.7, 0.35, 0),
    new THREE.Vector3(0, 0.62, 0),
    new THREE.Vector3(0.7, 0.35, 0),
    new THREE.Vector3(1.4, -0.5, 0),
  ]);
  const geometry = new THREE.TubeGeometry(curve, 96, 0.34, 24, false);
  const { material, uniforms } = createBananaMaterial();
  const banana = new THREE.Mesh(geometry, material);
  scene.add(banana);

  // Gommage ash — digital dust funneling into the core.
  const gommage = createGommageField(1400);
  scene.add(gommage.mesh);

  // Selective bloom via MRT: only the emissive neon rim blooms; the void stays dark.
  const postFx = new THREE.PostProcessing(renderer);
  const scenePass = pass(scene, camera);
  scenePass.setMRT(mrt({ output, emissive }));
  const outputColor = scenePass.getTextureNode("output");
  const emissiveColor = scenePass.getTextureNode("emissive");
  postFx.outputNode = outputColor.add(bloom(emissiveColor, 1.15, 0.55, 0));

  // Rapier SIMD physics — optional, isolated. A single dynamic body adds organic drift
  // and a thrash impulse at high charge.
  // ponytail: we step the world but never query colliders per-frame, so there is no
  // per-step CPU↔GPU sync churn (the state_sync_callback hot path the spec warns about).
  const physics = await tryInitPhysics();

  // ── State ──
  let ripeness = 0;
  let targetRipeness = 0;
  let charge = 0;
  let current: Stage = "DORMANT";
  let stageCb: ((s: Stage) => void) | null = null;
  const pointer = new THREE.Vector2();

  const onPointerMove = (e: PointerEvent) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
    charge = Math.min(1, charge + 0.01); // "tracks every interaction you make"
  };
  window.addEventListener("pointermove", onPointerMove);

  const resize = () => {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  };
  resize();
  window.addEventListener("resize", resize);

  // Dynamic Resolution Scaling — trade resolution for frame budget under load.
  let pixelRatio = Math.min(window.devicePixelRatio, 1.6);
  renderer.setPixelRatio(pixelRatio);

  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.05);

    ripeness += (targetRipeness - ripeness) * Math.min(1, dt * 2);
    charge += (0 - charge) * Math.min(1, dt * 0.5); // decays unless fed
    uniforms.ripeness.value = ripeness;
    uniforms.charge.value = charge;
    gommage.progress.value = Math.max(charge, smoothstep01(0.2, 0.6, ripeness));

    banana.rotation.y += (pointer.x * 0.6 - banana.rotation.y) * dt * 2;
    banana.rotation.x += (-pointer.y * 0.4 - banana.rotation.x) * dt * 2;
    banana.rotation.z += dt * 0.12;

    if (physics) {
      physics.step(charge);
      banana.position.set(physics.x() * 0.15, physics.y() * 0.15, 0);
    }

    const next = stageForRipeness(ripeness);
    if (next !== current) {
      current = next;
      stageCb?.(next);
    }

    // DRS: nudge pixel ratio toward the frame budget (~60fps).
    if (dt > 0.022 && pixelRatio > 0.8) pixelRatio -= 0.04;
    else if (dt < 0.014 && pixelRatio < 1.6) pixelRatio += 0.02;
    renderer.setPixelRatio(pixelRatio);

    void postFx.renderAsync();
  });

  return {
    setRipeness: (v) => {
      targetRipeness = clamp01(v);
    },
    addCharge: (d) => {
      charge = clamp01(charge + d);
    },
    pulse: () => {
      charge = 1;
      physics?.kick();
    },
    stage: () => current,
    onStage: (cb) => {
      stageCb = cb;
    },
    dispose: () => {
      renderer.setAnimationLoop(null);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", resize);
      gommage.dispose();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    },
  };
}

interface PhysicsHandle {
  step(charge: number): void;
  kick(): void;
  x(): number;
  y(): number;
}

async function tryInitPhysics(): Promise<PhysicsHandle | null> {
  try {
    const RAPIER = await import("@dimforge/rapier3d-simd");
    const world = new RAPIER.World({ x: 0, y: 0, z: 0 });
    const body = world.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic().setLinearDamping(1.4).setAngularDamping(1.0),
    );
    world.createCollider(RAPIER.ColliderDesc.ball(0.4), body);
    return {
      step(charge: number) {
        // Gentle spring back to origin + charge-scaled jitter ("thrash against its code").
        const t = body.translation();
        const jitter = charge * charge * 0.04;
        body.applyImpulse(
          {
            x: -t.x * 0.02 + (Math.random() - 0.5) * jitter,
            y: -t.y * 0.02 + (Math.random() - 0.5) * jitter,
            z: 0,
          },
          true,
        );
        world.step();
      },
      kick() {
        body.applyImpulse({ x: (Math.random() - 0.5) * 0.6, y: 0.6, z: 0 }, true);
      },
      x: () => body.translation().x,
      y: () => body.translation().y,
    };
  } catch {
    return null; // physics is an enhancement, never a hard dependency
  }
}

function smoothstep01(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

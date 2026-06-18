import { MeshStandardNodeMaterial } from "three/webgpu";
import {
  uniform,
  mix,
  smoothstep,
  clamp,
  dot,
  oneMinus,
  color,
  time,
  positionLocal,
  normalLocal,
  normalView,
  positionViewDirection,
  mx_noise_float,
  mx_fractal_noise_float,
  float,
} from "three/tsl";

export interface RipenessUniforms {
  /** 0 (unripe) → 1 (ascended). Persisted as the banana NFT's `ripeness`. */
  ripeness: ReturnType<typeof uniform>;
  /** 0 → 1 absorbed energy; spikes the thrash, rim, and gloss. */
  charge: ReturnType<typeof uniform>;
}

export interface BananaMaterial {
  material: MeshStandardNodeMaterial;
  uniforms: RipenessUniforms;
}

/**
 * The synthetic skin. A single TSL `MeshStandardNodeMaterial` whose color, emissive
 * rim, surface gloss and vertex displacement are all driven by two uniforms — exactly
 * the "neon radiance boiling into toxic yellow … vertices tear" beat from the promo.
 */
export function createBananaMaterial(): BananaMaterial {
  const ripeness = uniform(0);
  const charge = uniform(0);

  const material = new MeshStandardNodeMaterial();
  material.metalness = 0;

  // ── Albedo: cyan-green unripe → toxic yellow → procedural brown rot ──
  const green = color(0x39ff14);
  const cyan = color(0x00ffff);
  const yellow = color(0xffd700);
  const brown = color(0x4a2e0c);

  const rot = mx_fractal_noise_float(positionLocal.mul(3.2)).mul(0.5).add(0.5);
  const unripe = mix(green, cyan, charge.mul(0.6));
  const spots = smoothstep(0.55, 0.96, rot.mul(ripeness.add(0.25)));
  const ripe = mix(yellow, brown, spots);
  material.colorNode = mix(unripe, ripe, smoothstep(0.15, 0.85, ripeness));

  // ── Emissive: cyan Fresnel rim, pulsing, whitening toward detonation ──
  const fresnel = oneMinus(clamp(dot(normalView, positionViewDirection), 0, 1)).pow(2.6);
  const pulse = time.mul(2.2).sin().mul(0.5).add(0.5);
  const rimColor = mix(cyan, color(0xffffff), ripeness.mul(charge));
  const rimPower = fresnel.mul(mix(float(0.5), float(3.4), charge)).mul(mix(float(0.7), float(1), pulse));
  material.emissiveNode = rimColor.mul(rimPower);

  // ── Gloss: dry/matte unripe → wet/glossy mutation ──
  material.roughnessNode = mix(float(0.6), float(0.18), charge);

  // ── Geometry: idle breathing + violent thrash that tears vertices at high charge ──
  const breathe = time.mul(1.25).sin().mul(0.012);
  const thrash = mx_noise_float(positionLocal.mul(6.0).add(time.mul(3.0)))
    .mul(charge.mul(charge))
    .mul(0.07);
  material.positionNode = positionLocal.add(normalLocal.mul(breathe.add(thrash)));

  return { material, uniforms: { ripeness, charge } };
}

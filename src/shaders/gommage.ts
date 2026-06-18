import * as THREE from "three/webgpu";
import {
  attribute,
  uniform,
  vec3,
  vec4,
  float,
  time,
  fract,
  mix,
  smoothstep,
  oneMinus,
  color,
} from "three/tsl";

export interface GommageField {
  mesh: THREE.InstancedMesh;
  /** 0 → 1 dissolve amount. Driven by absorbed energy as the UI tears into ash. */
  progress: ReturnType<typeof uniform>;
  dispose(): void;
}

/**
 * The Gommage dissolve — "the surrounding site architecture tears into a chaotic storm
 * of digital ash, funneled directly into the core of the anomaly to fuel the next stage."
 *
 * A single InstancedMesh of additive sprites. Each particle is born on a shell and flows
 * inward to the core on a looping life. All per-instance data is packed into one vec4
 * attribute to stay under WebGPU vertex-buffer limits.
 */
export function createGommageField(count = 1400): GommageField {
  const geometry = new THREE.PlaneGeometry(1, 1);

  // ponytail: one vec4 (birth, lifespan, seed, scale) instead of four attributes —
  // fewer buffers, same information, under the WebGPU limit.
  const packed = new Float32Array(count * 4);
  for (let i = 0; i < count; i += 1) {
    packed[i * 4 + 0] = Math.random(); // birth phase
    packed[i * 4 + 1] = 0.45 + Math.random() * 0.7; // lifespan
    packed[i * 4 + 2] = Math.random() * 1000; // seed
    packed[i * 4 + 3] = 0.015 + Math.random() * 0.05; // scale
  }
  geometry.setAttribute(
    "aBirthLifeSeedScale",
    new THREE.InstancedBufferAttribute(packed, 4),
  );

  const progress = uniform(0);

  // The attribute is a vec4 at runtime, but attribute()'s type arg widens to `string`
  // and drops the tag — re-type it through vec4() so component swizzles are typed.
  const a = vec4(attribute("aBirthLifeSeedScale", "vec4") as never);
  const birth = a.x;
  const seed = a.z;
  const scale = a.w;

  const life = fract(time.mul(0.22).add(birth)); // looping 0..1
  const angle = seed.mul(0.0173);
  const dir = vec3(angle.sin(), seed.mul(0.0411).sin().mul(0.6), angle.cos()).normalize();
  const radius = mix(float(3.0), float(0.05), life); // funnel into the core
  const centre = dir.mul(radius);

  const material = new THREE.SpriteNodeMaterial();
  material.positionNode = centre;
  material.scaleNode = scale.mul(smoothstep(0, 0.12, life)).mul(oneMinus(life)).mul(progress);
  material.colorNode = mix(color(0x00ffff), color(0xffffff), life);
  material.opacityNode = progress.mul(oneMinus(life)).mul(0.9);
  material.transparent = true;
  material.depthWrite = false;
  material.blending = THREE.AdditiveBlending;

  const mesh = new THREE.InstancedMesh(geometry, material, count);
  mesh.frustumCulled = false;
  mesh.renderOrder = 2;

  return {
    mesh,
    progress,
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}

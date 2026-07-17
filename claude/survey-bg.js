/**
 * SoliSoul survey — living 3D backdrop.
 * Same visual language as the main experience: aurora shell, starfield,
 * and the particle brain drifting behind the form. As the visitor answers
 * questions (#barFill progress), the brain's palette calms from anxious
 * violet/rose to serene mint — therapy, visualized.
 */

import * as THREE from "three";

const IS_MOBILE = Math.min(window.innerWidth, window.innerHeight) < 620;
const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const COUNT = IS_MOBILE ? 9000 : 16000;
const STAR_COUNT = IS_MOBILE ? 400 : 900;

const rand = (a = 1, b = 0) => b + Math.random() * (a - b);
const smoothstep = (x) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
};

const canvas = document.getElementById("bg3d");
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: "high-performance" });
} catch (e) {
  canvas.remove();
  throw e;
}

const dpr = Math.min(window.devicePixelRatio || 1, IS_MOBILE ? 1.5 : 2);
renderer.setPixelRatio(dpr);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0); // let the page's own dark base show through

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 120);
camera.position.set(0, 0.2, 6.2);

/* ------------------------------------------------------------ aurora shell */

const aurora = new THREE.Mesh(
  new THREE.SphereGeometry(48, 24, 24),
  new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    transparent: true,
    uniforms: { uTime: { value: 0 } },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vDir;
      uniform float uTime;
      void main() {
        float t = uTime * 0.03;
        float band = sin(vDir.y * 3.0 + sin(vDir.x * 2.0 + t) + t) * 0.5 + 0.5;
        float band2 = sin(vDir.x * 2.5 - vDir.z * 2.0 - t * 1.4) * 0.5 + 0.5;
        vec3 tealGlow = vec3(0.05, 0.10, 0.06) * band;
        vec3 violetGlow = vec3(0.12, 0.07, 0.04) * band2;
        float horizon = smoothstep(0.6, -0.4, vDir.y);
        gl_FragColor = vec4((tealGlow + violetGlow) * horizon * 0.8, 0.9);
      }
    `,
  })
);
scene.add(aurora);

/* -------------------------------------------------------------- star field */

let starMat;
{
  const sPos = new Float32Array(STAR_COUNT * 3);
  const sSeed = new Float32Array(STAR_COUNT);
  for (let i = 0; i < STAR_COUNT; i++) {
    const r = rand(44, 16);
    const u = rand(Math.PI * 2);
    const v = Math.acos(rand(1, -1));
    sPos[i * 3] = r * Math.sin(v) * Math.cos(u);
    sPos[i * 3 + 1] = r * Math.cos(v);
    sPos[i * 3 + 2] = r * Math.sin(v) * Math.sin(u);
    sSeed[i] = rand(1);
  }
  const sGeo = new THREE.BufferGeometry();
  sGeo.setAttribute("position", new THREE.BufferAttribute(sPos, 3));
  sGeo.setAttribute("aSeed", new THREE.BufferAttribute(sSeed, 1));
  starMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 } },
    vertexShader: /* glsl */ `
      attribute float aSeed;
      uniform float uTime;
      varying float vTw;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vTw = 0.35 + 0.65 * (0.5 + 0.5 * sin(uTime * (0.6 + aSeed * 1.8) + aSeed * 60.0));
        gl_PointSize = (1.2 + aSeed * 2.2) * (30.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      varying float vTw;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.05, d) * vTw * 0.7;
        gl_FragColor = vec4(vec3(0.96, 0.92, 0.80), a);
      }
    `,
  });
  scene.add(new THREE.Points(sGeo, starMat));
}

/* ------------------------------------------------------ the particle brain */

const group = new THREE.Group();
scene.add(group);

const pos = new Float32Array(COUNT * 3);
const seeds = new Float32Array(COUNT);
const sizes = new Float32Array(COUNT);

for (let i = 0; i < COUNT; i++) {
  let x, y, z;
  if (i < COUNT * 0.86) {
    const u = rand(Math.PI * 2);
    const v = Math.acos(rand(1, -1));
    let dx = Math.sin(v) * Math.cos(u);
    let dy = Math.cos(v);
    let dz = Math.sin(v) * Math.sin(u);
    const fold =
      0.085 * Math.sin(9 * dy + 2) * Math.sin(7 * dz + 5) +
      0.05 * Math.sin(13 * dx * dz + 1) +
      rand(0.02, -0.02);
    const r = 1 + fold;
    x = dx * 1.02 * r;
    y = dy * 0.82 * r;
    z = dz * 1.32 * r;
    const gap = smoothstep(1 - Math.abs(x) / 0.22) * smoothstep((y + 0.15) / 0.5);
    y -= gap * 0.34;
    x += Math.sign(x || rand(1, -1)) * 0.05;
    if (y < -0.5) y = -0.5 + (y + 0.5) * 0.35;
    if (z > 0.7) x *= 1 - (z - 0.7) * 0.22;
  } else if (i < COUNT * 0.97) {
    const s = i % 2 === 0 ? 1 : -1;
    const u = rand(Math.PI * 2);
    const v = Math.acos(rand(1, -1));
    const rr = 0.34 * (1 + 0.1 * Math.sin(16 * v));
    x = s * 0.3 + rr * Math.sin(v) * Math.cos(u) * 0.9;
    y = -0.52 + rr * Math.cos(v) * 0.62;
    z = -0.92 + rr * Math.sin(v) * Math.sin(u) * 0.75;
  } else {
    const tt = rand(1);
    const rr = 0.11 * (1 - tt * 0.35);
    const a = rand(Math.PI * 2);
    x = Math.cos(a) * rr;
    y = -0.5 - tt * 0.42;
    z = -0.55 - tt * 0.25 + Math.sin(a) * rr;
  }
  pos[i * 3] = x * 1.45;
  pos[i * 3 + 1] = y * 1.45 + 0.15;
  pos[i * 3 + 2] = z * 1.45;
  seeds[i] = rand(1);
  sizes[i] = rand(1) < 0.06 ? rand(3.0, 2.0) : rand(1.7, 0.7);
}

const geo = new THREE.BufferGeometry();
geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 10);

const uniforms = {
  uTime: { value: 0 },
  uCalm: { value: 0 }, // 0 = anxious palette, 1 = calm palette
  uSize: { value: (IS_MOBILE ? 30 : 36) * dpr },
};

const mat = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  uniforms,
  vertexShader: /* glsl */ `
    attribute float aSeed;
    attribute float aSize;
    uniform float uTime;
    uniform float uCalm;
    uniform float uSize;
    varying vec3 vColor;
    varying float vTw;
    void main() {
      vec3 p = position;
      p += normalize(p + vec3(0.0001)) * sin(uTime * 0.9 + aSeed * 25.0) * 0.022;
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_Position = projectionMatrix * mv;
      gl_PointSize = aSize * uSize / max(1.0, -mv.z * 9.0);

      /* anxious: agitated terracotta — calm: sage green (the logo palette) */
      float h = (position.y + 1.0) * 0.5;
      vec3 anxious = mix(vec3(0.87, 0.49, 0.32), vec3(0.85, 0.54, 0.41), fract(aSeed * 3.7));
      vec3 calm = mix(vec3(0.56, 0.79, 0.66), vec3(0.50, 0.71, 0.64), h);
      vColor = mix(anxious, calm, uCalm);
      vTw = 0.5 + 0.5 * sin(uTime * (0.8 + fract(aSeed * 3.7) * 2.4) + aSeed * 90.0);
    }
  `,
  fragmentShader: /* glsl */ `
    varying vec3 vColor;
    varying float vTw;
    void main() {
      float d = length(gl_PointCoord - 0.5);
      if (d > 0.5) discard;
      float body = smoothstep(0.5, 0.12, d);
      float core = smoothstep(0.16, 0.0, d) * 0.9;
      float a = (body * 0.5 + core) * (0.5 + 0.4 * vTw) * 0.75;
      gl_FragColor = vec4(vColor * (0.85 + core), a);
    }
  `,
});
group.add(new THREE.Points(geo, mat));

/* ------------------------------------------------- layout, progress, loop */

function layout() {
  const w = window.innerWidth;
  camera.aspect = w / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(w, window.innerHeight);
  // wide screens: brain floats in the free margin beside the centered form
  if (w > 1250) {
    group.position.set(-2.6, 0, 0);
    group.scale.setScalar(1);
  } else {
    group.position.set(0, 0.4, -1.5); // behind the form, dimmer and deeper
    group.scale.setScalar(0.85);
  }
}
layout();
window.addEventListener("resize", layout);

/* progress → calm: poll the survey's own progress bar */
const barFill = document.getElementById("barFill");
let calmTarget = 0;
setInterval(() => {
  if (barFill) calmTarget = (parseFloat(barFill.style.width) || 0) / 100;
}, 700);

const parallax = { x: 0, y: 0 };
window.addEventListener(
  "pointermove",
  (e) => {
    parallax.x = (e.clientX / window.innerWidth) * 2 - 1;
    parallax.y = -(e.clientY / window.innerHeight) * 2 + 1;
  },
  { passive: true }
);

const clock = new THREE.Clock();
function tick() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;
  uniforms.uTime.value = t;
  aurora.material.uniforms.uTime.value = t;
  starMat.uniforms.uTime.value = t;
  uniforms.uCalm.value += (calmTarget - uniforms.uCalm.value) * Math.min(1, 1.5 * dt);
  if (!REDUCED) group.rotation.y += 0.08 * dt;
  camera.position.x = parallax.x * 0.25;
  camera.position.y = 0.2 + parallax.y * 0.15;
  camera.lookAt(0, 0, 0);
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
tick();

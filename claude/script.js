/**
 * SoliSoul × Claude — "Particle Mind"
 * A fully procedural WebGL journey: no model files, no textures.
 * ~45,000 GPU particles morph between four mathematical shapes:
 *   brain → heart → lotus → galaxy
 * mirroring the therapeutic arc: شناخت → احساس → شکوفایی → آرامش
 */

import * as THREE from "three";

/* ---------------------------------------------------------------- config */

const IS_MOBILE = Math.min(window.innerWidth, window.innerHeight) < 620;
const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const COUNT = IS_MOBILE ? 22000 : 45000;
const STAR_COUNT = IS_MOBILE ? 700 : 1400;
const MORPH_SECONDS = REDUCED ? 0.01 : 2.6;

const PALETTE = {
  mint: new THREE.Color("#7de0cb"),
  blue: new THREE.Color("#75bdea"),
  violet: new THREE.Color("#a69af5"),
  gold: new THREE.Color("#f7ca6b"),
  rose: new THREE.Color("#ef86b0"),
  coral: new THREE.Color("#f29682"),
  white: new THREE.Color("#fff6e8"),
  deepBlue: new THREE.Color("#2b3f68"),
};

/* section index → shape + camera preset */
const SECTION_PRESETS = [
  { shape: "brain", cam: [0.0, 0.25, 5.6], look: [0, 0, 0], spin: 0.1, offX: 0.0 },
  { shape: "brain", cam: [0.9, 0.55, 4.6], look: [0, 0.05, 0], spin: 0.16, offX: -1.15 },
  { shape: "heart", cam: [0.0, 0.1, 5.2], look: [0, 0, 0], spin: 0.12, offX: -1.15 },
  { shape: "lotus", cam: [0.0, 0.9, 5.5], look: [0, -0.75, 0], spin: 0.14, offX: -1.15 },
  { shape: "galaxy", cam: [0.0, 2.4, 4.6], look: [0, 0, 0], spin: 0.28, offX: -1.15 },
  { shape: "galaxy", cam: [0.0, 3.3, 3.8], look: [0, 0, 0], spin: 0.3, offX: 0.0 },
  { shape: "galaxy", cam: [0.0, 4.6, 2.6], look: [0, 0, 0], spin: 0.36, offX: 0.0 },
];

/* ------------------------------------------------------------- utilities */

const rand = (a = 1, b = 0) => b + Math.random() * (a - b);
const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;

function smoothstep(x) {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
}

// rAF with a timeout fallback: browsers throttle rAF in background tabs,
// and shape generation must not stall there
const nextFrame = () =>
  new Promise((r) => {
    const t = setTimeout(r, 90);
    requestAnimationFrame(() => {
      clearTimeout(t);
      r();
    });
  });

/* --------------------------------------------------------- shape recipes */
/* Per-particle fillers: write point i into pos/col. This lets generation
   be chunked across frames so the page never blocks on a full shape. */

const _c = new THREE.Color();

function fillBrain(i, n, pos, col) {
  {
    let x, y, z;

    if (i < n * 0.86) {
      // cortex: ellipsoid shell with folds + central fissure
      const u = rand(Math.PI * 2);
      const v = Math.acos(rand(1, -1));
      let dx = Math.sin(v) * Math.cos(u);
      let dy = Math.cos(v);
      let dz = Math.sin(v) * Math.sin(u);

      // cortical folds — layered ridges along the surface
      const fold =
        0.085 * Math.sin(9.0 * dy + 2.0) * Math.sin(7.0 * dz + 5.0) +
        0.05 * Math.sin(13.0 * dx * dz + 1.0) +
        rand(0.02, -0.02);

      const r = 1 + fold;
      x = dx * 1.02 * r;
      y = dy * 0.82 * r;
      z = dz * 1.32 * r;

      // longitudinal fissure between hemispheres (top only)
      const gap = smoothstep(1 - Math.abs(x) / 0.22) * smoothstep((y + 0.15) / 0.5);
      y -= gap * 0.34;
      x += Math.sign(x || rand(1, -1)) * 0.05;

      // flatten the underside
      if (y < -0.5) y = -0.5 + (y + 0.5) * 0.35;
      // frontal lobe slightly narrower
      if (z > 0.7) x *= 1 - (z - 0.7) * 0.22;
    } else if (i < n * 0.97) {
      // cerebellum: two ridged lobes tucked at the back underside
      const s = i % 2 === 0 ? 1 : -1;
      const u = rand(Math.PI * 2);
      const v = Math.acos(rand(1, -1));
      const rr = 0.34 * (1 + 0.1 * Math.sin(16 * v));
      x = s * 0.3 + rr * Math.sin(v) * Math.cos(u) * 0.9;
      y = -0.52 + rr * Math.cos(v) * 0.62;
      z = -0.92 + rr * Math.sin(v) * Math.sin(u) * 0.75;
    } else {
      // brain stem
      const t = rand(1);
      const rr = 0.11 * (1 - t * 0.35);
      const a = rand(Math.PI * 2);
      x = Math.cos(a) * rr;
      y = -0.5 - t * 0.42;
      z = -0.55 - t * 0.25 + Math.sin(a) * rr;
    }

    pos[i * 3] = x * 1.45;
    pos[i * 3 + 1] = y * 1.45 + 0.15;
    pos[i * 3 + 2] = z * 1.45;

    // electric mind: mint → blue by height, violet synapse flecks
    const t = (y + 1) / 2;
    _c.copy(PALETTE.mint).lerp(PALETTE.blue, t);
    if (Math.random() < 0.12) _c.copy(PALETTE.violet);
    if (Math.random() < 0.03) _c.copy(PALETTE.white);
    col[i * 3] = _c.r;
    col[i * 3 + 1] = _c.g;
    col[i * 3 + 2] = _c.b;
  }
}

// classic implicit heart: (x² + 9/4·z² + y² − 1)³ − x²·y³ − 9/80·z²·y³ = 0
function heartF(x, y, z) {
  const a = x * x + 2.25 * z * z + y * y - 1;
  return a * a * a - x * x * y * y * y - 0.1125 * z * z * y * y * y;
}

function fillHeart(i, n, pos, col) {
  const f = heartF;
  {
    // shoot a ray from origin, bisect the surface crossing
    const u = rand(Math.PI * 2);
    const v = Math.acos(rand(1, -1));
    const dx = Math.sin(v) * Math.cos(u);
    const dy = Math.cos(v);
    const dz = Math.sin(v) * Math.sin(u);

    let lo = 0, hi = 1.9;
    // ensure hi is outside
    while (f(dx * hi, dy * hi, dz * hi) < 0 && hi < 3) hi += 0.4;
    for (let k = 0; k < 12; k++) {
      const mid = (lo + hi) / 2;
      if (f(dx * mid, dy * mid, dz * mid) < 0) lo = mid;
      else hi = mid;
    }
    const t = (lo + hi) / 2 + rand(0.02, -0.02);

    const x = dx * t, y = dy * t, z = dz * t;
    pos[i * 3] = x * 1.15;
    pos[i * 3 + 1] = y * 1.15 + 0.1;
    pos[i * 3 + 2] = z * 1.15;

    // warm gradient: coral crown → deep rose tip, white sparks
    const g = (y + 1.1) / 2.2;
    _c.copy(PALETTE.rose).lerp(PALETTE.coral, g);
    if (Math.random() < 0.1) _c.copy(PALETTE.gold);
    if (Math.random() < 0.02) _c.copy(PALETTE.white);
    col[i * 3] = _c.r;
    col[i * 3 + 1] = _c.g;
    col[i * 3 + 2] = _c.b;
  }
}

// petal rings: open angle is measured from vertical; petals curl outward
const LOTUS_RINGS = [
  { petals: 10, open: 0.58, curl: 0.5, len: 1.6, base: 0.28, width: 0.34, y0: -0.6, share: 0.36 },
  { petals: 8, open: 0.36, curl: 0.34, len: 1.35, base: 0.2, width: 0.3, y0: -0.62, share: 0.3 },
  { petals: 6, open: 0.16, curl: 0.22, len: 1.05, base: 0.13, width: 0.26, y0: -0.64, share: 0.22 },
];
const LOTUS_SCALE = 1.15;

function fillLotus(i, n, pos, col) {
  const SCALE = LOTUS_SCALE;
  const b0 = Math.floor(n * 0.36);
  const b1 = b0 + Math.floor(n * 0.3);
  const b2 = Math.floor(n * 0.88);

  if (i < b2) {
    const r = i < b0 ? 0 : i < b1 ? 1 : 2;
    const ring = LOTUS_RINGS[r];
    {
      const p = Math.floor(rand(ring.petals));
      const theta = (p / ring.petals) * Math.PI * 2 + r * 0.4;

      const u = Math.sqrt(rand(1)); // along the petal
      const v = rand(1, -1); // across the petal

      // centerline swept in the radial-vertical plane, curling outward with u
      const ang = ring.open + ring.curl * u * u;
      const radial = ring.base + ring.len * u * Math.sin(ang);
      const height = ring.y0 + ring.len * u * Math.cos(ang);

      // leaf-shaped width, cupped edges pulled up and inward
      const width = Math.sin(Math.PI * Math.min(1, u * 1.07)) * ring.width;
      const cup = (1 - v * v);
      const rr = radial - (1 - cup) * 0.06;

      const cosT = Math.cos(theta), sinT = Math.sin(theta);
      const x = rr * sinT + v * width * cosT;
      const z = rr * cosT - v * width * sinT;
      const y = height + cup * 0.05;

      pos[i * 3] = x * SCALE + rand(0.015, -0.015);
      pos[i * 3 + 1] = y * SCALE + rand(0.015, -0.015);
      pos[i * 3 + 2] = z * SCALE + rand(0.015, -0.015);

      // outer petals rose, inner petals violet-white toward the heart
      const g = u * 0.85 + rand(0.15);
      _c.copy(PALETTE.rose).lerp(PALETTE.violet, r / 2).lerp(PALETTE.white, g * 0.35);
      col[i * 3] = _c.r;
      col[i * 3 + 1] = _c.g;
      col[i * 3 + 2] = _c.b;
    }
  } else {
    // golden seed pod at the heart of the flower
    const u = rand(Math.PI * 2);
    const v = Math.acos(rand(1, -1));
    const rr = 0.24 * Math.cbrt(rand(1));
    pos[i * 3] = rr * Math.sin(v) * Math.cos(u) * SCALE;
    pos[i * 3 + 1] = (-0.42 + rr * Math.cos(v) * 0.7) * SCALE;
    pos[i * 3 + 2] = rr * Math.sin(v) * Math.sin(u) * SCALE;
    _c.copy(PALETTE.gold).lerp(PALETTE.white, rand(0.4));
    col[i * 3] = _c.r;
    col[i * 3 + 1] = _c.g;
    col[i * 3 + 2] = _c.b;
  }
}

function fillGalaxy(i, n, pos, col) {
  const ARMS = 3;
  {
    let x, y, z, r;

    if (i < n * 0.22) {
      // central bulge
      r = Math.abs(gauss()) * 0.42;
      const u = rand(Math.PI * 2);
      const v = Math.acos(rand(1, -1));
      x = r * Math.sin(v) * Math.cos(u);
      y = r * Math.cos(v) * 0.55;
      z = r * Math.sin(v) * Math.sin(u);
      r = Math.sqrt(x * x + z * z);
    } else {
      // spiral arms
      r = Math.pow(rand(1), 0.65) * 2.35 + 0.15;
      const arm = i % ARMS;
      const angle = r * 1.75 + (arm / ARMS) * Math.PI * 2;
      const spread = 0.28 * (r / 2.4) + 0.05;
      x = Math.cos(angle) * r + gauss() * spread;
      z = Math.sin(angle) * r + gauss() * spread;
      y = gauss() * 0.09 * (1 - r / 3.2);
    }

    pos[i * 3] = x;
    pos[i * 3 + 1] = y;
    pos[i * 3 + 2] = z;

    // white-gold core → blue mid → violet rim
    const g = Math.min(1, r / 2.4);
    if (g < 0.25) _c.copy(PALETTE.white).lerp(PALETTE.gold, g / 0.25);
    else if (g < 0.6) _c.copy(PALETTE.gold).lerp(PALETTE.blue, (g - 0.25) / 0.35);
    else _c.copy(PALETTE.blue).lerp(PALETTE.violet, (g - 0.6) / 0.4);
    if (Math.random() < 0.04) _c.copy(PALETTE.mint);
    col[i * 3] = _c.r;
    col[i * 3 + 1] = _c.g;
    col[i * 3 + 2] = _c.b;
  }
}

const FILLERS = { brain: fillBrain, heart: fillHeart, lotus: fillLotus, galaxy: fillGalaxy };

/* Chunked generation: fill a shape in slices, yielding to the frame loop
   between slices so scrolling and morphing never stutter. */
async function generateShape(name, chunk, onProgress) {
  const pos = new Float32Array(COUNT * 3);
  const col = new Float32Array(COUNT * 3);
  const fill = FILLERS[name];
  for (let i = 0; i < COUNT; ) {
    const end = Math.min(i + chunk, COUNT);
    for (; i < end; i++) fill(i, COUNT, pos, col);
    if (onProgress) onProgress(i / COUNT);
    if (i < COUNT) await nextFrame();
  }
  SHAPES[name] = { pos, col };
}

/* ------------------------------------------------------------- WebGL boot */

const canvas = document.getElementById("scene");
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: "high-performance" });
} catch (e) {
  document.getElementById("webgl-fallback").hidden = false;
  document.getElementById("loader").classList.add("is-done");
  throw e;
}

let dpr = Math.min(window.devicePixelRatio || 1, IS_MOBILE ? 1.6 : 2);
renderer.setPixelRatio(dpr);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(new THREE.Color("#04070c"), 1);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 120);
camera.position.set(0, 0.25, 5.6);

const group = new THREE.Group();
scene.add(group);

/* ----------------------------------------------------------- aurora shell */

const aurora = new THREE.Mesh(
  new THREE.SphereGeometry(48, 32, 32),
  new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
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
        vec3 base = vec3(0.016, 0.027, 0.047);
        vec3 tealGlow = vec3(0.04, 0.10, 0.10) * band;
        vec3 violetGlow = vec3(0.08, 0.05, 0.13) * band2;
        float horizon = smoothstep(0.6, -0.4, vDir.y);
        gl_FragColor = vec4(base + (tealGlow + violetGlow) * horizon * 0.9, 1.0);
      }
    `,
  })
);
scene.add(aurora);

/* ------------------------------------------------------------- star field */

{
  const sPos = new Float32Array(STAR_COUNT * 3);
  const sSeed = new Float32Array(STAR_COUNT);
  for (let i = 0; i < STAR_COUNT; i++) {
    const r = rand(44, 18);
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
  const sMat = new THREE.ShaderMaterial({
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
        gl_PointSize = (1.4 + aSeed * 2.4) * (30.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      varying float vTw;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.05, d) * vTw * 0.85;
        gl_FragColor = vec4(vec3(0.85, 0.9, 1.0), a);
      }
    `,
  });
  const stars = new THREE.Points(sGeo, sMat);
  scene.add(stars);
  scene.userData.stars = { stars, sMat };
}

/* --------------------------------------------------------- morph particles */

const SHAPES = {};
const seeds = new Float32Array(COUNT);
const sizes = new Float32Array(COUNT);
for (let i = 0; i < COUNT; i++) {
  seeds[i] = rand(1);
  sizes[i] = rand(1) < 0.06 ? rand(3.4, 2.2) : rand(1.9, 0.7);
}

const geo = new THREE.BufferGeometry();
const posA = new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3);
const posB = new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3);
const colA = new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3);
const colB = new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3);
geo.setAttribute("position", posA); // aliased as aPosA
geo.setAttribute("aPosB", posB);
geo.setAttribute("aColA", colA);
geo.setAttribute("aColB", colB);
geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 10);

const uniforms = {
  uTime: { value: 0 },
  uProgress: { value: 1 },
  uSize: { value: (IS_MOBILE ? 38 : 46) * dpr },
  uPointer: { value: new THREE.Vector3(99, 99, 0) },
  uPointerStrength: { value: 0 },
  uSwirl: { value: REDUCED ? 0 : 1 },
};

const mat = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  uniforms,
  vertexShader: /* glsl */ `
    attribute vec3 aPosB;
    attribute vec3 aColA;
    attribute vec3 aColB;
    attribute float aSeed;
    attribute float aSize;
    uniform float uTime;
    uniform float uProgress;
    uniform float uSize;
    uniform vec3 uPointer;
    uniform float uPointerStrength;
    uniform float uSwirl;
    varying vec3 vColor;
    varying float vTw;

    void main() {
      float delay = fract(aSeed * 7.31) * 0.55;
      float p = smoothstep(0.0, 1.0, clamp((uProgress * 1.55 - delay) / 1.0, 0.0, 1.0));

      vec3 pos = mix(position, aPosB, p);

      /* mid-flight swirl: particles scatter into a vortex while travelling */
      float flight = sin(3.14159 * p) * uSwirl;
      if (flight > 0.001) {
        float a1 = aSeed * 40.0 + uTime * 0.6;
        vec3 swirl = vec3(
          sin(a1 + pos.y * 2.0),
          cos(a1 * 1.3 + pos.z * 2.0),
          sin(a1 * 0.7 + pos.x * 2.0)
        );
        pos += swirl * flight * (0.35 + fract(aSeed * 3.3) * 0.5);
      }

      /* gentle breathing */
      pos += normalize(pos + vec3(0.0001)) * sin(uTime * 0.9 + aSeed * 25.0) * 0.022 * uSwirl;

      /* pointer repulsion — the mind reacts to touch */
      vec3 toP = pos - uPointer;
      float pd = length(toP);
      float push = smoothstep(1.1, 0.0, pd) * uPointerStrength;
      pos += normalize(toP + vec3(0.0001)) * push * 0.5;

      vec4 mv = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mv;
      gl_PointSize = aSize * (1.0 + flight * 0.8 + push * 1.2) * uSize / max(1.0, -mv.z * 9.0);

      vColor = mix(aColA, aColB, p) * (1.0 + push * 0.9);
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
      float core = smoothstep(0.18, 0.0, d);
      float a = (body * 0.8 + core) * (0.6 + 0.4 * vTw);
      gl_FragColor = vec4(vColor * (1.1 + core * 0.6), a);
    }
  `,
});

const points = new THREE.Points(geo, mat);
group.add(points);

/* ------------------------------------------------- orbiting obsessions */
/* Obsessive thoughts circle the brain like satellites; they dissolve as
   soon as the mind morphs into another shape (therapy at work). */

const OBSESSIONS = [
  "وسواس فکری",
  "اضطراب",
  "نشخوار ذهنی",
  "ترس",
  "نگرانی",
  "افکار تکراری",
  "بی‌خوابی",
  "خودانتقادی",
];

const obsessionSprites = [];
{
  const orbitTints = ["#7de0cb", "#a69af5", "#75bdea", "#ef86b0", "#f7ca6b"];
  OBSESSIONS.forEach((word, k) => {
    const cv = document.createElement("canvas");
    cv.width = 512;
    cv.height = 128;
    const ctx = cv.getContext("2d");
    const tint = orbitTints[k % orbitTints.length];
    ctx.font = "600 52px Tahoma, 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = tint;
    ctx.shadowBlur = 26;
    ctx.fillStyle = "#f4f7ff";
    ctx.fillText(word, 256, 66);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = tint;
    ctx.fillText(word, 256, 66);

    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: tex,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    sprite.scale.set(1.35, 0.34, 1);
    sprite.userData = {
      radius: 2.05 + (k % 4) * 0.28,
      speed: (0.22 + (k % 3) * 0.09) * (k % 2 === 0 ? 1 : -1),
      phase: (k / OBSESSIONS.length) * Math.PI * 2,
      wobble: 0.55 + (k % 3) * 0.25,
    };
    group.add(sprite);
    obsessionSprites.push(sprite);
  });
}

/* -------------------------------------------------------- morph controller */

let currentShape = "brain";
let desiredShape = "brain"; // may be ahead of currentShape while a shape still generates
let morphActive = false;
let morphStart = 0;

function bakeInterrupted(progress) {
  // freeze in-flight particles: bake current mix into attribute A
  const a = posA.array, b = posB.array;
  const ca = colA.array, cb = colB.array;
  for (let i = 0; i < COUNT; i++) {
    const delay = (seeds[i] * 7.31 % 1) * 0.55;
    const p = smoothstep((progress * 1.55 - delay) / 1.0);
    for (let k = 0; k < 3; k++) {
      const j = i * 3 + k;
      a[j] += (b[j] - a[j]) * p;
      ca[j] += (cb[j] - ca[j]) * p;
    }
  }
}

function morphTo(name) {
  if (name === currentShape) return;
  const target = SHAPES[name];
  if (!target) return;

  if (morphActive) {
    bakeInterrupted(uniforms.uProgress.value);
  } else {
    posA.array.set(posB.array);
    colA.array.set(colB.array);
  }
  posB.array.set(target.pos);
  colB.array.set(target.col);
  posA.needsUpdate = colA.needsUpdate = posB.needsUpdate = colB.needsUpdate = true;

  uniforms.uProgress.value = 0;
  morphStart = performance.now();
  morphActive = true;
  currentShape = name;
}

/* ---------------------------------------------------------------- pointer */

const pointerNDC = new THREE.Vector2(9, 9);
const raycaster = new THREE.Raycaster();
const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const pointerWorld = new THREE.Vector3(99, 99, 0);
let pointerTargetStrength = 0;
const parallax = { x: 0, y: 0 };

window.addEventListener("pointermove", (e) => {
  pointerNDC.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  parallax.x = pointerNDC.x;
  parallax.y = pointerNDC.y;
  pointerTargetStrength = 1;
}, { passive: true });

window.addEventListener("pointerleave", () => { pointerTargetStrength = 0; });

/* drag to turn the mind: rotate the whole particle group with inertia */
const drag = { active: false, lastX: 0, lastY: 0, velY: 0, velX: 0, idle: 0 };

window.addEventListener("pointerdown", (e) => {
  if (e.pointerType !== "mouse") return; // touch keeps native scrolling
  if (e.target.closest("a, button, .card, .site-header, .shape-dots")) return;
  drag.active = true;
  drag.lastX = e.clientX;
  drag.lastY = e.clientY;
  drag.velY = drag.velX = 0;
}, { passive: true });

window.addEventListener("pointermove", (e) => {
  if (!drag.active) return;
  const dx = e.clientX - drag.lastX;
  const dy = e.clientY - drag.lastY;
  drag.lastX = e.clientX;
  drag.lastY = e.clientY;
  group.rotation.y += dx * 0.006;
  group.rotation.x = Math.max(-0.65, Math.min(0.65, group.rotation.x + dy * 0.004));
  drag.velY = dx * 0.006;
  drag.velX = dy * 0.004;
}, { passive: true });

const endDrag = () => { drag.active = false; };
window.addEventListener("pointerup", endDrag, { passive: true });
window.addEventListener("pointercancel", endDrag, { passive: true });

/* --------------------------------------------------------- section driver */

let activeIndex = 0;
const dots = [...document.querySelectorAll(".shape-dots a")];
const sections = [...document.querySelectorAll("section[data-index]")];

const camState = {
  pos: new THREE.Vector3(...SECTION_PRESETS[0].cam),
  look: new THREE.Vector3(...SECTION_PRESETS[0].look),
  spin: SECTION_PRESETS[0].spin,
  offX: 0,
};

function syncSection() {
  // deterministic: the section whose center is closest to the viewport center
  const mid = window.scrollY + window.innerHeight / 2;
  let idx = 0, best = Infinity;
  for (const s of sections) {
    const center = s.offsetTop + s.offsetHeight / 2;
    const d = Math.abs(center - mid);
    if (d < best) { best = d; idx = Number(s.dataset.index); }
  }
  if (idx !== activeIndex) {
    activeIndex = idx;
    desiredShape = SECTION_PRESETS[idx].shape;
    dots.forEach((d, i) => d.classList.toggle("is-active", i === idx));
  }
}

/* ------------------------------------------------------------ render loop */

const clock = new THREE.Clock();
let fpsSamples = 0, fpsTime = 0, degraded = false;

function tick() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  syncSection();

  uniforms.uTime.value = t;
  aurora.material.uniforms.uTime.value = t;
  scene.userData.stars.sMat.uniforms.uTime.value = t;

  // start the pending morph as soon as its target shape exists
  if (desiredShape !== currentShape && SHAPES[desiredShape]) morphTo(desiredShape);

  // morph progress
  if (morphActive) {
    const p = (performance.now() - morphStart) / (MORPH_SECONDS * 1000);
    uniforms.uProgress.value = Math.min(1, p);
    if (p >= 1) morphActive = false;
  }

  // camera glide toward the active preset + mouse parallax
  const preset = SECTION_PRESETS[activeIndex];
  const wide = window.innerWidth > 900;
  camState.pos.lerp(new THREE.Vector3(...preset.cam), 1 - Math.exp(-2.2 * dt));
  camState.look.lerp(new THREE.Vector3(...preset.look), 1 - Math.exp(-2.2 * dt));
  camState.spin += (preset.spin - camState.spin) * (1 - Math.exp(-2 * dt));
  camState.offX += ((wide ? preset.offX : 0) - camState.offX) * (1 - Math.exp(-2.2 * dt));

  camera.position.set(
    camState.pos.x + parallax.x * 0.35,
    camState.pos.y + parallax.y * 0.25,
    camState.pos.z
  );
  camera.lookAt(camState.look);
  group.position.x = camState.offX;

  // rotation: user drag has priority; inertia carries on, auto-spin resumes when calm
  if (drag.active) {
    drag.idle = 0;
  } else {
    group.rotation.y += drag.velY;
    group.rotation.x = Math.max(-0.65, Math.min(0.65, group.rotation.x + drag.velX));
    drag.velY *= 0.94;
    drag.velX *= 0.94;
    drag.idle += dt;
    if (!REDUCED && drag.idle > 1.5) {
      group.rotation.y += camState.spin * dt;
      group.rotation.x *= 0.98; // ease the tilt back to level
    }
  }

  // obsessive thoughts orbit the brain, dissolve for every other shape
  {
    const show = desiredShape === "brain" && currentShape === "brain" ? 1 : 0;
    for (let k = 0; k < obsessionSprites.length; k++) {
      const s = obsessionSprites[k];
      const d = s.userData;
      const m = s.material;
      m.opacity += ((show ? 0.85 : 0) - m.opacity) * Math.min(1, 2.2 * dt);
      if (m.opacity < 0.01) { s.visible = false; continue; }
      s.visible = true;
      const a = t * d.speed + d.phase;
      s.position.set(
        Math.cos(a) * d.radius,
        Math.sin(t * d.wobble + d.phase * 2) * 0.55 + 0.15,
        Math.sin(a) * d.radius
      );
    }
  }

  // pointer world position on the z=0 plane (in group-local x)
  raycaster.setFromCamera(pointerNDC, camera);
  if (raycaster.ray.intersectPlane(planeZ, pointerWorld)) {
    pointerWorld.x -= camState.offX;
    pointerWorld.applyAxisAngle(new THREE.Vector3(0, 1, 0), -group.rotation.y);
    uniforms.uPointer.value.lerp(pointerWorld, 0.2);
  }
  uniforms.uPointerStrength.value += (pointerTargetStrength - uniforms.uPointerStrength.value) * 0.06;

  renderer.render(scene, camera);

  // fps watchdog: degrade DPR once if we can't hold ~30fps
  if (!degraded) {
    fpsTime += dt;
    fpsSamples++;
    if (fpsTime > 4) {
      if (fpsSamples / fpsTime < 30 && dpr > 1) {
        dpr = 1;
        renderer.setPixelRatio(1);
        uniforms.uSize.value = IS_MOBILE ? 38 : 46;
        degraded = true;
      }
      fpsTime = 0;
      fpsSamples = 0;
    }
  }

  requestAnimationFrame(tick);
}

/* ----------------------------------------------------------------- resize */

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ------------------------------------------------------------------- init */

async function init() {
  const num = document.getElementById("loader-num");

  // only the brain gates first paint
  await generateShape("brain", 15000, (p) => {
    num.textContent = String(Math.round(p * 100));
  });

  // start on the brain, fully formed
  posA.array.set(SHAPES.brain.pos);
  colA.array.set(SHAPES.brain.col);
  posB.array.set(SHAPES.brain.pos);
  colB.array.set(SHAPES.brain.col);
  posA.needsUpdate = colA.needsUpdate = posB.needsUpdate = colB.needsUpdate = true;

  document.getElementById("loader").classList.add("is-done");
  tick();

  // the remaining shapes stream in behind the live scene, in scroll order;
  // pending morphs fire from tick() the moment their shape is ready
  await generateShape("heart", 4000);
  await generateShape("lotus", 9000);
  await generateShape("galaxy", 9000);
}

init();

// debug handle (harmless in production)
window.__ps = {
  uniforms,
  camState,
  group,
  camera,
  SHAPES,
  get activeIndex() { return activeIndex; },
  get currentShape() { return currentShape; },
};

import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Navigation */

const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");

navToggle?.addEventListener("click", () => {
  const isOpen = siteNav.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

siteNav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    siteNav.classList.remove("open");
    navToggle?.setAttribute("aria-expanded", "false");
  });
});

/* Mental-health topic controls */

const disorderData = {
  anxiety: {
    index: "۰۱",
    title: "اضطراب",
    description:
      "نگرانی مداوم، تنش بدنی و دشواری در آرام‌کردن ذهن می‌تواند کیفیت زندگی را کاهش دهد. ارزیابی تخصصی به شناخت الگو و مسیر درمان کمک می‌کند.",
  },
  depression: {
    index: "۰۲",
    title: "افسردگی",
    description:
      "افت خلق، کاهش انرژی و از دست‌دادن علاقه می‌تواند تجربه روزمره را سنگین کند. گفت‌وگوی درمانی فرصتی برای شناخت و بازسازی تدریجی فراهم می‌کند.",
  },
  ocd: {
    index: "۰۳",
    title: "وسواس فکری و عملی",
    description:
      "افکار ناخواسته و رفتارهای تکراری معمولاً چرخه‌ای فرساینده می‌سازند. درمان تخصصی می‌تواند فاصله میان فکر، اضطراب و عمل را بیشتر کند.",
  },
  panic: {
    index: "۰۴",
    title: "حمله پانیک",
    description:
      "موج ناگهانی ترس، تپش قلب و احساس از دست‌دادن کنترل بسیار واقعی است. شناخت نشانه‌ها و تمرین تنظیم بدن به کاهش شدت حمله کمک می‌کند.",
  },
  sleep: {
    index: "۰۵",
    title: "اختلال خواب",
    description:
      "بی‌خوابی، بیداری‌های مکرر یا خواب ناآرام با خلق و تمرکز پیوند دارد. بررسی عادت‌ها و عوامل روانی نقطه شروع درمان است.",
  },
  trauma: {
    index: "۰۶",
    title: "تروما",
    description:
      "تجربه‌های آسیب‌زا ممکن است در بدن، حافظه و روابط باقی بمانند. درمان امن و مرحله‌ای به بازگشت حس کنترل و پیوند کمک می‌کند.",
  },
};

const markerElements = [...document.querySelectorAll(".disorder-marker")];
const disorderIndex = document.querySelector("#disorder-index");
const disorderTitle = document.querySelector("#disorder-title");
const disorderDescription = document.querySelector("#disorder-description");

function selectDisorder(key) {
  const selected = disorderData[key];
  if (!selected) return;

  markerElements.forEach((marker) => {
    const active = marker.dataset.disorder === key;
    marker.classList.toggle("is-active", active);
    marker.setAttribute("aria-pressed", String(active));
  });

  disorderIndex.textContent = selected.index;
  disorderTitle.textContent = selected.title;
  disorderDescription.textContent = selected.description;
}

markerElements.forEach((marker) => {
  marker.setAttribute("aria-pressed", String(marker.classList.contains("is-active")));
  marker.addEventListener("click", () => selectDisorder(marker.dataset.disorder));
});

/* Content reveal and 3D card tilt */

const revealTargets = document.querySelectorAll(
  ".scene-panel, .section-heading, .service-card, .process-copy, .process-rail li, .blog-card, .contact-copy, .contact-form, .final-panel",
);

if (prefersReducedMotion || !("IntersectionObserver" in window)) {
  revealTargets.forEach((target) => target.classList.add("is-visible"));
} else {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.13 },
  );

  revealTargets.forEach((target) => revealObserver.observe(target));
}

if (!prefersReducedMotion && window.matchMedia("(pointer: fine)").matches) {
  document.querySelectorAll("[data-tilt]").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      const rotateY = (x - 0.5) * 7;
      const rotateX = (0.5 - y) * 6;
      card.style.setProperty("--tilt-x", rotateX.toFixed(2) + "deg");
      card.style.setProperty("--tilt-y", rotateY.toFixed(2) + "deg");
      card.style.setProperty("--glow-x", (x * 100).toFixed(1) + "%");
      card.style.setProperty("--glow-y", (y * 100).toFixed(1) + "%");
    });

    card.addEventListener("pointerleave", () => {
      card.style.setProperty("--tilt-x", "0deg");
      card.style.setProperty("--tilt-y", "0deg");
    });
  });
}

const contactForm = document.querySelector(".contact-form");
const formStatus = document.querySelector(".form-status");

contactForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  formStatus.textContent = "نسخه نمایشی آماده است؛ اتصال فرم به سامانه نوبت‌دهی در مرحله بعد انجام می‌شود.";
});

/* Three.js world */

const canvas = document.querySelector("#brain-canvas");
const stage = document.querySelector(".brain-stage");
const loaderElement = document.querySelector("#brain-loader");
const motionButton = document.querySelector("#brain-motion");
const resetButton = document.querySelector("#brain-reset");
const sceneNumber = document.querySelector("#scene-number");
const sceneName = document.querySelector("#scene-name");

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x020f24, 0.041);

const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 70);
camera.position.set(0, 0, 8.6);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
  powerPreference: "high-performance",
});
renderer.setClearColor(0x020f24, 1);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.34;

scene.add(new THREE.HemisphereLight(0x9cecff, 0x00112c, 1.9));

const keyLight = new THREE.DirectionalLight(0xcaf6ff, 4.2);
keyLight.position.set(-4.5, 5.8, 7.2);
scene.add(keyLight);

const rimLight = new THREE.PointLight(0x168cff, 15.5, 30);
rimLight.position.set(5.2, 0.4, 4.2);
scene.add(rimLight);

const lowerLight = new THREE.PointLight(0x18dfff, 10.5, 24);
lowerLight.position.set(-4.2, -3.2, 3.2);
scene.add(lowerLight);

const coreLight = new THREE.PointLight(0x3b6cff, 9.2, 18);
coreLight.position.set(0.2, 0.1, 2.6);
scene.add(coreLight);

const modelPivot = new THREE.Group();
const brainSpin = new THREE.Group();
modelPivot.add(brainSpin);
scene.add(modelPivot);

const brainMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uOpacity: { value: 0.55 },
    uPulse: { value: 0 },
    uColor: { value: new THREE.Color(0x0755c7) },
    uGlowColor: { value: new THREE.Color(0x88efff) },
  },
  vertexShader: `
    varying vec3 vViewPosition;

    void main() {
      vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = viewPosition.xyz;
      gl_Position = projectionMatrix * viewPosition;
    }
  `,
  fragmentShader: `
    uniform float uOpacity;
    uniform float uPulse;
    uniform vec3 uColor;
    uniform vec3 uGlowColor;
    varying vec3 vViewPosition;

    void main() {
      vec3 normal = normalize(cross(dFdx(vViewPosition), dFdy(vViewPosition)));
      if (!gl_FrontFacing) normal *= -1.0;
      vec3 viewDirection = normalize(-vViewPosition);
      vec3 lightDirection = normalize(vec3(-0.35, 0.58, 0.74));
      float light = 0.3 + 0.7 * max(dot(normal, lightDirection), 0.0);
      float fresnel = pow(1.0 - abs(dot(normal, viewDirection)), 2.0);
      vec3 baseColor = uColor * light;
      vec3 finalColor = mix(baseColor, uGlowColor, fresnel * 0.88);
      finalColor += uGlowColor * uPulse * 0.08;
      gl_FragColor = vec4(finalColor, (0.58 + fresnel * 0.3) * uOpacity);
    }
  `,
  transparent: true,
  side: THREE.DoubleSide,
  depthWrite: true,
  toneMapped: false,
  extensions: { derivatives: true },
});

const brainBaseOpacity = 0.55;
const brainAuraMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uOpacity: { value: 0.94 },
    uInnerColor: { value: new THREE.Color(0x075eff) },
    uEdgeColor: { value: new THREE.Color(0x9cf7ff) },
  },
  vertexShader: `
    varying vec3 vViewPosition;

    void main() {
      vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = viewPosition.xyz;
      gl_Position = projectionMatrix * viewPosition;
    }
  `,
  fragmentShader: `
    uniform float uOpacity;
    uniform vec3 uInnerColor;
    uniform vec3 uEdgeColor;
    varying vec3 vViewPosition;

    void main() {
      vec3 normal = normalize(cross(dFdx(vViewPosition), dFdy(vViewPosition)));
      if (!gl_FrontFacing) normal *= -1.0;
      vec3 viewDirection = normalize(-vViewPosition);
      float facing = abs(dot(normal, viewDirection));
      float fresnel = pow(1.0 - facing, 2.15);
      vec3 glowColor = mix(uInnerColor * 0.35, uEdgeColor * 1.6, fresnel);
      float alpha = (0.035 + fresnel * 1.2) * uOpacity;
      gl_FragColor = vec4(glowColor, alpha);
    }
  `,
  transparent: true,
  side: THREE.DoubleSide,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  toneMapped: false,
  extensions: { derivatives: true },
});

const sceneStates = {
  hero: {
    number: "01",
    name: "ذهن را از زاویه‌ای تازه ببینید",
    position: [-1.95, 0.05, 0],
    rotation: [-0.08, -0.42, 0.03],
    scale: 1,
    opacity: 1,
    ringOpacity: 0.18,
  },
  about: {
    number: "02",
    name: "شناخت، آغاز تغییر است",
    position: [2.18, 0.1, -0.45],
    rotation: [0.04, -1.08, -0.08],
    scale: 0.96,
    opacity: 0.92,
    ringOpacity: 0.1,
  },
  services: {
    number: "03",
    name: "برای هر چالش، یک مسیر",
    position: [0, -0.1, -1.7],
    rotation: [0.26, 0.36, 0.02],
    scale: 0.76,
    opacity: 0.42,
    ringOpacity: 0.07,
  },
  process: {
    number: "04",
    name: "تغییر، قدم‌به‌قدم شکل می‌گیرد",
    position: [-2.18, 0.05, -0.55],
    rotation: [-0.18, -1.92, 0.09],
    scale: 0.93,
    opacity: 0.9,
    ringOpacity: 0.09,
  },
  blogs: {
    number: "05",
    name: "دانش، ذهن را روشن می‌کند",
    position: [2.16, 0.05, -0.95],
    rotation: [0.12, 1.72, -0.05],
    scale: 0.84,
    opacity: 0.58,
    ringOpacity: 0.07,
  },
  contact: {
    number: "06",
    name: "یک پیام، آغاز یک مسیر",
    position: [-2.12, 0, -0.65],
    rotation: [-0.1, -0.62, 0.02],
    scale: 0.9,
    opacity: 0.88,
    ringOpacity: 0.08,
  },
  final: {
    number: "07",
    name: "آرامش، حق شماست",
    position: [0, 0, -1.45],
    rotation: [0.02, 0.18, 0],
    scale: 0.82,
    opacity: 0.62,
    ringOpacity: 0.08,
  },
};

const mobileSceneStates = {
  hero: { position: [0, -1.25, -1.1], scale: 0.7, opacity: 0.88 },
  about: { position: [0, 1.85, -1.45], scale: 0.66, opacity: 0.56 },
  services: { position: [0, 0, -2.2], scale: 0.64, opacity: 0.25 },
  process: { position: [0, 0.5, -1.9], scale: 0.68, opacity: 0.35 },
  blogs: { position: [0, 0.2, -2.2], scale: 0.62, opacity: 0.28 },
  contact: { position: [0, 0.5, -2], scale: 0.68, opacity: 0.34 },
  final: { position: [0, 0, -1.8], scale: 0.72, opacity: 0.42 },
};

const targetPosition = new THREE.Vector3();
const desiredPosition = new THREE.Vector3();
const targetScale = new THREE.Vector3(1, 1, 1);
const targetRotation = new THREE.Euler();
let targetOpacity = 1;
let targetRingOpacity = 0.18;
let activeScene = "hero";
let isMobile = window.innerWidth <= 760;

const orbitVisual = new THREE.Group();
modelPivot.add(orbitVisual);

const ringMaterial = new THREE.MeshBasicMaterial({
  color: 0x37bfff,
  transparent: true,
  opacity: 0.18,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
});

[
  [2.58, 1, 0.36, 0.08],
  [2.28, 0.92, -0.42, -0.25],
  [2.85, 1.1, 0.9, 0.34],
].forEach(([radius, scaleY, rotationX, rotationZ]) => {
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(radius, 0.009, 8, 180),
    ringMaterial.clone(),
  );
  ring.scale.y = scaleY;
  ring.rotation.x = rotationX;
  ring.rotation.z = rotationZ;
  orbitVisual.add(ring);
});

const markerAnchors = [
  new THREE.Vector3(-2.24, 1.46, 0.4),
  new THREE.Vector3(2.28, 1.3, -0.12),
  new THREE.Vector3(-2.56, 0.02, 0.72),
  new THREE.Vector3(2.54, -0.12, 0.5),
  new THREE.Vector3(-1.76, -1.64, -0.05),
  new THREE.Vector3(1.8, -1.68, 0.42),
].map((position) => {
  const anchor = new THREE.Object3D();
  anchor.position.copy(position);
  modelPivot.add(anchor);
  return anchor;
});

const particleCount = isMobile ? 360 : 820;
const particlePositions = new Float32Array(particleCount * 3);
const particleColors = new Float32Array(particleCount * 3);
const particlePalette = [
  new THREE.Color(0x1f83ff),
  new THREE.Color(0x38d9ff),
  new THREE.Color(0xb9f5ff),
  new THREE.Color(0x536cff),
];

for (let index = 0; index < particleCount; index += 1) {
  const angle = Math.random() * Math.PI * 2;
  const radius = 2.5 + Math.random() * 5.8;
  particlePositions[index * 3] = Math.cos(angle) * radius;
  particlePositions[index * 3 + 1] = (Math.random() - 0.5) * 7.4;
  particlePositions[index * 3 + 2] = Math.sin(angle) * radius * 0.52 - 2.2;
  const color = particlePalette[index % particlePalette.length];
  particleColors[index * 3] = color.r;
  particleColors[index * 3 + 1] = color.g;
  particleColors[index * 3 + 2] = color.b;
}

const particleGeometry = new THREE.BufferGeometry();
particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
particleGeometry.setAttribute("color", new THREE.BufferAttribute(particleColors, 3));

const particles = new THREE.Points(
  particleGeometry,
  new THREE.PointsMaterial({
    size: 0.052,
    vertexColors: true,
    transparent: true,
    opacity: 0.84,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  }),
);
scene.add(particles);

function createGlowTexture() {
  const glowCanvas = document.createElement("canvas");
  glowCanvas.width = 96;
  glowCanvas.height = 96;
  const context = glowCanvas.getContext("2d");
  const gradient = context.createRadialGradient(48, 48, 0, 48, 48, 48);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.13, "rgba(154,245,255,0.98)");
  gradient.addColorStop(0.38, "rgba(48,174,255,0.58)");
  gradient.addColorStop(1, "rgba(15,78,255,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 96, 96);
  const texture = new THREE.CanvasTexture(glowCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const glowTexture = createGlowTexture();
const neuralCore = new THREE.Group();
const neuralPointCount = isMobile ? 190 : 440;
const neuralPositions = new Float32Array(neuralPointCount * 3);
const neuralColors = new Float32Array(neuralPointCount * 3);
const neuralVectors = [];
const neuralPalette = [
  new THREE.Color(0xd7fbff),
  new THREE.Color(0x55dfff),
  new THREE.Color(0x2588ff),
];

for (let index = 0; index < neuralPointCount; index += 1) {
  let x;
  let y;
  let z;
  do {
    x = Math.random() * 2 - 1;
    y = Math.random() * 2 - 1;
    z = Math.random() * 2 - 1;
  } while (x * x + y * y + z * z > 1);

  x *= 1.72;
  y *= 1.22;
  z *= 1.03;
  neuralPositions[index * 3] = x;
  neuralPositions[index * 3 + 1] = y;
  neuralPositions[index * 3 + 2] = z;
  neuralVectors.push(new THREE.Vector3(x, y, z));

  const color = neuralPalette[index % neuralPalette.length];
  neuralColors[index * 3] = color.r;
  neuralColors[index * 3 + 1] = color.g;
  neuralColors[index * 3 + 2] = color.b;
}

const neuralGeometry = new THREE.BufferGeometry();
neuralGeometry.setAttribute("position", new THREE.BufferAttribute(neuralPositions, 3));
neuralGeometry.setAttribute("color", new THREE.BufferAttribute(neuralColors, 3));

const neuralPointMaterial = new THREE.PointsMaterial({
  map: glowTexture,
  size: isMobile ? 0.105 : 0.09,
  sizeAttenuation: true,
  vertexColors: true,
  transparent: true,
  opacity: 0.96,
  alphaTest: 0.015,
  depthTest: false,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  toneMapped: false,
});

const surfaceSparkMaterial = new THREE.PointsMaterial({
  map: glowTexture,
  color: 0xd9fcff,
  size: isMobile ? 0.09 : 0.078,
  sizeAttenuation: true,
  transparent: true,
  opacity: 0.92,
  alphaTest: 0.015,
  depthTest: false,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  toneMapped: false,
});

const neuralPoints = new THREE.Points(neuralGeometry, neuralPointMaterial);
neuralPoints.frustumCulled = false;
neuralPoints.renderOrder = 8;
neuralCore.add(neuralPoints);

const connectionPositions = [];
for (let index = 0; index < neuralVectors.length; index += 2) {
  const start = neuralVectors[index];
  let nearest = null;
  let nearestDistance = 0.72;
  for (let offset = 1; offset <= 18; offset += 1) {
    const candidate = neuralVectors[(index + offset * 7) % neuralVectors.length];
    const distance = start.distanceTo(candidate);
    if (distance < nearestDistance) {
      nearest = candidate;
      nearestDistance = distance;
    }
  }
  if (!nearest) continue;
  connectionPositions.push(start.x, start.y, start.z, nearest.x, nearest.y, nearest.z);
}

const neuralLineGeometry = new THREE.BufferGeometry();
neuralLineGeometry.setAttribute(
  "position",
  new THREE.Float32BufferAttribute(connectionPositions, 3),
);
const neuralLineMaterial = new THREE.LineBasicMaterial({
  color: 0x46cfff,
  transparent: true,
  opacity: 0.14,
  depthTest: false,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  toneMapped: false,
});
const neuralLines = new THREE.LineSegments(neuralLineGeometry, neuralLineMaterial);
neuralLines.renderOrder = 7;
neuralCore.add(neuralLines);
brainSpin.add(neuralCore);

const floorGlowMaterial = new THREE.SpriteMaterial({
  map: glowTexture,
  color: 0x1c83ff,
  transparent: true,
  opacity: 0.48,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  toneMapped: false,
});
const floorGlow = new THREE.Sprite(floorGlowMaterial);
floorGlow.position.set(0, -1.72, -0.22);
floorGlow.scale.set(3.4, 0.5, 1);
modelPivot.add(floorGlow);

let brainModel = null;
const modelLoader = new GLTFLoader();

modelLoader.load(
  "./assets/brain-lite.glb",
  (gltf) => {
    brainModel = gltf.scene;
    const brainMeshes = [];
    brainModel.traverse((object) => {
      if (!object.isMesh) return;
      object.material = brainMaterial;
      object.frustumCulled = true;
      brainMeshes.push(object);
    });

    const bounds = new THREE.Box3().setFromObject(brainModel);
    const center = bounds.getCenter(new THREE.Vector3());
    const size = bounds.getSize(new THREE.Vector3());
    const scale = 3.75 / Math.max(size.x, size.y, size.z);
    brainModel.position.copy(center).multiplyScalar(-scale);
    brainModel.scale.setScalar(scale);

    brainMeshes.forEach((mesh) => {
      const aura = new THREE.Mesh(mesh.geometry, brainAuraMaterial);
      aura.scale.setScalar(1.006);
      aura.renderOrder = 2;
      mesh.add(aura);

      const sourcePositions = mesh.geometry.getAttribute("position");
      const sampleCount = Math.min(isMobile ? 180 : 420, sourcePositions.count);
      const sampledPositions = new Float32Array(sampleCount * 3);
      const stride = Math.max(1, Math.floor(sourcePositions.count / sampleCount));
      for (let index = 0; index < sampleCount; index += 1) {
        const sourceIndex = Math.min(
          sourcePositions.count - 1,
          index * stride + ((index * 13) % stride),
        );
        sampledPositions[index * 3] = sourcePositions.getX(sourceIndex);
        sampledPositions[index * 3 + 1] = sourcePositions.getY(sourceIndex);
        sampledPositions[index * 3 + 2] = sourcePositions.getZ(sourceIndex);
      }
      const surfaceSparkGeometry = new THREE.BufferGeometry();
      surfaceSparkGeometry.setAttribute(
        "position",
        new THREE.BufferAttribute(sampledPositions, 3),
      );
      const surfaceSparks = new THREE.Points(surfaceSparkGeometry, surfaceSparkMaterial);
      surfaceSparks.scale.setScalar(1.008);
      surfaceSparks.renderOrder = 9;
      mesh.add(surfaceSparks);
    });

    brainSpin.add(brainModel);
    brainSpin.rotation.set(0, -1.05, Math.PI / 2);

    loaderElement.classList.add("is-loaded");
    stage.classList.add("brain-ready");
  },
  (progressEvent) => {
    if (!progressEvent.total) return;
    const progress = Math.min(
      99,
      Math.round((progressEvent.loaded / progressEvent.total) * 100),
    );
    loaderElement.querySelector("p").textContent =
      `در حال بارگذاری مغز سه‌بعدی · ${progress}٪`;
  },
  () => {
    loaderElement.classList.add("has-error");
    loaderElement.querySelector("p").textContent = "بارگذاری مدل سه‌بعدی ناموفق بود";
    loaderElement.setAttribute("aria-label", "بارگذاری مدل سه‌بعدی ناموفق بود");
  },
);

function currentSceneState(key) {
  const desktop = sceneStates[key] || sceneStates.hero;
  if (!isMobile) return desktop;
  const mobile = mobileSceneStates[key] || mobileSceneStates.hero;
  return {
    ...desktop,
    ...mobile,
  };
}

function setScene(key, immediate = false) {
  if (!sceneStates[key]) key = "hero";
  activeScene = key;
  const state = currentSceneState(key);

  targetPosition.fromArray(state.position);
  targetRotation.set(...state.rotation);
  targetScale.setScalar(state.scale);
  targetOpacity = state.opacity;
  targetRingOpacity = state.ringOpacity;

  document.body.dataset.scene = key;
  stage.classList.toggle("hero-active", key === "hero");
  sceneNumber.textContent = state.number;
  sceneName.textContent = state.name;

  const navKey = key === "final" ? "contact" : key;
  document.querySelectorAll("[data-scene-link]").forEach((link) => {
    link.classList.toggle("is-active", link.dataset.sceneLink === navKey);
  });

  if (immediate) {
    modelPivot.position.copy(targetPosition);
    modelPivot.rotation.copy(targetRotation);
    modelPivot.scale.copy(targetScale);
    brainMaterial.uniforms.uOpacity.value = targetOpacity * brainBaseOpacity;
  }
}

const sceneSections = [...document.querySelectorAll("[data-scene]")];
let scrollFrame = 0;

function updateSceneFromScroll() {
  scrollFrame = 0;
  const viewportCenter = window.innerHeight * 0.48;
  let nearestKey = "hero";
  let nearestDistance = Infinity;

  sceneSections.forEach((section) => {
    const rect = section.getBoundingClientRect();
    const distance = Math.abs(rect.top + rect.height * 0.5 - viewportCenter);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestKey = section.dataset.scene;
    }
  });

  if (nearestKey !== activeScene) setScene(nearestKey);
}

window.addEventListener(
  "scroll",
  () => {
    if (scrollFrame) return;
    scrollFrame = window.requestAnimationFrame(updateSceneFromScroll);
  },
  { passive: true },
);

let motionEnabled = !prefersReducedMotion;

function updateMotionButton() {
  const symbol = motionButton.querySelector("span");
  symbol.textContent = motionEnabled ? "Ⅱ" : "▶";
  const label = motionEnabled ? "توقف حرکت" : "ادامه حرکت";
  motionButton.setAttribute("aria-label", label);
  motionButton.title = label;
}

motionButton?.addEventListener("click", () => {
  motionEnabled = !motionEnabled;
  updateMotionButton();
});

resetButton?.addEventListener("click", () => {
  brainSpin.rotation.set(0, -1.05, Math.PI / 2);
  motionEnabled = !prefersReducedMotion;
  updateMotionButton();
});

let isDragging = false;
let previousPointerX = 0;
let previousPointerY = 0;

canvas.addEventListener("pointerdown", (event) => {
  if (isMobile) return;
  isDragging = true;
  previousPointerX = event.clientX;
  previousPointerY = event.clientY;
  stage.classList.add("is-dragging");
  motionEnabled = false;
  updateMotionButton();
  canvas.setPointerCapture(event.pointerId);
});

canvas.addEventListener("pointermove", (event) => {
  if (!isDragging) return;
  const deltaX = event.clientX - previousPointerX;
  const deltaY = event.clientY - previousPointerY;
  previousPointerX = event.clientX;
  previousPointerY = event.clientY;
  brainSpin.rotation.y += deltaX * 0.007;
  brainSpin.rotation.x = THREE.MathUtils.clamp(
    brainSpin.rotation.x + deltaY * 0.005,
    -0.65,
    0.65,
  );
});

function endDrag(event) {
  if (!isDragging) return;
  isDragging = false;
  stage.classList.remove("is-dragging");
  if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
}

canvas.addEventListener("pointerup", endDrag);
canvas.addEventListener("pointercancel", endDrag);

function resizeRenderer() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  isMobile = width <= 760;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.2 : 1.65));
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.fov = isMobile ? 46 : 38;
  camera.updateProjectionMatrix();
  setScene(activeScene, true);
  updateSceneFromScroll();
}

window.addEventListener("resize", resizeRenderer);

const projectedPosition = new THREE.Vector3();
const cameraPosition = new THREE.Vector3();
const centerCameraPosition = new THREE.Vector3();
const centerWorldPosition = new THREE.Vector3();

function updateMarkers() {
  if (activeScene !== "hero" || isMobile) return;
  const width = window.innerWidth;
  const height = window.innerHeight;
  modelPivot.getWorldPosition(centerWorldPosition);
  centerCameraPosition.copy(centerWorldPosition).applyMatrix4(camera.matrixWorldInverse);

  markerAnchors.forEach((anchor, index) => {
    anchor.getWorldPosition(projectedPosition);
    cameraPosition.copy(projectedPosition).applyMatrix4(camera.matrixWorldInverse);
    projectedPosition.project(camera);
    const x = (projectedPosition.x * 0.5 + 0.5) * width;
    const y = (-projectedPosition.y * 0.5 + 0.5) * height;
    const marker = markerElements[index];
    const visible = projectedPosition.z > -1 && projectedPosition.z < 1;
    marker.style.setProperty("--marker-x", x.toFixed(1) + "px");
    marker.style.setProperty("--marker-y", y.toFixed(1) + "px");
    marker.classList.toggle("is-hidden", !visible);
    marker.classList.toggle("is-back", cameraPosition.z < centerCameraPosition.z);
  });
}

const clock = new THREE.Clock();

function animate() {
  const delta = Math.min(clock.getDelta(), 0.05);
  const elapsed = clock.elapsedTime;
  const smoothing = prefersReducedMotion ? 1 : 1 - Math.pow(0.002, delta);

  desiredPosition.copy(targetPosition);
  if (motionEnabled) desiredPosition.y += Math.sin(elapsed * 0.7) * 0.055;

  modelPivot.position.lerp(desiredPosition, smoothing);
  modelPivot.scale.lerp(targetScale, smoothing);
  modelPivot.rotation.x = THREE.MathUtils.lerp(modelPivot.rotation.x, targetRotation.x, smoothing);
  modelPivot.rotation.y = THREE.MathUtils.lerp(modelPivot.rotation.y, targetRotation.y, smoothing);
  modelPivot.rotation.z = THREE.MathUtils.lerp(modelPivot.rotation.z, targetRotation.z, smoothing);

  if (motionEnabled && brainModel) {
    brainSpin.rotation.y += delta * (activeScene === "hero" ? 0.13 : 0.045);
  }

  brainMaterial.uniforms.uOpacity.value = THREE.MathUtils.lerp(
    brainMaterial.uniforms.uOpacity.value,
    targetOpacity * brainBaseOpacity,
    smoothing,
  );
  brainMaterial.uniforms.uPulse.value = motionEnabled
    ? 0.5 + Math.sin(elapsed * 1.35) * 0.5
    : 0.25;
  brainAuraMaterial.uniforms.uOpacity.value = THREE.MathUtils.lerp(
    brainAuraMaterial.uniforms.uOpacity.value,
    0.94 * targetOpacity,
    smoothing,
  );
  neuralPointMaterial.opacity = THREE.MathUtils.lerp(
    neuralPointMaterial.opacity,
    0.96 * targetOpacity,
    smoothing,
  );
  neuralPointMaterial.size =
    (isMobile ? 0.105 : 0.09) + (motionEnabled ? Math.sin(elapsed * 2.2) * 0.009 : 0);
  surfaceSparkMaterial.opacity = THREE.MathUtils.lerp(
    surfaceSparkMaterial.opacity,
    targetOpacity,
    smoothing,
  );
  surfaceSparkMaterial.size =
    (isMobile ? 0.09 : 0.078) + (motionEnabled ? Math.sin(elapsed * 2.65 + 0.6) * 0.009 : 0);
  neuralLineMaterial.opacity = THREE.MathUtils.lerp(
    neuralLineMaterial.opacity,
    0.14 * targetOpacity,
    smoothing,
  );
  floorGlowMaterial.opacity = THREE.MathUtils.lerp(
    floorGlowMaterial.opacity,
    0.62 * targetOpacity,
    smoothing,
  );
  rimLight.intensity = 15.5 + (motionEnabled ? Math.sin(elapsed * 1.1) * 1.2 : 0);
  coreLight.intensity = 9.2 + (motionEnabled ? Math.sin(elapsed * 1.7 + 0.8) * 0.8 : 0);

  orbitVisual.rotation.y = Math.sin(elapsed * 0.22) * 0.09;
  orbitVisual.children.forEach((child, index) => {
    if (!child.isMesh) return;
    const wave = motionEnabled ? Math.sin(elapsed + index) * 0.025 : 0;
    child.material.opacity = THREE.MathUtils.lerp(
      child.material.opacity,
      Math.max(0.025, targetRingOpacity + wave),
      smoothing,
    );
  });

  particles.rotation.y += delta * 0.012;
  particles.rotation.z = Math.sin(elapsed * 0.1) * 0.045;
  neuralCore.rotation.y = Math.sin(elapsed * 0.24) * 0.035;

  updateMarkers();
  renderer.render(scene, camera);
  window.requestAnimationFrame(animate);
}

setScene("hero", true);
resizeRenderer();
updateMotionButton();
animate();

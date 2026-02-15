import * as THREE from 'three';
import './style.css';

const app = document.querySelector('#app');

const info = document.createElement('div');
info.className = 'info';
info.innerHTML = `
  <strong>Triangle Picking</strong>
  클릭하면 삼각형 색상이 변경됩니다.<br />
  WASM 모듈이 로드되면 색상 인덱스 계산을 C++에서 처리합니다.
`;

document.body.append(info);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#0f172a');

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 4);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
app.append(renderer.domElement);

const geometry = new THREE.BufferGeometry();
const vertices = new Float32Array([
  0, 1, 0,
  -1, -1, 0,
  1, -1, 0,
]);
geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

const colors = ['#38bdf8', '#a855f7', '#f97316', '#40de00'];
let colorIndex = 0;

const material = new THREE.MeshBasicMaterial({
  color: new THREE.Color(colors[colorIndex]),
  side: THREE.DoubleSide,
});

const triangle = new THREE.Mesh(geometry, material);
scene.add(triangle);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

let nextColorIndex = (current) => (current + 1) % colors.length;

const loadWasmModule = async () => {
  try {
    const moduleFactory = await import('./color_picker.js');
    const module = await moduleFactory.default();
    nextColorIndex = module.cwrap('next_color_index', 'number', ['number']);
  } catch (error) {
    console.warn('WASM 모듈을 찾지 못했습니다. JS fallback을 사용합니다.', error);
  }
};

await loadWasmModule();

const updateColor = () => {
  colorIndex = nextColorIndex(colorIndex);
  material.color.set(colors[colorIndex]);
};

const onPointerDown = (event) => {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObject(triangle);
  if (intersects.length > 0) {
    updateColor();
  }
};

renderer.domElement.addEventListener('pointerdown', onPointerDown);

const animate = () => {
  requestAnimationFrame(animate);
  triangle.rotation.z += 0.003;
  renderer.render(scene, camera);
};

animate();

const onResize = () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
};

window.addEventListener('resize', onResize);

import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import vertex from "./shaders/vertex.glsl";
import fragment from "./shaders/fragment.glsl";
// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

// CURL NOISE FUNC

const SimplexNoise = require("simplex-noise"),
  simplex = new SimplexNoise(Math.random);

function computeCurl(x, y, z) {
  var eps = 0.0001;

  var curl = new THREE.Vector3();

  //Find rate of change in YZ plane
  var n1 = simplex.noise3D(x, y + eps, z);
  var n2 = simplex.noise3D(x, y - eps, z);
  //Average to find approximate derivative
  var a = (n1 - n2) / (2 * eps);
  var n1 = simplex.noise3D(x, y, z + eps);
  var n2 = simplex.noise3D(x, y, z - eps);
  //Average to find approximate derivative
  var b = (n1 - n2) / (2 * eps);
  curl.x = a - b;

  //Find rate of change in XZ plane
  n1 = simplex.noise3D(x, y, z + eps);
  n2 = simplex.noise3D(x, y, z - eps);
  a = (n1 - n2) / (2 * eps);
  n1 = simplex.noise3D(x + eps, y, z);
  n2 = simplex.noise3D(x - eps, y, z);
  b = (n1 - n2) / (2 * eps);
  curl.y = a - b;

  //Find rate of change in XY plane
  n1 = simplex.noise3D(x + eps, y, z);
  n2 = simplex.noise3D(x - eps, y, z);
  a = (n1 - n2) / (2 * eps);
  n1 = simplex.noise3D(x, y + eps, z);
  n2 = simplex.noise3D(x, y - eps, z);
  b = (n1 - n2) / (2 * eps);
  curl.z = a - b;

  return curl;
}

/**
 * Object
 */

//Curve generator
const getCurve = (start) => {
  let scale = 2;
  let points = [];
  points.push(start);

  let currentPoint = start.clone();
  for (let i = 0; i < 400; i++) {
    // console.log(currentPoint)
    let v = computeCurl(
      currentPoint.x / scale,
      currentPoint.y / scale,
      currentPoint.z / scale
    );
    currentPoint.addScaledVector(v, 0.001);
    // console.log(currentPoint.clone(),v)

    points.push(currentPoint.clone());
  }

  return points;
};
// TUBE generator
const material = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0.0 },
    uLight: { value: new THREE.Vector3(0,0,0)}
  },
  vertexShader: vertex,
  fragmentShader: fragment,

  side: THREE.DoubleSide,
});
const generateTubes = () => {
  let path = null;
  let geometry = null;
  // const geometry2 = new THREE.PlaneBufferGeometry(1,1)

  let mesh = null;
  const objects = [];

  for (let i = 0; i < 150; i++) {
    path = new THREE.CatmullRomCurve3(
      getCurve(
        new THREE.Vector3(
          Math.random() - 0.5,
          Math.random() - 0.5,
          Math.random() - 0.5
        )
      )
    );
    geometry = new THREE.TubeBufferGeometry(path, 100, 0.005, 8, false);
    mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    objects.push(mesh);
  }
};

// Raycast Func

const mouse = new THREE.Vector2();
const emouse = new THREE.Vector2();
const elasticMouse = new THREE.Vector2(0, 0);
const elasticMouseVel = new THREE.Vector2(0, 0);
const temp = new THREE.Vector2();
const cursor = document.querySelector(".cursor");

const raycast = () => {
  let raycastPlane = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(10, 10),
    material
  );
  let light = new THREE.Mesh(
    new THREE.SphereBufferGeometry(0.03, 20, 20),
    new THREE.MeshBasicMaterial({ color: 0xe38a93 })
  );
  scene.add(raycastPlane, light);

  const raycaster = new THREE.Raycaster();

  window.addEventListener("mousemove", onMouseMove);
  function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;


    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects([raycastPlane]);
    if (intersects.length > 0) {
      let p = intersects[0].point;
      emouse.x = p.x
      emouse.y = p.y
    }
  }
  return light;
};

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height);
camera.position.z = 1;
scene.add(camera);

/**
 *  Controls
 */

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.update();
/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.render(scene, camera);
renderer.setClearColor(new THREE.Color("black"));

/**
 *  Main
 */

generateTubes();
const light = raycast();

/**
 *  Animation
 */
const clock = new THREE.Clock();
const animate = () => {
  // Time

  let elapseTime = clock.getElapsedTime();
  
  // Controls update
  controls.update();

  /**
   *  cursor/light animation
   */

  cursor.style.transform = `translate(${elasticMouse.x}px,${elasticMouse.y}px)`;

  temp.copy(emouse).sub(elasticMouse).multiplyScalar(0.15);
  elasticMouseVel.add(temp);
  elasticMouseVel.multiplyScalar(0.8);
  elasticMouse.add(elasticMouseVel);

  light.position.x = elasticMouse.x
  light.position.y = elasticMouse.y

  material.uniforms.uLight.value = light.position
  material.uniforms.uTime.value = elapseTime;
  // renderer
  renderer.render(scene, camera);

  window.requestAnimationFrame(animate);
};

animate();

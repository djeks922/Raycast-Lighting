import "./style.css";
import * as THREE from "three";
import dat from 'dat.gui';
import gsap from 'gsap';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import vertex from "./shaders/vertex.glsl";
import fragment from "./shaders/fragment.glsl";
import vertexTubes from "./shaderTubes/vertex.glsl";
import fragmentTubes from "./shaderTubes/fragment.glsl";



// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();
const scene1 = new THREE.Scene();

// Dat Gui

const gui = new dat.GUI();


// Parameters for gui

const parameters = {};
parameters.rTubes = 255;
parameters.gTubes = 255;
parameters.bTubes = 255;

parameters.rPlane = 255;
parameters.gPlane = 255;
parameters.bPlane = 255;

parameters.powerT = 0.91;
parameters.antiDiffusionT = 6;
parameters.powerP = 0.61;
parameters.antiDiffusionP = 59;
const Tubes = gui.addFolder('Tubes')
Tubes.add(parameters,'rTubes',0,255,1);
Tubes.add(parameters,'gTubes',0,255,1);
Tubes.add(parameters,'bTubes',0,255,1);
Tubes.add(parameters,'powerT',0,1,0.01);
Tubes.add(parameters,'antiDiffusionT',0,150,1);
const Plane = gui.addFolder('Plane')
Plane.add(parameters,'rPlane',0,255,1);
Plane.add(parameters,'gPlane',0,255,1);
Plane.add(parameters,'bPlane',0,255,1);
Plane.add(parameters,'powerP',0,1,0.01);
Plane.add(parameters,'antiDiffusionP',0,150,1);

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
    currentPoint.addScaledVector(v, 0.007);
    // console.log(currentPoint.clone(),v)

    points.push(currentPoint.clone());
  }

  return points;
};
// TUBE generator
const material = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0.0 },
    uLight: { value: new THREE.Vector3(0,0,0)},
    uColor: {value : new THREE.Vector3(0,0,0)},
    uIntensity: {value: new THREE.Vector2(0,0)}
  },
  vertexShader: vertex,
  fragmentShader: fragment,
  // transparent: true,
  side: THREE.DoubleSide,
});
const materialTubes = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0.0 },
    uLight: { value: new THREE.Vector3(0,0,0)},
    uColor: {value : new THREE.Vector3(0.,0.,0.)},
    uIntensity: {value: new THREE.Vector2(0,0)}
  },
  vertexShader: vertexTubes,
  fragmentShader: fragmentTubes,
  // transparent: true,
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
          (Math.random()-0.5)*3,
          (Math.random()-0.5)*3,
          (Math.random()-0.5)*3
        )
      )
    );
    geometry = new THREE.TubeBufferGeometry(path, 100, 0.005, 8, false);
    mesh = new THREE.Mesh(geometry, materialTubes);
    scene.add(mesh);
    objects.push(mesh);
  }
  return objects;
};

// Raycast Func

const mouse = new THREE.Vector2();
const emouse = new THREE.Vector3();
const elasticMouse = new THREE.Vector2(0, 0, 0);
const elasticMouseVel = new THREE.Vector2(0, 0, 0);
const temp = new THREE.Vector3();

const raycast = (objects) => {
  let raycastPlane = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(2, 5),
    material
  );
  raycastPlane.position.set(0,0,-1.5)
  let raycastPlane1 = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(3, 5),
    material
  );
  raycastPlane1.position.set(-1,0,0)
  raycastPlane1.rotation.set(0,Math.PI*0.5,0)
  
  let raycastPlane2 = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(3, 5),
    material
  );
  raycastPlane2.position.set(1,0,0)
  raycastPlane2.rotation.set(0,Math.PI*0.5,0)
  let raycastPlane3 = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(2, 5),
    material
  );
  raycastPlane3.position.set(0,0,1.5)
  let raycastPlane4 = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(2, 3),
    material
  );
  raycastPlane4.position.set(0,2,0)
  raycastPlane4.rotation.set(Math.PI*0.5,0,0)
  let raycastPlane5 = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(2, 3),
    material
  );
  raycastPlane5.position.set(0,-2,0)
  raycastPlane5.rotation.set(Math.PI*0.5,0,0)
  
 

  // Light
  let light = new THREE.Mesh(
    new THREE.SphereBufferGeometry(0.001, 20, 20),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  scene.add(light);
  scene1.add(raycastPlane,raycastPlane1,raycastPlane2,raycastPlane3,raycastPlane4,raycastPlane5);
  const raycaster = new THREE.Raycaster();

  window.addEventListener("mousemove", onMouseMove);
  function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;


    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects([raycastPlane,raycastPlane1,raycastPlane2,raycastPlane3,raycastPlane4,raycastPlane5]);
    if (intersects.length > 0) {
      let p = intersects[0].point;
      emouse.x = p.x
      emouse.y = p.y
      emouse.z = p.z
      // console.log(intersects)
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
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height,0.0001,1000);
// gsap.fromTo(camera.position,{z:-1},{duration:10,z:1})
// gsap.to(camera.position,{z:-1,delay:10})
camera.position.z = 10
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
renderer.setClearColor(new THREE.Color("rgb(0,0,20)"));
renderer.autoClear = false;
/**
 *  Main
 */

const objects = generateTubes();
const light = raycast(objects);

/**
 *  Animation
 */
const clock = new THREE.Clock();
const animate = () => {
  // Time

  let elapseTime = clock.getElapsedTime();
  // Controls update
  // controls.update();

  /**
   *  cursor/light animation
   */

  // cursor.style.transform = `translate(${elasticMouse.x}px,${elasticMouse.y}px)`;

  temp.copy(emouse).sub(elasticMouse).multiplyScalar(0.15);
  elasticMouseVel.add(temp);
  elasticMouseVel.multiplyScalar(0.8);
  elasticMouse.add(elasticMouseVel);

  light.position.x = elasticMouse.x
  light.position.y = elasticMouse.y
  light.position.z = emouse.z

  material.uniforms.uLight.value = light.position
  material.uniforms.uTime.value = elapseTime;
  material.uniforms.uColor.value = [parameters.rPlane,parameters.gPlane,parameters.bPlane];
  material.uniforms.uIntensity.value = [parameters.powerP,parameters.antiDiffusionP];

  materialTubes.uniforms.uLight.value = light.position
  materialTubes.uniforms.uTime.value = elapseTime;
  materialTubes.uniforms.uColor.value = [parameters.rTubes,parameters.gTubes,parameters.bTubes];
  materialTubes.uniforms.uIntensity.value = [parameters.powerT,parameters.antiDiffusionT];
  

  // camera
  
  // camera.rotation.y += -mouse.x
  // camera.rotation.x += +mouse.y
  // gsap.to(camera.rotation,{duration:10,x:camera.rotation.x+mouse.y,y:camera.rotation.y-mouse.x})
  // camera.position.x = Math.cos(elapseTime * 0.3);
  // camera.position.y = Math.sin(elapseTime *.25); 
  // camera.position.z = Math.sin(elapseTime*0.3); 
  // camera.lookAt(new THREE.Vector3(0,0,0))
  
  // console.log(camera.position.x)

 

  // renderer
  renderer.clear();
  renderer.render(scene1, camera);
  renderer.clearDepth();
  renderer.render(scene,camera)
  

  // recall animationFunc

  window.requestAnimationFrame(animate);
};

animate();


//////////////////////////////////////////////////////////////////////////////////////////////
  let container = document.getElementById("nav_list");
  container.onmouseover = handler;

  function handler(event) {
    function str(el) {
      if (!el) return "null";
      return el.className || el.tagName;
    }

    if (str(event.target) == "cut__wrapper") {
      const cut1 = event.target.children[0];
      const cut2 = event.target.children[1];
      const cut3 = event.target.children[2];
      const cut4 = event.target.children[3];
      const timeline = gsap.timeline();
      timeline
        .fromTo(cut3,{duration:0.6, top: "50%", y: "-50%" }, { y: "150%" })
        .fromTo(cut4,{duration:0.6, top: "50%", y: "-50%" }, { y: "150%" }, "<+0.1")
        .fromTo(cut1,{duration:0.6, y: "-150%" }, { y: "0" }, "<")
        .fromTo(cut2,{duration:0.6, y: "-150%" }, { y: "0" }, "<-0.1");
    }
  }
////////////////////////////////////////////////////////////
let lastKnownScrollPosition = 0;
let ticking = false;

function doSomething(scrollPos) {
  gsap.to(camera.position,{duration:3,z:2+scrollPos/1000})
}

document.addEventListener('scroll', function(e) {
  lastKnownScrollPosition = window.scrollY;
  console.log(lastKnownScrollPosition);

  if (!ticking) {
    window.requestAnimationFrame(function() {
      doSomething(lastKnownScrollPosition);
      ticking = false;
    });

    ticking = true;
  }
});
//THREE Imports
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { SMAAPass } from "three/addons/postprocessing/SMAAPass.js";
//import { RenderPixelatedPass } from "three/addons/postprocessing/RenderPixelatedPass.js";
//CANNON Imports
import * as CANNON from "cannon-es";
import { Quaternion } from "cannon-es";
import CannonDebugger from "cannon-es-debugger";
//Etc
import getColors from "./utils/color-generator";
import { bar } from "./bar";
import mazeSphere from "./mazeSphere";
import maze from "./maze";

const mazeParams = {
  cells: 11,
  length: 15,
  width: 15,
  floor: 0.25,
  oww: 0.5,
  iww: 0.25,
  wh: 0.5,
};

//Materials & colors
const colors = getColors();

const scene = new THREE.Scene();
const world = new CANNON.World({
  gravity: new CANNON.Vec3(0, -9.82, 0), // m/s²
});

//Camera
let toggleCamera = true;

const perspCam = new THREE.PerspectiveCamera(
  90,
  window.innerWidth / window.innerHeight,
  0.1,
  2000
);
perspCam.position.set(-26, 23, 26);

const orthCam = new THREE.OrthographicCamera(
  window.innerWidth / -50,
  window.innerWidth / 50,
  window.innerHeight / 50,
  window.innerHeight / -50,
  1,
  1000
);
orthCam.position.set(-26, 23, 26);

let activeCamera = orthCam;

//SphereMesh and SphereBody
const sphereRadius = 0.5;
const sphereMesh = mazeSphere.getMesh(sphereRadius, parseInt(colors[0]));
scene.add(sphereMesh);
const sphereBody = mazeSphere.getBody(sphereRadius);
world.addBody(sphereBody);

//Maze Mesh and Body
const mazeBase = maze.getMazeBody(mazeParams);
world.addBody(mazeBase);
const mazeMesh = maze.getMazeMesh(mazeBase, mazeParams, parseInt(colors[1]));
scene.add(mazeMesh);

//Ground
const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
const groundMaterial = new THREE.MeshLambertMaterial({
  color: colors[2],
  side: THREE.DoubleSide,
});
const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
groundMesh.receiveShadow = true;
groundMesh.rotation.x = Math.PI * -0.5;
scene.add(groundMesh);

const groundBody = new CANNON.Body({
  type: CANNON.Body.STATIC,
  shape: new CANNON.Plane(),
});
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0); // make it face up
world.addBody(groundBody);
groundMesh.quaternion.copy(groundBody.quaternion);

//Lighting
const spotLight = new THREE.SpotLight(0xffffff, 0.5, 0);
spotLight.position.set(2, 17, 2);
spotLight.angle = Math.PI / 2;
spotLight.castShadow = true;
scene.add(spotLight);

const hemilight = new THREE.HemisphereLight(0xcccccc, 0x000000, 1);
scene.add(hemilight);

const sunLen = 15;
const sunWid = 22;
const sunLight = new THREE.DirectionalLight(0xffffff, 0.5);
sunLight.castShadow = true;
sunLight.position.set(10, 17, 9);
sunLight.shadow.mapSize.width = 1024;
sunLight.shadow.mapSize.height = 1024;
sunLight.shadow.camera.left = -sunWid;
sunLight.shadow.camera.right = sunWid;
sunLight.shadow.camera.top = sunLen + 9;
sunLight.shadow.camera.bottom = -sunLen;
scene.add(sunLight);

//Rendering/Animating
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(bar());
document.body.appendChild(renderer.domElement);

//Postprocessing
let composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, activeCamera);
composer.addPass(renderPass);

const smaaPass = new SMAAPass(
  window.innerWidth * renderer.getPixelRatio(),
  window.innerHeight * renderer.getPixelRatio()
);
composer.addPass(smaaPass);

//Playing with pixel postprocessing
//const renderPixPass = new RenderPixelatedPass(4, scene, camera);
//composer.addPass(renderPixPass);

let wpress = false;
let spress = false;
let apress = false;
let dpress = false;

document.addEventListener("keydown", (e) => {
  switch (e.key) {
    case "w":
      wpress = true;
      break;
    case "s":
      spress = true;
      break;
    case "a":
      apress = true;
      break;
    case "d":
      dpress = true;
      break;
    default:
      break;
  }
});

document.addEventListener("keyup", (e) => {
  switch (e.key) {
    case "w":
      wpress = false;
      break;
    case "s":
      spress = false;
      break;
    case "a":
      apress = false;
      break;
    case "d":
      dpress = false;
      break;
    default:
      break;
  }
});

let seeDebugger = false;

document.addEventListener("keypress", (e) => {
  switch (e.key) {
    case "x":
      seeDebugger = !seeDebugger;
      break;
    default:
      break;
  }
});

document.addEventListener("keypress", (e) => {
  switch (e.key) {
    case "u":
      //swap cameras
      if (toggleCamera) {
        swapCameras(perspCam);
      } else {
        swapCameras(orthCam);
      }

      break;
    default:
      break;
  }
});

window.addEventListener("resize", onWindowResize);

//Debugging/Helpers
//const axesHelper = new THREE.AxesHelper(15);
//scene.add(axesHelper);
let cannonDebugger = new CannonDebugger(scene, world, {
  onUpdate(body, mesh) {
    if (mesh.visible !== seeDebugger) {
      mesh.visible = seeDebugger;
    }
  },
}); //Debugger

let controls = new OrbitControls(activeCamera, renderer.domElement);
controls.target.set(0, 5, 0);
controls.update();
//const sunHelper = new THREE.CameraHelper(sunLight.shadow.camera);
//scene.add(sunHelper);

function animate() {
  requestAnimationFrame(animate);
  sphereMesh.position.copy(sphereBody.position);
  sphereMesh.quaternion.copy(sphereBody.quaternion);

  rotateFromInput();

  mazeMesh.position.copy(mazeBase.position);
  mazeMesh.quaternion.copy(mazeBase.quaternion);

  cannonDebugger.update();

  world.fixedStep();
  composer.render();
}

animate();

//HELPER FUNCTIONS
function rotateFromInput() {
  //Calculate the vector to rotate to
  let vec = new CANNON.Vec3(0, 0, 0);
  if (wpress) {
    vec.vadd(new CANNON.Vec3(-1, 0, 0), vec);
  }
  if (spress) {
    vec.vadd(new CANNON.Vec3(1, 0, 0), vec);
  }
  if (apress) {
    vec.vadd(new CANNON.Vec3(0, 0, 1), vec);
  }
  if (dpress) {
    vec.vadd(new CANNON.Vec3(0, 0, -1), vec);
  }
  const x = new Quaternion().setFromAxisAngle(vec, 0.2);
  mazeBase.quaternion.slerp(x, 0.02, mazeBase.quaternion);
}

function onWindowResize() {
  if (toggleCamera) {
    activeCamera.left = window.innerWidth / -50;
    activeCamera.right = window.innerWidth / 50;
    activeCamera.top = window.innerHeight / 50;
    activeCamera.bottom = window.innerHeight / -50;
  } else {
    activeCamera.aspect = window.innerWidth / window.innerHeight;
    perspCam.aspect = window.innerWidth / window.innerHeight;
  }

  activeCamera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
}

function swapCameras(targetCamera) {
  activeCamera = targetCamera;
  toggleCamera = !toggleCamera;

  composer.dispose();
  composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, activeCamera);
  composer.addPass(renderPass);
  renderPass.dispose();

  const smaaPass = new SMAAPass(
    window.innerWidth * renderer.getPixelRatio(),
    window.innerHeight * renderer.getPixelRatio()
  );
  composer.addPass(smaaPass);
  smaaPass.dispose();
  controls.dispose();
  controls = new OrbitControls(activeCamera, renderer.domElement);
  controls.target.set(0, 5, 0);
  controls.update();
  //There is no memory leak in ba sing se
}

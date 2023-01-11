import * as THREE from "three";
import * as CANNON from "cannon-es";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { bodyToMesh } from "./three-conversion-utils";
import { Quaternion } from "cannon-es";
import CannonDebugger from "cannon-es-debugger"; //Debugger
import { cannonMaze } from "./maze";

//Scene setup
const scene = new THREE.Scene();

//Cannon setup
const world = new CANNON.World({
    gravity: new CANNON.Vec3(0, -9.82, 0), // m/s²
});

//Camera
const camera = new THREE.PerspectiveCamera(
    90,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
);

camera.position.z = 24;
camera.position.x = 0;
camera.position.y = 24;
camera.lookAt(0, 0, 0);

/*const helper = new THREE.CameraHelper(camera);
scene.add(helper);
*/
//Sphere setup
const sphereRadius = 1;
const sphereWidth = 21;
const sphereHeight = 16;
const sphereGeometry = new THREE.SphereGeometry(
    sphereRadius,
    sphereWidth,
    sphereHeight
);
const sphereMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });

const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
sphere.castShadow = true;
sphere.receiveShadow = true;
scene.add(sphere);

//SphereBody
const sphereBody = new CANNON.Body({
    mass: 5,
    shape: new CANNON.Sphere(sphereRadius),
});
sphereBody.position.set(0, 20, 0);
world.addBody(sphereBody);

//Cylinder THREE setup
const cylRadius = 8;
const cylMaterial = new THREE.MeshLambertMaterial({
    color: 0x30f0d0d,
});

const cylGeometry = new THREE.CylinderGeometry(
    cylRadius,
    cylRadius,
    0.5,
    30,
    20
);
const cylinder = new THREE.Mesh(cylGeometry, cylMaterial);
cylinder.castShadow = true;
cylinder.receiveShadow = true;

//Cylinder CANNON setup
const cylShape = new CANNON.Cylinder(cylRadius, cylRadius, 0.5, 12);
const cylBody = new CANNON.Body({ mass: 0, shape: cylShape });
cylBody.position.set(0, 5, 0);

//add a box to both
const boxgeo = new THREE.BoxGeometry(12, 2, 2);
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const exampleBox = new THREE.Mesh(boxgeo, material);
exampleBox.position.set(0, 18, 0);
scene.add(exampleBox);

//

const boxShape = new CANNON.Box(new CANNON.Vec3(2, 2, 2));
cylBody.addShape(boxShape, new CANNON.Vec3(1, 0, 1));

//Add Cylinder to scene and world
//scene.add(cylinder);
world.addBody(cylBody);

const maze = bodyToMesh(cylBody, cylMaterial);
cannonMaze();
scene.add(maze);

//Plane Setup
const planeGeo = new THREE.PlaneGeometry(100, 100);
const planeMat = new THREE.MeshLambertMaterial({
    color: 0x1f4031,
    side: THREE.DoubleSide,
});
const plane = new THREE.Mesh(planeGeo, planeMat);
plane.receiveShadow = true;
plane.rotation.x = Math.PI * -0.5;
scene.add(plane);

//Ground
const groundBody = new CANNON.Body({
    type: CANNON.Body.STATIC,
    shape: new CANNON.Plane(),
});
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0); // make it face up
world.addBody(groundBody);

//Axeshelper
const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);

//Lighting
/*
const light = new THREE.SpotLight(0xffffff, 1, 0);
light.position.set(0, 20, 0);
light.angle = Math.PI / 2.55;
light.castShadow = true;
*/

const hemilight = new THREE.HemisphereLight(0xeeeeee, 0x000000, 0.5);
//scene.add(hemilight);
const d = 10;
const light = new THREE.DirectionalLight(0xffffff, 2);
light.castShadow = true;
light.position.set(0, 7, 0);
light.shadow.mapSize.width = 512; // default
light.shadow.mapSize.height = 512;
light.shadow.camera.left = -d;
light.shadow.camera.right = d;
light.shadow.camera.top = d;
light.shadow.camera.bottom = -d;
scene.add(light);

//const lightHelper = new THREE.CameraHelper(light.shadow.camera);
//scene.add(lightHelper);

//Rendering/Animating
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

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

const controls = new OrbitControls(camera, renderer.domElement);
controls.update();

const cannonDebugger = new CannonDebugger(scene, world); //Debugger

function animate() {
    requestAnimationFrame(animate);
    sphere.position.copy(sphereBody.position);
    sphere.quaternion.copy(sphereBody.quaternion);
    plane.quaternion.copy(groundBody.quaternion);

    rotateFromInput();

    //exampleBox.position.copy(cylBody.position);
    exampleBox.quaternion.copy(cylBody.quaternion);

    maze.position.copy(cylBody.position);
    maze.quaternion.copy(cylBody.quaternion);

    cannonDebugger.update(); //Debugger
    world.fixedStep();
    renderer.render(scene, camera);
}

function rotateFromInput() {
    //Calculate the vector to rotate to
    let vec = new CANNON.Vec3(0, 0, 0);
    if (wpress) {
        vec.vadd(new CANNON.Vec3(-1, 0, 0), vec);
        //console.log(vec);
    }
    if (spress) {
        vec.vadd(new CANNON.Vec3(1, 0, 0), vec);
        //console.log(vec);
    }
    if (apress) {
        vec.vadd(new CANNON.Vec3(0, 0, 1), vec);
        //console.log(vec);
    }
    if (dpress) {
        vec.vadd(new CANNON.Vec3(0, 0, -1), vec);
        //console.log(vec);
    }
    const x = new Quaternion().setFromAxisAngle(vec, 0.2);
    cylBody.quaternion.slerp(x, 0.02, cylBody.quaternion);
}

animate();

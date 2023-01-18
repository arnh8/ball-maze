import * as THREE from "three";
import * as CANNON from "cannon-es";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { bodyToMesh } from "./three-conversion-utils";
import { Quaternion } from "cannon-es";
import CannonDebugger from "cannon-es-debugger"; //Debugger
import { createMaze, hasConnection } from "./maze";

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

//MAZE PARAMETERS
let l = 15;
let h = 0.5;
let w = 15;
let cells = 9;
const t = 0.5; //outer wall width
const t_i = t / 2; //inner wall width
//

const matrix = createMaze(cells, cells);
const cellwidth = (l - 2 * t - (cells - 1) * t_i) / cells;
//Floor of maze (also the main body)
const halfExtents = new CANNON.Vec3(l - 2 * t, h, w - 2 * t);
const mazeFloor = new CANNON.Body({
    //consider changing floor to a plane
    mass: 0,
    shape: new CANNON.Box(halfExtents),
});

//Outer walls
const boxShape = new CANNON.Box(new CANNON.Vec3(w - 2 * t, 1, t));
mazeFloor.addShape(boxShape, new CANNON.Vec3(0, 1.5, l - t));
mazeFloor.addShape(boxShape, new CANNON.Vec3(0, 1.5, -(l - t)));
const box1Shape = new CANNON.Box(new CANNON.Vec3(t, 1, l - 2 * t));
mazeFloor.addShape(box1Shape, new CANNON.Vec3(w - t, 1.5, 0));
mazeFloor.addShape(box1Shape, new CANNON.Vec3(-(w - t), 1.5, 0));

//Inner vertical walls
const zoffset = 1.5;
const vert = new CANNON.Box(new CANNON.Vec3(t_i, 1, cellwidth));
for (let cellNo = 0; cellNo < matrix[0].length * matrix[0].length; cellNo++) {
    //If cellNo is one of the cells on the far right skip it
    if ((cellNo - cells + 1) % cells == 0) {
        continue;
    }
    //Check if connection to the right, if not, put a wall there
    const x = cellNo % cells;
    const y = Math.floor(cellNo / cells);
    if (!hasConnection(x, y, x + 1, y, matrix)) {
        //add the block, calculate offsets
        const xoffset = 2 * (x + 1) * (cellwidth + t_i) - (l - 2 * t + t_i);
        const yoffset = 2 * y * (cellwidth + t_i) - (l - 2 * t - cellwidth);
        mazeFloor.addShape(vert, new CANNON.Vec3(xoffset, zoffset, yoffset));
    }
}

//Inner Horizontal walls (skip bottom rows)
let calcLength = 0; //Length of wall to be made
let wallsBelow = [];
//For every row... this wont be pretty
for (let y = 0; y < matrix[0].length - 1; y++) {
    for (let x = 0; x < matrix.length; x++) {
        if (hasConnection(x, y, x, y + 1, matrix)) {
            wallsBelow.push(0);
        } else {
            wallsBelow.push(1);
        }
    }
    console.log(wallsBelow);
    let parentCell = null;
    if (wallsBelow[0] == 0) {
        //parentCell = 0;
    } else {
        //wall below
        parentCell = 0;
        calcLength += cellwidth;
    }

    for (let x = 1; x < wallsBelow.length; x++) {
        if (wallsBelow[x] == 0) {
            //0 detected, time to place a shape

            if (wallsBelow[x - 1] == 0) {
                //00, add cube
                const horiz = new CANNON.Box(new CANNON.Vec3(t_i, 1, t_i));
                const xoffset = 2 * x * (cellwidth + t_i) - (l - 2 * t + t_i);
                const yoffset =
                    2 * y * (cellwidth + t_i) -
                    (l - 2 * t - 2 * cellwidth - t_i); //- 5.55;
                mazeFloor.addShape(
                    horiz,
                    new CANNON.Vec3(xoffset, zoffset, yoffset)
                );
                calcLength = 0;
            } else {
                //10, add a long
                calcLength += t_i;
                const horiz = new CANNON.Box(
                    new CANNON.Vec3(calcLength, 1, t_i)
                );
                const xoffset =
                    2 * x * (cellwidth + t_i) -
                    (l - 2 * t + t_i) -
                    calcLength +
                    t_i;
                const yoffset =
                    2 * y * (cellwidth + t_i) -
                    (l - 2 * t - 2 * cellwidth - t_i); //- 5.55;

                mazeFloor.addShape(
                    horiz,
                    new CANNON.Vec3(xoffset, zoffset, yoffset)
                );
                calcLength = 0;
            }
        } else {
            //1 detected, add a unit and continue
            if (wallsBelow[x - 1] == 1) {
                //11
                calcLength += cellwidth + t_i;
                if (x == wallsBelow.length - 1) {
                    const horiz = new CANNON.Box(
                        new CANNON.Vec3(calcLength, 1, t_i)
                    );
                    const xoffset =
                        2 * x * (cellwidth + t_i) -
                        (l - 2 * t + t_i) -
                        calcLength +
                        t_i +
                        2 * cellwidth;
                    const yoffset =
                        2 * y * (cellwidth + t_i) -
                        (l - 2 * t - 2 * cellwidth - t_i); //- 5.55;

                    mazeFloor.addShape(
                        horiz,
                        new CANNON.Vec3(xoffset, zoffset, yoffset)
                    );
                    calcLength = 0;
                }
            } else {
                //01
                calcLength += cellwidth + t_i;
                if (x == wallsBelow.length - 1) {
                    const horiz = new CANNON.Box(
                        new CANNON.Vec3(calcLength, 1, t_i)
                    );
                    const xoffset =
                        2 * x * (cellwidth + t_i) -
                        (l - 2 * t + t_i) -
                        calcLength +
                        t_i +
                        2 * cellwidth;
                    const yoffset =
                        2 * y * (cellwidth + t_i) -
                        (l - 2 * t - 2 * cellwidth - t_i); //- 5.55;
                    mazeFloor.addShape(
                        horiz,
                        new CANNON.Vec3(xoffset, zoffset, yoffset)
                    );
                    calcLength = 0;
                }
            }
        }
    }

    wallsBelow = [];
}

mazeFloor.position.set(0, 5, 0);
world.addBody(mazeFloor);
const mazeMaterial = new THREE.MeshLambertMaterial({
    color: 0x164013,
});
const mazeMesh = bodyToMesh(mazeFloor, mazeMaterial);

//Add rounded corners to maze mesh
for (let x = 0; x < 4; x++) {
    const cornerGeometry = new THREE.CylinderGeometry(
        2 * t,
        2 * t,
        2 * 1,
        24,
        1,
        false,
        (Math.PI / 2) * x,
        Math.PI / 2
    );

    const mazeCornerMesh = new THREE.Mesh(cornerGeometry, mazeMaterial);
    const cOffset = l - 2 * t;
    switch (x) {
        case 0:
            mazeCornerMesh.position.set(cOffset, 1.5, cOffset);
            break;
        case 1:
            mazeCornerMesh.position.set(cOffset, 1.5, -cOffset);
            break;
        case 2:
            mazeCornerMesh.position.set(-cOffset, 1.5, -cOffset);
            break;
        case 3:
            mazeCornerMesh.position.set(-cOffset, 1.5, cOffset);
            break;
        default:
            break;
    }

    mazeMesh.add(mazeCornerMesh);
}

for (let i = 0; i < mazeMesh.children.length; i++) {
    const e = mazeMesh.children[i];
    e.castShadow = true;
    e.receiveShadow = true;
}

scene.add(mazeMesh);

//Plane Setup
const planeGeo = new THREE.PlaneGeometry(1000, 1000);
const planeMat = new THREE.MeshLambertMaterial({
    color: 0x51814e,
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

const hemilight = new THREE.HemisphereLight(0xcccccc, 0x000000, 1);
scene.add(hemilight);

const d = 20;
const light = new THREE.DirectionalLight(0xffffff, 1);
light.castShadow = true;
light.position.set(10, 17, 10);
light.shadow.mapSize.width = 512; // default
light.shadow.mapSize.height = 512;
light.shadow.camera.left = -d;
light.shadow.camera.right = d;
light.shadow.camera.top = d;
light.shadow.camera.bottom = -d;
//light.target = sphere;
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
    //exampleBox.quaternion.copy(cylBody.quaternion);

    mazeMesh.position.copy(mazeFloor.position);
    mazeMesh.quaternion.copy(mazeFloor.quaternion);

    //cannonDebugger.update(); //Debugger
    world.fixedStep();
    renderer.render(scene, camera);
}

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
    mazeFloor.quaternion.slerp(x, 0.02, mazeFloor.quaternion);
}

animate();

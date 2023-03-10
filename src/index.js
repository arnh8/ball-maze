import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
//import { RenderPixelatedPass } from "three/addons/postprocessing/RenderPixelatedPass.js";
import { SMAAPass } from "three/addons/postprocessing/SMAAPass.js";

import * as CANNON from "cannon-es";
import { Quaternion } from "cannon-es";
import CannonDebugger from "cannon-es-debugger";

import tinycolor from "tinycolor2";

import { createMaze, hasConnection } from "./maze";
import { bar } from "./bar";
import { bodyToMesh } from "./three-conversion-utils";

//Parameters
const mazeLength = 15;
const mazeFloorThickness = 0.25;
const mazeWidth = 15;
const cells = 11; //cells x cells maze
const oww = 0.5; //outer wall width
const iww = oww / 2; //inner wall width
const wh = 0.5; //wall height
const sphereRadius = 0.5;

//Materials & colors
const colors = getColors();
const sphereMaterial = new THREE.MeshPhongMaterial({
    color: parseInt(colors[0].toHex(), 16),
    shininess: 150,
});
const mazeMaterial = new THREE.MeshLambertMaterial({
    color: parseInt(colors[1].toHex(), 16),
});

const groundMaterial = new THREE.MeshLambertMaterial({
    color: parseInt(colors[2].toHex(), 16),
    side: THREE.DoubleSide,
});

const scene = new THREE.Scene();
const world = new CANNON.World({
    gravity: new CANNON.Vec3(0, -9.82, 0), // m/s²
});

//Camera
/*
const camera = new THREE.PerspectiveCamera(
    90,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
);
*/

const camera = new THREE.OrthographicCamera(
    window.innerWidth / -50,
    window.innerWidth / 50,
    window.innerHeight / 50,
    window.innerHeight / -50,
    1,
    1000
);
camera.position.set(-26, 23, 26);

//SphereMesh
const sphereWidthSegments = 21;
const sphereHeight = 16;
const sphereGeometry = new THREE.SphereGeometry(
    sphereRadius,
    sphereWidthSegments,
    sphereHeight
);
const sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
sphereMesh.castShadow = true;
sphereMesh.receiveShadow = true;
scene.add(sphereMesh);

//SphereBody
const sphereBody = new CANNON.Body({
    mass: 5,
    shape: new CANNON.Sphere(sphereRadius),
});
sphereBody.position.set(0, 20, 0);
world.addBody(sphereBody);

//Add Maze
const matrix = createMaze(cells, cells);
const cellwidth = (mazeLength - 2 * oww - (cells - 1) * iww) / cells;
const halfExtents = new CANNON.Vec3(
    mazeLength - 2 * oww,
    mazeFloorThickness,
    mazeWidth - 2 * oww
);
const mazeFloor = new CANNON.Body({
    //consider changing floor to a plane
    mass: 0,
    shape: new CANNON.Box(halfExtents),
});

//Outer walls
const zoffset = wh + mazeFloorThickness;
const boxShape = new CANNON.Box(new CANNON.Vec3(mazeWidth - 2 * oww, wh, oww));
mazeFloor.addShape(boxShape, new CANNON.Vec3(0, zoffset, mazeLength - oww));
mazeFloor.addShape(boxShape, new CANNON.Vec3(0, zoffset, -(mazeLength - oww)));
const box1Shape = new CANNON.Box(
    new CANNON.Vec3(oww, wh, mazeLength - 2 * oww)
);
mazeFloor.addShape(box1Shape, new CANNON.Vec3(mazeWidth - oww, zoffset, 0));
mazeFloor.addShape(box1Shape, new CANNON.Vec3(-(mazeWidth - oww), zoffset, 0));

//Inner vertical walls
const vert = new CANNON.Box(new CANNON.Vec3(iww, wh, cellwidth));
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
        const xoffset =
            2 * (x + 1) * (cellwidth + iww) - (mazeLength - 2 * oww + iww);
        const yoffset =
            2 * y * (cellwidth + iww) - (mazeLength - 2 * oww - cellwidth);
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
    if (wallsBelow[0] == 0) {
    } else {
        //wall below
        calcLength += cellwidth;
    }

    for (let x = 1; x < wallsBelow.length; x++) {
        if (wallsBelow[x] == 0) {
            //0 detected, place a shape
            if (wallsBelow[x - 1] == 0) {
                //00, add cube (single notch)
                const horiz = new CANNON.Box(new CANNON.Vec3(iww, wh, iww));
                const xoffset =
                    2 * x * (cellwidth + iww) - (mazeLength - 2 * oww + iww);
                const yoffset =
                    2 * y * (cellwidth + iww) -
                    (mazeLength - 2 * oww - 2 * cellwidth - iww); //- 5.55;
                mazeFloor.addShape(
                    horiz,
                    new CANNON.Vec3(xoffset, zoffset, yoffset)
                );
                calcLength = 0;
            } else {
                //10, add a long
                calcLength += iww;
                const horiz = new CANNON.Box(
                    new CANNON.Vec3(calcLength, wh, iww)
                );
                const xoffset =
                    2 * x * (cellwidth + iww) -
                    (mazeLength - 2 * oww + iww) -
                    calcLength +
                    iww;
                const yoffset =
                    2 * y * (cellwidth + iww) -
                    (mazeLength - 2 * oww - 2 * cellwidth - iww); //- 5.55;

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
                calcLength += cellwidth + iww;
                if (x == wallsBelow.length - 1) {
                    const horiz = new CANNON.Box(
                        new CANNON.Vec3(calcLength, wh, iww)
                    );
                    const xoffset =
                        2 * x * (cellwidth + iww) -
                        (mazeLength - 2 * oww + iww) -
                        calcLength +
                        iww +
                        2 * cellwidth;
                    const yoffset =
                        2 * y * (cellwidth + iww) -
                        (mazeLength - 2 * oww - 2 * cellwidth - iww); //- 5.55;

                    mazeFloor.addShape(
                        horiz,
                        new CANNON.Vec3(xoffset, zoffset, yoffset)
                    );
                    calcLength = 0;
                }
            } else {
                //01
                calcLength += cellwidth + iww;
                if (x == wallsBelow.length - 1) {
                    const horiz = new CANNON.Box(
                        new CANNON.Vec3(calcLength, wh, iww)
                    );
                    const xoffset =
                        2 * x * (cellwidth + iww) -
                        (mazeLength - 2 * oww + iww) -
                        calcLength +
                        iww +
                        2 * cellwidth;
                    const yoffset =
                        2 * y * (cellwidth + iww) -
                        (mazeLength - 2 * oww - 2 * cellwidth - iww); //- 5.55;
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

mazeFloor.position.set(0, 6, 0);
world.addBody(mazeFloor);

const mazeMesh = bodyToMesh(mazeFloor, mazeMaterial);

//Add rounded corners to maze mesh
for (let x = 0; x < 4; x++) {
    const cornerGeometry = new THREE.CylinderGeometry(
        2 * oww,
        2 * oww,
        2 * wh,
        24,
        1,
        false,
        (Math.PI / 2) * x,
        Math.PI / 2
    );

    const mazeCornerMesh = new THREE.Mesh(cornerGeometry, mazeMaterial);
    const cOffset = mazeLength - 2 * oww;
    switch (x) {
        case 0:
            mazeCornerMesh.position.set(cOffset, zoffset, cOffset);
            break;
        case 1:
            mazeCornerMesh.position.set(cOffset, zoffset, -cOffset);
            break;
        case 2:
            mazeCornerMesh.position.set(-cOffset, zoffset, -cOffset);
            break;
        case 3:
            mazeCornerMesh.position.set(-cOffset, zoffset, cOffset);
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

//Ground
const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
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
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const smaaPass = new SMAAPass(
    window.innerWidth * renderer.getPixelRatio(),
    window.innerHeight * renderer.getPixelRatio()
);
composer.addPass(smaaPass);

//Playing with pixel postprocessing
//const renderPixPass = new RenderPixelatedPass(2, scene, camera);
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

window.addEventListener("resize", onWindowResize);
function onWindowResize() {
    camera.left = window.innerWidth / -50;
    camera.right = window.innerWidth / 50;
    camera.top = window.innerHeight / 50;
    camera.bottom = window.innerHeight / -50;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
}

//Debugging/Helpers
//const axesHelper = new THREE.AxesHelper(15);
//scene.add(axesHelper);
//const cannonDebugger = new CannonDebugger(scene, world); //Debugger

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 5, 0);
controls.update();
//const sunHelper = new THREE.CameraHelper(sunLight.shadow.camera);
//scene.add(sunHelper);

function animate() {
    requestAnimationFrame(animate);
    sphereMesh.position.copy(sphereBody.position);
    sphereMesh.quaternion.copy(sphereBody.quaternion);

    rotateFromInput();

    mazeMesh.position.copy(mazeFloor.position);
    mazeMesh.quaternion.copy(mazeFloor.quaternion);

    //cannonDebugger.update(); //Debugger
    world.fixedStep();
    composer.render();
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

function getColors() {
    const colorSeed = tinycolor.random();
    let colors;
    if (Math.random() > 0.5) {
        colors = tinycolor(colorSeed).monochromatic();
    } else {
        colors = tinycolor(colorSeed).analogous();
    }

    if (colors[1].getBrightness() > 120) {
        const x = colors[1].getBrightness() - 50;
        colors[1].darken(x * x * 0.0019);
    } else if (colors[1].getBrightness() < 20) {
        colors[1].brighten(10);
    }

    if (colors[2].getBrightness() > 120) {
        const x = colors[2].getBrightness() - 50;
        colors[2].darken(x * x * 0.0019 + 5);
    } else if (colors[2].getBrightness() < 20) {
        colors[2].brighten(10);
    }

    return colors;
}

animate();

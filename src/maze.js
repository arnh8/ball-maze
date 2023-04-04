import * as THREE from "three";
import * as CANNON from "cannon-es";

import { createMaze, hasConnection } from "./utils/maze-generator";
import { bodyToMesh } from "./utils/three-conversion-utils";
//Args needed
//cells: if cells is x, then the maze will have the shape of x by x cells
//oww = outer wall width, iww = inner wall width
//wh = wall height
const getMazeBody = ({ cells, length, width, floor, oww, iww, wh }) => {
  const matrix = createMaze(cells, cells);
  const cellwidth = (length - 2 * oww - (cells - 1) * iww) / cells;
  const halfExtents = new CANNON.Vec3(length - 2 * oww, floor, width - 2 * oww);

  //Init floor of maze
  const base = new CANNON.Body({
    //consider changing floor to a plane
    mass: 0,
    shape: new CANNON.Box(halfExtents),
  });

  //Outer walls
  const zoffset = wh + floor;
  const boxShape = new CANNON.Box(new CANNON.Vec3(width - 2 * oww, wh, oww));
  base.addShape(boxShape, new CANNON.Vec3(0, zoffset, length - oww));
  base.addShape(boxShape, new CANNON.Vec3(0, zoffset, -(length - oww)));
  const box1Shape = new CANNON.Box(new CANNON.Vec3(oww, wh, length - 2 * oww));
  base.addShape(box1Shape, new CANNON.Vec3(width - oww, zoffset, 0));
  base.addShape(box1Shape, new CANNON.Vec3(-(width - oww), zoffset, 0));

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
        2 * (x + 1) * (cellwidth + iww) - (length - 2 * oww + iww);
      const yoffset =
        2 * y * (cellwidth + iww) - (length - 2 * oww - cellwidth);
      base.addShape(vert, new CANNON.Vec3(xoffset, zoffset, yoffset));
    }
  }

  //Inner Horizontal walls (skip bottom row)
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
          const xoffset = 2 * x * (cellwidth + iww) - (length - 2 * oww + iww);
          const yoffset =
            2 * y * (cellwidth + iww) -
            (length - 2 * oww - 2 * cellwidth - iww); //- 5.55;
          base.addShape(horiz, new CANNON.Vec3(xoffset, zoffset, yoffset));
          calcLength = 0;
        } else {
          //10, add a long
          calcLength += iww;
          const horiz = new CANNON.Box(new CANNON.Vec3(calcLength, wh, iww));
          const xoffset =
            2 * x * (cellwidth + iww) -
            (length - 2 * oww + iww) -
            calcLength +
            iww;
          const yoffset =
            2 * y * (cellwidth + iww) -
            (length - 2 * oww - 2 * cellwidth - iww); //- 5.55;

          base.addShape(horiz, new CANNON.Vec3(xoffset, zoffset, yoffset));
          calcLength = 0;
        }
      } else {
        //1 detected, add a unit and continue
        if (wallsBelow[x - 1] == 1) {
          //11
          calcLength += cellwidth + iww;
          if (x == wallsBelow.length - 1) {
            const horiz = new CANNON.Box(new CANNON.Vec3(calcLength, wh, iww));
            const xoffset =
              2 * x * (cellwidth + iww) -
              (length - 2 * oww + iww) -
              calcLength +
              iww +
              2 * cellwidth;
            const yoffset =
              2 * y * (cellwidth + iww) -
              (length - 2 * oww - 2 * cellwidth - iww); //- 5.55;

            base.addShape(horiz, new CANNON.Vec3(xoffset, zoffset, yoffset));
            calcLength = 0;
          }
        } else {
          //01
          calcLength += cellwidth + iww;
          if (x == wallsBelow.length - 1) {
            const horiz = new CANNON.Box(new CANNON.Vec3(calcLength, wh, iww));
            const xoffset =
              2 * x * (cellwidth + iww) -
              (length - 2 * oww + iww) -
              calcLength +
              iww +
              2 * cellwidth;
            const yoffset =
              2 * y * (cellwidth + iww) -
              (length - 2 * oww - 2 * cellwidth - iww); //- 5.55;
            base.addShape(horiz, new CANNON.Vec3(xoffset, zoffset, yoffset));
            calcLength = 0;
          }
        }
      }
    }
    wallsBelow = [];
  }
  base.position.set(0, 6, 0);

  return base;
};

const getMazeMesh = (body, mazeParams, color) => {
  const mazeColor = color !== undefined ? color : 0xffffff;
  const mazeMaterial = new THREE.MeshLambertMaterial({
    color: mazeColor,
  });
  //Convert body to mesh
  const mesh = bodyToMesh(body, mazeMaterial);

  //Add corners
  for (let x = 0; x < 4; x++) {
    const cornerGeometry = new THREE.CylinderGeometry(
      2 * mazeParams.oww,
      2 * mazeParams.oww,
      2 * mazeParams.wh,
      24,
      1,
      false,
      (Math.PI / 2) * x,
      Math.PI / 2
    );

    const mazeCornerMesh = new THREE.Mesh(cornerGeometry, mazeMaterial);
    const zoffset = mazeParams.wh + mazeParams.floor;
    const cOffset = mazeParams.length - 2 * mazeParams.oww;
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

    mesh.add(mazeCornerMesh);
  }

  for (let i = 0; i < mesh.children.length; i++) {
    const e = mesh.children[i];
    e.castShadow = true;
    e.receiveShadow = true;
  }
  return mesh;
};

export default { getMazeBody, getMazeMesh };

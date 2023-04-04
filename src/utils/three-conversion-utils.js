//Several functions from https://github.com/pmndrs/cannon-es/blob/master/examples/js/three-conversion-utils.js
import * as THREE from "three";
import * as CANNON from "cannon-es";

export function shapeToGeometry(shape, { flatShading = true } = {}) {
    switch (shape.type) {
        case CANNON.Shape.types.SPHERE: {
            return new THREE.SphereGeometry(shape.radius, 8, 8);
        }

        case CANNON.Shape.types.PARTICLE: {
            return new THREE.SphereGeometry(0.1, 8, 8);
        }

        case CANNON.Shape.types.PLANE: {
            return new THREE.PlaneGeometry(500, 500, 4, 4);
        }

        case CANNON.Shape.types.BOX: {
            return new THREE.BoxGeometry(
                shape.halfExtents.x * 2,
                shape.halfExtents.y * 2,
                shape.halfExtents.z * 2
            );
        }

        case CANNON.Shape.types.CYLINDER: {
            return new THREE.CylinderGeometry(
                shape.radiusTop,
                shape.radiusBottom,
                shape.height,
                shape.numSegments
            );
        }

        default: {
            throw new Error(`Shape not recognized: "${shape.type}"`);
        }
    }
}

export function bodyToMesh(body, material) {
    const group = new THREE.Group();

    group.position.copy(body.position);
    group.quaternion.copy(body.quaternion);

    const meshes = body.shapes.map((shape) => {
        const geometry = shapeToGeometry(shape);

        return new THREE.Mesh(geometry, material);
    });

    meshes.forEach((mesh, i) => {
        const offset = body.shapeOffsets[i];
        const orientation = body.shapeOrientations[i];
        mesh.position.copy(offset);
        mesh.quaternion.copy(orientation);

        group.add(mesh);
    });

    return group;
}

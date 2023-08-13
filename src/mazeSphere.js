import * as THREE from "three";
import * as CANNON from "cannon-es";

const getMesh = (radius, color) => {
  const sphereRadius = radius ? radius : 0.5;
  const sphereWidthSegments = 21;
  const sphereHeight = 16;
  const sphereGeometry = new THREE.SphereGeometry(
    sphereRadius,
    sphereWidthSegments,
    sphereHeight
  );

  const sphereColor = color !== undefined ? color : 0xff4444;
  const sphereMaterial = new THREE.MeshPhongMaterial({
    color: sphereColor,
    shininess: 150,
  });

  const sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
  sphereMesh.castShadow = true;
  sphereMesh.receiveShadow = true;

  return sphereMesh;
};

const getBody = (radius) => {
  const sphereBody = new CANNON.Body({
    mass: 5,
    shape: new CANNON.Sphere(radius),
  });
  sphereBody.position.set(0, 20, 0);
  sphereBody.mass = 30;

  return sphereBody;
};

export default { getMesh, getBody };

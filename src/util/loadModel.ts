import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

function makeDoubleSided(object: THREE.Object3D) {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(material => {
            material.side = THREE.DoubleSide;
          });
        } else {
          child.material.side = THREE.DoubleSide;
        }
      }
    }
  });
}

export function loadModel(
  fileName: string,
  content: Blob,
  doubleSided: boolean = true
): Promise<THREE.Object3D> {
  return new Promise((resolve, reject) => {
    const fileType = fileName.split('.').pop()?.toLowerCase();
    if (!fileType) {
      reject(new Error(`Unsupported file type: no extension found`));
      return;
    }
    const url = URL.createObjectURL(content);

    const onLoad = (object: THREE.Object3D) => {
      // Apply shadows and double-sided materials
      object.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;

          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((material) => {
                if (doubleSided) material.side = THREE.DoubleSide;
                // Ensure material can receive shadows
                if (material instanceof THREE.MeshStandardMaterial) {
                  material.needsUpdate = true;
                }
              });
            } else {
              if (doubleSided) child.material.side = THREE.DoubleSide;
              if (child.material instanceof THREE.MeshStandardMaterial) {
                child.material.needsUpdate = true;
              }
            }
          }
        }
      });

      URL.revokeObjectURL(url); // Clean up
      resolve(object);
    };

    switch (fileType) {
      case 'glb':
      case 'gltf': {
        const loader = new GLTFLoader();
        loader.load(
          url,
          (gltf) => {
            const model = gltf.scene;
            onLoad(model);
          },
          undefined,
          reject
        );
        break;
      }
      case 'fbx': {
        const loader = new FBXLoader();
        loader.load(url, onLoad, undefined, reject);
        break;
      }
      case 'obj': {
        const loader = new OBJLoader();
        loader.load(url, onLoad, undefined, reject);
        break;
      }
      default:
        reject(new Error(`Unsupported file type: ${fileType}`));
    }
  });
}

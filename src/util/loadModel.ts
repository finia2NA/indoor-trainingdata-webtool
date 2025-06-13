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

export function loadModel(fileName: string, content: Blob): Promise<THREE.Object3D> {
  return new Promise((resolve, reject) => {
    const fileType = fileName.split('.').pop()?.toLowerCase();
    if (!fileType) {
      reject(new Error('File type not found'));
      return;
    }
    const url = URL.createObjectURL(content);
    switch (fileType) {
      case 'glb':
      case 'gltf': {
        const loader = new GLTFLoader();
        loader.load(url, (gltf) => {
          const model = gltf.scene || gltf;
          makeDoubleSided(model);
          resolve(model);
        }, undefined, reject);
        break;
      }
      case 'fbx': {
        const loader = new FBXLoader();
        loader.load(url, (object) => {
          makeDoubleSided(object);
          resolve(object);
        }, undefined, reject);
        break;
      }
      case 'obj': {
        const loader = new OBJLoader();
        loader.load(url, (object) => {
          makeDoubleSided(object);
          resolve(object);
        }, undefined, reject);
        break;
      }
      default:
        reject(new Error(`Unsupported file type: ${fileType}`));
    }
  });
}

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

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
          resolve(gltf.scene || gltf);
        }, undefined, reject);
        break;
      }
      case 'fbx': {
        const loader = new FBXLoader();
        loader.load(url, (object) => {
          resolve(object);
        }, undefined, reject);
        break;
      }
      default:
        reject(new Error(`Unsupported file type: ${fileType}`));
    }
  });
}

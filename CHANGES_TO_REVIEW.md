# Extracted Changes for Review

These are specific improvements found within shader-related commits that should be considered for inclusion. They are general improvements unrelated to shader functionality.

## 1. Shadow Map Setup (from commit `179b651` and `cdb2fa5`)

**File: `src/hooks/offscreen/sceneCache.ts` (if restored) - Line 22-25**
```typescript
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
```

**Purpose**: Enables shadow mapping with soft shadows for better rendering quality.

## 2. Model Loading with Shadow Support (from commit `179b651`)

**File: `src/hooks/offscreen/sceneCache.ts` (if restored) - Line 44-51**
```typescript
loadedObject.traverse((child) => {
  if (child instanceof THREE.Mesh) {
    if (doubleSided) {
      child.material.side = THREE.DoubleSide;
    }
    child.receiveShadow = true;
    child.castShadow = true;
  }
});
```

**Purpose**: Ensures loaded models can cast and receive shadows properly.

## 3. Point Light Cleanup (from commit `f33b0b1`)

**File: `src/hooks/offscreen/useOffscreenThree.ts` - Around line 138**
```typescript
// After we are done, clean up and reactivate the ambient light
scene.remove(pl);
if (ambientLight) {
  ambientLight.visible = true;
}
```

**Purpose**: Prevents memory leaks by properly cleaning up point lights.

## 4. Improved Model Loading Function (from commit `59732a4`)

**File: `src/util/loadModel.ts` - Replace existing function**
```typescript
// loadModel.js
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
```

**Purpose**: 
- Proper shadow casting/receiving setup for all loaded models
- URL cleanup to prevent memory leaks
- Better error handling
- Material handling improvements

## 5. Scene Cache System (from commit `9b9a608`)

**New File: `src/hooks/offscreen/sceneCache.ts`**
```typescript
import * as THREE from 'three';
import { Project } from "../../data/db";
import { loadModel } from '../../util/loadModel';
import Transformation from '../../data/Transformation';
import { get360s, Image360 } from '../../util/get360s';

const setupScene = async (
  project: Project,
  getVisibility: (projectId: number, modelId: number) => boolean,
  getTransformation: (projectId: number, modelId: number) => Transformation | null,
  width: number,
  height: number,
  doubleSided: boolean,
  use360Shading: boolean = false
) => {
  if (!project) throw new Error('Model not found');
  if (!project.id) throw new Error('Model id not found');

  // first, basic setup: canvas, scene, renderer, lights, camera, etc
  const offscreen = new OffscreenCanvas(width, height);
  const renderer = new THREE.WebGLRenderer({ canvas: offscreen, preserveDrawingBuffer: true });
  const scene = new THREE.Scene();
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  scene.background = new THREE.Color(0x484848);
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  const ambientLight = new THREE.AmbientLight(0xffffff, 1);
  ambientLight.name = 'ambientLight';
  scene.add(ambientLight);

  // now, add all applicable models to the scene
  const models = project.models;
  if (!models) throw new Error('Models not found');
  const loadedObjects: THREE.Object3D[] = [];

  for (const model of models) {
    if (!getVisibility(project.id, model.id)) continue;

    const transformation = getTransformation(project.id, model.id);
    if (!transformation) throw new Error(`Transformation not found for model${model.name}, ids p-${project.id}, m-${model.id}`);

    const loadedObject = await loadModel(model.name, model.content);
    loadedObject.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (doubleSided) {
          child.material.side = THREE.DoubleSide;
        }
        child.receiveShadow = true;
        child.castShadow = true;
      }
    });
    loadedObject.position.set(transformation.translation[0], transformation.translation[1], transformation.translation[2]);
    loadedObject.setRotationFromEuler(new THREE.Euler(transformation.rotation[0], transformation.rotation[1], transformation.rotation[2]));
    loadedObject.scale.set(transformation.scale[0], transformation.scale[1], transformation.scale[2]);
    scene.add(loadedObject);
    loadedObjects.push(loadedObject);
  }

  // New code: if images are available, load them
  let images360: Image360[] | null = [];
  try {
    images360 = await get360s(project, true);
    if (!images360 || images360.length === 0) {
      console.log('No 360° images found in project metadata');
      images360 = null;
    }
  } catch (error) {
    console.error('Failed to load 360 images:', error);
    images360 = null;
  }

  return { offscreen, renderer, scene, camera, images360 };
}

type SceneData = {
  offscreen: OffscreenCanvas;
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  images360: Image360[] | null;
};

type SceneCacheKey = {
  projectId: number;
  width: number;
  height: number;
  doubleSided: boolean;
  use360Shading: boolean;
  // We'll use function references as part of the cache key
  getVisibilityRef: Function;
  getTransformationRef: Function;
};

class SceneCache {
  private cache: Map<string, SceneData> = new Map();

  private createCacheKey(
    projectId: number,
    width: number,
    height: number,
    doubleSided: boolean,
    use360Shading: boolean,
    getVisibility: Function,
    getTransformation: Function
  ): { key: SceneCacheKey; keyString: string } {
    const key: SceneCacheKey = {
      projectId,
      width,
      height,
      doubleSided,
      use360Shading,
      getVisibilityRef: getVisibility,
      getTransformationRef: getTransformation,
    };

    // Create a string representation for the Map key
    const keyString = JSON.stringify({
      projectId,
      width,
      height,
      doubleSided,
      use360Shading,
      // Use function toString() or a unique identifier if available
      getVisibilityId: getVisibility.toString(),
      getTransformationId: getTransformation.toString(),
    });

    return { key, keyString };
  }

  async getOrCreateScene(
    project: Project,
    getVisibility: (projectId: number, modelId: number) => boolean,
    getTransformation: (projectId: number, modelId: number) => Transformation | null,
    width: number,
    height: number,
    doubleSided: boolean = false,
    use360Shading: boolean = false
  ): Promise<SceneData> {
    if (!project?.id) {
      throw new Error('Project or project ID is missing');
    }

    const { keyString } = this.createCacheKey(
      project.id,
      width,
      height,
      doubleSided,
      use360Shading,
      getVisibility,
      getTransformation
    );

    // Check if we have a cached scene for this exact configuration
    const cachedScene = this.cache.get(keyString);
    if (cachedScene) {
      console.log('Returning cached scene');
      return cachedScene;
    }

    console.log('Creating new scene (not from cache)');
    
    // Create new scene
    const sceneData = await setupScene(
      project,
      getVisibility,
      getTransformation,
      width,
      height,
      doubleSided,
      use360Shading,
    );

    // Cache the new scene
    this.cache.set(keyString, sceneData);

    // Optionally limit cache size to prevent memory leaks
    if (this.cache.size > 2) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        const oldScene = this.cache.get(firstKey);
        if (oldScene) {
          // Clean up WebGL resources
          oldScene.renderer.dispose();
          oldScene.scene.clear();
        }
        this.cache.delete(firstKey);
      }
    }

    return sceneData;
  }

  // Method to manually invalidate cache for a specific project
  invalidateProject(projectId: number): void {
    const keysToDelete: string[] = [];
    for (const [keyString] of this.cache) {
      try {
        const keyData = JSON.parse(keyString);
        if (keyData.projectId === projectId) {
          keysToDelete.push(keyString);
        }
      } catch (error) {
        // If we can't parse the key, it's probably corrupted, so delete it
        keysToDelete.push(keyString);
      }
    }

    keysToDelete.forEach(key => {
      const scene = this.cache.get(key);
      if (scene) {
        // Clean up WebGL resources
        scene.renderer.dispose();
        scene.scene.clear();
      }
      this.cache.delete(key);
    });

    console.log(`Invalidated ${keysToDelete.length} cached scenes for project ${projectId}`);
  }

  // Method to clear all cached scenes
  clearAll(): void {
    for (const [, scene] of this.cache) {
      // Clean up WebGL resources
      scene.renderer.dispose();
      scene.scene.clear();
    }
    this.cache.clear();
    console.log('Cleared all cached scenes');
  }

  // Get cache stats for debugging
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Export a singleton instance
export const sceneCache = new SceneCache();
export type { SceneData };
```

**Purpose**: Implements scene caching with proper memory management and WebGL resource cleanup.

## 6. Updated useScene Hook (from commit `9b9a608`)

**File: `src/hooks/offscreen/useScene.ts` - Replace with object-based parameters**
```typescript
import { useCallback, useEffect } from 'react';
import { Project } from "../../data/db";
import { sceneCache, SceneData } from './sceneCache';
import useMultiTransformationStore from '../state/useMultiTransformationStore';

type GetOrCreateSceneProps = {
  width: number;
  height: number;
  doubleSided?: boolean;
  use360Shading?: boolean;
}

const useScene = (project?: Project) => {
  // Get the data we need
  const projectId = project?.id ?? null;

  // Functions from other hooks
  const { getTransformation, getVisibility } = useMultiTransformationStore();

  console.log('useScene hook initialized with projectId:', projectId);

  // Clear cache when project changes or when transformation/visibility functions change
  useEffect(() => {
    if (projectId) {
      sceneCache.invalidateProject(projectId);
    }
    console.log('Scene Cache invalidated for project:', projectId);
  }, [projectId, getTransformation, getVisibility]);

  // Get or create scene - now just forwards everything to the cache
  const getOrCreateScene = useCallback(async (props: GetOrCreateSceneProps): Promise<SceneData> => {
    if (!project) {
      throw new Error('Project is required');
    }

    // Forward all hook data and props to the cache
    return sceneCache.getOrCreateScene(
      project,
      getVisibility,
      getTransformation,
      props.width,
      props.height,
      props.doubleSided ?? false,
      props.use360Shading ?? false,
    );
  }, [project, getVisibility, getTransformation]);

  return { getOrCreateScene }
}

export default useScene;
```

**Purpose**: Refactors scene management to use centralized caching with object-based parameters.

## Summary

These changes provide:
1. **Better rendering quality** - Shadow mapping improvements
2. **Memory management** - Proper resource cleanup and scene caching
3. **Performance** - Scene caching reduces repeated setup
4. **Code quality** - Better error handling and URL cleanup
5. **Consistency** - Standardized shadow casting/receiving for all models

All these improvements are unrelated to shader functionality and would benefit the application regardless of the 360° shader implementation.
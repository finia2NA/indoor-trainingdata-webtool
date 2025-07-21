import * as THREE from 'three';
import { Project } from "../../data/db";
import { loadModel } from '../../util/loadModel';
import Transformation from '../../data/Transformation';
import { get360s, Image360 } from '../../util/get360s';
import { setShader, setUniforms } from './shading';

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
    if (doubleSided) {
      loadedObject.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material.side = THREE.DoubleSide;
        }
      });
    }
    loadedObject.position.set(transformation.translation[0], transformation.translation[1], transformation.translation[2]);
    loadedObject.setRotationFromEuler(new THREE.Euler(transformation.rotation[0], transformation.rotation[1], transformation.rotation[2]));
    loadedObject.scale.set(transformation.scale[0], transformation.scale[1], transformation.scale[2]);
    scene.add(loadedObject);
    loadedObject.name = "sceneOBJ" + model.name;
    loadedObjects.push(loadedObject);
  }

  // New code: if images are available, load them and then use them in a shader
  let images360: Image360[] | null = [];
  try {
    images360 = await get360s(project, true);
    if (!images360 || images360.length === 0) {
      console.log('No 360° images found in project metadata');
      images360 = null;
    }
  } catch (error) {
    console.error('Failed to load 360 images:', error);
  }

  // Apply shaders based on available images
  if (images360 && use360Shading) {
    // Apply composite shader if images are available
    loadedObjects.forEach(obj => {
      setShader(obj, 'composite', doubleSided);
    });

    return { offscreen, renderer, scene, camera, images360 };
  } else {
    return { offscreen, renderer, scene, camera, images360 };
  }
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

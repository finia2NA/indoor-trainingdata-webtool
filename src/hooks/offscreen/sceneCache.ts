import * as THREE from 'three';
import { Project } from "../../data/db";
import { loadModel } from '../../util/loadModel';
import Transformation from '../../data/Transformation';
import { get360s, Image360 } from '../../util/get360s';

const setupScene = async (
  project: Project,
  transformations: Record<number, Transformation>,
  visibilities: Record<number, boolean>,
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

  // Only add ambient light when NOT using 360° shading
  if (!use360Shading) {
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    ambientLight.name = 'ambientLight';
    scene.add(ambientLight);
  }

  // now, add all applicable models to the scene
  const models = project.models;
  if (!models) throw new Error('Models not found');
  const loadedObjects: THREE.Object3D[] = [];

  for (const model of models) {
    const isVisible = visibilities[model.id] ?? true;
    if (!isVisible) continue;

    const transformation = transformations[model.id];
    if (!transformation) throw new Error(`Transformation not found for model${model.name}, ids p-${project.id}, m-${model.id}`);

    const loadedObject = await loadModel(model.name, model.content);
    loadedObject.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (use360Shading) {
          // Create custom shadow material for 360° shading
          const compMat = new THREE.ShadowMaterial({ 
            color: 0xffffff, 
            side: doubleSided ? THREE.DoubleSide : THREE.FrontSide
          });
          
          // Add custom uniforms
          (compMat as any).uniforms = {
            sphereMap: { value: null },
            lightPos: { value: new THREE.Vector3() }
          };
          
          compMat.onBeforeCompile = shader => {
            // Link custom uniforms
            shader.uniforms.sphereMap = (compMat as any).uniforms.sphereMap;
            shader.uniforms.lightPos = (compMat as any).uniforms.lightPos;
            
            // Replace fog fragment to show black in shadow, green otherwise
            shader.fragmentShader = shader.fragmentShader.replace(
              '#include <fog_fragment>',
              `if ( gl_FragColor.a > 0.1 ) {
  gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); // Black for shadowed areas
} else {
  gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0); // Green for non-shadowed areas
}
#include <fog_fragment>`
            );
          };
          
          child.material = compMat;
        } else {
          if (doubleSided) {
            child.material.side = THREE.DoubleSide;
          }
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
  // Use serialized transformation and visibility data instead of function references
  transformationsHash: string;
  visibilitiesHash: string;
};

class SceneCache {
  private cache: Map<string, SceneData> = new Map();

  private createTransformationHash(transformations: Record<number, Transformation>): string {
    const sorted = Object.keys(transformations)
      .sort()
      .map(key => {
        const t = transformations[parseInt(key)];
        return `${key}:${t.translation.join(',')},${t.rotation.join(',')},${t.scale.join(',')}`;
      })
      .join('|');
    return sorted;
  }

  private createVisibilityHash(visibilities: Record<number, boolean>): string {
    const sorted = Object.keys(visibilities)
      .sort()
      .map(key => `${key}:${visibilities[parseInt(key)]}`)
      .join('|');
    return sorted;
  }

  private createCacheKey(
    projectId: number,
    width: number,
    height: number,
    doubleSided: boolean,
    use360Shading: boolean,
    transformations: Record<number, Transformation>,
    visibilities: Record<number, boolean>
  ): { key: SceneCacheKey; keyString: string } {
    const transformationsHash = this.createTransformationHash(transformations);
    const visibilitiesHash = this.createVisibilityHash(visibilities);

    const key: SceneCacheKey = {
      projectId,
      width,
      height,
      doubleSided,
      use360Shading,
      transformationsHash,
      visibilitiesHash,
    };

    // Create a string representation for the Map key
    const keyString = JSON.stringify(key);

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

    // Extract actual transformation and visibility data for cache key
    const transformations: Record<number, Transformation> = {};
    const visibilities: Record<number, boolean> = {};

    // Collect all relevant transformations and visibilities for this project
    if (project.models) {
      for (const model of project.models) {
        const transformation = getTransformation(project.id, model.id);
        const visibility = getVisibility(project.id, model.id);

        if (transformation) {
          transformations[model.id] = transformation;
        }
        visibilities[model.id] = visibility;
      }
    }

    const { keyString } = this.createCacheKey(
      project.id,
      width,
      height,
      doubleSided,
      use360Shading,
      transformations,
      visibilities
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
      transformations,
      visibilities,
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
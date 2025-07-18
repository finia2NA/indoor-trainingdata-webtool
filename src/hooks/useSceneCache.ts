import { useCallback, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useLiveQuery } from 'dexie-react-hooks';
import { useParams } from 'react-router-dom';
import db, { Project } from "../data/db";
import { loadModel } from '../util/loadModel';
import useMultiTransformationStore from './useMultiTransformationStore';
import Transformation from '../data/Transformation';
import { get360s, Image360 } from '../util/get360s';

type SceneOptions = {
  width?: number;
  height?: number;
  doubleSided?: boolean;
  load360Images?: boolean;
};

type ImageData = {
  images360Data: Image360[];
  textureMap: Map<string, THREE.Texture>;
  metadataMap: Map<string, { x: number; y: number; z: number; course: number }>;
};

type SceneData = {
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  camera: THREE.PerspectiveCamera;
  offscreen: OffscreenCanvas;
  imageData: ImageData | null;
};

const setupScene = async (
  project: Project,
  getVisibility: (projectId: number, modelId: number) => boolean,
  getTransformation: (projectId: number, modelId: number) => Transformation | null,
  width: number,
  height: number,
  doubleSided: boolean = false,
  load360Images: boolean = false
): Promise<SceneData> => {

  if (!project) throw new Error('Model not found');
  if (!project.id) throw new Error('Model id not found');

  // first, basic setup: canvas, scene, renderer, lights, camera, etc
  const offscreen = new OffscreenCanvas(width, height);
  const renderer = new THREE.WebGLRenderer({ canvas: offscreen, preserveDrawingBuffer: true });
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x484848);
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  const ambientLight = new THREE.AmbientLight(0xffffff, 1);
  scene.add(ambientLight);

  // Load 360° images if requested
  let imageData: ImageData | null = null;
  
  if (load360Images) {
    try {
      const images360Data = await get360s(project, true);
      if (images360Data.length > 0) {
        const textureMap = new Map<string, THREE.Texture>();
        const textureLoader = new THREE.TextureLoader();
        
        for (const imageData360 of images360Data) {
          if (imageData360.image instanceof Blob) {
            const imageUrl = URL.createObjectURL(imageData360.image);
            const texture = await new Promise<THREE.Texture>((resolve, reject) => {
              textureLoader.load(
                imageUrl,
                (texture) => {
                  URL.revokeObjectURL(imageUrl);
                  resolve(texture);
                },
                undefined,
                (error) => {
                  URL.revokeObjectURL(imageUrl);
                  reject(error);
                }
              );
            });
            textureMap.set(imageData360.name, texture);
          }
        }

        const metadataMap = new Map(
          images360Data.map(img => [
            img.name, 
            { x: img.x, y: img.y, z: img.z, course: img.course }
          ])
        );

        imageData = { images360Data, textureMap, metadataMap };
      }
    } catch (error) {
      console.warn('Could not load 360° images:', error);
    }
  }

  // now, add all applicable models to the scene
  const models = project.models;
  if (!models) throw new Error('Models not found');
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
    
    // TODO: Apply 360° shading here if imageData is available
    // if (imageData) {
    //   loadedObject.traverse((child) => {
    //     if (child instanceof THREE.Mesh) {
    //       // Apply your custom shader material here
    //       // child.material = create360ShadedMaterial(child.material, imageData);
    //     }
    //   });
    // }
    
    loadedObject.position.set(transformation.translation[0], transformation.translation[1], transformation.translation[2]);
    loadedObject.setRotationFromEuler(new THREE.Euler(transformation.rotation[0], transformation.rotation[1], transformation.rotation[2]));
    loadedObject.scale.set(transformation.scale[0], transformation.scale[1], transformation.scale[2]);
    scene.add(loadedObject);
  }

  return { offscreen, renderer, scene, camera, imageData };
};

const useSceneCache = (options: SceneOptions = {}) => {
  const { id: projectId } = useParams();
  const { getTransformation, getVisibility } = useMultiTransformationStore();
  
  const {
    width = 512,
    height = 512,
    doubleSided = false,
    load360Images = true
  } = options;

  // Scene cache to avoid rebuilding
  const sceneCache = useRef<{
    projectId: number | null;
    scene: THREE.Scene | null;
    renderer: THREE.WebGLRenderer | null;
    camera: THREE.PerspectiveCamera | null;
    offscreen: OffscreenCanvas | null;
    imageData: ImageData | null;
    initialized?: boolean;
    cacheKey: string | null;
  }>({
    projectId: null,
    scene: null,
    renderer: null,
    camera: null,
    offscreen: null,
    imageData: null,
    initialized: false,
    cacheKey: null
  });

  const project = useLiveQuery<Project | null>(
    async () => {
      return (await db.projects.where('id').equals(Number(projectId)).first()) ?? null;
    },
    [projectId]
  );

  // Clear cache when project changes or when transformation/visibility functions change
  useEffect(() => {
    // Dispose of textures from scene cache to prevent memory leaks
    if (sceneCache.current.imageData?.textureMap) {
      sceneCache.current.imageData.textureMap.forEach(texture => texture.dispose());
    }
    
    sceneCache.current = {
      projectId: null,
      scene: null,
      renderer: null,
      camera: null,
      offscreen: null,
      imageData: null,
      initialized: false,
      cacheKey: null
    };
  }, [projectId, getTransformation, getVisibility]);

  // Get or create scene (for performance)
  const getSceneData = useCallback(async (): Promise<SceneData | null> => {
    if (!project || !project.id) {
      return null;
    }

    // Create a cache key based on options
    const cacheKey = `${width}x${height}-${doubleSided}-${load360Images}`;
    
    if (sceneCache.current.scene &&
        sceneCache.current.projectId === Number(projectId) &&
        sceneCache.current.cacheKey === cacheKey) {
      return {
        scene: sceneCache.current.scene,
        renderer: sceneCache.current.renderer!,
        camera: sceneCache.current.camera!,
        offscreen: sceneCache.current.offscreen!,
        imageData: sceneCache.current.imageData
      };
    }

    console.log('Creating new scene (not from cache)');
    const sceneData = await setupScene(
      project,
      getVisibility,
      getTransformation,
      width,
      height,
      doubleSided,
      load360Images
    );

    // Cache the scene
    sceneCache.current = {
      projectId: Number(projectId),
      scene: sceneData.scene,
      renderer: sceneData.renderer,
      camera: sceneData.camera,
      offscreen: sceneData.offscreen,
      imageData: sceneData.imageData,
      cacheKey
    };

    return sceneData;
  }, [project, projectId, getVisibility, getTransformation, width, height, doubleSided, load360Images]);

  return {
    getSceneData,
    project,
    sceneCache: sceneCache.current
  };
};

export default useSceneCache;
export type { SceneData, ImageData, SceneOptions };

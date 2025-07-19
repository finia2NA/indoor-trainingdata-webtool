import * as THREE from 'three';
import { Project } from "../../data/db";
import { loadModel } from '../../util/loadModel';
import Transformation from '../../data/Transformation';
import { useCallback, useEffect, useRef } from 'react';
import useMultiTransformationStore from '../state/useMultiTransformationStore';
import { get360s, Image360 } from '../../util/get360s';

const setupScene = async (
  project: Project,
  getVisibility: (projectId: number, modelId: number) => boolean,
  getTransformation: (projectId: number, modelId: number) => Transformation | null,
  width: number,
  height: number,
  doubleSided: boolean = false) => {

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
    loadedObject.position.set(transformation.translation[0], transformation.translation[1], transformation.translation[2]);
    loadedObject.setRotationFromEuler(new THREE.Euler(transformation.rotation[0], transformation.rotation[1], transformation.rotation[2]));
    loadedObject.scale.set(transformation.scale[0], transformation.scale[1], transformation.scale[2]);
    scene.add(loadedObject);
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

  if (!images360)
    return { offscreen, renderer, scene, camera, images360 };

  // At this point, we have images360 loaded
  return { offscreen, renderer, scene, camera, images360 };

}


const useScene = (project?: Project) => {
  // Get the data we need
  const projectId = project?.id ?? null;

  // Functions from other hooks
  const { getTransformation, getVisibility } = useMultiTransformationStore();


  // Cached scene data
  const sceneCache = useRef<{
    projectId: number | null;
    offscreen: OffscreenCanvas | null;
    scene: THREE.Scene | null;
    renderer: THREE.WebGLRenderer | null;
    camera: THREE.PerspectiveCamera | null;
    images360?: Image360[];
    initialized?: boolean;
  }>({
    projectId: null,
    offscreen: null,
    scene: null,
    renderer: null,
    camera: null,
    images360: [],
    initialized: false
  });

  // Clear cache when project changes or when transformation/visibility functions change
  useEffect(() => {
    sceneCache.current = {
      projectId: null,
      offscreen: null,
      scene: null,
      renderer: null,
      camera: null,
      images360: [],
      initialized: false
    };
  }, [projectId, getTransformation, getVisibility]);


  // Get or create scene (for performance)
  const getOrCreateScene = useCallback(async (width: number, height: number, doubleSided: boolean = false) => {
    if (sceneCache.current.scene &&
      sceneCache.current.projectId === Number(projectId) &&
      project?.id === sceneCache.current.projectId) {
      return {
        scene: sceneCache.current.scene,
        renderer: sceneCache.current.renderer!,
        camera: sceneCache.current.camera!,
        offscreen: sceneCache.current.offscreen!,
        images360: sceneCache.current.images360 || []
      };
    }

    console.log('Creating new scene (not from cache)');
    const sceneData = await setupScene(
      project!,
      getVisibility,
      getTransformation,
      width,
      height,
      doubleSided
    );

    // Cache the scene
    sceneCache.current = {
      projectId: Number(projectId),
      offscreen: sceneData.offscreen,
      scene: sceneData.scene,
      renderer: sceneData.renderer,
      camera: sceneData.camera
    };

    return sceneData;
  }, [project, projectId, getVisibility, getTransformation]);

  return { getOrCreateScene }

}
export default useScene;
import { useCallback, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useLiveQuery } from 'dexie-react-hooks';
import { useParams } from 'react-router-dom';
import db, { Project } from "../data/db";
import { Pose, ScreenShotResult } from './useDataGeneratorUtils';
import { loadModel } from '../utils/loadModel';
import { Id, toast } from 'react-toastify';
import { ProgressToast, ProgressType } from '../components/UI/Toasts';
import useMultiTransformationStore from './useMultiTransformationStore';
import Transformation from '../data/Transformation';

type takeScreenshotProps = {
  poses: Pose[];
  width: number;
  height: number;
}

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

  return { offscreen, renderer, scene, camera };
}


const useOffscreenThree = () => {
  const { id: projectId } = useParams();
  const progressToastId = useRef<null | Id>(null);
  const { getTransformation, getVisibility } = useMultiTransformationStore();

  // Scene cache to avoid rebuilding for each raycast
  const sceneCache = useRef<{
    projectId: number | null;
    scene: THREE.Scene | null;
    renderer: THREE.WebGLRenderer | null;
    camera: THREE.PerspectiveCamera | null;
    initialized?: boolean;
  }>({
    projectId: null,
    scene: null,
    renderer: null,
    camera: null,
    initialized: false
  });

  const project = useLiveQuery<Project | null>(
    async () => {
      return (await db.projects.where('id').equals(Number(projectId)).first()) ?? null;
    },
    [projectId]
  );


  // Clear cache when project changes or when transformation/visibility functions change
  useEffect(() => {
    sceneCache.current = {
      projectId: null,
      scene: null,
      renderer: null,
      camera: null,
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
        offscreen: null // Not needed for raycasting
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
      scene: sceneData.scene,
      renderer: sceneData.renderer,
      camera: sceneData.camera
    };

    return sceneData;
  }, [project, projectId, getVisibility, getTransformation]);

  const takeOffscreenScreenshots = useCallback(async ({ poses, width, height }: takeScreenshotProps) => {
    if (!project) throw new Error('Model not found');
    if (!project.id) throw new Error('Model id not found');
    if (!poses || poses.length === 0) throw new Error('Poses not given');

    // Init the toast ASAP so the user knows what's going on
    progressToastId.current = toast(ProgressToast, {
      progress: 0.00001, data: { progress: 0.00001, type: ProgressType.SCREENSHOT }, type: "info", onClose(reason) {
        if (reason === "stop") {
          doStop();
        }
      },
    });

    // build the scene
    const { offscreen, renderer, scene, camera } =
      await setupScene(project, getVisibility, getTransformation, width, height);

    // take the pictures.
    // we need to keep track of the progress, and also allow the user to stop the process
    let stop = false;
    const doStop = () => {
      stop = true;
    }

    const results: ScreenShotResult[] = [];
    for (let i = 0; i < poses.length; i++) {
      if (stop) break;
      const progress = (i + 1) / poses.length;


      if (progressToastId.current === null) {
        throw new Error('Screenshot toast was not initialized');
      } else {
        toast.update(progressToastId.current, { progress, data: { progress, type: ProgressType.SCREENSHOT } });
      }
      const pose = poses[i];
      camera.position.set(...pose.position.toArray());
      camera.fov = pose.fov;
      camera.updateProjectionMatrix();
      camera.lookAt(...pose.target.toArray());
      renderer.render(scene, camera);
      const blob = await offscreen.convertToBlob({ type: 'image/png' });
      results.push({
        blob,
        pose,
        width,
        height,
      });
    }

    if (!stop)
      toast("Screenshots complete", { type: "success" });
    else
      toast("Screenshots stopped", { type: "warning" });

    if (progressToastId.current !== null) {
      toast.dismiss(progressToastId.current);
      progressToastId.current = null;
    }

    return results;
  }, [getTransformation, getVisibility, project]);



  const doOffscreenRaycast = useCallback(async (start: THREE.Vector3, target: THREE.Vector3, limitDistance = true) => {
    if (!project) throw new Error('Model not found');
    if (!project.id) throw new Error('Model id not found');

    try {
      const { scene, renderer, camera } = await getOrCreateScene(512, 512, true);

      // Set up camera to ensure scene is properly initialized
      if (!sceneCache.current.initialized) {
        camera.position.copy(start);
        camera.lookAt(target);
        camera.updateProjectionMatrix();
        renderer.render(scene, camera);

        // Update matrices and compute bounding boxes only once
        scene.updateMatrixWorld(true);
        scene.traverse((object) => {
          if (object instanceof THREE.Mesh && !object.geometry.boundingBox) {
            object.geometry.computeBoundingBox();
          }
        });

        sceneCache.current.initialized = true;
      }

      // Perform the raycast
      const raycaster = new THREE.Raycaster();
      const direction = target.clone().sub(start).normalize();
      raycaster.set(start, direction);
      if (limitDistance) {
        raycaster.far = start.distanceTo(target);
      }

      const intersections = raycaster.intersectObjects(scene.children, true);
      return intersections;
    } catch (error) {
      console.error('Raycast error:', error);
      throw error;
    }
  }, [getOrCreateScene, project]);

  // Add a batch raycast function for even better performance when needed
  const doBatchOffscreenRaycast = useCallback(async (raycastRequests: { start: THREE.Vector3, target: THREE.Vector3 }[]) => {
    if (!project || raycastRequests.length === 0) return [];

    try {
      const { scene } = await getOrCreateScene(512, 512, true);

      const raycaster = new THREE.Raycaster();
      return raycastRequests.map(req => {
        const direction = req.target.clone().sub(req.start).normalize();
        raycaster.set(req.start, direction);
        raycaster.far = req.start.distanceTo(req.target);
        return raycaster.intersectObjects(scene.children, true);
      });
    } catch (error) {
      console.error('Batch raycast error:', error);
      throw error;
    }
  }, [getOrCreateScene, project]);

  return {
    takeOffscreenScreenshots,
    doOffscreenRaycast,
    doBatchOffscreenRaycast
  };
};

export default useOffscreenThree;

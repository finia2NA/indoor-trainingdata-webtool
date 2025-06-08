import { useCallback, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useLiveQuery } from 'dexie-react-hooks';
import { useParams } from 'react-router-dom';
import db, { Project } from "../data/db";
import { Pose, ScreenShotResult, PostTrainingPose } from './useDataGeneratorUtils';
import { loadModel } from '../util/loadModel';
import { Id, toast } from 'react-toastify';
import { ProgressToast, ProgressType } from '../components/UI/Toasts';
import useMultiTransformationStore from './useMultiTransformationStore';
import Transformation from '../data/Transformation';

type TakeScreenshotProps<T extends Pose> = {
  poses: T[];
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

  const takeOffscreenScreenshots = useCallback(async ({ poses, width, height }: TakeScreenshotProps<Pose>) => {
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

    const results: ScreenShotResult<Pose>[] = [];
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

    if (!stop) {
      console.log('Screenshots complete');
      toast("Screenshots complete", { type: "success" });
    }
    else {
      console.log('Screenshots stopped prematurely');
      toast("Screenshots stopped", { type: "warning" });
    }

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


  // --------------- 360 ------------------

  const createScene360 = async (w: number, h: number) => {
    const offscreen = new OffscreenCanvas(w, h);
    const renderer = new THREE.WebGLRenderer({ canvas: offscreen, preserveDrawingBuffer: true });
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);

    // Create sphere with material that can have its texture updated
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(5, 64, 64),
      new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })
    );
    scene.add(sphere);

    return { offscreen, scene, renderer, camera, sphere };
  };



  // 360° screenshot function moved from offscreen360.ts
  const take360Screenshots = useCallback(async ({ poses: ptPoses, width, height }: TakeScreenshotProps<PostTrainingPose>): Promise<ScreenShotResult<PostTrainingPose>[]> => {
    if (!project || !project.id) throw new Error('Project not found');

    // Init the toast ASAP so the user knows what's going on
    progressToastId.current = toast(ProgressToast, {
      progress: 0.00001, data: { progress: 0.00001, type: ProgressType.POSTTRAININGSCREENSHOT }, type: "info", onClose(reason) {
        if (reason === "stop") {
          doStop();
        }
      },
    });

    // --------- VALIDATION ---------
    const images360 = await db.getImages360(project.id);
    const metadataFile = await db.getMetadataFile(project.id);

    if (!images360.length) {
      throw new Error('No images360 found');
    }

    // Parse metadata file content
    const metadataText = await metadataFile?.content.text();
    if (!metadataText) {
      throw new Error('No metadata file found');
    }
    const metadata = JSON.parse(metadataText) as { name: string; x: number; y: number; z: number; course: number }[];

    // Create a map of image names to their content for quick lookup
    const imageMap = new Map(images360.map(img => [img.name, img.content]));

    // Validate that each pose has a corresponding image and metadata entry
    for (const pose of ptPoses) {
      if (!pose.imageName) {
        throw new Error(`Pose ${pose.series} has no imageName`);
      }

      // Check if image exists
      if (!imageMap.has(pose.imageName)) {
        throw new Error(`Image ${pose.imageName} not found in images360`);
      }

      // Check if position exists in metadata
      const position = metadata.find(p => p.name === pose.imageName);
      if (!position) {
        throw new Error(`Position for image ${pose.imageName} not found in metadata`);
      }
    }

    // --------- TAKING SCREENSHOTS ---------

    const textureLoader = new THREE.TextureLoader();
    const textures = new Map<string, THREE.Texture>(); // Let's cache textures to avoid reloading them
    const results: ScreenShotResult<PostTrainingPose>[] = [];

    const { offscreen, scene, renderer, camera, sphere } = await createScene360(width, height);

    // Add stop functionality
    let stop = false;
    const doStop = () => {
      stop = true;
    }

    for (const pose of ptPoses) {
      if (stop) break;
      const progress = (results.length + 1) / ptPoses.length;

      if (progressToastId.current === null) {
        throw new Error('Screenshot toast was not initialized');
      } else {
        toast.update(progressToastId.current, { progress, data: { progress, type: ProgressType.POSTTRAININGSCREENSHOT } });
      }

      // Load the corresponding 360° image for this pose if not already loaded
      if (!textures.has(pose.imageName)) {
        const imageBlob = imageMap.get(pose.imageName);
        if (!imageBlob) {
          throw new Error(`Image blob for ${pose.imageName} not found`);
        }
        // Create URL from blob and load as texture
        const imageUrl = URL.createObjectURL(imageBlob);
        const texture = await new Promise<THREE.Texture>((resolve, reject) => {
          textureLoader.load(
            imageUrl,
            (texture) => {
              URL.revokeObjectURL(imageUrl); // Clean up URL
              resolve(texture);
            },
            undefined,
            (error) => {
              URL.revokeObjectURL(imageUrl); // Clean up URL even on error
              reject(error);
            }
          );
        });

        textures.set(pose.imageName, texture);
      }

      const texture = textures.get(pose.imageName);
      if (!texture) {
        throw new Error(`Texture for ${pose.imageName} not found`);
      }
      sphere.material.map = texture;
      sphere.material.needsUpdate = true;

      // Get the course value from metadata and rotate the sphere
      const position = metadata.find(p => p.name === pose.imageName);
      if (!position) {
        throw new Error(`Position for image ${pose.imageName} not found in metadata`);
      }
      sphere.rotation.y = THREE.MathUtils.degToRad(position.course);

      // Set camera properties
      camera.fov = pose.fov;
      camera.updateProjectionMatrix();

      // The camera stays at 0, so we need to translate the target.
      const translatedTarget = pose.target.clone().sub(pose.position);
      camera.lookAt(translatedTarget);

      renderer.render(scene, camera);
      const blob = await offscreen.convertToBlob({ type: 'image/png' });
      results.push({
        blob,
        pose,
        width,
        height,
      });
    }

    if (!stop) {
      console.log('Screenshots complete');
      toast("Screenshots complete", { type: "success" });
    }
    else {
      console.log('Screenshots stopped prematurely');
      toast("Screenshots stopped", { type: "warning" });
    }

    if (progressToastId.current !== null) {
      toast.dismiss(progressToastId.current);
      progressToastId.current = null;
    }

    return results;
  }, [project]);

  return {
    takeOffscreenScreenshots,
    doOffscreenRaycast,
    doBatchOffscreenRaycast,
    take360Screenshots
  };
};

export default useOffscreenThree;

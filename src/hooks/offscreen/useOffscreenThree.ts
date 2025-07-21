import { useCallback, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useLiveQuery } from 'dexie-react-hooks';
import { useParams } from 'react-router-dom';
import db, { Project } from "../../data/db";
import { Pose, ScreenShotResult, PostTrainingPose } from './useDataGeneratorUtils';
import { Id, toast } from 'react-toastify';
import { ProgressToast, ProgressType } from '../../components/UI/Toasts';
import useMultiTransformationStore from '../state/useMultiTransformationStore';
import { get360s, Image360 } from '../../util/get360s';
import useScene from './useScene';
import Renderer from 'three/examples/jsm/renderers/common/Renderer.js';
import { createPostMaterial, setUniforms } from './shading';

type TakeScreenshotProps<T extends Pose> = {
  poses: T[];
  width: number;
  height: number;
  use360Shading?: boolean;
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


  const { getOrCreateScene } = useScene(project ?? undefined);

  async function takeNormalScreenshot(pose: Pose, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer, results: ScreenShotResult<Pose>[], scene: THREE.Scene, offscreen: OffscreenCanvas, width: number, height: number) {
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

  async function takeShadedScreenshot(pose: Pose, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer, results: ScreenShotResult<Pose>[], scene: THREE.Scene, offscreen: OffscreenCanvas, width: number, height: number, images360: Image360[]) {
    camera.position.set(...pose.position.toArray());
    camera.fov = pose.fov;
    camera.updateProjectionMatrix();
    camera.lookAt(...pose.target.toArray());

    // remove the ambient light from the scene
    const ambientLight = scene.getObjectByName('ambientLight');
    if (ambientLight) {
      scene.remove(ambientLight);
    }

    // Turn on casting and receiving shadows on the meshes
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });

    // Find the 5 closest images360 to the pose
    const closestImages = images360
      .map(image => ({
        image,
        distance: pose.position.distanceTo(new THREE.Vector3(image.x, image.y, image.z))
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);

    // Init a point light
    const pointLight = new THREE.PointLight(0xffffff, 1.5);
    pointLight.castShadow = true;
    pointLight.shadow.mapSize.width = 1024;
    pointLight.shadow.mapSize.height = 1024;
    pointLight.shadow.camera.near = 0.5;
    pointLight.shadow.camera.far = 50;
    // pointLight.shadow.bias = -0.01;

    // Init render pass array
    const renderTargets: THREE.WebGLRenderTarget[] = [];

    // Go through the closest images
    for (const closest of closestImages) {
      if (!closest.image.image) {
        throw new Error(`Image ${closest.image.name} had not texture loaded`);
      }

      // Set the point light position to the image position
      pointLight.position.set(closest.image.x, closest.image.y, closest.image.z);
      // Apply the uniforms to the objects in the scene
      setUniforms(scene, closest.image);

      // Create a render pass with the point light and the sphere map
      const target = new THREE.WebGLRenderTarget(width, height);
      renderer.setRenderTarget(target);
      renderer.clear();
      renderer.render(scene, camera);

      renderTargets.push(target);
    }

    // restore the scene
    if (ambientLight) {
      scene.add(ambientLight);
    }
    scene.remove(pointLight);


    // Combination shader
    // First, create the postScene
    const postScene = new THREE.Scene();
    const postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const quadGeom = new THREE.PlaneGeometry(2, 2);
    // create composite shader material
    const postMaterial = createPostMaterial(renderTargets);
    const quad = new THREE.Mesh(quadGeom, postMaterial);
    postScene.add(quad);

    // Render it
    renderer.setRenderTarget(null); // Render to default framebuffer
    renderer.clear();
    renderer.render(postScene, postCamera);

    const blob = await offscreen.convertToBlob({ type: 'image/png' });
    results.push({
      blob,
      pose,
      width,
      height,
    });
  }

  const takeOffscreenScreenshots = useCallback(async ({ poses, width, height, use360Shading }: TakeScreenshotProps<Pose>) => {
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
    const { offscreen, renderer, scene, camera, images360 } =
      await getOrCreateScene({ width, height, doubleSided: true, use360Shading });

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
      if (use360Shading && images360 && images360.length > 0) {
        await takeShadedScreenshot(poses[i], camera, renderer, results, scene, offscreen, width, height, images360);
      } else {
        await takeNormalScreenshot(poses[i], camera, renderer, results, scene, offscreen, width, height);
      }
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
      const { scene, renderer, camera } = await getOrCreateScene({ width: 512, height: 512, doubleSided: true });

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
      const { scene } = await getOrCreateScene({ width: 512, height: 512, doubleSided: true });

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

    if (!ptPoses || ptPoses.length === 0) {
      console.warn('No poses provided for 360° screenshots');
      return [];
    }

    // Init the toast ASAP so the user knows what's going on
    progressToastId.current = toast(ProgressToast, {
      progress: 0.00001, data: { progress: 0.00001, type: ProgressType.POSTTRAININGSCREENSHOT }, type: "info", onClose(reason) {
        if (reason === "stop") {
          doStop();
        }
      },
    });

    // --------- VALIDATION ---------
    const images360 = await get360s(project, true);
    if (!images360 || images360.length === 0) {
      throw new Error('No 360° images found in project metadata');
    }
    const images360Map = new Map(images360.map(img => [img.name, img]));

    // Validate that each pose has a corresponding image with texture loaded
    for (const pose of ptPoses) {
      if (!pose.imageName) {
        throw new Error(`Pose ${pose.series} has no imageName`);
      }

      const imageData = images360Map.get(pose.imageName);
      if (!imageData) {
        throw new Error(`Image ${pose.imageName} not found in images360`);
      }

      if (!imageData.image) {
        throw new Error(`Texture for image ${pose.imageName} not loaded`);
      }
    }

    // --------- TAKING SCREENSHOTS ---------

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

      // Get the image data (texture and position are already loaded)
      const imageData = images360Map.get(pose.imageName);
      if (!imageData || !imageData.image) {
        throw new Error(`Image data or texture for ${pose.imageName} not found`);
      }

      // Set the texture on the sphere
      sphere.material.map = imageData.image;
      sphere.material.needsUpdate = true;

      // Rotate the sphere based on course value
      sphere.rotation.y = THREE.MathUtils.degToRad(imageData.course);

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


    // Clean up
    renderer.dispose();
    sphere.geometry.dispose();
    sphere.material.dispose();

    for (const imageData of images360) {
      if (imageData.image) {
        imageData.image.dispose();
      }
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

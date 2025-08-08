import { useCallback, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useLiveQuery } from 'dexie-react-hooks';
import { useParams } from 'react-router-dom';
import db, { Project } from "../../data/db";
import { Pose, ScreenShotResult, PostTrainingPose } from './useDataGeneratorUtils';
import { Id, toast } from 'react-toastify';
import { ProgressToast, ProgressType } from '../../components/UI/Toasts';
import useMultiTransformationStore from '../state/useMultiTransformationStore';
import useMultiGenerationStore from '../state/useMultiGenerationStore';
import useDebugStore from '../state/useDebugStore';
import { get360s } from '../../util/get360s';
import useScene from './useScene';

const DEBUG_RENDERTARGETS = true; // Set to true to enable render target downloads for debugging

// Post-processing material for combining multiple render targets
function createPostMaterial(renderTargets: THREE.WebGLRenderTarget[]) {
  // Build the fragment shader with dynamic texture sampling
  const fragmentShader = `
    varying vec2 vUv;
    ${renderTargets.map((_, i) => `uniform sampler2D uTexture${i};`).join('\n    ')}
    
    void main() {
      vec3 weightedSum = vec3(0.0);
      float totalWeight = 0.0;

      ${renderTargets.map((_, i) => `
      vec4 sample${i} = texture2D(uTexture${i}, vUv);
      weightedSum += sample${i}.rgb * sample${i}.a;  // Weight color by alpha
      totalWeight += sample${i}.a;`).join('')}

      vec3 finalColor = totalWeight > 0.0 ? weightedSum / totalWeight : vec3(0.0);
      float finalAlpha = totalWeight > 0.0 ? 1.0 : 0.0;
      
      gl_FragColor = vec4(finalColor, finalAlpha);
    }
  `;

  const vertexShader = `
    varying vec2 vUv;
    
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `;

  // Create uniforms for each texture
  const uniforms: Record<string, { value: THREE.Texture }> = {};
  renderTargets.forEach((rt, i) => {
    uniforms[`uTexture${i}`] = { value: rt.texture };
  });

  return new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    transparent: true
  });
}

type TakeScreenshotProps<T extends Pose> = {
  poses: T[];
  width: number;
  height: number;
}

// Function to download a render target as an image file
const downloadRenderTarget = (renderer: THREE.WebGLRenderer, renderTarget: THREE.WebGLRenderTarget, filename: string) => {
  // Create a canvas to read the render target data
  const canvas = document.createElement('canvas');
  canvas.width = renderTarget.width;
  canvas.height = renderTarget.height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    console.error('Could not get canvas context for render target download');
    return;
  }

  // Read pixels from the render target
  const pixels = new Uint8Array(renderTarget.width * renderTarget.height * 4);
  renderer.setRenderTarget(renderTarget);
  renderer.readRenderTargetPixels(renderTarget, 0, 0, renderTarget.width, renderTarget.height, pixels);

  // Create ImageData and put it on canvas
  const imageData = new ImageData(new Uint8ClampedArray(pixels), renderTarget.width, renderTarget.height);

  // Flip the image vertically (WebGL renders upside down)
  const flippedCanvas = document.createElement('canvas');
  flippedCanvas.width = canvas.width;
  flippedCanvas.height = canvas.height;
  const flippedCtx = flippedCanvas.getContext('2d');

  if (!flippedCtx) {
    console.error('Could not get flipped canvas context');
    return;
  }

  ctx.putImageData(imageData, 0, 0);
  flippedCtx.scale(1, -1);
  flippedCtx.translate(0, -flippedCanvas.height);
  flippedCtx.drawImage(canvas, 0, 0);

  // Download the image
  flippedCanvas.toBlob((blob) => {
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, 'image/png');

  // Reset render target
  renderer.setRenderTarget(null);
};

const useOffscreenThree = () => {
  const { id: projectId } = useParams();
  const progressToastId = useRef<null | Id>(null);
  const { getTransformation, getVisibility } = useMultiTransformationStore();
  const { getUse360Shading, getMaxShadingImages, getMaxShadingDistance } = useMultiGenerationStore();
  const { renderScreenshotsFromAbove } = useDebugStore();

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

  const takeOffscreenScreenshotsAmbient = useCallback(async ({ poses, width, height }: TakeScreenshotProps<Pose>) => {
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
      await getOrCreateScene({ width, height, doubleSided: false });

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

  const takeOffscreenScreenshotsShaded = useCallback(async ({ poses, width, height }: TakeScreenshotProps<Pose>) => {
    if (!project) throw new Error('Model not found');
    if (!project.id) throw new Error('Model id not found');
    if (!poses || poses.length === 0) throw new Error('Poses not given');

    const projectIdNum = Number(projectId);
    const maxShadingImages = getMaxShadingImages(projectIdNum);
    const maxShadingDistance = getMaxShadingDistance(projectIdNum);

    // Load 360° images with positions
    const images360 = await get360s(project, true);
    if (!images360 || images360.length === 0) {
      throw new Error('No 360° images found for shading');
    }

    // Init the toast ASAP so the user knows what's going on
    progressToastId.current = toast(ProgressToast, {
      progress: 0.00001, data: { progress: 0.00001, type: ProgressType.SCREENSHOT }, type: "info", onClose(reason) {
        if (reason === "stop") {
          doStop();
        }
      },
    });

    // build the scene with 360° shading enabled
    const { offscreen, renderer, scene, camera } =
      await getOrCreateScene({ width, height, doubleSided: false, use360Shading: true });

    // Set up post-processing scene outside the loop
    const postScene = new THREE.Scene();
    const postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const quadGeom = new THREE.PlaneGeometry(2, 2);

    // take the pictures.
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

      // Find closest 360° images for this pose
      const imagesWithDistances = images360.map(img => ({
        image: img,
        distance: pose.position.distanceTo(new THREE.Vector3(img.x, img.y, img.z))
      }));

      // Filter by max distance and sort by distance
      const nearbyImages = imagesWithDistances
        .filter(item => item.distance <= maxShadingDistance)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, maxShadingImages);

      // Create point lights at selected 360° image positions
      const lightContainers = nearbyImages.map(imageAndDistance => {
        const light = new THREE.PointLight(0xffffff, 1, 0);
        light.intensity = 5;
        light.decay = 0;
        light.distance = 0;
        light.castShadow = true;
        light.position.set(imageAndDistance.image.x, imageAndDistance.image.y, imageAndDistance.image.z);
        light.shadow.mapSize.width = 2048;
        light.shadow.mapSize.height = 2048;
        scene.add(light);
        return { light, imgWithDistance: imageAndDistance };
      });

      // Set up camera and render
      if (renderScreenshotsFromAbove) {
        // Debug mode: render from above with fixed position and rotation
        camera.position.set(0, 70, 0);
        camera.rotation.set(-Math.PI / 2, 0, 0); // -90 degrees in X axis
        camera.fov = pose.fov;
        camera.updateProjectionMatrix();
      } else {
        // Normal mode: use pose position and target
        camera.position.set(...pose.position.toArray());
        camera.fov = pose.fov;
        camera.updateProjectionMatrix();
        camera.lookAt(...pose.target.toArray());
      }


      // ----------------------------------------
      // THIS IS WHERE THE FUN BEGINS

      // Create fresh render targets for this pose
      const renderTargets: THREE.WebGLRenderTarget[] = [];
      for (let j = 0; j < lightContainers.length; j++) {
        const renderTarget = new THREE.WebGLRenderTarget(width, height, {
          format: THREE.RGBAFormat,
          type: THREE.UnsignedByteType,
          depthBuffer: true,
          stencilBuffer: false,
        });
        renderTargets.push(renderTarget);
      }

      // Create post-processing material for this pose's render targets
      const postMaterial = createPostMaterial(renderTargets);
      const quad = new THREE.Mesh(quadGeom, postMaterial);
      postScene.add(quad);

      // Fill each render target with the render with the point light
      for (let j = 0; j < lightContainers.length; j++) {
        const container = lightContainers[j];

        // deactivate all point lights
        lightContainers.forEach(container => container.light.visible = false);
        // activate the current point light
        container.light.visible = true;

        // Update uniforms for 360° shading materials
        scene.traverse((child) => {
          if (child instanceof THREE.Mesh && (child.material as any).uniforms) {
            const material = child.material as any;
            // Set sphere map from the 360° image texture
            material.uniforms.sphereMap.value = container.imgWithDistance.image.texture;
            // Set light position as vec4 (x, y, z, course)
            material.uniforms.lightPos.value.set(
              container.imgWithDistance.image.x,
              container.imgWithDistance.image.y,
              container.imgWithDistance.image.z,
              container.imgWithDistance.image.course
            );
          }
        });

        // Render the scene with the current point light
        renderer.setRenderTarget(renderTargets[j]);
        renderer.clear();
        renderer.render(scene, camera);

        // Download the render target for debugging
        if (DEBUG_RENDERTARGETS) {
          downloadRenderTarget(renderer, renderTargets[j], `pose_${i}_light_${j}.png`);
        }
      }

      // Update post-processing material uniforms with current render targets
      for (let j = 0; j < lightContainers.length; j++) {
        const uniformName = `uTexture${j}`;
        (postMaterial as any).uniforms[uniformName].value = renderTargets[j].texture;
      }

      // Composite output via fullscreen quad
      renderer.setRenderTarget(null);
      renderer.clear();
      renderer.render(postScene, postCamera);

      // Clean up render targets and post-processing quad for this pose
      renderTargets.forEach(rt => rt.dispose());
      postScene.remove(quad);
      postMaterial.dispose();
      // ----------------------------------------

      // Clean up point lights after rendering this pose
      lightContainers.forEach(container => {
        scene.remove(container.light);
        // Clean up shadow map if it exists
        if (container.light.shadow && container.light.shadow.map) {
          container.light.shadow.map.dispose();
        }
      });

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

    // Clean up post-processing scene and geometry
    quadGeom.dispose();

    return results;
  }, [getTransformation, getVisibility, project, projectId, getMaxShadingImages, getMaxShadingDistance, renderScreenshotsFromAbove]);

  // Wrapper function that routes to the appropriate implementation
  const takeOffscreenScreenshots = useCallback(async (props: TakeScreenshotProps<Pose>) => {
    const projectIdNum = Number(projectId);
    const use360Shading = getUse360Shading(projectIdNum);

    if (use360Shading) {
      return takeOffscreenScreenshotsShaded(props);
    } else {
      return takeOffscreenScreenshotsAmbient(props);
    }
  }, [projectId, getUse360Shading, takeOffscreenScreenshotsShaded, takeOffscreenScreenshotsAmbient]);

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

      if (!imageData.texture) {
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

    for (const [index, pose] of ptPoses.entries()) {
      if (stop) break;

      const progress = (results.length + 1) / ptPoses.length;

      if (progressToastId.current === null) {
        throw new Error('Screenshot toast was not initialized');
      } else {
        toast.update(progressToastId.current, { progress, data: { progress, type: ProgressType.POSTTRAININGSCREENSHOT } });
      }

      // Get the image data (texture and position are already loaded)
      const imageData = images360Map.get(pose.imageName);
      if (!imageData || !imageData.texture) {
        throw new Error(`Image data or texture for ${pose.imageName} not found`);
      }

      // Set the texture on the sphere
      sphere.material.map = imageData.texture;
      sphere.material.needsUpdate = true;

      // Rotate the sphere based on course value
      sphere.rotation.y = THREE.MathUtils.degToRad(imageData.course);

      // Set camera properties
      camera.fov = pose.fov;
      camera.updateProjectionMatrix();

      // The camera stays at 0, so we need to translate the target.
      const translatedTarget = pose.target.clone().sub(pose.position);
      camera.lookAt(translatedTarget);

      // For the first pose (index 0), do a warm-up render that we discard
      if (index === 0) {
        renderer.render(scene, camera);
        await offscreen.convertToBlob({ type: 'image/png' }); // Discard this blob
      }

      // Now do the actual render that we keep
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
      if (imageData.texture) {
        imageData.texture.dispose();
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

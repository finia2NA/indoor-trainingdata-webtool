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
import { sceneCache as globalSceneCache } from './sceneCache';

const DO_CLEANUP = false;
const DEBUG_RENDERTARGETS = true; // Set to true to enable render target downloads for debugging


// Post-processing material for combining multiple render targets
/*
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
*/

// Post-processing material for combining multiple render targets with influence-based weighting
function createPostMaterial(renderTargets: THREE.WebGLRenderTarget[], maxImagesToKeep: number, weightingMode: string, polynomialExponent: number, exponentialBase: number, polynomialMultiplier: number, exponentialMultiplier: number) {
  // Build the fragment shader with dynamic texture sampling
  const fragmentShader = `
    varying vec2 vUv;
    ${renderTargets.map((_, i) => `uniform sampler2D uTexture${i};`).join('\n    ')}
    
    void main() {
      // First pass: decode all samples and collect valid ones with influence
      vec3 colors[${renderTargets.length}];
      float influences[${renderTargets.length}];
      bool validSamples[${renderTargets.length}];
      int numValid = 0;
      
      ${renderTargets.map((_, i) => `
      vec4 sample${i} = texture2D(uTexture${i}, vUv);
      if (sample${i}.a > 0.1) {
        // Decode influence from red channel
        int packedValue = int(sample${i}.r * 65535.0 + 0.5);
        int influenceInt = packedValue & 255;
        influences[${i}] = clamp(float(influenceInt) / 255.0, 0.0, 1.0);
        
        // Decode color from all RGB channels
        colors[${i}].r = float((int(sample${i}.r * 65535.0 + 0.5) >> 8) & 255) / 255.0;
        colors[${i}].g = float((int(sample${i}.g * 65535.0 + 0.5) >> 8) & 255) / 255.0;
        colors[${i}].b = float((int(sample${i}.b * 65535.0 + 0.5) >> 8) & 255) / 255.0;
        
        // Only consider samples with non-zero influence for outlier rejection
        if (influences[${i}] > 0.0) {
          validSamples[${i}] = true;
          numValid++;
        } else {
          validSamples[${i}] = false;
        }
      } else {
        validSamples[${i}] = false;
        influences[${i}] = 0.0;
      }`).join('')}
      
      // Apply outlier rejection to keep only the best images
      if (numValid > ${maxImagesToKeep}) {
        int numToKeep = ${maxImagesToKeep};
        int numToReject = numValid - numToKeep;
        
        // Calculate total distances for each valid sample
        float totalDistances[${renderTargets.length}];
        for (int i = 0; i < ${renderTargets.length}; i++) {
          totalDistances[i] = 0.0;
          if (validSamples[i]) {
            for (int j = 0; j < ${renderTargets.length}; j++) {
              if (validSamples[j] && i != j) {
                vec3 diff = colors[i] - colors[j];
                float dist = length(diff);
                totalDistances[i] += dist;
              }
            }
          } else {
            totalDistances[i] = 999999.0; // Mark invalid samples with high distance
          }
        }
        
        // Simple selection sort to find samples with smallest distances
        // Mark the numToReject samples with highest distances as invalid
        for (int reject = 0; reject < numToReject; reject++) {
          int maxIdx = -1;
          float maxDist = -1.0;
          for (int i = 0; i < ${renderTargets.length}; i++) {
            if (validSamples[i] && totalDistances[i] > maxDist) {
              maxDist = totalDistances[i];
              maxIdx = i;
            }
          }
          if (maxIdx >= 0) {
            validSamples[maxIdx] = false; // Reject this outlier
          }
        }
      }
      
      // Final weighted averaging using remaining valid samples
      vec3 weightedSum = vec3(0.0);
      float totalWeight = 0.0;
      
      for (int i = 0; i < ${renderTargets.length}; i++) {
        if (validSamples[i]) {
          // Apply weighting function to influence
          float weight = influences[i];
          ${weightingMode === 'polynomial' ? `
          weight = pow(weight, ${polynomialExponent.toFixed(1)}) * ${polynomialMultiplier.toFixed(1)};
          ` : weightingMode === 'exponential' ? `
          weight = (pow(${exponentialBase.toFixed(1)}, weight) - 1.0) * ${exponentialMultiplier.toFixed(1)};
          ` : `
          // Linear weighting (no transformation needed)
          `}
          
          weightedSum += colors[i] * weight;
          totalWeight += weight;
        }
      }
      
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
  const ctx = canvas.getContext('2d', { alpha: true });

  if (!ctx) {
    console.error('Could not get canvas context for render target download');
    return;
  }

  // Read pixels from the render target (assuming FloatType)
  const pixels = new Float32Array(renderTarget.width * renderTarget.height * 4);
  renderer.setRenderTarget(renderTarget);
  renderer.readRenderTargetPixels(renderTarget, 0, 0, renderTarget.width, renderTarget.height, pixels);

  // Test influence encoding - check if pixels have influence data encoded
  let pixelsWithInfluence = 0;
  let pixelsWithoutInfluence = 0;
  let maxInfluenceError = 0;
  let maxColorError = 0;
  let pixelsWithCleanEncoding = 0;
  let pixelsWithFractionalBits = 0;
  let maxFractionalError = 0;
  
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const alpha = pixels[i + 3];
    
    // Skip transparent pixels (no data)
    if (alpha < 0.1) continue;
    
    // Check if encoded values are clean integers (no fractional bits)
    const channels = [r, g, b];
    let hasCleanEncoding = true;
    let maxChannelFractionalError = 0;
    
    // Debug: log first few pixels to see what we're getting
    if (i < 20) {
      console.log(`Pixel ${i/4}: R=${r.toFixed(6)}, G=${g.toFixed(6)}, B=${b.toFixed(6)}, A=${alpha.toFixed(6)}`);
      console.log(`  Scaled: R=${(r*65535).toFixed(6)}, G=${(g*65535).toFixed(6)}, B=${(b*65535).toFixed(6)}`);
    }
    
    for (let c = 0; c < 3; c++) {
      const scaledValue = channels[c] * 65535.0;
      const fractionalPart = scaledValue - Math.floor(scaledValue);
      maxChannelFractionalError = Math.max(maxChannelFractionalError, fractionalPart);
      
      if (fractionalPart > 0.0001) { // Allow tiny floating point errors
        hasCleanEncoding = false;
      }
    }
    
    if (hasCleanEncoding) {
      pixelsWithCleanEncoding++;
    } else {
      pixelsWithFractionalBits++;
      maxFractionalError = Math.max(maxFractionalError, maxChannelFractionalError);
    }
    
    // Decode influence from each RGB channel (should be identical)
    let hasInfluence = false;
    let influenceValues = [];
    let colorValues = [];
    
    for (let c = 0; c < 3; c++) {
      const packedValue = Math.round(channels[c] * 65535.0);
      const colorInt = (packedValue >> 8) & 0xFF; // High 8 bits
      const influenceInt = packedValue & 0xFF;    // Low 8 bits
      
      const decodedColor = colorInt / 255.0;
      const decodedInfluence = influenceInt / 255.0;
      
      influenceValues.push(decodedInfluence);
      colorValues.push(decodedColor);
      
      if (decodedInfluence < 0.99) { // Non-full influence
        hasInfluence = true;
      }
    }
    
    if (hasInfluence) {
      pixelsWithInfluence++;
      
      // Check encoding accuracy - influence should be identical across RGB channels
      const minInfluence = Math.min(...influenceValues);
      const maxInfluence = Math.max(...influenceValues);
      const influenceError = maxInfluence - minInfluence;
      maxInfluenceError = Math.max(maxInfluenceError, influenceError);
      
      // Check color encoding accuracy (less critical but good to verify)
      const minColor = Math.min(...colorValues);
      const maxColor = Math.max(...colorValues);
      const colorError = maxColor - minColor;
      maxColorError = Math.max(maxColorError, colorError);
    } else {
      pixelsWithoutInfluence++;
    }
  }
  
  console.log(`Influence encoding analysis for ${filename}:`);
  console.log(`  Total non-transparent pixels: ${pixelsWithInfluence + pixelsWithoutInfluence}`);
  console.log(`  Pixels with clean integer encoding: ${pixelsWithCleanEncoding} (${(pixelsWithCleanEncoding/(pixelsWithInfluence + pixelsWithoutInfluence)*100).toFixed(1)}%)`);
  console.log(`  Pixels with fractional bits: ${pixelsWithFractionalBits} (${(pixelsWithFractionalBits/(pixelsWithInfluence + pixelsWithoutInfluence)*100).toFixed(1)}%)`);
  console.log(`  Max fractional error: ${maxFractionalError.toFixed(6)}`);
  console.log(`  Pixels with variable influence: ${pixelsWithInfluence} (${(pixelsWithInfluence/(pixelsWithInfluence + pixelsWithoutInfluence)*100).toFixed(1)}%)`);
  console.log(`  Pixels with full influence: ${pixelsWithoutInfluence} (${(pixelsWithoutInfluence/(pixelsWithInfluence + pixelsWithoutInfluence)*100).toFixed(1)}%)`);
  console.log(`  Max influence encoding error: ${(maxInfluenceError * 255).toFixed(2)}/255`);
  console.log(`  Max color encoding error: ${(maxColorError * 255).toFixed(2)}/255`);
  
  if (pixelsWithFractionalBits > 0) {
    console.warn(`⚠️  Found ${pixelsWithFractionalBits} pixels with fractional bits - encoding may have precision issues!`);
    console.warn(`⚠️  Max fractional error: ${maxFractionalError.toFixed(6)}`);
  } else {
    console.log(`✅ All pixels have clean integer encoding - no fractional bits detected`);
  }
  
  if (pixelsWithInfluence === 0) {
    console.warn(`⚠️  No pixels with variable influence found in ${filename} - encoding may not be working correctly!`);
  } else {
    console.log(`✅ Influence encoding working - found ${pixelsWithInfluence} pixels with variable influence`);
  }
  
  if (maxInfluenceError > 0.004) { // More than 1/255 difference
    console.warn(`⚠️  High influence encoding error: ${(maxInfluenceError * 255).toFixed(2)}/255`);
  } else {
    console.log(`✅ Influence encoding accuracy good - max error: ${(maxInfluenceError * 255).toFixed(2)}/255`);
  }

  // Create ImageData and put it on canvas
  // Convert float values (0.0-1.0) to byte values (0-255) for ImageData
  const bytePixels = new Uint8ClampedArray(pixels.length);
  for (let i = 0; i < pixels.length; i++) {
    bytePixels[i] = Math.round(pixels[i] * 255);
  }
  const imageData = new ImageData(bytePixels, renderTarget.width, renderTarget.height);

  // Flip the image vertically (WebGL renders upside down)
  const flippedCanvas = document.createElement('canvas');
  flippedCanvas.width = canvas.width;
  flippedCanvas.height = canvas.height;
  const flippedCtx = flippedCanvas.getContext('2d', { alpha: true });

  if (!flippedCtx) {
    console.error('Could not get flipped canvas context');
    return;
  }

  // Ensure canvas contexts preserve alpha
  ctx.putImageData(imageData, 0, 0);
  
  // Don't fill with any background color - preserve transparency
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

const applyTransformationToPosition = (position: THREE.Vector3, transformation: any) => {
  if (!transformation) return position.clone();

  // Create transformation matrix
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(...transformation.rotation)
  );
  matrix.compose(
    new THREE.Vector3(...transformation.translation),
    quaternion,
    new THREE.Vector3(...transformation.scale)
  );

  // Apply transformation to the position
  return position.clone().applyMatrix4(matrix);
}

const useOffscreenThree = () => {
  const { id: projectId } = useParams();
  const progressToastId = useRef<null | Id>(null);
  const { getTransformation, getVisibility, getCourseCorrection } = useMultiTransformationStore();
  const { getUse360Shading, getMaxShadingImages, getMaxShadingDistance, getPitchAngleRange, getMaxImagesToKeep, getWeightingMode, getPolynomialExponent, getExponentialBase, getInfluenceRange, getPolynomialMultiplier, getExponentialMultiplier } = useMultiGenerationStore();
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
    const pitchAngleRange = getPitchAngleRange(projectIdNum);

    // Get the 360s transformation
    const transformation = getTransformation(projectIdNum, "360s");

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

    // Get influence range from store
    const influenceRange = getInfluenceRange(projectIdNum);

    // build the scene with 360° shading enabled
    const { offscreen, renderer, scene, camera } =
      await getOrCreateScene({ width, height, doubleSided: false, use360Shading: true, influenceRange });

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
      const imagesWithDistances = images360.map(img => {
        const originalPos = new THREE.Vector3(img.x, img.y, img.z);
        const transformedPos = applyTransformationToPosition(originalPos, transformation);
        return {
          image: img,
          transformedPosition: transformedPos,
          distance: pose.position.distanceTo(transformedPos)
        };
      });

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
        // Use transformed position for light placement
        light.position.copy(imageAndDistance.transformedPosition);
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
          type: THREE.FloatType,
          depthBuffer: true,
          stencilBuffer: false,
          generateMipmaps: false,
        });
        renderTargets.push(renderTarget);
      }

      // Get settings for post-processing
      const maxImagesToKeep = getMaxImagesToKeep(projectIdNum);
      const weightingMode = getWeightingMode(projectIdNum);
      const polynomialExponent = getPolynomialExponent(projectIdNum);
      const exponentialBase = getExponentialBase(projectIdNum);
      const polynomialMultiplier = getPolynomialMultiplier(projectIdNum);
      const exponentialMultiplier = getExponentialMultiplier(projectIdNum);

      // Create post-processing material for this pose's render targets
      const postMaterial = createPostMaterial(renderTargets, maxImagesToKeep, weightingMode, polynomialExponent, exponentialBase, polynomialMultiplier, exponentialMultiplier);
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
            // Set light position as vec4 (x, y, z, course) using transformed position
            const transformedPos = container.imgWithDistance.transformedPosition;

            // Transform the course direction vector to account for coordinate system flips
            let transformedCourse = container.imgWithDistance.image.course;
            // Apply course correction
            const courseCorrection = getCourseCorrection(projectIdNum, container.imgWithDistance.image.name);
            transformedCourse += courseCorrection;
            if (transformation) {
              console.log("Original course:", transformedCourse);
              console.log("Transformation scale:", transformation.scale);

              const courseVector = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(transformedCourse));
              console.log("Course vector before transform:", courseVector);

              const matrix = new THREE.Matrix4();
              const quaternion = new THREE.Quaternion().setFromEuler(
                new THREE.Euler(...transformation.rotation)
              );
              matrix.compose(
                new THREE.Vector3(0, 0, 0), // No translation for direction vector
                quaternion,
                new THREE.Vector3(...transformation.scale) // Include scale!
              );
              courseVector.applyMatrix4(matrix);
              console.log("Course vector after transform:", courseVector);

              // Convert back to angle
              transformedCourse = Math.atan2(courseVector.z, courseVector.x) * 180 / Math.PI;
              console.log("Transformed course:", transformedCourse);
            }

            material.uniforms.lightPos.value.set(
              transformedPos.x,
              transformedPos.y,
              transformedPos.z,
              transformedCourse
            );
            console.log("Light position sent to shader:", transformedPos.x, transformedPos.y, transformedPos.z, transformedCourse);

            // Calculate flip values based on transformation scale
            if (transformation) {
              // Horizontal flip when x XOR z scale is negative. inverted FOR SOME REASON
              const flipHorizontal = !(transformation.scale[0] < 0) !== (transformation.scale[2] < 0);
              // Vertical flip when y scale is negative
              const flipVertical = false;
              console.log("Vertical flip:", flipVertical, "Horizontal flip:", flipHorizontal);

              material.uniforms.flipHorizontal.value = flipHorizontal;
              material.uniforms.flipVertical.value = flipVertical;
            } else {
              material.uniforms.flipHorizontal.value = false;
              material.uniforms.flipVertical.value = false;
            }

            // coordinate system used in shader: 0° is the equator, 90° is the north pole, -90° is the south pole
            const minPitchDegrees = pitchAngleRange[0]; // Most negative (down)
            const maxPitchDegrees = pitchAngleRange[1]; // Most positive (up)

            // Convert to spherical coordinate system
            const minPitchRadians = (90 + minPitchDegrees) * Math.PI / 180; // Min degrees becomes min radians
            const maxPitchRadians = (90 + maxPitchDegrees) * Math.PI / 180; // Max degrees becomes max radians

            material.uniforms.minPitch.value = minPitchRadians;
            material.uniforms.maxPitch.value = maxPitchRadians;
          }
        });

        // Render the scene with the current point light
        renderer.setRenderTarget(renderTargets[j]);
        renderer.setClearColor(0x000000, 0.0); // Clear with transparent background
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
      if (DO_CLEANUP) {
        renderTargets.forEach(rt => rt.dispose());
        postScene.remove(quad);
        postMaterial.dispose();
      }
      // ----------------------------------------

      // Clean up point lights after rendering this pose
      lightContainers.forEach(container => {
        scene.remove(container.light);
        // Clean up shadow map if it exists
        if (DO_CLEANUP && container.light.shadow && container.light.shadow.map) {
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
    if (DO_CLEANUP) {
      quadGeom.dispose();
    }

    // Invalidate the global scene cache to ensure fresh scene on next render
    globalSceneCache.invalidateProject(project.id);

    return results;
  }, [getTransformation, getVisibility, project, projectId, getMaxShadingImages, getMaxShadingDistance, getPitchAngleRange, renderScreenshotsFromAbove]);

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

      // Rotate the sphere based on course value with correction
      const courseCorrection = getCourseCorrection(Number(projectId), pose.imageName);
      sphere.rotation.y = THREE.MathUtils.degToRad(imageData.course + courseCorrection);

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
    if (DO_CLEANUP) {
      renderer.dispose();
      sphere.geometry.dispose();
      sphere.material.dispose();

      for (const imageData of images360) {
        if (imageData.texture) {
          imageData.texture.dispose();
        }
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

import db from "../data/db";
import * as THREE from 'three';
import { PostTrainingPose, ScreenShotResult } from "../hooks/useDataGeneratorUtils";


/**
 * TODO now:
 * 1. get the images from the poses from dexie
 * 2. Setup a simple scene with a camera and sphere
 * 3. Create the correct screenshots from poses
 * 4. Environment mapping with the images
 */

const getOrCreateScene = async (width: number, height: number) => {
  const offscreen = new OffscreenCanvas(width, height);
  const renderer = new THREE.WebGLRenderer({ canvas: offscreen, preserveDrawingBuffer: true });
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);

  // Create sphere with material that can have its texture updated
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(5, 64, 64),
    new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })
  );
  scene.add(sphere);

  return { offscreen, scene, renderer, camera, sphere };
}


const take360Screenshots = async (projectId: number, poses: PostTrainingPose[], width: number, height: number): Promise<ScreenShotResult<PostTrainingPose>[]> => {
  const images360 = await db.getImages360(projectId);
  const metadataFile = await db.getMetadataFile(projectId);

  // --------- VALIDATION ---------
  if (!images360.length) {
    throw new Error("No images360 found");
  }

  // Parse metadata file content
  const metadataText = await metadataFile?.content.text();
  if (!metadataText) {
    throw new Error("No metadata file found");
  }
  const metadata = JSON.parse(metadataText) as { name: string; x: number; y: number; z: number; course: number }[];

  // Create a map of image names to their content for quick lookup
  const imageMap = new Map(images360.map(img => [img.name, img.content]));

  // Validate that each pose has a corresponding image and metadata entry
  for (const pose of poses) {
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

  // Now, we need to set up a simple three.js scene. Using an offscreencanvas, there is a sphere and a camera.
  const { offscreen, scene, renderer, camera, sphere } = await getOrCreateScene(width, height);
  const textureLoader = new THREE.TextureLoader();

  const textures = new Map<string, THREE.Texture>(); // Let's cache textures to avoid reloading them
  const results: ScreenShotResult<PostTrainingPose>[] = [];

  for (const pose of poses) {
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

  return results;
}

export default take360Screenshots;
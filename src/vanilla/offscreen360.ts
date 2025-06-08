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
  const ambientLight = new THREE.AmbientLight(0xffffff, 1);
  scene.add(ambientLight);

  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(1, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide })
  );
  scene.add(sphere);

  return { offscreen, scene, renderer, camera };
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
  const metadata = JSON.parse(metadataText) as { name: string; x: number; y: number; z: number }[];

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
  const { offscreen, scene, renderer, camera } = await getOrCreateScene(width, height);

  // Now, we need to take the screenshots.
  const results: ScreenShotResult<PostTrainingPose>[] = [];
  for (const pose of poses) {
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
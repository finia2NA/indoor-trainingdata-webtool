import { Project } from "../data/db"
import db from "../data/db";
import * as THREE from 'three';

export type Image360 = {
  name: string;
  x: number;
  y: number;
  z: number;
  course: number;
  image?: THREE.Texture;
};

export async function get360s(project: Project, withImages: boolean = false): Promise<Image360[] | null> {
  if (!project.metadataFile) {
    console.log('No metadata file found in project');
    return null;
  }

  let text;
  let data;
  try {
    text = await project.metadataFile.content.text();
    data = JSON.parse(text);
  } catch (error) {
    return null
  }

  const images360Data = data as unknown as Image360[];

  if (withImages) {

    if (!project.id) {
      throw new Error("Project ID is required to load images. Baaaka");
    }

    // Get the stored 360° images from the database
    const storedImages = await db.getImages360(project.id);

    // Create a map of image names to their blob content for quick lookup
    const imageMap = new Map(storedImages.map(img => [img.name, img.content]));

    // Attach image data to metadata entries
    for (const imageData of images360Data) {
      const storedImage = imageMap.get(imageData.name);
      if (storedImage) {
        // Create a URL from the blob and load it as a Three.js texture
        const imageUrl = URL.createObjectURL(storedImage);
        const loader = new THREE.TextureLoader();

        // Load the texture synchronously (note: this creates a texture that loads asynchronously)
        const texture = loader.load(imageUrl,
          () => {
            // Clean up the object URL after the texture is loaded
            URL.revokeObjectURL(imageUrl);
          },
          undefined,
          (error) => {
            console.error('Failed to load texture:', error);
            URL.revokeObjectURL(imageUrl);
          }
        );

        imageData.image = texture;
      }
    }
  }

  return images360Data;
}
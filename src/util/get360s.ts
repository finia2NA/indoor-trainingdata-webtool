import { Project } from "../data/db"
import db from "../data/db";

export type Image360 = {
  name: string;
  x: number;
  y: number;
  z: number;
  course: number;
  image?: string | Blob;
};

export async function get360s(project: Project, withImages: boolean = false): Promise<Image360[]> {
  if (!project.metadataFile) throw new Error("No metadata file found in project");

  let text;
  let data;
  try {
    text = await project.metadataFile.content.text();
    data = JSON.parse(text);
  } catch (error) {
    console.error('Failed to load images:', error);
    throw error;
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
        // Attach the blob directly - Three.js can handle this with URL.createObjectURL()
        imageData.image = storedImage;
      }
    }
  }

  return images360Data;
}
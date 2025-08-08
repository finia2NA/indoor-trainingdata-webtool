import { useEffect, useState } from 'react';
import { Project } from '../../data/db';
import * as THREE from 'three';
import { Line } from '@react-three/drei';
import { Image360, get360s } from '../../util/get360s';
import useCameraPoseStore from '../../hooks/sync/useCameraPoseStore';
import View360Sphere from './View360Sphere';


type Image360MarkersProps = {
  project: Project;
};

const Image360Markers = ({ project }: Image360MarkersProps) => {
  const [positions, setPositions] = useState<Image360[]>([]);
  const [selectedImage, setSelectedImage] = useState<Image360 | null>(null);
  const { moveCameraTo, enter360View, reactiveCameraPosition, reactiveTarget, is360ViewActive } = useCameraPoseStore();

  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const images = await get360s(project, true); // Load with images for textures
        if (!images) {
          console.log('No 360 images found in project metadata');
          return;
        }
        setPositions(images);
      } catch (error) {
        console.error('Error loading 360 images:', error);
      }
    };

    loadMetadata();
  }, [project.metadataFile]);

  // Clear selected image when exiting 360° view
  useEffect(() => {
    if (!is360ViewActive) {
      setSelectedImage(null);
    }
  }, [is360ViewActive]);

  const handleSphereClick = (pos: Image360) => {
    // Store current camera position before entering 360° view
    enter360View(reactiveCameraPosition, reactiveTarget);
    
    // Set the selected image for texture display
    setSelectedImage(pos);
    
    // Move camera to 0.5 units (50cm) away from the sphere position
    const offset = 0.005;
    const cameraPosition: [number, number, number] = [pos.x, pos.y + offset, pos.z];
    const target: [number, number, number] = [pos.x, pos.y, pos.z];
    moveCameraTo(cameraPosition, target);
  };

  return (
    <>
      {positions.map((pos, index) => (
        <group key={index} position={[pos.x, pos.y, pos.z]}>
          {/* Sphere marker */}
          <mesh onClick={is360ViewActive ? undefined : () => handleSphereClick(pos)}>
            <sphereGeometry args={[0.03, 16, 16]} />
            <meshBasicMaterial color="#ffff00" />
          </mesh>

          {/* Direction indicator line */}
          <group rotation={[0, THREE.MathUtils.degToRad(pos.course), 0]}>
            <Line
              points={[[0, 0, 0], [0.3, 0, 0]]}
              color="#ff0000"
              lineWidth={2}
            />
          </group>
        </group>
      ))}
      
      {/* 360° view sphere with texture */}
      <View360Sphere selectedImage={selectedImage} />
    </>
  );
};

export default Image360Markers; 
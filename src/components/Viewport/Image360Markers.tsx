import { useEffect, useState } from 'react';
import { Project } from '../../data/db';
import * as THREE from 'three';
import { Line } from '@react-three/drei';
import { Image360, get360s } from '../../util/get360s';
import useCameraPoseStore from '../../hooks/sync/useCameraPoseStore';
import View360Sphere from './View360Sphere';


type Image360MarkersProps = {
  project: Project;
  onImageSelected?: (image: Image360 | null) => void;
};

const Image360Markers = ({ project, onImageSelected }: Image360MarkersProps) => {
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
      if (onImageSelected) onImageSelected(null);
    }
  }, [is360ViewActive, onImageSelected]);

  const handleSphereClick = (pos: Image360) => {
    // Store current camera position before entering 360° view
    enter360View(reactiveCameraPosition, reactiveTarget);
    
    // Set the selected image for texture display
    setSelectedImage(pos);
    if (onImageSelected) onImageSelected(pos);
    
    // Calculate camera position based on negative course direction (camera looks back towards sphere)
    const offset = 0.005;
    const courseRadians = THREE.MathUtils.degToRad(pos.course);
    const courseVector = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), courseRadians);
    courseVector.multiplyScalar(-offset); // Negative to position camera opposite to course direction
    
    const cameraPosition: [number, number, number] = [
      pos.x + courseVector.x, 
      pos.y + courseVector.y, 
      pos.z + courseVector.z
    ];
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
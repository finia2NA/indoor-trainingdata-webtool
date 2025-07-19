import { useEffect, useState } from 'react';
import { Project } from '../../data/db';
import * as THREE from 'three';
import { Line } from '@react-three/drei';
import { Image360, get360s } from '../../util/get360s';


type Image360MarkersProps = {
  project: Project;
};

const Image360Markers = ({ project }: Image360MarkersProps) => {
  const [positions, setPositions] = useState<Image360[]>([]);

  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const images = await get360s(project);
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

  return (
    <>
      {positions.map((pos, index) => (
        <group key={index} position={[pos.x, pos.y, pos.z]}>
          {/* Sphere marker */}
          <mesh>
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
    </>
  );
};

export default Image360Markers; 
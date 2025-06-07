import { useEffect, useState } from 'react';
import { Project } from '../../data/db';
import * as THREE from 'three';
import { Line } from '@react-three/drei';

type Image360Position = {
  name: string;
  x: number;
  y: number;
  z: number;
  course: number;
};

type Image360MarkersProps = {
  project: Project;
};

const Image360Markers = ({ project }: Image360MarkersProps) => {
  const [positions, setPositions] = useState<Image360Position[]>([]);

  useEffect(() => {
    const loadMetadata = async () => {
      if (!project.metadataFile) return;
      
      try {
        const text = await project.metadataFile.content.text();
        const data = JSON.parse(text) as Image360Position[];
        setPositions(data);
      } catch (error) {
        console.error('Failed to load metadata:', error);
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
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshBasicMaterial color="#ff0000" />
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
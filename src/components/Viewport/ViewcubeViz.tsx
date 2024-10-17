import { Canvas, useLoader } from '@react-three/fiber';
import WrappedOrbitControls from './WrappedOrbitControls';
import * as THREE from 'three';

export interface ViewcubeVizProps {
  orbitAngles: { azimuthAngle: number, polarAngle: number };
  setOrbitAngles: React.Dispatch<React.SetStateAction<{ azimuthAngle: number; polarAngle: number; }>>;
}

// Helper function to create text texture
const createTextTexture = (text: string) => {
  const canvas = document.createElement('canvas');
  const size = 256;
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');

  if (context) {
    // Background color
    context.fillStyle = '#333';
    context.fillRect(0, 0, size, size);

    // Text settings
    context.font = '40px Arial';
    context.fillStyle = 'white';
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    // Draw text
    context.fillText(text, size / 2, size / 2);
  }

  // Create texture from canvas
  const texture = new THREE.CanvasTexture(canvas);
  return texture;
};

const Cube = () => {
  return (
    <mesh>
      <boxGeometry args={[3, 3, 3]} />
      <meshBasicMaterial attach="material-0" map={createTextTexture("right")} />
      <meshBasicMaterial attach="material-1" map={createTextTexture("left")} />
      <meshBasicMaterial attach="material-2" map={createTextTexture("top")} />
      <meshBasicMaterial attach="material-3" map={createTextTexture("bottom")} />
      <meshBasicMaterial attach="material-4" map={createTextTexture("front")} />
      <meshBasicMaterial attach="material-5" map={createTextTexture("back")} />
    </mesh>
  );
};

const ViewcubeViz = ({ orbitAngles, setOrbitAngles }: ViewcubeVizProps) => {
  return (
    <Canvas className='bg-oxford_blue bg-opacity-50'>
      <ambientLight />
      <pointLight position={[10, 10, 10]} />
      <Cube />
      <WrappedOrbitControls orbitAngles={orbitAngles} setOrbitAngles={setOrbitAngles} enablePan={false} />
    </Canvas>
  );
};

export default ViewcubeViz;
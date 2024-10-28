import { Canvas } from '@react-three/fiber';
import WrappedOrbitControls from './WrappedOrbitControls';
import * as THREE from 'three';
import useOrbitAngleStore from '../../hooks/useOrbitAngleStore';

enum CUBEFACE {
  RIGHT = "right",
  LEFT = "left",
  TOP = "top",
  BOTTOM = "bottom",
  FRONT = "front",
  BACK = "back"
}

function directionToFace(direction: THREE.Vector3): CUBEFACE {
  /*
    front: _Vector3 {x: 0, y: 0, z: 1}
    back: _Vector3 {x: 0, y: 0, z: -1}
    top: _Vector3 {x: 0, y: 1, z: 0}
    bottom: _Vector3 {x: 0, y: -1, z: 0}
    left: _Vector3 {x: -1, y: 0, z: 0}
    right: _Vector3 {x: 1, y: 0, z: 0}
  */
  if (direction.equals(new THREE.Vector3(1, 0, 0))) return CUBEFACE.RIGHT;
  if (direction.equals(new THREE.Vector3(-1, 0, 0))) return CUBEFACE.LEFT;
  if (direction.equals(new THREE.Vector3(0, 1, 0))) return CUBEFACE.TOP;
  if (direction.equals(new THREE.Vector3(0, -1, 0))) return CUBEFACE.BOTTOM;
  if (direction.equals(new THREE.Vector3(0, 0, 1))) return CUBEFACE.FRONT;
  if (direction.equals(new THREE.Vector3(0, 0, -1))) return CUBEFACE.BACK;
  throw new Error("Invalid direction");
}

function faceToColor(face: CUBEFACE): string {
  /*
    We need three colors for this. The paris of opposite faces should have the same color.
  */
  switch (face) {
    case CUBEFACE.RIGHT:
    case CUBEFACE.LEFT:
      return '#FAA916';
    case CUBEFACE.TOP:
    case CUBEFACE.BOTTOM:
      return '#DB2955';
    case CUBEFACE.FRONT:
    case CUBEFACE.BACK:
      return '#95B8D1';
    default:
      throw new Error("Invalid face");
  }
}



function faceToAngles(face: CUBEFACE): { azimuthAngle: number, polarAngle: number } {
  /*
    front: { azimuthAngle: 0, polarAngle: Math.PI / 2 }
    top: { azimuthAngle: 0, polarAngle: 0 }
    bottom: { azimuthAngle: 0, polarAngle: Math.PI }
    right: { azimuthAngle: Math.PI/2, polarAngle: Math.PI / 2 }
    back: { azimuthAngle: Math.PI, polarAngle: Math.PI / 2 }
    left: { azimuthAngle: Math.PI*1.5, polarAngle: Math.PI / 2 }
  */
  switch (face) {
    case CUBEFACE.RIGHT:
      return { azimuthAngle: Math.PI / 2, polarAngle: Math.PI / 2 };
    case CUBEFACE.LEFT:
      return { azimuthAngle: Math.PI * 1.5, polarAngle: Math.PI / 2 };
    case CUBEFACE.TOP:
      return { azimuthAngle: 0, polarAngle: 0 };
    case CUBEFACE.BOTTOM:
      return { azimuthAngle: 0, polarAngle: Math.PI };
    case CUBEFACE.FRONT:
      return { azimuthAngle: 0, polarAngle: Math.PI / 2 };
    case CUBEFACE.BACK:
      return { azimuthAngle: Math.PI, polarAngle: Math.PI / 2 };
    default:
      throw new Error("Invalid face");
  }
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
    // TODO: different color for each face
    context.fillStyle = faceToColor(text as CUBEFACE);
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

interface CubeProps {
  // eslint-disable-next-line no-unused-vars
  setOrbitAngles: (angles: { azimuthAngle: number; polarAngle: number }) => void;
}


const Cube = ({ setOrbitAngles }: CubeProps) => {


  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onClick = (e: any) => {

    // First, figure out what face was clicked
    const normal = e.face?.normal;
    if (!normal) return;
    const face = directionToFace(normal);
    const angles = faceToAngles(face);
    setOrbitAngles(angles);
  }

  return (
    <mesh onClick={onClick}>
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

const ViewcubeViz = () => {

  const { setOrbitAngles } = useOrbitAngleStore((state) => state);

  return (
    <Canvas className='bg-oxford_blue bg-opacity-60'>
      <ambientLight />
      <pointLight position={[10, 10, 10]} />
      <Cube setOrbitAngles={setOrbitAngles} />
      <WrappedOrbitControls enablePan={false} />
    </Canvas>
  );
};

export default ViewcubeViz;
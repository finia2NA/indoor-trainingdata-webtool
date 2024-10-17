import { Canvas } from '@react-three/fiber';
import WrappedOrbitControls from './WrappedOrbitControls';

export interface ViewcubeVizProps {
  orbitAngles: { azimuthAngle: number, polarAngle: number };
  setOrbitAngles: React.Dispatch<React.SetStateAction<{ azimuthAngle: number; polarAngle: number; }>>;
}

const Cube = () => {
  return (
    <mesh>
      <boxGeometry args={[3, 3, 3]} />
      {/* <meshStandardMaterial color="orange" /> */}
      <meshBasicMaterial attach="material-0" color="#00FF00" />
      <meshBasicMaterial attach="material-1" color="#FF0000" />
      <meshBasicMaterial attach="material-2" color="#0000FF" />
      <meshBasicMaterial attach="material-3" color="#FFFF00" />
      <meshBasicMaterial attach="material-4" color="#FF00FF" />
      <meshBasicMaterial attach="material-5" color="#00FFFF" />
    </mesh>
  );
};

const ViewcubeViz = ({ orbitAngles, setOrbitAngles }: ViewcubeVizProps) => {
  return (
    <Canvas className='bg-oxford_blue bg-opacity-50'>
      <ambientLight />
      <pointLight position={[10, 10, 10]} />
      <Cube />
      <WrappedOrbitControls orbitAngles={orbitAngles} setOrbitAngles={setOrbitAngles}
        enablePan={false} />
    </Canvas>
  );
};

export default ViewcubeViz;
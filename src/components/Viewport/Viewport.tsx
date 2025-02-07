import { Canvas } from '@react-three/fiber';
import { Model3D } from '../../data/db';
import WrappedOrbitControls, { OrbitUsecase } from './WrappedOrbitControls';
import useEditorStore, { EditorMode, EditorState } from '../../hooks/useEditorStore';
import SwitchableCamera from './SwitchableCamera';
import SceneObject from './SceneObject';
import PolygonCreator from './PolygonCreator/PolygonCreator';
import LabeledAxesHelper from './LabeledAxesHelper';
import CameraPosLogging from './CameraPoseLogging';
import { useRef, useState } from 'react';
import { Camera, Vector3 } from 'three';

type ViewportProps = {
  model: Model3D;
}

// Make it a bit easier to click on lines
const raycasterParams = {
  Line: { threshold: 0.03 },
  Mesh: undefined,
  LOD: undefined,
  Points: {
    threshold: 0
  },
  Sprite: undefined
}

const randomValue = () => Math.random() * 10 - 5;


const Viewport = ({ model }: ViewportProps) => {

  const { showGrid, editorMode } = useEditorStore((state) => (state as EditorState));
  const cameraRef = useRef<Camera | null>();
  const [orbitTarget, setOrbitTarget] = useState<Vector3>(new Vector3(0, 0, 0));

  const setNewPose = () => {
    if (cameraRef.current) {
      // Set random position and rotation.
      const newX = randomValue();
      const newY = randomValue();
      const newZ = randomValue();
      const newPositionVector = new Vector3(newX, newY, newZ);

      const targetOffset = new Vector3(Math.random(), Math.random(), Math.random()).normalize().add(newPositionVector);
      setOrbitTarget(targetOffset);

      cameraRef.current.position.set(newX, newY, newZ);
    }
  };


  return (
    <>
      <button
        onClick={setNewPose}
      >asdfasdfasdfasfasdfasdfasdfadf</button>
      <Canvas
        raycaster={{ params: raycasterParams }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />

        <SceneObject model={model} />

        {[EditorMode.MAP, EditorMode.GENERATE].includes(editorMode) && <PolygonCreator />}

        <WrappedOrbitControls
          useCase={OrbitUsecase.VIEWPORT}
          target={orbitTarget}
        />
        {showGrid &&
          <>
            <gridHelper args={[10, 10]} />
            <LabeledAxesHelper size={5} />
          </>
        }
        <color attach="background" args={['#484848']} />

        <SwitchableCamera ref={cameraRef} />
        <CameraPosLogging />
      </Canvas>
    </>
  );
}

export default Viewport;

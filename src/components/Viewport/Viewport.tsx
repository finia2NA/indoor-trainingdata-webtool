import { Canvas } from '@react-three/fiber';
import { Model3D } from '../../data/db';
import WrappedOrbitControls, { OrbitUsecase } from './WrappedOrbitControls';
import useEditorStore, { EditorMode, EditorState } from '../../hooks/useEditorStore';
import SwitchableCamera from './SwitchableCamera';
import SceneObject from './SceneObject';
import PolygonCreator from './PolygonCreator/PolygonCreator';
import LabeledAxesHelper from './LabeledAxesHelper';
import CameraPosLogging from './CameraPoseLogging';
import { useRef, useEffect, useCallback } from 'react';
import { Camera, Vector3 } from 'three';
import { saveAs } from 'file-saver';
import { useDataGeneratorStore } from '../../hooks/useDataGeneratorUtils';
import WASDControls from './WASDControls';

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

const Viewport = ({ model }: ViewportProps) => {
  const { showGrid, editorMode } = useEditorStore((state) => (state as EditorState));

  const { orbitTarget, setOrbitTarget, registerSetPose, registerTakeScreenshot } = useDataGeneratorStore();
  const cameraRef = useRef<Camera | null>();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const setPose = useCallback((pos: Vector3, target: Vector3) => {
    if (cameraRef.current) {
      cameraRef.current.position.set(pos.x, pos.y, pos.z);
      setOrbitTarget(target);
    }
  }, [setOrbitTarget]);

  const takeScreenshot = useCallback(async () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      });
    });

    if (blob) {
      saveAs(blob, 'screenshot.png');
    }
  }, []);

  // Register callbacks in the store once
  useEffect(() => {
    registerSetPose(setPose);
    registerTakeScreenshot(takeScreenshot);
  }, [setPose, takeScreenshot, registerSetPose, registerTakeScreenshot]);

  return (
    <>
      <Canvas
        gl={{ preserveDrawingBuffer: true }}
        raycaster={{ params: raycasterParams }}
        ref={canvasRef}
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
        {/* <WASDControls /> */}
      </Canvas>
    </>
  );
}

export default Viewport;

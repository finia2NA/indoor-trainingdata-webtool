import { Canvas } from '@react-three/fiber';
import { Project } from '../../data/db';
import WrappedOrbitControls, { OrbitUsecase } from './WrappedOrbitControls';
import useEditorStore, { EditorMode, EditorState } from '../../hooks/useEditorStore';
import SwitchableCamera from './SwitchableCamera';
import SceneObjects from './SceneObjects';
import PolygonCreator from './PolygonCreator/PolygonCreator';
import LabeledAxesHelper from './LabeledAxesHelper';
import CameraPosLogging from './CameraPoseLogging';
import { useRef, useEffect, useCallback } from 'react';
import { Camera, PerspectiveCamera, Vector3 } from 'three';
import { ScreenShotResult, useDataGeneratorStore } from '../../hooks/useDataGeneratorUtils';

type ViewportProps = {
  project: Project;
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

const Viewport = ({ project }: ViewportProps) => {
  const { showGrid, editorMode } = useEditorStore((state) => (state as EditorState));

  const { orbitTarget, setOrbitTarget, registerSetPose, registerTakeScreenshot } = useDataGeneratorStore();
  const cameraRef = useRef<Camera | null>();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  /**
   * @deprecated use the offscreen canvas instead
   */
  const setPose = useCallback((pos: Vector3, target: Vector3) => {
    if (cameraRef.current) {
      cameraRef.current.position.set(pos.x, pos.y, pos.z);
      setOrbitTarget(target);
    }
  }, [setOrbitTarget]);

  /**
   * @deprecated use the offscreen canvas instead
   */
  const takeScreenshot = useCallback(async (screenshotWidth: number, screenshotHeight: number): Promise<ScreenShotResult> => {
    if (!canvasRef.current) throw new Error("Canvas not available");
    const canvas = canvasRef.current;

    const originalWidth = canvas.width;
    const originalHeight = canvas.height;
    canvas.width = screenshotWidth;
    canvas.height = screenshotHeight;
    await new Promise((resolve) => requestAnimationFrame(resolve));


    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      });
    });
    const cameraFOV = cameraRef.current instanceof PerspectiveCamera ? cameraRef.current.fov : null;

    canvas.width = originalWidth;
    canvas.height = originalHeight;

    if (blob) {
      return {
        blob,
        fov: cameraFOV
      } as ScreenShotResult;
    }

    throw new Error("Failed to capture screenshot");
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

        <SceneObjects project={project} />

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

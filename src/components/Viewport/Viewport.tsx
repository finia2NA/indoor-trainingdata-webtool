import { Canvas } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { Project } from '../../data/db';
import WrappedOrbitControls, { OrbitUsecase } from './WrappedOrbitControls';
import useEditorStore, { EditorMode } from '../../hooks/state/useEditorStore';
import useDebugStore from '../../hooks/state/useDebugStore';
import SwitchableCamera from './SwitchableCamera';
import SceneObjects from './SceneObjects';
import PolygonCreator from './PolygonCreator/PolygonCreator';
import LabeledAxesHelper from './LabeledAxesHelper';
import CameraPosLogging from './CameraPoseLogging';
import Image360Markers from './Image360Markers';
import PointLightWithControls from './PointLightWithControls';
import CameraController from './CameraController';
import { Image360 } from '../../util/get360s';

type ViewportProps = {
  project: Project;
  setSelectedImage: (image: Image360 | null) => void;
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

const Viewport = ({ project, setSelectedImage }: ViewportProps) => {
  const { showGrid, editorMode, showImages } = useEditorStore();
  const {
    ambientLightActive,
    ambientLightIntensity,
    measuringActive,
    measuredPoint
  } = useDebugStore();



  return (
    <>
      <Canvas
        gl={{ preserveDrawingBuffer: true }}
        shadows
        raycaster={{ params: raycasterParams }}
      >
        {ambientLightActive && <ambientLight intensity={ambientLightIntensity} />}

        <PointLightWithControls />

        <SceneObjects project={project} />
        {showImages &&
          <Image360Markers project={project} onImageSelected={setSelectedImage} />
        }

        {[EditorMode.MAP, EditorMode.GENERATE, EditorMode.DEBUG].includes(editorMode) && <PolygonCreator />}

        <WrappedOrbitControls
          useCase={OrbitUsecase.VIEWPORT}
        />
        {showGrid &&
          <>
            <gridHelper args={[10, 10]} />
            <LabeledAxesHelper size={5} />
          </>
        }
        <color attach="background" args={['#484848']} />

        <> // Camera Controls
          <SwitchableCamera />
          <CameraPosLogging />
          <CameraController />
        </>
        {measuringActive && measuredPoint && (
          <Html position={measuredPoint} center style={{ pointerEvents: 'none' }}>
            <div className="px-2 py-1 rounded bg-black/70 text-white text-xs whitespace-nowrap">
              [{measuredPoint.map((v) => v.toFixed(3)).join(', ')}]
            </div>
          </Html>
        )}
      </Canvas>
    </>
  );
}

export default Viewport;

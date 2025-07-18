import { Canvas } from '@react-three/fiber';
import { Project } from '../../data/db';
import WrappedOrbitControls, { OrbitUsecase } from './WrappedOrbitControls';
import useEditorStore, { EditorMode, EditorState } from '../../hooks/state/useEditorStore';
import SwitchableCamera from './SwitchableCamera';
import SceneObjects from './SceneObjects';
import PolygonCreator from './PolygonCreator/PolygonCreator';
import LabeledAxesHelper from './LabeledAxesHelper';
import CameraPosLogging from './CameraPoseLogging';
import Image360Markers from './Image360Markers';

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
  const { showGrid, editorMode, showImages } = useEditorStore((state) => (state as EditorState));


  return (
    <>
      <Canvas
        gl={{ preserveDrawingBuffer: true }}
        raycaster={{ params: raycasterParams }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />

        <SceneObjects project={project} />
        {showImages &&
          <Image360Markers project={project} />
        }

        {[EditorMode.MAP, EditorMode.GENERATE].includes(editorMode) && <PolygonCreator />}

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

        <SwitchableCamera />
        <CameraPosLogging />
      </Canvas>
    </>
  );
}

export default Viewport;

import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Project } from '../../data/db';
import WrappedOrbitControls, { OrbitUsecase } from './WrappedOrbitControls';
import useEditorStore, { EditorMode, EditorState } from '../../hooks/state/useEditorStore';
import useDebugStore from '../../hooks/state/useDebugStore';
import SwitchableCamera from './SwitchableCamera';
import SceneObjects from './SceneObjects';
import PolygonCreator from './PolygonCreator/PolygonCreator';
import LabeledAxesHelper from './LabeledAxesHelper';
import CameraPosLogging from './CameraPoseLogging';
import Image360Markers from './Image360Markers';
import PointLightWithControls from './PointLightWithControls';
import CameraController from './CameraController';
import View360Overlay from './View360Overlay';
import { Image360 } from '../../util/get360s';
import { OrbitControls } from '@react-three/drei';

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
  const {
    useAmbientLight,
    ambientLightIntensity
  } = useDebugStore();
  
  const [selectedImage, setSelectedImage] = useState<Image360 | null>(null);


  return (
    <>
      <View360Overlay selectedImage={selectedImage} />
      <Canvas
        gl={{ preserveDrawingBuffer: true }}
        shadows
        raycaster={{ params: raycasterParams }}
      >
        {useAmbientLight && <ambientLight intensity={ambientLightIntensity} />}

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

        <SwitchableCamera />
        <CameraPosLogging />
        <CameraController />
      </Canvas>
    </>
  );
}

export default Viewport;

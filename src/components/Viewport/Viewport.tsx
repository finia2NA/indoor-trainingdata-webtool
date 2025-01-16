import { Canvas } from '@react-three/fiber';
import { Model3D } from '../../data/db';
import WrappedOrbitControls from './WrappedOrbitControls';
import useEditorStore, { EditorMode, EditorState } from '../../hooks/useEditorStore';
import SwitchableCamera from './SwitchableCamera';
import SceneObject from './SceneObject';
import PolygonSurface from './PolygonSurface';
import LabeledAxesHelper from './LabeledAxesHelper';

interface ViewportProps {
  model: Model3D;
}


const Viewport = ({ model }: ViewportProps) => {

  const { showGrid, editorMode } = useEditorStore((state) => (state as EditorState));

  return (
    <Canvas>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      <SceneObject model={model} />
      {editorMode === EditorMode.MAP && <PolygonSurface/>}

      <WrappedOrbitControls />
      {/* <OrbitControls /> */}
      {showGrid &&
        <>
          <gridHelper args={[10, 10]} />
          <LabeledAxesHelper size={5} />
        </>
      }
      <color attach="background" args={['#484848']} />

      <SwitchableCamera />
    </Canvas>
  );
}

export default Viewport;

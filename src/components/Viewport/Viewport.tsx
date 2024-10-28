import { Canvas } from '@react-three/fiber';
import { Model3D } from '../../data/db';
import WrappedOrbitControls from './WrappedOrbitControls';
import useEditorStore, { EditorState } from '../../hooks/useEditorState';
import SwitchableCamera from './SwitchableCamera';
import SceneObject from './SceneObject';

interface ViewportProps {
  model: Model3D;
}


const Viewport = ({ model }: ViewportProps) => {

  const { showGrid } = useEditorStore((state) => (state as EditorState));

  return (
    <div className='h-full'>
      <Canvas>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />

        <SceneObject model={model} />

        <WrappedOrbitControls />
        {/* <OrbitControls /> */}
        {showGrid &&
          <>
            <gridHelper args={[10, 10]} />
            <axesHelper args={[5]} />
          </>
        }
        <color attach="background" args={['#484848']} />

        <SwitchableCamera />
      </Canvas>
    </div>
  );
}

export default Viewport;

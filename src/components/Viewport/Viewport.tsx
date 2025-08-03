import { Canvas } from '@react-three/fiber';
import { Project } from '../../data/db';
import * as THREE from 'three';
import WrappedOrbitControls, { OrbitUsecase } from './WrappedOrbitControls';
import useEditorStore, { EditorMode, EditorState } from '../../hooks/state/useEditorStore';
import SwitchableCamera from './SwitchableCamera';
import SceneObjects from './SceneObjects';
import PolygonCreator from './PolygonCreator/PolygonCreator';
import LabeledAxesHelper from './LabeledAxesHelper';
import CameraPosLogging from './CameraPoseLogging';
import Image360Markers from './Image360Markers';
import { get360s, Image360 } from '../../util/get360s';
import { useEffect, useMemo, useState } from 'react';

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

  const [img360s, setImg360s] = useState<Image360[]>([]);

  useEffect(() => {
    const fetch360s = async () => {
      const data = await get360s(project);
      setImg360s(data ?? []);
    };
    fetch360s();
  }, [project]);


  const { showGrid, editorMode, showImages } = useEditorStore((state) => (state as EditorState));


  return (
    <>
      <Canvas
        gl={{ preserveDrawingBuffer: true }}
        raycaster={{ params: raycasterParams }}
        shadows={{ autoUpdate: true, type: THREE.PCFSoftShadowMap }}  // Configure shadows here
      >
        {/* <ambientLight intensity={0.5} /> */}
        {/* <directionalLight position={[10, 10, 5]} intensity={1} /> */}

        <SceneObjects project={project} />
        {showImages &&
          <Image360Markers project={project} />
        }

        {img360s.map((img360) => (
          <pointLight
            key={img360.name}
            position={[img360.x, img360.y, img360.z]}
            intensity={2}
            decay={0}

            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
            shadow-camera-near={0.5}
            shadow-camera-far={20}
          />
        ))}

        {/* Editor specific */}

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

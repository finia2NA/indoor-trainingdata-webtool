import { OrthographicCamera, PerspectiveCamera } from '@react-three/drei';
import useEditorStore, { EditorState, Perspective } from "../../hooks/useEditorState";

interface SwitchableCameraProps {
  a?: string
}

const SwitchableCamera = ({ a }: SwitchableCameraProps) => {

  const { showGrid, perspectiveMode } = useEditorStore((state) => (state as EditorState));


  return <>
    {perspectiveMode === Perspective.ORTHOGRAPHIC &&
      <OrthographicCamera makeDefault={true} position={[0, 0, 10]}
        zoom={10} />
    }
    {perspectiveMode === Perspective.PERSPECTIVE &&
      <PerspectiveCamera makeDefault={true} position={[0, 0, 10]} />
    }
  </>
}

export default SwitchableCamera;
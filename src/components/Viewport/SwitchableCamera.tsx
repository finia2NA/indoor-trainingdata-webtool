import { OrthographicCamera, PerspectiveCamera } from "@react-three/drei";
import useEditorStore, { EditorState, Perspective, } from "../../hooks/useEditorState";

const SwitchableCamera = () => {

  // console.log("RENDERING SWITCHABLE CAMERA");

  const { perspectiveMode } = useEditorStore((state) => (state as EditorState));


  return (
    <>
      {perspectiveMode === Perspective.PERSPECTIVE ?
        <PerspectiveCamera makeDefault position={[0, 0, 5]} /> :
        <OrthographicCamera makeDefault position={[0, 0, 5]} />}

    </>
  )
}

export default SwitchableCamera;
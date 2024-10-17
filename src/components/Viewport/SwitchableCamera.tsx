import * as THREE from "three";
import * as DREI from "@react-three/drei";
import useEditorStore, { EditorState, Perspective, } from "../../hooks/useEditorState";
import { useEffect, useRef } from "react";


const SwitchableCamera = () => {
  console.log("RENDERING SWITCHABLE CAMERA");
  const { perspectiveMode } = useEditorStore((state) => (state as EditorState));

  const cameraRef = useRef(null);

  useEffect(() => {

    const aspect = window.innerWidth / window.innerHeight;
    const orthoMatrix = new THREE.OrthographicCamera(
      -aspect, aspect, 1, -1, 0.1, 1000
    ).projectionMatrix;
    const perspMatrix = new THREE.PerspectiveCamera(
      75, aspect, 0.1, 1000
    ).projectionMatrix;

    if (!cameraRef.current) return;
    console.log(cameraRef.current);

    cameraRef.current.projectionMatrix.copy(perspectiveMode === Perspective.PERSPECTIVE ? perspMatrix : orthoMatrix);

  }, [cameraRef, perspectiveMode]);

  return (
    <DREI.PerspectiveCamera
      makeDefault
      position={[0, 0, 5]}
      ref={cameraRef}
    />

  )
}

export default SwitchableCamera;
import { OrthographicCamera, PerspectiveCamera } from "@react-three/drei";
import useEditorStore, { Perspective } from "../../hooks/useEditorStore";
import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import * as THREE from "three";

const SwitchableCamera = forwardRef((_props, ref) => {

  const { perspectiveMode } = useEditorStore();
  const perspectiveRef = useRef<THREE.PerspectiveCamera | null>(null);
  const orthoRef = useRef<THREE.OrthographicCamera | null>(null);

  useEffect(() => {
    if (!perspectiveRef.current || !orthoRef.current) return;
    if (perspectiveMode === Perspective.PERSPECTIVE) {
      perspectiveRef.current.position.x = orthoRef.current.position.x;
      perspectiveRef.current.position.y = orthoRef.current.position.y;
      perspectiveRef.current.position.z = orthoRef.current.position.z;
    }
    if (perspectiveMode === Perspective.ORTHOGRAPHIC) {
      orthoRef.current.position.x = perspectiveRef.current.position.x;
      orthoRef.current.position.y = perspectiveRef.current.position.y;
      orthoRef.current.position.z = perspectiveRef.current.position.z;
    }
  }, [perspectiveMode]);

  useImperativeHandle(ref, () =>
    perspectiveMode === Perspective.PERSPECTIVE ? perspectiveRef.current : orthoRef.current,
    [perspectiveMode]);

  return (
    <>
      <PerspectiveCamera
        makeDefault={perspectiveMode === Perspective.PERSPECTIVE}
        position={[0, 1, 0]}
        ref={perspectiveRef}
        zoom={1}
      />
      <OrthographicCamera
        makeDefault={perspectiveMode === Perspective.ORTHOGRAPHIC}
        position={[0, 10, 0]}
        ref={orthoRef}
        zoom={10}
      />
    </>
  );
});

export default SwitchableCamera;
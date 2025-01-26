import { OrthographicCamera, PerspectiveCamera } from "@react-three/drei";
import useEditorStore, { EditorState, Perspective } from "../../hooks/useEditorStore";
import { useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector3 } from "three";

// const SwitchableCamera = forwardRef((_, ref) => {
const SwitchableCamera = () => {

  const { perspectiveMode } = useEditorStore((state) => (state as EditorState));
  const perspectiveRef = useRef(null);
  const orthoRef = useRef(null);

  // useImperativeHandle(ref, () => ({
  //   camera: perspectiveMode === Perspective.PERSPECTIVE ? perspectiveRef.current : orthoRef.current
  // }));

  useEffect(() => {
    if (!perspectiveRef.current || !orthoRef.current) return;

    if (perspectiveMode === Perspective.PERSPECTIVE) {
      // FIXME: fix eslint error
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

  // // Track pressed keys
  // const pressedKeys = useRef(new Set<string>());
  // const moveSpeed = 0.1;

  // const handleKeyDown = useCallback((e: KeyboardEvent) => {
  //   pressedKeys.current.add(e.key.toLowerCase());
  // }, []);

  // const handleKeyUp = useCallback((e: KeyboardEvent) => {
  //   pressedKeys.current.delete(e.key.toLowerCase());
  // }, []);

  // useEffect(() => {
  //   window.addEventListener("keydown", handleKeyDown);
  //   window.addEventListener("keyup", handleKeyUp);

  //   return () => {
  //     window.removeEventListener("keydown", handleKeyDown);
  //     window.removeEventListener("keyup", handleKeyUp);
  //   }
  // }, [handleKeyDown, handleKeyUp]);

  // useFrame(() => {
  //   const moveVector = new Vector3();
  //   if (pressedKeys.current.has("w")) {
  //     moveVector.add(new Vector3(0, 0, -moveSpeed));
  //   }
  //   if (pressedKeys.current.has("s")) {
  //     moveVector.add(new Vector3(0, 0, moveSpeed));
  //   }
  //   if (pressedKeys.current.has("a")) {
  //     moveVector.add(new Vector3(-moveSpeed, 0, 0));
  //   }
  //   if (pressedKeys.current.has("d")) {
  //     moveVector.add(new Vector3(moveSpeed, 0, 0));
  //   }
  //   console.log(moveVector);
  //   perspectiveRef.current.position.add(moveVector);
  // });


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
  // });
}

export default SwitchableCamera;
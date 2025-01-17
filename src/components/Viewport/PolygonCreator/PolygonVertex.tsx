import { TransformControls } from "@react-three/drei";
import { Mesh, Vector3 } from "three";
import useOrbitTransformSync from "../../../hooks/useOrbitTransformSync";
import { useEffect, useRef, useState } from "react";
import useEditorStore, { EditorState, PolygonToolMode } from "../../../hooks/useEditorStore";

interface VertexObjectProps {
  position: Vector3;
  // eslint-disable-next-line no-unused-vars
  setPosition: (position: Vector3) => void;
  isSelected: boolean;
  setAsSelected: () => void;
  color: string;
  // eslint-disable-next-line no-unused-vars
  tryPolygonCompletion: (position: Vector3) => void;
}

const PolygonVertex: React.FC<VertexObjectProps> = ({ position, setPosition, isSelected, setAsSelected, color, tryPolygonCompletion }) => {
  const { setIsTransforming } = useOrbitTransformSync();
  const { polygonToolMode } = useEditorStore((state) => state as EditorState);

  // keep a ref and  a state for manipulation
  const sphereRef = useRef<Mesh>(null);
  const [sphereObject, setSphereObject] = useState<Mesh | null>(null);
  useEffect(() => {
    if (sphereRef.current) {
      setSphereObject(sphereRef.current);
    }
  }, [sphereRef]);

  // when transforming, update the position
  const onTransform = () => {
    if (!sphereRef.current) return;

    const obj = sphereRef.current;
    const pos = obj.position;
    setPosition(pos);
  }

  // What happens when the mesh is clicked
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onMeshClick = (event: any) => {
    // selecting vertices is only allowed in edit mode
    if (polygonToolMode === PolygonToolMode.CREATE) {
      event.stopPropagation();
      // if we are in Create mode, try to complete the polygon
      tryPolygonCompletion(position);
    }


    // When we are in Edit mode, select the vertex
    if (polygonToolMode === PolygonToolMode.EDIT) {
      event.stopPropagation();
      setAsSelected();
    }
  }

  return (
    <>
      <mesh position={position} ref={sphereRef} onClick={onMeshClick}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {isSelected &&
        <TransformControls
          object={sphereObject || undefined}
          position={position}
          mode="translate"
          onMouseDown={() => setIsTransforming(true)}
          onMouseUp={() => setIsTransforming(false)}
          onChange={onTransform}
        />
      }
    </>
  );
};

export default PolygonVertex;
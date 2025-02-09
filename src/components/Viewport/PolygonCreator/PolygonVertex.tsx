import { Html, TransformControls } from "@react-three/drei";
import { Mesh, Vector3 } from "three";
import useTransformingSync from "../../../hooks/useTransformingSync";
import { useEffect, useRef, useState } from "react";
import useEditorStore, { EditorState, PolygonToolMode } from "../../../hooks/useEditorStore";

type VertexObjectProps = {
  position: Vector3;
  setPosition: (position: Vector3) => void;
  isSelected: boolean;
  setAsSelected: () => void;
  pointIndex: number;
  color: string;
  tryPolygonCompletion: (position: Vector3) => void;
};

const PolygonVertex: React.FC<VertexObjectProps> = ({ position, setPosition, isSelected, setAsSelected, pointIndex, color, tryPolygonCompletion }) => {
  const { setIsTransforming } = useTransformingSync();
  const { polygonToolMode, showLabels } = useEditorStore((state) => state as EditorState);

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
      {showLabels &&
        <Html position={position} style={{ pointerEvents: 'none' }}>
          <div style={{ height: "0.2em" }} />
          <div style={{ color: color, fontSize: '0.7em' }}>{pointIndex}</div>
        </Html>
      }
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
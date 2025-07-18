import { useState } from "react";
import useEditorStore, { EditorState, PolygonToolMode } from "../../../hooks/state/useEditorStore";
import { DoubleSide, Vector3 } from "three";
import useMultiPolygonStore from "../../../hooks/state/useMultiPolygonStore";
import { useParams } from "react-router-dom";


type CreatorSurfaceProps = {
  addPoint: (position: Vector3) => void;
}

const CreatorSurface = ({ addPoint }: CreatorSurfaceProps) => {

  const { polygonHeight, polygonSize, polygonToolMode } = useEditorStore((state) => state as EditorState);
  const { setSelectedPolygon } = useMultiPolygonStore();
  const id = Number(useParams<{ id: string }>().id);
  const [isDragging, setIsDragging] = useState(false);

  // dragging helpers
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handlePointerDown = (event: any) => {
    event.stopPropagation();
    setIsDragging(false);
  };
  const handlePointerMove = () => {
    setIsDragging(true);
  };

  // adding a new point when surface is clicked
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handlePointerUp = (event: any) => {
    if (polygonToolMode === PolygonToolMode.CREATE) {
      event.stopPropagation();
      if (isDragging) return;

      const { x, y, z } = event.point;
      addPoint(new Vector3(x, y, z));
    }
    if (polygonToolMode === PolygonToolMode.EDIT) {
      event.stopPropagation();
      if (isDragging) return;
      setSelectedPolygon(id, [null, null]);
    }
  }

  return (
    <mesh
      rotation={[Math.PI / 2, 0, 0]}
      position={[0, polygonHeight, 0]}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <planeGeometry args={[polygonSize, polygonSize]} />
      <meshStandardMaterial
        color="lightblue"
        side={DoubleSide}
        opacity={0.5}
        transparent={true}
      />
    </mesh>
  )
}

export default CreatorSurface;
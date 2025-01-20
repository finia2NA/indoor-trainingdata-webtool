import { BufferGeometry, DoubleSide, Vector3, BufferAttribute } from "three";
import usePolygonStore, { PolygonState } from "../../../hooks/usePolygonStore";
import { useEffect, useMemo, useRef } from "react";

type PolygonHeightDisplayProps = {
  polygon: Vector3[];
  height: number;
}

const PolygonHeightDisplay = ({ polygon, height }: PolygonHeightDisplayProps) => {

  // enable updates
  const bufferRef = useRef<BufferGeometry | null>(null);

  // Get verts
  const vertices = useMemo(() => {
    const upperVerts = polygon.map((point) => point.clone().add(new Vector3(0, height, 0)));
    const lowerVerts = polygon.map((point) => point.clone().add(new Vector3(0, -height, 0)));
    return [...upperVerts, ...lowerVerts];
  }, [polygon, height]);

  const faces = useMemo(() => {
    // Get side faces
    const upper = (index: number) => index % polygon.length;
    const lower = (index: number) => (index % polygon.length) + polygon.length;
    const result = [];
    for (let i = 0; i < polygon.length; i++) {
      result.push([
        [upper(i), lower(i), lower(i + 1)],
        [upper(i), lower(i + 1), upper(i + 1)],
      ]);
    }
    // Get upper faces
    for (let i = 0; i < polygon.length; i++) {
      result.push([
        [upper(0), upper(i), upper(i + 1)],
        [lower(0), lower(i + 1), lower(i)],
      ]);

    }
    return result;
  }, [polygon]);



  // create data for geometry
  const positions = useMemo(() => vertices.flatMap((vertex) => [vertex.x, vertex.y, vertex.z]), [vertices]);
  const indices = useMemo(() => faces.flat().flat(), [faces]);

  // update buffer geometry on change
  useEffect(() => {
    if (!bufferRef.current) return;
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(new Float32Array(positions), 3));
    geometry.setIndex(indices);
    bufferRef.current.copy(geometry);
  }, [positions, indices]);

  return (
    <>
      <mesh>
        <bufferGeometry ref={bufferRef} />
        <meshStandardMaterial color="red" opacity={0.5} transparent={true} />
      </mesh>
      {vertices.map((vertex, index) => (
        <mesh key={index} position={vertex}>
          <sphereGeometry args={[0.02, 16, 16]} />
          <meshStandardMaterial color="blue" />
        </mesh>
      ))}
    </>
  )
}



const HeightDisplay = () => {
  const { polygons, offset } = usePolygonStore();

  return (
    <>
      {polygons.map((polygon, index) => (
        <PolygonHeightDisplay key={index} polygon={polygon} height={offset} />
      ))}
    </>
  );

};

export default HeightDisplay;
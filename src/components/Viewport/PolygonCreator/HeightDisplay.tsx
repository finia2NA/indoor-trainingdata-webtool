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

  // Get side faces
  const faces = useMemo(() => {
    const upper = (index: number) => index % polygon.length;
    const lower = (index: number) => (index % polygon.length) + polygon.length;
    const result = [];
    for (let i = 0; i < polygon.length; i++) {
      result.push([
        [upper(i), lower(i), lower(i + 1)],
        [upper(i), lower(i + 1), upper(i + 1)],
      ]);
    }
    return result;
  }, [polygon]);

  // Get upper faces (TODO)

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

  console.log("updated!")
  return (
    <>
      <mesh>
        <bufferGeometry ref={bufferRef} />
        <meshStandardMaterial color="red" side={DoubleSide} />
      </mesh>
      {vertices.map((vertex, index) => (
        <mesh key={index} position={vertex}>
          <sphereGeometry args={[0.03, 16, 16]} />
          <meshStandardMaterial color="blue" opacity={0.5} transparent={true} />
        </mesh>
      ))}
    </>
  )
}



const HeightDisplay = () => {
  const { getPolygons, offset } = usePolygonStore((state) => ({
    getPolygons: state.getPolygons,
    offset: state.offset,
  }));

  const polygons = getPolygons();

  return (
    <>
      {polygons.map((polygon, index) => (
        <PolygonHeightDisplay key={index} polygon={polygon} height={offset} />
      ))}
    </>
  );

};

export default HeightDisplay;
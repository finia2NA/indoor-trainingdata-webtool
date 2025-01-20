import { Tree } from "react-arborist";
import usePolygonStore from "../../hooks/usePolygonStore.ts";
import { useMemo, useState } from "react";
import { PiDotFill, PiFolder, PiPolygon, PiTrash } from "react-icons/pi";

type NodeType = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  node: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  style: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dragHandle?: any
};

function Node({ node, style, dragHandle }: NodeType) {
  const [isHovered, setIsHovered] = useState(false);

  const type = node.data.type;

  let icon = null;
  switch (type) {
    case 'Polygon':
      icon = <PiPolygon />;
      break;
    case 'Point':
      icon = <PiDotFill />;
      break;
    case 'Folder':
      icon = <PiFolder />;
      break;
  }

  return (
    <div
      style={{ ...style }}
      ref={dragHandle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex row justify-between hover:bg-[#31364d] p-1 place-items-center">
        <div className="flex flex-row gap-1 place-items-center">
          {icon}
          {node.data.name}
          {node.data.coord && <span>({node.data.coord.x.toFixed(2)}, {node.data.coord.y.toFixed(2)}, {node.data.coord.z.toFixed(2)})</span>}
        </div>
        {isHovered && <PiTrash />}
      </div>
    </div>
  );
}

const Polygontree = () => {
  const { polygons } = usePolygonStore();

  const data = useMemo(() => {
    return polygons.map((polygon, polygonIndex) => ({
      id: `Poly-${polygonIndex}`,
      name: `Polygon ${polygonIndex}`,
      type: 'Polygon',
      children: polygon.map((point, pointIndex) => ({
        id: `Poly-${polygonIndex}-Point-${pointIndex}`,
        name: `Point ${pointIndex}`,
        type: 'Point',
        coord: point,
      })),
    }));
  }, [polygons]);

  return (
    <>
      <Tree data={data}>
        {Node}
      </Tree>
    </>
  )
}

export default Polygontree;
import { Tree } from "react-arborist";
import usePolygonStore from "../../hooks/usePolygonStore.ts";
import { useMemo, useState } from "react";
import { PiDotFill, PiFolder, PiPolygon, PiTrash } from "react-icons/pi";
import { InteractiveInput } from "@designbyadrian/react-interactive-input";

type CoordinateProps = {
  x: number,
  y: number,
  z: number,
  // eslint-disable-next-line no-unused-vars
  handleLocationChange: (newValue: number, index: number) => void
};

type NodeProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  node: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  style: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dragHandle?: any
};

const Coordinate = ({ x, y, z, handleLocationChange }: CoordinateProps) => {

  const data = [
    { name: 'x', value: x },
    { name: 'y', value: y },
    { name: 'z', value: z },
  ];

  return (
    // TODO: this works, but the row is not high enough to contain the input fields
    // <div className="flex flex-row gap-1">
    //   {data.map((item, index) => (
    //     <InteractiveInput
    //       className="w-16 h-4 bg-dim_gray p-0"
    //       key={index}
    //       type="number"
    //       value={item.value}
    //       onChange={(e) => handleLocationChange(parseFloat(e.target.value), index)}
    //     />
    //   ))}
    // </div>
    <div className="flex flex-row gap-1">
      {data.map((item, index) => (
        <div key={index} className="flex flex-row gap-1">
          <span>{item.value.toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}

function Node({ node, style, dragHandle }: NodeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { setPolygons, polygons, setSelectedPolygon, deletePolygon, deletePoint } = usePolygonStore();

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

  const handleNodeClick = () => {
    if (type === 'Point') {
      setSelectedPolygon([node.data.polygonIndex, node.data.pointIndex]);
    }
  };

  const handleTrashClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (type === 'Point') {
      deletePoint(node.data.polygonIndex, node.data.pointIndex);
    }
    if (type === 'Polygon') {
      deletePolygon(node.data.polygonIndex);
    }
  };

  const handlePointLocationChange = (newValue: number, index: number) => {
    if (node.data.type === 'Point') {
      const oldLocation = node.data.coord;
      const newLocation = oldLocation.clone().setComponent(index, newValue);
      const updatedPolygons = [...polygons];
      updatedPolygons[node.data.polygonIndex][node.data.pointIndex] = newLocation;
      setPolygons(updatedPolygons);
    }
  }

  return (
    <div
      style={{ ...style }}
      ref={dragHandle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`flex row justify-between p-1 place-items-center ${node.data.isSelected ? 'bg-tropical_indigo' : 'hover:bg-[#31364d]'}`}
        onClick={handleNodeClick}
      >
        <div className="flex flex-row gap-1 place-items-center">
          {icon}
          {node.data.name}
          {/* {node.data.coord && <span>({node.data.coord.x.toFixed(2)}, {node.data.coord.y.toFixed(2)}, {node.data.coord.z.toFixed(2)})</span>} */}
          {node.data.coord && <Coordinate x={node.data.coord.x} y={node.data.coord.y} z={node.data.coord.z} handleLocationChange={handlePointLocationChange} />}
        </div>
        {(isHovered || node.data.isSelected) && <PiTrash onClick={handleTrashClick} />}
      </div>
    </div>
  );
}

const Polygontree = () => {
  const { polygons, selectedPolygon } = usePolygonStore();

  const data = useMemo(() => {
    return polygons.map((polygon, polygonIndex) => ({
      id: `Poly-${polygonIndex}`,
      name: `Polygon ${polygonIndex}`,
      polygonIndex: polygonIndex,
      type: 'Polygon',
      children: polygon.map((point, pointIndex) => ({
        id: `Poly-${polygonIndex}-Point-${pointIndex}`,
        name: `Point ${pointIndex}`,
        polygonIndex: polygonIndex,
        pointIndex: pointIndex,
        isSelected: pointIndex === selectedPolygon[1] && polygonIndex === selectedPolygon[0],
        type: 'Point',
        coord: point,
      })),
    }));
  }, [polygons, selectedPolygon]);

  return (
    <>
      <Tree data={data} selection="single">
        {Node}
      </Tree>
    </>
  )
}

export default Polygontree;
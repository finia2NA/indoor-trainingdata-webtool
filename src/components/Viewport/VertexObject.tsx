import { TransformControls } from "@react-three/drei";
import { Mesh, Vector3 } from "three";
import useOrbitTransformSync from "../../hooks/useOrbitTransformSync";
import { useEffect, useRef, useState } from "react";

interface VertexObjectProps {
  position: Vector3;
  // eslint-disable-next-line no-unused-vars
  setPosition: (position: Vector3) => void;
  isSelected: boolean;
  color: string;
}

const VertexObject: React.FC<VertexObjectProps> = ({ position, setPosition, isSelected, color }) => {
  const { setIsTransforming } = useOrbitTransformSync();

  const sphereRef = useRef<Mesh>(null);
  const [sphereObject, setSphereObject] = useState<Mesh | null>(null);

  useEffect(() => {
    if (sphereRef.current) {
      setSphereObject(sphereRef.current);
    }
  }, [sphereRef]);


  const onTransform = () => {
    if (!sphereRef.current) return;

    const obj = sphereRef.current;
    const pos = obj.position;
    setPosition(pos);
  }

  return (
    <>
      <mesh position={position} ref={sphereRef}>
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

export default VertexObject;
import { useFrame, useThree } from "@react-three/fiber";
import useCameraPoseStore from "../../hooks/useCameraPoseStore";
const CameraPosLogging = () => {
  const { camera } = useThree();
  const { setCameraPosition, setCameraRotation } = useCameraPoseStore();
  useFrame(() => {
    setCameraPosition(camera.position.toArray());
    setCameraRotation(camera.rotation.toArray());
  });
  return null;
}

export default CameraPosLogging;
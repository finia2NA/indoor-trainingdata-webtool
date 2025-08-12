import { useFrame, useThree } from "@react-three/fiber";
import useCameraPoseStore from "../../hooks/sync/useCameraPoseStore";
const CameraPosLogging = () => {
  const { camera } = useThree();
  const { setCurrentCameraPosition, setCurrentCameraRotation } = useCameraPoseStore();
  useFrame(() => {
    setCurrentCameraPosition(camera.position.toArray());
    setCurrentCameraRotation([camera.rotation.x, camera.rotation.y, camera.rotation.z]);
  });
  return null;
}

export default CameraPosLogging;
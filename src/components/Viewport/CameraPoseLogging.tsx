import { useFrame, useThree } from "@react-three/fiber";
import useCameraPoseStore from "../../hooks/sync/useCameraPoseStore";
const CameraPosLogging = () => {
  const { camera } = useThree();
  const { setReactiveCameraPosition, setReactiveCameraRotation } = useCameraPoseStore();
  useFrame(() => {
    setReactiveCameraPosition(camera.position.toArray());
    setReactiveCameraRotation([camera.rotation.x, camera.rotation.y, camera.rotation.z]);
  });
  return null;
}

export default CameraPosLogging;
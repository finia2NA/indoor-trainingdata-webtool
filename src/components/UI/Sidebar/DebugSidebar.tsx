
import { InteractiveInput } from "@designbyadrian/react-interactive-input";
import { Project } from "../../../data/db";
import SidebarSection from "./SidebarSection";
import useDebugStore from "../../../hooks/state/useDebugStore";


const DebugSidebar = ({ project }: { project: Project }) => {
  const {
    useAmbientLight,
    setUseAmbientLight,
    ambientLightIntensity,
    setAmbientLightIntensity,
    pointLightActive,
    setPointLightActive,
    pointLightX,
    setPointLightX,
    pointLightY,
    setPointLightY,
    pointLightZ,
    setPointLightZ,
  } = useDebugStore();

  return (
    <SidebarSection title="Debug">
      <SidebarSection title="Ambient Light" level={2}>
        <div className="flex flex-col gap-4">
          <div className="flex items-center">
            <label className="w-40">Use ambient light</label>
            <input
              type="checkbox"
              className="ml-2"
              checked={useAmbientLight}
              onChange={(e) => setUseAmbientLight(e.target.checked)}
            />
          </div>
          <div className="flex items-center">
            <label htmlFor="offset" className="w-40">Ambient Light Intensity</label>
            <InteractiveInput
              id="offset"
              className="w-24 ml-2 text-center bg-inactive"
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={ambientLightIntensity}
              onChange={(e) => setAmbientLightIntensity(Number(e.target.value))}
            />
          </div>
        </div>
      </SidebarSection>
      <SidebarSection title="Point Light" level={2}>
        <div className="flex flex-col gap-4">
          <div className="flex items-center">
            <label className="w-40">Point light active</label>
            <input
              type="checkbox"
              className="ml-2"
              checked={pointLightActive}
              onChange={(e) => setPointLightActive(e.target.checked)}
            />
          </div>
          <div className="flex items-center">
            <label htmlFor="pointLightX" className="w-40">Position X</label>
            <InteractiveInput
              id="pointLightX"
              className="w-24 ml-2 text-center bg-inactive"
              type="number"
              step={0.1}
              value={pointLightX}
              onChange={(e) => setPointLightX(Number(e.target.value))}
            />
          </div>
          <div className="flex items-center">
            <label htmlFor="pointLightY" className="w-40">Position Y</label>
            <InteractiveInput
              id="pointLightY"
              className="w-24 ml-2 text-center bg-inactive"
              type="number"
              step={0.1}
              value={pointLightY}
              onChange={(e) => setPointLightY(Number(e.target.value))}
            />
          </div>
          <div className="flex items-center">
            <label htmlFor="pointLightZ" className="w-40">Position Z</label>
            <InteractiveInput
              id="pointLightZ"
              className="w-24 ml-2 text-center bg-inactive"
              type="number"
              step={0.1}
              value={pointLightZ}
              onChange={(e) => setPointLightZ(Number(e.target.value))}
            />
          </div>
        </div>
      </SidebarSection>
    </SidebarSection>
  );
}

export default DebugSidebar;
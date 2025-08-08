
import { InteractiveInput } from "@designbyadrian/react-interactive-input";
import { Project } from "../../../data/db";
import SidebarSection from "./SidebarSection";
import useDebugStore from "../../../hooks/state/useDebugStore";
import useCameraPoseStore from "../../../hooks/sync/useCameraPoseStore";
import PoseList from "./PoseList";


const DebugSidebar = ({ project: _project }: { project: Project }) => {
  const { moveCameraTo } = useCameraPoseStore();
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
    pointLightIntensity,
    setPointLightIntensity,
    pointLightDistance,
    setPointLightDistance,
    pointLightDecay,
    setPointLightDecay,
    renderScreenshotsFromAbove,
    setRenderScreenshotsFromAbove,
  measuringActive,
  setMeasuringActive,
  measuredPoint,
  clearMeasuredPoint,
  } = useDebugStore();

  const handleTestCameraMovement = () => {
    // Generate random position
    const randomPosition: [number, number, number] = [
      (Math.random() - 0.5) * 10, // Random x between -5 and 5
      Math.random() * 8 + 2,      // Random y between 2 and 10
      (Math.random() - 0.5) * 10  // Random z between -5 and 5
    ];
    // Set target near the position
    const target: [number, number, number] = [
      randomPosition[0] + (Math.random() - 0.5) * 2,
      randomPosition[1] - 1,
      randomPosition[2] + (Math.random() - 0.5) * 2
    ];
    moveCameraTo(randomPosition, target);
  };

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
              max={5}
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
          <div className="flex items-center">
            <label htmlFor="pointLightIntensity" className="w-40">Intensity</label>
            <InteractiveInput
              id="pointLightIntensity"
              className="w-24 ml-2 text-center bg-inactive"
              type="number"
              min={0}
              max={10}
              step={0.1}
              value={pointLightIntensity}
              onChange={(e) => setPointLightIntensity(Number(e.target.value))}
            />
          </div>
          <div className="flex items-center">
            <label htmlFor="pointLightDistance" className="w-40">Distance</label>
            <InteractiveInput
              id="pointLightDistance"
              className="w-24 ml-2 text-center bg-inactive"
              type="number"
              min={0}
              max={100}
              step={1}
              value={pointLightDistance}
              onChange={(e) => setPointLightDistance(Number(e.target.value))}
            />
          </div>
          <div className="flex items-center">
            <label htmlFor="pointLightDecay" className="w-40">Decay</label>
            <InteractiveInput
              id="pointLightDecay"
              className="w-24 ml-2 text-center bg-inactive"
              type="number"
              min={0}
              max={5}
              step={0.1}
              value={pointLightDecay}
              onChange={(e) => setPointLightDecay(Number(e.target.value))}
            />
          </div>
        </div>
      </SidebarSection>
      <SidebarSection title="Screenshots" level={2}>
        <div className="flex flex-col gap-4">
          <div className="flex items-center">
            <label className="w-40">Render from above</label>
            <input
              type="checkbox"
              className="ml-2"
              checked={renderScreenshotsFromAbove}
              onChange={(e) => setRenderScreenshotsFromAbove(e.target.checked)}
            />
          </div>
        </div>
      </SidebarSection>
      <SidebarSection title="Measuring" level={2}>
        <div className="flex flex-col gap-3">
          <div className="flex items-center">
            <label className="w-40">Measure mode</label>
            <input
              type="checkbox"
              className="ml-2"
              checked={measuringActive}
              onChange={(e) => setMeasuringActive(e.target.checked)}
            />
          </div>
          <div className="text-xs text-gray-300">
            {measuredPoint ? (
              <div className="flex items-center gap-2">
                <span>Last:</span>
                <span>
                  [{measuredPoint.map((v) => v.toFixed(3)).join(', ')}]
                </span>
                <button
                  className="ml-auto px-2 py-1 bg-neutral-700 rounded hover:bg-neutral-600"
                  onClick={clearMeasuredPoint}
                >
                  Clear
                </button>
              </div>
            ) : (
              <span>Click a mesh to record position</span>
            )}
          </div>
        </div>
      </SidebarSection>
      <SidebarSection title="Camera Movement" level={2}>
        <div className="flex flex-col gap-4">
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            onClick={handleTestCameraMovement}
          >
            Move Camera to Random Position
          </button>
        </div>
      </SidebarSection>
      <PoseList />
    </SidebarSection>
  );
}

export default DebugSidebar;
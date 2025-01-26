import { InteractiveInput } from "@designbyadrian/react-interactive-input";
import usePolygonStore from "../../../hooks/usePolygonStore";
import SidebarSection from "./SidebarSection";


const GenerateSidebar = () => {
  const { offset, setOffset } = usePolygonStore();


  return (
    <SidebarSection title="Generate">
      <label htmlFor="offset" className="block text-sm font-medium text-gray-700">Offset</label>
      <InteractiveInput
        id="offset"
        className='w-32 text-right bg-dim_gray basis-1/3'
        type="number"
        min={0} max={1} step={0.01}
        value={offset}
        onChange={(e) => setOffset(parseFloat(e.target.value))}
      />

      {/* Mode: single, pair */}
      {/* If pair, distance */}

      {/* Angle */}

      {/* Format */}

      {/* #images */}
    </SidebarSection>
  )



}

export default GenerateSidebar;
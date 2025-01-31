import { InteractiveInput } from "@designbyadrian/react-interactive-input";
import usePolygonStore from "../../../hooks/usePolygonStore";
import SidebarSection from "./SidebarSection";
import { useState } from "react";
import { Slider } from "@mui/material";
import AngleDisplay from "../../Viewport/Minipanels/AngleDisplay";
import DistributionViz from "../../Viewport/Minipanels/DistributionViz";


const GenerateSidebar = () => {
  const { offset, setOffset } = usePolygonStore();


  const [angles, setAngles] = useState([-10, 10]);
  const [anglesConcentration, setAnglesConcentration] = useState(0.5);

  const [pair, setPair] = useState(false);
  const [distanceOffset, setDistanceOffset] = useState([0, 0.2]);
  const [distanceConcentration, setDistanceConcentration] = useState(0.5);
  const [angleOffset, setAngleOffset] = useState(10);
  const [angleConcentration, setAngleConcentration] = useState(0.5);


  const [numImages, setNumImages] = useState(1000);
  const [imageSize, setImageSize] = useState([256, 256]);

  // TODO: make add global stored states

  return (
    <SidebarSection title="Generate">
      <SidebarSection title="Poses" level={3}>
        {/* 
        - Offset input
        - Angle (min, max) slider
        - Pair, Single checkbox
        */}

        {/* OFFSET */}
        <div className="flex items-center mb-2">
          <label htmlFor="offset" className="mr-2 w-20">Offset</label>
          <InteractiveInput
            id="offset"
            className='w-32 text-right bg-dim_gray basis-1/3'
            type="number"
            min={0} max={1} step={0.01}
            value={offset}
            onChange={(e) => setOffset(parseFloat(e.target.value))}
          />
        </div>

        {/* ANGLES */}
        <SidebarSection title="Angles" level={4}>
          <div className="flex items-center mb-2 gap-2">
            <div className="w-10/12">
              <label htmlFor="angle" className="mr-2 w-20">Angles Range</label>
              <Slider
                // TODO: theming (color prop)
                getAriaLabel={() => 'Angles Range'}
                value={angles}
                onChange={(_, value) => setAngles(value as number[])}
                valueLabelDisplay="auto"
                getAriaValueText={(value) => `${value}°`}
                min={-90}
                max={90}
              />
            </div>
            <AngleDisplay minAngle={angles[0]} maxAngle={angles[1]} />
          </div>
          <div className="w-10/12">
            <label htmlFor="dist" className="mr-2 w-20">Angles Distribution</label>
            <Slider
              // TODO: theming (color prop)
              getAriaLabel={() => 'Angles Distribution'}
              value={anglesConcentration}
              onChange={(_, value) => setAnglesConcentration(value as number)}
              valueLabelDisplay="auto"
              min={0}
              max={1}
              step={0.01}
            />
          </div>
          <DistributionViz concentration={anglesConcentration} />
        </SidebarSection>

        {/* Pairwise */}
        <SidebarSection title="Pairwise Generation" level={4}>
          <div className="flex items-center mb-2">
            <label htmlFor="pair" className="mr-2 w-400">Generate Pairs</label>
            <input
              id="pair"
              type="checkbox"
              checked={pair}
              onChange={(e) => setPair(e.target.checked)}
            />
          </div>
          {pair &&
            <div>
              <div className="flex items-center mb-2">
                <label htmlFor="distance" className="mr-2 w-20">Distance Range</label>
                <Slider
                  getAriaLabel={() => 'Distance Range'}
                  value={distanceOffset}
                  onChange={(_, value) => setDistanceOffset(value as number[])}
                  valueLabelDisplay="auto"
                  getAriaValueText={(value) => `${value}m`}
                  min={0}
                  max={1}
                  step={0.01}
                />
              </div>

              <label htmlFor="dist" className="mr-2 w-20">Distance Distribution</label>
              <Slider
                getAriaLabel={() => 'Distance Distribution'}
                value={distanceConcentration}
                onChange={(_, value) => setDistanceConcentration(value as number)}
                valueLabelDisplay="auto"
                min={0}
                max={1}
                step={0.01}
              />
              <DistributionViz concentration={distanceConcentration} />

              <label htmlFor="dist" className="mr-2 w-20">Angle Offset</label>
              <Slider
                getAriaLabel={() => 'Angle Offset'}
                value={angleOffset}
                onChange={(_, value) => setAngleOffset(value as number)}
                valueLabelDisplay="auto"
                getAriaValueText={(value) => `${value}°`}
                min={0}
                max={180}
              />

              <label htmlFor="dist" className="mr-2 w-20">Angle Distribution</label>
              <Slider
                getAriaLabel={() => 'Angle Offset Distribution'}
                value={angleConcentration}
                onChange={(_, value) => setAngleConcentration(value as number)}
                valueLabelDisplay="auto"
                min={0}
                max={1}
                step={0.01}
              />
              <DistributionViz concentration={angleConcentration} />
            </div>
          }
        </SidebarSection>


      </SidebarSection>

      {/* Images */}
      <SidebarSection title="Format" level={3}>
        <div className="flex items-center mb-2">
          <label htmlFor="numImages" className="mr-2 w-20">Number of Images</label>
          <InteractiveInput
            id="numImages"
            className='w-32 text-right bg-dim_gray basis-1/3'
            type="number"
            min={1} step={1}
            value={numImages}
            onChange={(e) => setNumImages(parseInt(e.target.value))}
          />
        </div>

        <div className="flex items-center mb-2">
          <label htmlFor="imageSize" className="mr-2 w-20">Image Size</label>
          <div className="flex gap-2">
            {imageSize.map((size, index) => (
              <InteractiveInput
                key={index}
                id="imageSize"
                className='w-16 text-right bg-dim_gray basis-1/4'
                type="number"
                min={32}
                step={16}
                max={2048}
                value={size}
                onChange={(e) => {
                  const newSize = [...imageSize];
                  newSize[index] = parseInt(e.target.value);
                  setImageSize(newSize);
                }}
              />
            ))}
          </div>
        </div>
      </SidebarSection>
    </SidebarSection>
  )

}

export default GenerateSidebar;
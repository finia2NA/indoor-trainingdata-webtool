import { InteractiveInput } from "@designbyadrian/react-interactive-input";
import SidebarSection from "./SidebarSection";
import { Slider } from "@mui/material";
import AngleDisplay from "../../Viewport/Minipanels/AngleDisplay";
import DistributionViz from "../../Viewport/Minipanels/DistributionViz";
import { useParams } from "react-router-dom";
import useMultiGenerationStore, { GenPair } from "../../../hooks/useMultiGenerationStore";
import { ResetConfirmationToast } from "../Toasts";
import { toast } from "react-toastify";
import useDataGeneratorUtils from "../../../hooks/useDataGeneratorUtils";
import usePrecomputedPoses from "../../../hooks/usePrecomputedPoses";


const GenerateSidebar = () => {
  const id = Number(useParams<{ id: string }>().id);

  const { generatePoses, takeScreenshots } = useDataGeneratorUtils();
  const { poses } = usePrecomputedPoses();

  // Declaring here, then getting them from the store so that we don't polute the main closure with id-independent variables and functions
  let offset, angles, anglesConcentration, avoidWalls, pair, pairDistanceRange, pairDistanceConcentration, pairAngleOffset, pairAngleConcentration, fovRange, fovConcentration, numSeries, imageSize;
  let setHeightOffset, setAnglesRange, setAnglesConcentration, setAvoidWalls, setDoPair, setPairDistanceRange, setPairDistanceConcentration, setPairAngleRange, setAngleConcentration, setFovRange, setFovConcentration, setNumSeries, setImageSize, reset;
  {
    // getting values from store
    const {
      getHeightOffset,
      setHeightOffset: storeSetHeightOffset,
      getAnglesRange,
      setAnglesRange: storeSetAnglesRange,
      getAnglesConcentration,
      setAnglesConcentration: storeSetAnglesConcentration,
      getAvoidWalls,
      setAvoidWalls: storeSetAvoidWalls,
      getDoPairGeneration,
      setDoPairGeneration: storeSetDoPairGeneration,
      getPairDistanceRange,
      setPairDistanceRange: storeSetPairDistanceRange,
      getPairDistanceConcentration,
      setPairDistanceConcentration: storeSetPairDistanceConcentration,
      getPairAngle,
      setPairAngle: storeSetPairAngle,
      getPairAngleConcentration,
      setPairAngleConcentration: storeSetPairAngleConcentration,
      getFovRange,
      setFovRange: storeSetFovRange,
      getFovConcentration,
      setFovConcentration: storeSetFovConcentration,
      getNumSeries,
      setNumSeries: storeSetNumSeries,
      getImageDimensions,
      setImageDimensions: storeSetImageDimensions,
      reset: storeReset
    } = useMultiGenerationStore();
    offset = getHeightOffset(id);
    angles = getAnglesRange(id);
    anglesConcentration = getAnglesConcentration(id);
    avoidWalls = getAvoidWalls(id);
    pair = getDoPairGeneration(id);
    pairDistanceRange = getPairDistanceRange(id);
    pairDistanceConcentration = getPairDistanceConcentration(id);
    pairAngleOffset = getPairAngle(id);
    pairAngleConcentration = getPairAngleConcentration(id);
    fovRange = getFovRange(id);
    fovConcentration = getFovConcentration(id);
    numSeries = getNumSeries(id);
    imageSize = getImageDimensions(id);

    setHeightOffset = (offset: number) => storeSetHeightOffset(id, offset);
    setAnglesRange = (angles: GenPair) => storeSetAnglesRange(id, angles);
    setAnglesConcentration = (concentration: number) => storeSetAnglesConcentration(id, concentration);
    setAvoidWalls = (avoid: boolean) => storeSetAvoidWalls(id, avoid);
    setDoPair = (doPair: boolean) => storeSetDoPairGeneration(id, doPair);
    setPairDistanceRange = (distanceRange: GenPair) => storeSetPairDistanceRange(id, distanceRange);
    setPairDistanceConcentration = (concentration: number) => storeSetPairDistanceConcentration(id, concentration);
    setPairAngleRange = (val: number) => storeSetPairAngle(id, val);
    setAngleConcentration = (concentration: number) => storeSetPairAngleConcentration(id, concentration);
    setFovRange = (range: GenPair) => storeSetFovRange(id, range);
    setFovConcentration = (concentration: number) => storeSetFovConcentration(id, concentration);
    setNumSeries = (numSeries: number) => storeSetNumSeries(id, numSeries);
    setImageSize = (size: [number, number]) => storeSetImageDimensions(id, size);
    reset = () => storeReset(id);
  }

  const resetHandler = () => {
    toast.warn(ResetConfirmationToast,
      {
        type: 'warning',
        onClose: (reason) => {
          if (reason === 'reset') {
            reset();
          }
        }
      });
  }

  const heightOffsetHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    // NOTE: limiting in this way does not appear to work
    setHeightOffset(Math.max(parseFloat(e.target.value), 0));
  }

  const takeScreenshotsHandler = () => {
    console.log("Taking screenshots");
    if (poses.length === 0)
      toast.error('Need to generate poses first');
    takeScreenshots();
  }

  const screenshotColor = poses.length === 0 ? "inactive" : "confirm";
  return (
    <SidebarSection title="Generate">
      <SidebarSection title="Poses" level={3}>
        <SidebarSection title="Base Settings" level={4}>
          <div className="flex flex-col mb-2">
            <div className="flex items-center">
              {/* OFFSET */}
              <label htmlFor="offset" className="mr-2 w-20">Offset</label>
              <InteractiveInput
                id="offset"
                className="w-32 text-center bg-inactive basis-1/3"
                type="number"
                min={0}
                max={1}
                step={0.01}
                value={offset}
                onChange={heightOffsetHandler}
              />
            </div>
            <p className="text-gray-400">Determines the height range in which poses are generated around the polygon height</p>
          </div>
          {/* WALL AVOIDANCE */}
          <div className="flex flex-col mb-2">
            <div className="flex items-center">
              <label htmlFor="avoidWalls" className="mr-2 w-400">Avoid Walls</label>
              <input
                id="avoidWalls"
                type="checkbox"
                checked={avoidWalls}
                onChange={(e) => setAvoidWalls(e.target.checked)}
              />
            </div>
            <p className="text-gray-400">If checked, poses close to and looking at a wall are not possible</p>
          </div>
        </SidebarSection>

        {/* ANGLES */}
        <SidebarSection title="Angles" level={4}>
          <div className="flex items-center mb-2 gap-2">
            <div className="w-10/12">
              <label htmlFor="angle" className="mr-2 w-20">Angles Range</label>
              <Slider
                color="secondary"
                getAriaLabel={() => 'Angles Range'}
                value={angles}
                onChange={(_, value) => setAnglesRange(value as GenPair)}
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
              color="secondary"
              getAriaLabel={() => 'Angles Distribution'}
              value={anglesConcentration}
              onChange={(_, value) => setAnglesConcentration(value as number)}
              valueLabelDisplay="auto"
              min={0}
              max={1}
              step={0.01}
            />
          </div>
          <DistributionViz concentration={anglesConcentration} minVal={angles[0]} maxVal={angles[1]} />
        </SidebarSection>

        {/* Pairwise */}
        <SidebarSection title="Pairwise Generation" level={4}>
          <div className="flex items-center mb-2">
            <label htmlFor="pair" className="mr-2 w-400">Generate Pairs</label>
            <input
              id="pair"
              type="checkbox"
              checked={pair}
              onChange={(e) => setDoPair(e.target.checked)}
            />
          </div>
          {pair &&
            <div>
              <div className="flex items-center mb-2">
                <label htmlFor="distance" className="mr-2 w-20">Distance Range</label>
                <Slider
                  color="secondary"
                  getAriaLabel={() => 'Distance Range'}
                  value={pairDistanceRange}
                  onChange={(_, value) => setPairDistanceRange(value as GenPair)}
                  valueLabelDisplay="auto"
                  getAriaValueText={(value) => `${value}m`}
                  min={0}
                  max={1}
                  step={0.01}
                />
              </div>

              <label htmlFor="dist" className="mr-2 w-20">Distance Distribution</label>
              <Slider
                color="secondary"
                getAriaLabel={() => 'Distance Distribution'}
                value={pairDistanceConcentration}
                onChange={(_, value) => setPairDistanceConcentration(value as number)}
                valueLabelDisplay="auto"
                min={0}
                max={1}
                step={0.01}
              />
              <DistributionViz concentration={pairDistanceConcentration} startAtZero minVal={pairDistanceRange[0]} maxVal={pairDistanceRange[1]} />

              <label htmlFor="dist" className="mr-2 w-20">Angle Offset</label>
              <Slider
                color="secondary"
                getAriaLabel={() => 'Angle Offset'}
                value={pairAngleOffset}
                onChange={(_, value) => setPairAngleRange(value as number)}
                valueLabelDisplay="auto"
                getAriaValueText={(value) => `${value}°`}
                min={0}
                max={180}
              />
              <label htmlFor="dist" className="mr-2 w-20">Angle Distribution</label>
              <Slider
                color="secondary"
                getAriaLabel={() => 'Angle Offset Distribution'}
                value={pairAngleConcentration}
                onChange={(_, value) => setAngleConcentration(value as number)}
                valueLabelDisplay="auto"
                min={0}
                max={1}
                step={0.01}
              />
              <DistributionViz concentration={pairAngleConcentration} startAtZero minVal={0} maxVal={pairAngleOffset} />
            </div>
          }
        </SidebarSection>


      </SidebarSection>

      {/* Images */}
      <SidebarSection title="Format" level={3}>

        <SidebarSection title="Camera Settings" level={4} className="mb-2">
          <div className="flex items-center mb-2">
            <label htmlFor="fov" className="mr-2 w-20">FOV Range</label>
            <Slider
              color="secondary"
              getAriaLabel={() => 'FOV range'}
              value={fovRange}
              onChange={(_, value) => setFovRange(value as GenPair)}
              valueLabelDisplay="auto"
              getAriaValueText={(value) => `${value}°`}
              min={40}
              max={120}
              step={1}
            />
          </div>
          <label htmlFor="dist" className="mr-2 w-20">FOV Distribution</label>
          <Slider
            color="secondary"
            getAriaLabel={() => 'FOV Distribution'}
            value={fovConcentration}
            onChange={(_, value) => setFovConcentration(value as number)}
            valueLabelDisplay="auto"
            min={0}
            max={1}
            step={0.01}
          />
          <DistributionViz concentration={fovConcentration} minVal={fovRange[0]} maxVal={fovRange[1]} />
        </SidebarSection>

        <div className="flex items-center mb-2">
          <label htmlFor="numseries" className="mr-2 w-20">Number of Series</label>
          <InteractiveInput
            id="numSeries"
            className='w-32 text-center bg-inactive basis-1/3'
            type="number"
            min={1} step={1}
            value={numSeries}
            onChange={(e) => setNumSeries(parseInt(e.target.value))}
          />
        </div>

        <div className="flex items-center mb-2">
          <label htmlFor="imageSize" className="mr-2 w-20">Image Size</label>
          <div className="flex gap-2">
            {imageSize.map((size, index) => (
              <InteractiveInput
                key={index}
                id="imageSize"
                className='w-16 text-center bg-inactive basis-1/4'
                type="number"
                min={32}
                step={16}
                max={2048}
                value={size}
                onChange={(e) => {
                  const newSize = [...imageSize] as GenPair;
                  newSize[index] = parseInt(e.target.value);
                  setImageSize(newSize);
                }}
              />
            ))}
          </div>
        </div>
      </SidebarSection>
      <SidebarSection title="Generate" level={3}>
        <div className="flex flex-row gap-2 justify-around">
          <button
            className="bg-primary p-1 px-4"
            onClick={() => generatePoses()}
          >Generate Poses</button>
          <button
            className={`bg-${screenshotColor} p-1 px-4`}
            onClick={takeScreenshotsHandler}>
            Take Screenshots
          </button>
          <button
            className="bg-danger p-1 px-4"
            onClick={resetHandler}
          >Reset Generator Settings</button>
        </div>
      </SidebarSection>
    </SidebarSection >

  )

}

export default GenerateSidebar;
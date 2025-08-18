import { InteractiveInput } from "@designbyadrian/react-interactive-input";
import SidebarSection from "./SidebarSection";
import { Slider } from "@mui/material";
import AngleDisplay from "../../Viewport/Minipanels/AngleDisplay";
import DistributionViz from "../../Viewport/Minipanels/DistributionViz";
import InfluenceDisplay from "../../Viewport/Minipanels/InfluenceDisplay";
import { useParams } from "react-router-dom";
import useMultiGenerationStore, { GenPair } from "../../../hooks/state/useMultiGenerationStore";
import { ResetConfirmationToast } from "../Toasts";
import { toast } from "react-toastify";
import useDataGeneratorUtils from "../../../hooks/offscreen/useDataGeneratorUtils";
import usePrecomputedPoses from "../../../hooks/state/usePrecomputedPoses";
import { Project } from "../../../data/db";


const GenerateSidebar = ({ project }: { project: Project }) => {
  const id = Number(useParams<{ id: string }>().id);

  const { generatePoses, takeScreenshots } = useDataGeneratorUtils();
  const { poses, posttrainingPoses } = usePrecomputedPoses();

  // Declaring here, then getting them from the store so that we don't polute the main closure with id-independent variables and functions
  let offset, angles, anglesConcentration, avoidWalls, wallAvoidanceThreshold, pair, pairDistanceRange, pairDistanceConcentration, pairAngleOffset, pairAngleConcentration, fovRange, fovConcentration, numSeries, imageSize, usePosttraining, numPosttrainingImages, use360Shading, maxShadingImages, maxShadingDistance, pitchAngleRange, maxImagesToKeep, influenceRange, weightingMode, polynomialExponent, exponentialBase, polynomialMultiplier, exponentialMultiplier;
  let setHeightOffset, setAnglesRange, setAnglesConcentration, setAvoidWalls, setWallAvoidanceThreshold, setDoPair, setPairDistanceRange, setPairDistanceConcentration, setPairAngleRange, setAngleConcentration, setFovRange, setFovConcentration, setNumSeries, setImageSize, setUsePosttraining, setNumPosttrainingImages, setUse360Shading, setMaxShadingImages, setMaxShadingDistance, setPitchAngleRange, setMaxImagesToKeep, setInfluenceRange, setWeightingMode, setPolynomialExponent, setExponentialBase, setPolynomialMultiplier, setExponentialMultiplier, reset;
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
      getWallAvoidanceThreshold,
      setWallAvoidanceThreshold: storeSetWallAvoidanceThreshold,
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
      getUsePosttrainingImages,
      setUsePosttrainingImages: storeSetUsePosttrainingImages,
      getNumPosttrainingImages,
      setNumPosttrainingImages: storeSetNumPosttrainingImages,
      getUse360Shading,
      setUse360Shading: storeSetUse360Shading,
      getMaxShadingImages,
      setMaxShadingImages: storeSetMaxShadingImages,
      getMaxShadingDistance,
      setMaxShadingDistance: storeSetMaxShadingDistance,
      getPitchAngleRange,
      setPitchAngleRange: storeSetPitchAngleRange,
      getMaxImagesToKeep,
      setMaxImagesToKeep: storeSetMaxImagesToKeep,
      getInfluenceRange,
      setInfluenceRange: storeSetInfluenceRange,
      getWeightingMode,
      setWeightingMode: storeSetWeightingMode,
      getPolynomialExponent,
      setPolynomialExponent: storeSetPolynomialExponent,
      getExponentialBase,
      setExponentialBase: storeSetExponentialBase,
      getPolynomialMultiplier,
      setPolynomialMultiplier: storeSetPolynomialMultiplier,
      getExponentialMultiplier,
      setExponentialMultiplier: storeSetExponentialMultiplier,
      reset: storeReset
    } = useMultiGenerationStore();
    offset = getHeightOffset(id);
    angles = getAnglesRange(id);
    anglesConcentration = getAnglesConcentration(id);
    avoidWalls = getAvoidWalls(id);
    wallAvoidanceThreshold = getWallAvoidanceThreshold(id);
    pair = getDoPairGeneration(id);
    pairDistanceRange = getPairDistanceRange(id);
    pairDistanceConcentration = getPairDistanceConcentration(id);
    pairAngleOffset = getPairAngle(id);
    pairAngleConcentration = getPairAngleConcentration(id);
    fovRange = getFovRange(id);
    fovConcentration = getFovConcentration(id);
    numSeries = getNumSeries(id);
    imageSize = getImageDimensions(id);
    usePosttraining = getUsePosttrainingImages(id);
    numPosttrainingImages = getNumPosttrainingImages(id);
    use360Shading = getUse360Shading(id);
    maxShadingImages = getMaxShadingImages(id);
    maxShadingDistance = getMaxShadingDistance(id);
    pitchAngleRange = getPitchAngleRange(id);
    maxImagesToKeep = getMaxImagesToKeep(id);
    influenceRange = getInfluenceRange(id);
    weightingMode = getWeightingMode(id);
    polynomialExponent = getPolynomialExponent(id);
    exponentialBase = getExponentialBase(id);
    polynomialMultiplier = getPolynomialMultiplier(id);
    exponentialMultiplier = getExponentialMultiplier(id);

    setHeightOffset = (offset: number) => storeSetHeightOffset(id, offset);
    setAnglesRange = (angles: GenPair) => storeSetAnglesRange(id, angles);
    setAnglesConcentration = (concentration: number) => storeSetAnglesConcentration(id, concentration);
    setAvoidWalls = (avoid: boolean) => storeSetAvoidWalls(id, avoid);
    setWallAvoidanceThreshold = (threshold: number) => storeSetWallAvoidanceThreshold(id, threshold);
    setDoPair = (doPair: boolean) => storeSetDoPairGeneration(id, doPair);
    setPairDistanceRange = (distanceRange: GenPair) => storeSetPairDistanceRange(id, distanceRange);
    setPairDistanceConcentration = (concentration: number) => storeSetPairDistanceConcentration(id, concentration);
    setPairAngleRange = (val: number) => storeSetPairAngle(id, val);
    setAngleConcentration = (concentration: number) => storeSetPairAngleConcentration(id, concentration);
    setFovRange = (range: GenPair) => storeSetFovRange(id, range);
    setFovConcentration = (concentration: number) => storeSetFovConcentration(id, concentration);
    setNumSeries = (numSeries: number) => storeSetNumSeries(id, numSeries);
    setImageSize = (size: [number, number]) => storeSetImageDimensions(id, size);
    setUsePosttraining = (usePosttraining: boolean) => storeSetUsePosttrainingImages(id, usePosttraining);
    setNumPosttrainingImages = (numImages: number) => storeSetNumPosttrainingImages(id, numImages);
    setUse360Shading = (use360Shading: boolean) => storeSetUse360Shading(id, use360Shading);
    setMaxShadingImages = (maxImages: number) => storeSetMaxShadingImages(id, maxImages);
    setMaxShadingDistance = (maxDistance: number) => storeSetMaxShadingDistance(id, maxDistance);
    setPitchAngleRange = (pitchRange: GenPair) => storeSetPitchAngleRange(id, pitchRange);
    setMaxImagesToKeep = (maxImages: number) => storeSetMaxImagesToKeep(id, maxImages);
    setInfluenceRange = (influenceRange: GenPair) => storeSetInfluenceRange(id, influenceRange);
    setWeightingMode = (mode: string) => storeSetWeightingMode(id, mode);
    setPolynomialExponent = (exponent: number) => storeSetPolynomialExponent(id, exponent);
    setExponentialBase = (base: number) => storeSetExponentialBase(id, base);
    setPolynomialMultiplier = (multiplier: number) => storeSetPolynomialMultiplier(id, multiplier);
    setExponentialMultiplier = (multiplier: number) => storeSetExponentialMultiplier(id, multiplier);
    reset = () => storeReset(id);
  }

  const img360Available = project.metadataFile && project.images360;

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
    if (poses.length === 0 && posttrainingPoses.length === 0)
      toast.error('Need to generate poses first');
    takeScreenshots();
  }

  const screenshotColor = (poses.length || posttrainingPoses.length) ? "confirm" : "inactive";

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
            {avoidWalls && (
              <div className="mt-2">
                <label htmlFor="wallAvoidanceThreshold" className="mr-2 w-20">Wall Distance Threshold</label>
                <Slider
                  id="wallAvoidanceThreshold"
                  color="secondary"
                  value={wallAvoidanceThreshold}
                  onChange={(_, value) => setWallAvoidanceThreshold(value as number)}
                  valueLabelDisplay="auto"
                  min={0}
                  max={1}
                  step={0.01}
                />
                <p className="text-gray-400 text-sm">Minimum distance to walls (0-1)</p>
              </div>
            )}
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

      {img360Available &&
        <SidebarSection title="360° Images" level={3}>
          <SidebarSection title="360° Shading" level={4} className="mb-2">
            <div className="flex flex-col mb-2">
              <div>
                <label htmlFor="360shading" className="mr-2 w-400">Use 360° Shading</label>
                <input
                  id="360shading"
                  type="checkbox"
                  checked={use360Shading}
                  onChange={(e) => setUse360Shading(e.target.checked)}
                />
              </div>
              <p className="text-gray-400">If checked, 360° images will be projected out to shade the 3D object</p>
              {use360Shading && (
                <>
                  <div className="flex items-center mb-2">
                    <label htmlFor="maxShadingImages" className="mr-2 w-20">Max Images</label>
                    <InteractiveInput
                      id="maxShadingImages"
                      className='w-32 text-center bg-inactive basis-1/3'
                      type="number"
                      min={0}
                      step={1}
                      value={maxShadingImages}
                      onChange={(e) => setMaxShadingImages(parseInt(e.target.value))}
                    />
                  </div>
                  <div className="flex items-center mb-2">
                    <label htmlFor="maxShadingDistance" className="mr-2 w-20">Max Distance</label>
                    <InteractiveInput
                      id="maxShadingDistance"
                      className='w-32 text-center bg-inactive basis-1/3'
                      type="number"
                      min={0}
                      step={0.1}
                      value={maxShadingDistance}
                      onChange={(e) => setMaxShadingDistance(parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="flex flex-col mb-2">
                    <div className="flex items-center">
                      <label htmlFor="maxImagesToKeep" className="mr-2 w-20">Max Images to Keep</label>
                      <InteractiveInput
                        id="maxImagesToKeep"
                        className='w-32 text-center bg-inactive basis-1/3'
                        type="number"
                        min={1}
                        step={1}
                        value={maxImagesToKeep}
                        onChange={(e) => setMaxImagesToKeep(parseInt(e.target.value))}
                      />
                    </div>
                    <p className="text-gray-400">Used for outlier rejection - keeps only the most similar 360° images per pixel</p>
                  </div>
                  <div className="flex items-center mb-2 gap-2">
                    <div className="w-10/12">
                      <label htmlFor="pitchAngle" className="mr-2 w-20">Pitch Range</label>
                      <Slider
                        color="secondary"
                        getAriaLabel={() => 'Pitch Angle Range'}
                        value={pitchAngleRange}
                        onChange={(_, value) => setPitchAngleRange(value as GenPair)}
                        valueLabelDisplay="auto"
                        getAriaValueText={(value) => `${value}°`}
                        min={-90}
                        max={90}
                      />
                    </div>
                    <AngleDisplay minAngle={pitchAngleRange[0]} maxAngle={pitchAngleRange[1]} />
                  </div>
                  <div className="flex flex-col mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-10/12">
                        <label htmlFor="influenceRange" className="mr-2 w-20">Influence Range</label>
                        <Slider
                          color="secondary"
                          getAriaLabel={() => 'Influence Range'}
                          value={influenceRange}
                          onChange={(_, value) => setInfluenceRange(value as GenPair)}
                          valueLabelDisplay="auto"
                          getAriaValueText={(value) => `${value}m`}
                          min={0}
                          max={20}
                          step={0.1}
                        />
                      </div>
                    </div>
                    <InfluenceDisplay fullInfluenceUntil={influenceRange[0]} zeroInfluenceAt={influenceRange[1]} />
                    <p className="text-gray-400">Controls distance-based weighting: full influence until {influenceRange[0]}m, zero influence at {influenceRange[1]}m</p>
                  </div>
                  <div className="flex flex-col mb-2">
                    <div className="flex items-center">
                      <label htmlFor="weightingMode" className="mr-2 w-20">Weighting Mode</label>
                      <select
                        id="weightingMode"
                        className="bg-inactive p-1 w-32"
                        value={weightingMode}
                        onChange={(e) => setWeightingMode(e.target.value)}
                      >
                        <option value="linear">Linear</option>
                        <option value="polynomial">Polynomial</option>
                        <option value="exponential">Exponential</option>
                        <option value="closestAvailable">Closest Available</option>
                      </select>
                    </div>
                    <p className="text-gray-400">Determines how 360° images are combined: weighting modes blend multiple images, while Closest Available uses only the nearest valid image</p>
                  </div>
                  {weightingMode === 'polynomial' && (
                    <>
                      <div className="flex flex-col mb-2">
                        <div className="flex items-center">
                          <label htmlFor="polynomialExponent" className="mr-2 w-20">Exponent</label>
                          <InteractiveInput
                            id="polynomialExponent"
                            className='w-32 text-center bg-inactive basis-1/3'
                            type="number"
                            min={0.1}
                            max={10}
                            step={0.1}
                            value={polynomialExponent}
                            onChange={(e) => setPolynomialExponent(parseFloat(e.target.value))}
                          />
                        </div>
                        <p className="text-gray-400">Formula: weight = (influence × multiplier)^{polynomialExponent}</p>
                      </div>
                      <div className="flex flex-col mb-2">
                        <div className="flex items-center">
                          <label htmlFor="polynomialMultiplier" className="mr-2 w-20">Multiplier</label>
                          <InteractiveInput
                            id="polynomialMultiplier"
                            className='w-32 text-center bg-inactive basis-1/3'
                            type="number"
                            min={1}
                            max={1000}
                            step={1}
                            value={polynomialMultiplier}
                            onChange={(e) => setPolynomialMultiplier(parseFloat(e.target.value))}
                          />
                        </div>
                        <p className="text-gray-400">Scales the polynomial result to control overall weight magnitude</p>
                      </div>
                    </>
                  )}
                  {weightingMode === 'exponential' && (
                    <>
                      <div className="flex flex-col mb-2">
                        <div className="flex items-center">
                          <label htmlFor="exponentialBase" className="mr-2 w-20">Base</label>
                          <InteractiveInput
                            id="exponentialBase"
                            className='w-32 text-center bg-inactive basis-1/3'
                            type="number"
                            min={1.1}
                            max={10}
                            step={0.1}
                            value={exponentialBase}
                            onChange={(e) => setExponentialBase(parseFloat(e.target.value))}
                          />
                        </div>
                        <p className="text-gray-400">Formula: weight = {exponentialBase}^(influence × multiplier) - 1</p>
                      </div>
                      <div className="flex flex-col mb-2">
                        <div className="flex items-center">
                          <label htmlFor="exponentialMultiplier" className="mr-2 w-20">Multiplier</label>
                          <InteractiveInput
                            id="exponentialMultiplier"
                            className='w-32 text-center bg-inactive basis-1/3'
                            type="number"
                            min={1}
                            max={1000}
                            step={1}
                            value={exponentialMultiplier}
                            onChange={(e) => setExponentialMultiplier(parseFloat(e.target.value))}
                          />
                        </div>
                        <p className="text-gray-400">Scales the exponential result to control overall weight magnitude</p>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </SidebarSection>
          <SidebarSection title="Posttraining" level={4} className="mb-2">
            <div className="flex items-center mb-2">
              <label htmlFor="posttraining" className="mr-2 w-400">Generate Posttraining Images</label>
              <input
                id="posttraining"
                type="checkbox"
                checked={usePosttraining}
                onChange={(e) => setUsePosttraining(e.target.checked)}
              />
            </div>
            <div className="flex items-center mb-2">
              <label htmlFor="imagesPerSphere" className="mr-2 w-20">Images per Sphere</label>
              <InteractiveInput
                id="imagesPerSphere"
                className='w-32 text-center bg-inactive basis-1/3'
                disabled={!usePosttraining}
                type="number"
                min={1}
                step={1}
                value={numPosttrainingImages}
                onChange={(e) => setNumPosttrainingImages(parseInt(e.target.value))}
              />
            </div>
          </SidebarSection>
        </SidebarSection>

      }


      <SidebarSection title="Generate" level={3}>

        <div className="flex flex-col gap-1 text-sm text-gray-400">
          <div className="flex justify-between">
            <span>Normal Poses:</span>
            <span>{poses.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Posttraining Poses:</span>
            <span>{posttrainingPoses.length}</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Total Poses:</span>
            <span>{poses.length + posttrainingPoses.length}</span>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex flex-row gap-2 justify-around">
            <button
              className="bg-primary p-1 px-4"
              onClick={() => generatePoses()}
            >Generate Poses</button>
            <button
              className={`bg-${screenshotColor} p-1 px-4`}
              disabled={poses.length === 0 && posttrainingPoses.length === 0}
              onClick={takeScreenshotsHandler}>
              Take Screenshots
            </button>
            <button
              className="bg-danger p-1 px-4"
              onClick={resetHandler}
            >Reset Generator Settings</button>
          </div>

        </div>
      </SidebarSection>
    </SidebarSection >

  )

}

export default GenerateSidebar;
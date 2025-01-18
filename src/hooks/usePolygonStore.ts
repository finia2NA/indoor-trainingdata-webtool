import { Vector3 } from "three";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PolygonState = {
  polygons: number[][][]; // polygon -> point -> [x, y, z]
  getPolygons: () => Vector3[][];
  // eslint-disable-next-line no-unused-vars
  setPolygons: (polygons: Vector3[][]) => void;

  selectedPolygon: [number | null, number | null];
  // eslint-disable-next-line no-unused-vars
  setSelectedPolygon: (selectedPolygon: [number | null, number | null]) => void;

  offset: number;
  // eslint-disable-next-line no-unused-vars
  setOffset: (offset: number) => void;
}

const usePolygonStore = create<PolygonState>()(
  persist(
    (set, get) => ({
      polygons: [[]],
      getPolygons: () => {
        return get().polygons.map((polygon) => polygon.map((point) => new Vector3(point[0], point[1], point[2])));
      },
      setPolygons: (polygons) => {
        const numberArrayPolygons = polygons.map((polygon) =>
          polygon.map((point) => [point.x, point.y, point.z])
        );
        set({ polygons: numberArrayPolygons });
      },

      selectedPolygon: [null, null],
      setSelectedPolygon: (selectedPolygon) => set({ selectedPolygon }),

      offset: 1,
      setOffset: (offset) => set({ offset }),
    }),
    {
      name: "polygon-storage", // unique name
    }
  )
);

export default usePolygonStore;
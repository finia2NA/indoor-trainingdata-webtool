import { toast } from "react-toastify";
import { Vector3 } from "three";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import PolygonDeletionToast from "../components/UI/Toasts";

export type PolygonState = {
  // Polygons
  polygons: Vector3[][]; // polygon -> point -> Vector3
  // eslint-disable-next-line no-unused-vars
  setPolygons: (polygons: Vector3[][]) => void;

  // Selected Polygon
  selectedPolygon: [number | null, number | null];
  // eslint-disable-next-line no-unused-vars
  setSelectedPolygon: (selectedPolygon: [number | null, number | null]) => void;

  // Advanced Polygon Operations
  // eslint-disable-next-line no-unused-vars
  deletePolygon: (index: number) => void;
  // eslint-disable-next-line no-unused-vars
  deletePoint: (polygonIndex: number, pointIndex: number) => void;
  // eslint-disable-next-line no-unused-vars
  addPoint: (position: Vector3, polygonIndex?: number, afterPoint?: Vector3) => void;

  // Rendering offset height
  offset: number;
  // eslint-disable-next-line no-unused-vars
  setOffset: (offset: number) => void;
};

const usePolygonStore = create<PolygonState>()(
  persist(
    (set, get) => ({
      polygons: [[]],
      setPolygons: (polygons) => {
        set({ polygons });
      },
      selectedPolygon: [null, null],
      setSelectedPolygon: (selectedPolygon) => set({ selectedPolygon }),
      deletePolygon: (index) => {
        let updatedPolygons = [...get().polygons.slice(0, index), ...get().polygons.slice(index + 1)];
        if (updatedPolygons.length === 0) {
          updatedPolygons = [[]];
        }
        set({ polygons: updatedPolygons });
      },
      deletePoint: (polygonIndex, pointIndex) => {
        if (polygonIndex === null || pointIndex === null) return;
        if (get().polygons[polygonIndex].length <= 3) {
          toast.warn(PolygonDeletionToast,
            {
              type: 'error',
              onClose: (reason) => {
                if (reason === "delete") {
                  get().deletePolygon(polygonIndex);
                  get().setSelectedPolygon([null, null]);
                }
              }
            });
          return;
        }
        const updatedPolygons = [...get().polygons];
        updatedPolygons[polygonIndex] = updatedPolygons[polygonIndex].filter(
          (_: unknown, index: number | null) => index !== pointIndex
        );
        set({ polygons: updatedPolygons });
      },
      addPoint: (position, polygonIndex?, afterPoint?) => {
        const polygons = get().polygons;
        const currentPolygon = polygonIndex !== undefined ? polygons[polygonIndex] : polygons[polygons.length - 1];
        polygonIndex = polygonIndex ?? polygons.length - 1;
        let newCurrentPolygon;

        if (afterPoint) {
          const afterIndex = currentPolygon.indexOf(afterPoint);
          newCurrentPolygon = [...currentPolygon.slice(0, afterIndex + 1), position, ...currentPolygon.slice(afterIndex + 1)];
        } else {
          newCurrentPolygon = [...currentPolygon, position];
        }

        const updatedPolygons = [...polygons];
        updatedPolygons[polygonIndex] = newCurrentPolygon;

        get().setPolygons(updatedPolygons);
      },
      offset: 1,
      setOffset: (offset) => set({ offset }),
    }),
    {
      name: "polygon-storage",
      serialize: (state) => {
        const serializedState = {
          ...state,
          state: {
            ...state.state,
            polygons: state.state.polygons.map((polygon) =>
              polygon.map((point) => [point.x, point.y, point.z])
            ),
          },
        };
        return JSON.stringify(serializedState);
      },
      deserialize: (str) => {
        const state = JSON.parse(str);
        return {
          ...state,
          state: {
            ...state.state,
            polygons: state.state.polygons.map((polygon: number[][]) =>
              polygon.map((point) => new Vector3(point[0], point[1], point[2]))
            ),
          },
        };
      },
    }
  )
);

export default usePolygonStore;
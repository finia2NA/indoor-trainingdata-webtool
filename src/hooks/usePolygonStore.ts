import { toast } from "react-toastify";
import { Vector3 } from "three";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import PolygonDeletionToast from "../components/UI/Toasts";

export type PolygonState = {
  // POLYGONS
  multiPolygons: { [id: number]: Vector3[][] }; // model id -> polygon -> point -> Vector3
  /**
   * Gets the polygons for a given model id. Creates an empty polygon list if none exist.
   * @param id The model id
   * @returns The polygons for the model
   */
  getPolygons: (id: number) => Vector3[][];
  /**
   * Sets the polygons for a given model id. Overwrites.
   * @param id The model id
   * @param polygons The new polygons
   */
  setPolygons: (id: number, polygons: Vector3[][]) => void;

  // SELECTION
  multiSelectedPolygons: { [id: number]: [number | null, number | null] };
  /**
   * Gets the selected polygon for a given model id. Creates an empty selection if none exist.
   * @param id The model id
   * @returns The selected polygon
   */
  getSelectedPolygon: (id: number) => [number | null, number | null];
  setSelectedPolygon: (id: number, selectedPolygon: [number | null, number | null]) => void;

  // ADVANCED POLYGON OPERATIONS
  deletePolygon: (id: number, index: number) => void;
  deletePoint: (id: number, polygonIndex: number, pointIndex: number) => void;
  addPoint: (id: number, position: Vector3, polygonIndex?: number, afterPoint?: Vector3) => void;

  // HEIGHT OFFSET (TODO: Move to separate store and rename)
  multiOffsets: { [id: number]: number };
  getOffset: (id: number) => number;
  setOffset: (id: number, offset: number) => void;
};

const usePolygonStore = create<PolygonState>()(
  persist(
    (set, get) => ({
      multiPolygons: {},
      multiSelectedPolygons: {},
      multiOffsets: {},

      // BASIC POLYGON OPERATIONS
      getPolygons: (id) => {
        const multiPolygons = get().multiPolygons;
        if (!multiPolygons[id]) {
          set({ multiPolygons: { ...multiPolygons, [id]: [[]] } });
          return [[]];
        }
        return multiPolygons[id];
      },
      setPolygons: (id, polygons) => {
        set({ multiPolygons: { ...get().multiPolygons, [id]: polygons } });
      },

      // SELECTION
      getSelectedPolygon: (id) => {
        const multiSelectedPolygons = get().multiSelectedPolygons;
        if (!multiSelectedPolygons[id]) {
          set({ multiSelectedPolygons: { ...multiSelectedPolygons, [id]: [null, null] } });
          return [null, null];
        }
        return multiSelectedPolygons[id];
      },
      setSelectedPolygon: (id, selectedPolygon) => {
        set({ multiSelectedPolygons: { ...get().multiSelectedPolygons, [id]: selectedPolygon } });
      },

      // ADVANCED POLYGON OPERATIONS
      deletePolygon: (id, index) => {
        // let updatedPolygons = [...get().multiPolygons.slice(0, index), ...get().multiPolygons.slice(index + 1)];
        // if (updatedPolygons.length === 0) {
        //   updatedPolygons = [[]];
        // }
        // set({ multiPolygons: updatedPolygons });
        let currentPolygons = get().getPolygons(id);
        currentPolygons.splice(index, 1);
        if (currentPolygons.length === 0) {
          currentPolygons = [[]];
        }
        set({ multiPolygons: { ...get().multiPolygons, [id]: currentPolygons } });
      },
      deletePoint: (id, polygonIndex, pointIndex) => {
        // if (polygonIndex === null || pointIndex === null) return;
        // if (get().multiPolygons[polygonIndex].length <= 3) {
        //   toast.warn(PolygonDeletionToast,
        //     {
        //       type: 'error',
        //       onClose: (reason) => {
        //         if (reason === "delete") {
        //           get().deletePolygon(polygonIndex);
        //           get().setSelectedPolygon([null, null]);
        //         }
        //       }
        //     });
        //   return;
        // }
        // const updatedPolygons = [...get().multiPolygons];
        // updatedPolygons[polygonIndex] = updatedPolygons[polygonIndex].filter(
        //   (_: unknown, index: number | null) => index !== pointIndex
        // );
        // set({ multiPolygons: updatedPolygons });
        if (polygonIndex === null || pointIndex === null) return;
        let currentPolygons = get().getPolygons(id);
        if (currentPolygons[polygonIndex].length <= 3) {
          toast.warn(PolygonDeletionToast,
            {
              type: 'error',
              onClose: (reason) => {
                if (reason === "delete") {
                  get().deletePolygon(id, polygonIndex);
                  get().setSelectedPolygon(id, [null, null]);
                }
              }
            });
          return;
        }
        currentPolygons[polygonIndex].splice(pointIndex, 1);
        set({ multiPolygons: { ...get().multiPolygons, [id]: currentPolygons } });
      },

      addPoint: (id, position, polygonIndex?, afterPoint?) => {
        // const polygons = get().multiPolygons;
        // const currentPolygon = polygonIndex !== undefined ? polygons[polygonIndex] : polygons[polygons.length - 1];
        // polygonIndex = polygonIndex ?? polygons.length - 1;
        // let newCurrentPolygon;

        // if (afterPoint) {
        //   const afterIndex = currentPolygon.indexOf(afterPoint);
        //   newCurrentPolygon = [...currentPolygon.slice(0, afterIndex + 1), position, ...currentPolygon.slice(afterIndex + 1)];
        // } else {
        //   newCurrentPolygon = [...currentPolygon, position];
        // }

        // const updatedPolygons = [...polygons];
        // updatedPolygons[polygonIndex] = newCurrentPolygon;

        // get().setPolygons(updatedPolygons);
        let currentPolygons = get().getPolygons(id);
        const currentPolygon = polygonIndex !== undefined ? currentPolygons[polygonIndex] : currentPolygons[currentPolygons.length - 1];
        polygonIndex = polygonIndex ?? currentPolygons.length - 1;
        let newCurrentPolygon;

        if (afterPoint) {
          const afterIndex = currentPolygon.indexOf(afterPoint);
          newCurrentPolygon = [...currentPolygon.slice(0, afterIndex + 1), position, ...currentPolygon.slice(afterIndex + 1)];
        } else {
          newCurrentPolygon = [...currentPolygon, position];
        }

        currentPolygons[polygonIndex] = newCurrentPolygon;
        get().setPolygons(id, currentPolygons);
      },

      // HEIGHT OFFSET
      getOffset: (id: number) => {
        const multiOffsets = get().multiOffsets;
        if (!multiOffsets[id]) {
          set({ multiOffsets: { ...multiOffsets, [id]: 0 } });
          return 0;
        }
        return multiOffsets[id];
      },
      setOffset: (id, offset) => {
        set({ multiOffsets: { ...get().multiOffsets, [id]: offset } });
      },
    }),
    {
      name: "polygon-storage",
      serialize: (state) => {
        const serializedState = {
          ...state,
          state: {
            ...state.state,
            multiPolygons: Object.fromEntries(
              Object.entries(state.state.multiPolygons).map(([id, polygons]) => [
                id,
                polygons.map((polygon) =>
                  polygon.map((point) => [point.x, point.y, point.z])
                ),
              ])
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
            multiPolygons: Object.fromEntries(
              Object.entries(state.state.multiPolygons).map(([id, polygons]) => [
                id,
                (polygons as number[][][]).map((polygon: number[][]) =>
                  polygon.map((point) => new Vector3(point[0], point[1], point[2]))
                ),
              ])
            ),
          },
        };
      },
    }
  )
);

export default usePolygonStore;
import { toast } from "react-toastify";
import { Vector3 } from "three";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { PolygonDeletionToast } from "../components/UI/Toasts";

export type Polygon = Vector3[];
export type PolygonList = Polygon[];
// model id -> polygon -> point -> Vector3
export type MultiPolygons = { [id: number]: PolygonList };

type PolygonSelection = [number | null, number | null];
type MultiPolygonSelection = { [id: number]: PolygonSelection };

type EditPositionProps = {
  id: number;
  polygonIndex: number;
  pointIndex?: number;
  x?: number;
  y?: number;
  z?: number;
};

export type MultiPolygonState = {
  // POLYGONS
  multiPolygons: MultiPolygons;
  /**
   * Gets the polygons for a given model id. Creates an empty polygon list if none exist.
   * @param id The model id
   * @returns The polygons for the model
   */
  getPolygons: (id: number) => PolygonList;
  /**
   * Sets the polygons for a given model id. Overwrites.
   * @param id The model id
   * @param polygons The new polygons
   */
  setPolygons: (id: number, polygons: PolygonList) => void;

  // SELECTION
  multiSelectedPolygons: MultiPolygonSelection;
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
  addPoint: (id: number, position: Vector3, polygonIndex?: number, afterPointIndex?: number) => void;
  editPosition: (props: EditPositionProps) => void;
};

const useMultiPolygonStore = create<MultiPolygonState>()(
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
        let currentPolygons = get().getPolygons(id);
        currentPolygons.splice(index, 1);
        if (currentPolygons.length === 0) {
          currentPolygons = [[]];
        }
        set({ multiPolygons: { ...get().multiPolygons, [id]: currentPolygons } });
      },
      deletePoint: (id, polygonIndex, pointIndex) => {
        if (polygonIndex === null || pointIndex === null) return;
        const currentPolygons = get().getPolygons(id);
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

      addPoint: (id, position, polygonIndex?, afterPointIndex?) => {

        if (polygonIndex === undefined && afterPointIndex === undefined) {
          // Simple case: no polygonIndex, afterPoint provided
          const allPolygons = get().getPolygons(id);
          const currentPolygon = allPolygons[allPolygons.length - 1];
          const newCurrentPolygon = [...currentPolygon, position];
          allPolygons[allPolygons.length - 1] = newCurrentPolygon;
          get().setPolygons(id, allPolygons);
        } else if (polygonIndex !== undefined && afterPointIndex !== undefined) {
          // Complex case: splicing into a polygon
          const allPolygons = get().getPolygons(id);
          const currentPolygon = allPolygons[polygonIndex];
          const newPolygon = currentPolygon
            .slice(0, afterPointIndex + 1)
            .concat([position])
            .concat(currentPolygon.slice(afterPointIndex + 1));
          allPolygons[polygonIndex] = newPolygon;
          get().setPolygons(id, allPolygons);
        } else {
          // Error case: we need either both or none of the splice arguments
          console.error("Invalid arguments for addPoint: need to provide both polygonIndex and afterPoint or neither");
          return;
        }

      },
      editPosition: ({ id, polygonIndex, pointIndex, x, y, z }: EditPositionProps) => {
        const allPolygons = get().getPolygons(id);
        const editIndices = [];
        if (pointIndex !== undefined) {
          editIndices.push(pointIndex);
        } else {
          for (let i = 0; i < allPolygons.length; i++) {
            editIndices.push(...Array.from({ length: allPolygons[i].length }, (_, i) => i));
          }
        }

        for (const index of editIndices) {
          if (x !== undefined) allPolygons[polygonIndex][index].x = x;
          if (y !== undefined) allPolygons[polygonIndex][index].y = y;
          if (z !== undefined) allPolygons[polygonIndex][index].z = z;
        }

        set({ multiPolygons: { ...get().multiPolygons, [id]: allPolygons } });
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

export default useMultiPolygonStore;
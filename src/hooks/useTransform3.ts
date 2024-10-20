import { create } from "zustand";
import { persist } from "zustand/middleware";

/* eslint-disable no-unused-vars */
export class Transformation3 {
  translation: number[];
  rotation: number[];
  scale: number[];

  constructor(translation?: number[], rotation?: number[], scale?: number[]) {
    this.translation = translation || [0, 0, 0];
    this.rotation = rotation || [0, 0, 0];
    this.scale = scale || [1, 1, 1];
  }

  copy(): Transformation3 {
    return new Transformation3([...this.translation], [...this.rotation], [...this.scale]);
  }
}

interface MultiTransformationState3 {
  transformations: Record<number, Transformation3>;
  getTransformation: (id: number) => Transformation3 | null;
  addTransformation: (id: number) => void;

  setTranslation: (id: number, translation: number[]) => void;
  setRotation: (id: number, rotation: number[]) => void;
  setScale: (id: number, scale: number[]) => void;
}

const useMultiTransformationStore3 = create<MultiTransformationState3>()(
  persist(
    (set, get) => ({
      transformations: {},

      getTransformation: (id: number) => {
        const obj = get().transformations[id];
        if (!obj) {
          return null;
        }
        return new Transformation3(obj.translation, obj.rotation, obj.scale);
      },

      addTransformation: (id: number) => set((state) => ({
        transformations: {
          ...state.transformations,
          [id]: new Transformation3(),
        },
      })),

      setTranslation: (id: number, translation: number[]) => set((state) => {
        // get the object
        const currTrans = state.getTransformation(id);
        if (!currTrans) return state;

        // update the translation
        const newTransformation = currTrans.copy();
        newTransformation.translation = translation;

        // return the new state
        return {
          transformations: {
            ...state.transformations,
            [id]: newTransformation,
          },
        };
      }),

      setRotation: (id: number, rotation: number[]) => set((state) => {
        // get the object
        const currTrans = state.getTransformation(id);
        if (!currTrans) return state;

        // update the translation
        const newTransformation = currTrans.copy();
        newTransformation.rotation = rotation;

        return {
          transformations: {
            ...state.transformations,
            [id]: newTransformation,
          },
        };
      }),

      setScale: (id: number, scale: number[]) => set((state) => {
        // get the object
        const currTrans = state.getTransformation(id);
        if (!currTrans) return state;

        // update the translation
        const newTransformation = currTrans.copy();
        newTransformation.scale = scale;

        return {
          transformations: {
            ...state.transformations,
            [id]: newTransformation,
          },
        };
      }),

    }),
    {
      name: 'multiTransformation'
    },
  ),
);

export default useMultiTransformationStore3;
import { create } from "zustand";
import { persist } from "zustand/middleware";
import Transformation from '../data/Transformation';

/* eslint-disable no-unused-vars */

interface MultiTransformationState {
  transformations: Record<number, Transformation>;
  getTransformation: (id: number) => Transformation | null;
  addTransformation: (id: number) => void;

  setTransformation: (id: number, transformation: Transformation) => void;

  setTranslation: (id: number, translation: number[]) => void;
  setRotation: (id: number, rotation: number[]) => void;
  setScale: (id: number, scale: number[]) => void;
}

const useMultiTransformationStore = create<MultiTransformationState>()(
  persist(
    (set, get) => ({
      transformations: {},

      getTransformation: (id: number) => {
        const obj = get().transformations[id];
        if (!obj) {
          return null;
        }
        return new Transformation(obj.translation, obj.rotation, obj.scale);
      },

      addTransformation: (id: number) => set((state) => ({
        transformations: {
          ...state.transformations,
          [id]: new Transformation(),
        },
      })),

      setTransformation: (id: number, transformation: Transformation) => set((state) => {
        // Check if the transformation exists; if not, do nothing
        const currTrans = state.getTransformation(id);
        if (!currTrans) return state;

        // Use the provided transformation to replace the current one
        return {
          transformations: {
            ...state.transformations,
            [id]: transformation.copy(),
          },
        };
      }),

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

export default useMultiTransformationStore;
import { create } from "zustand";
import { persist } from "zustand/middleware";
import Transformation from '../data/Transformation';

interface MultiTransformationState {
  mulitTransformations: Record<number, Transformation>;
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
      mulitTransformations: {},

      getTransformation: (id: number) => {
        const obj = get().mulitTransformations[id];
        if (!obj) {
          return null;
        }
        return new Transformation(obj.translation, obj.rotation, obj.scale);
      },

      addTransformation: (id: number) => set((state) => ({
        mulitTransformations: {
          ...state.mulitTransformations,
          [id]: new Transformation(),
        },
      })),

      setTransformation: (id: number, transformation: Transformation) => set((state) => {
        // Check if the transformation exists; if not, do nothing
        const currTrans = state.getTransformation(id);
        if (!currTrans) return state;

        // Use the provided transformation to replace the current one
        return {
          mulitTransformations: {
            ...state.mulitTransformations,
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
          mulitTransformations: {
            ...state.mulitTransformations,
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
          mulitTransformations: {
            ...state.mulitTransformations,
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
          mulitTransformations: {
            ...state.mulitTransformations,
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
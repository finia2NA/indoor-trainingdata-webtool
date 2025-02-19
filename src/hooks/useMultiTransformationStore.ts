import { create } from "zustand";
import { persist } from "zustand/middleware";
import Transformation from '../data/Transformation';

type MultiTransformationState = {
  mulitTransformations: Record<number, Record<number, Transformation>>;
  getTransformation: (projectId: number, modelId: number) => Transformation | null;
  addTransformation: (projectId: number, modelId: number) => void;

  setTransformation: (projectId: number, modelId: number, transformation: Transformation) => void;

  setTranslation: (projectId: number, modelId: number, translation: number[]) => void;
  setRotation: (projectId: number, modelId: number, rotation: number[]) => void;
  setScale: (projectId: number, modelId: number, scale: number[]) => void;

  multiVisibility: Record<number, Record<number,boolean>>;
  getVisibility: (projectId: number, modelId: number) => boolean;
  setVisibility: (projectId: number, modelId: number, visibility: boolean) => void;


};

const useMultiTransformationStore = create<MultiTransformationState>()(
  persist(
    (set, get) => ({
      mulitTransformations: {},
      multiVisibility: {},

      getTransformation: (projectId: number, modelId: number) => {
        const obj = get().mulitTransformations[projectId]?.[modelId];
        if (!obj) {
          return null;
        }
        return new Transformation(obj.translation, obj.rotation, obj.scale);
      },

      addTransformation: (projectId: number, modelId: number) => set((state) => ({
        mulitTransformations: {
          ...state.mulitTransformations,
          [projectId]: {
            ...state.mulitTransformations[projectId],
            [modelId]: new Transformation(),
          },
        },
      })),

      setTransformation: (projectId: number, modelId: number, transformation: Transformation) => set((state) => {
        // Check if the transformation exists; if not, do nothing
        const currTrans = state.getTransformation(projectId, modelId);
        if (!currTrans) return state;

        // Use the provided transformation to replace the current one
        return {
          mulitTransformations: {
            ...state.mulitTransformations,
            [projectId]: {
              ...state.mulitTransformations[projectId],
              [modelId]: transformation,
            },
          },
        };
      }),

      setTranslation: (projectId: number, modelId: number, translation: number[]) => set((state) => {
        // get the object
        const currTrans = state.getTransformation(projectId, modelId);
        if (!currTrans) return state;

        // update the translation
        const newTransformation = currTrans.copy();
        newTransformation.translation = translation;

        // return the new state
        return {
          mulitTransformations: {
            ...state.mulitTransformations,
            [projectId]: {
              ...state.mulitTransformations[projectId],
              [modelId]: newTransformation,
            },
          },
        };
      }),

      setRotation: (projectId: number, modelId: number, rotation: number[]) => set((state) => {
        // get the object
        const currTrans = state.getTransformation(projectId, modelId);
        if (!currTrans) return state;

        // update the translation
        const newTransformation = currTrans.copy();
        newTransformation.rotation = rotation;

        return {
          mulitTransformations: {
            ...state.mulitTransformations,
            [projectId]: {
              ...state.mulitTransformations[projectId],
              [modelId]: newTransformation,
            },
          },
        };
      }),

      setScale: (projectId: number, modelId: number, scale: number[]) => set((state) => {
        // get the object
        const currTrans = state.getTransformation(projectId, modelId);
        if (!currTrans) return state;

        // update the translation
        const newTransformation = currTrans.copy();
        newTransformation.scale = scale;

        return {
          mulitTransformations: {
            ...state.mulitTransformations,
            [projectId]: {
              ...state.mulitTransformations[projectId],
              [modelId]: newTransformation,
            },
          }
        };

      }),

      getVisibility: (projectId: number, modelId: number) => {
        return get().multiVisibility[projectId]?.[modelId] ?? false;
      },

      setVisibility: (projectId: number, modelId: number, visibility: boolean) => set((state) => ({
        multiVisibility: {
          ...state.multiVisibility,
          [projectId]: {
            ...state.multiVisibility[projectId],
            [modelId]: visibility,
          },
        },
      })),
    }),
    {
      name: 'multiTransformation'
    }
  )
);

export default useMultiTransformationStore;
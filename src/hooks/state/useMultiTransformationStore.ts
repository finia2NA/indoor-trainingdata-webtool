import { create } from "zustand";
import { persist } from "zustand/middleware";
import Transformation from '../../data/Transformation';

type MultiTransformationState = {
  mulitTransformations: Record<number, Record<number | "360s", Transformation>>;
  getTransformation: (projectId: number, modelId: number | "360s") => Transformation | null;
  addTransformation: (projectId: number, modelId: number | "360s") => void;

  setTransformation: (projectId: number, modelId: number | "360s", transformation: Transformation) => void;

  setTranslation: (projectId: number, modelId: number | "360s", translation: number[]) => void;
  setRotation: (projectId: number, modelId: number | "360s", rotation: number[]) => void;
  setScale: (projectId: number, modelId: number | "360s", scale: number[]) => void;

  multiVisibility: Record<number, Record<number | "360s", boolean>>;
  getVisibility: (projectId: number, modelId: number | "360s") => boolean;
  setVisibility: (projectId: number, modelId: number | "360s", visibility: boolean) => void;

  multiCourseCorrection: Record<number, Record<string, { coarse: number; fine: number }>>; // project -> image name -> correction values
  getCourseCorrection: (projectId: number, imageName: string) => number;
  getCoarseCourseCorrection: (projectId: number, imageName: string) => number;
  getFineCourseCorrection: (projectId: number, imageName: string) => number;
  getCourseCorrectionOrNull: (projectId: number, imageName: string) => { coarse: number; fine: number } | null;
  setCourseCorrection: (projectId: number, imageName: string, coarse: number, fine: number) => void;
  removeCourseCorrection: (projectId: number, imageName: string) => void;

};

const useMultiTransformationStore = create<MultiTransformationState>()(
  persist(
    (set, get) => ({
      mulitTransformations: {},
      multiVisibility: {},
      multiCourseCorrection: {},

      getTransformation: (projectId: number, modelId: number | "360s") => {
        const obj = get().mulitTransformations[projectId]?.[modelId];
        if (!obj) {
          return null;
        }
        return new Transformation(obj.translation, obj.rotation, obj.scale);
      },

      addTransformation: (projectId: number, modelId: number | "360s") => set((state) => ({
        mulitTransformations: {
          ...state.mulitTransformations,
          [projectId]: {
            ...state.mulitTransformations[projectId],
            [modelId]: new Transformation(),
          },
        },
      })),

      setTransformation: (projectId: number, modelId: number | "360s", transformation: Transformation) => set((state) => {
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

      setTranslation: (projectId: number, modelId: number | "360s", translation: number[]) => set((state) => {
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

      setRotation: (projectId: number, modelId: number | "360s", rotation: number[]) => set((state) => {
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

      setScale: (projectId: number, modelId: number | "360s", scale: number[]) => set((state) => {
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

      getVisibility: (projectId: number, modelId: number | "360s") => {
        return get().multiVisibility[projectId]?.[modelId] ?? true;
      },

      setVisibility: (projectId: number, modelId: number | "360s", visibility: boolean) => set((state) => ({
        multiVisibility: {
          ...state.multiVisibility,
          [projectId]: {
            ...state.multiVisibility[projectId],
            [modelId]: visibility,
          },
        },
      })),

      getCourseCorrection: (projectId: number, imageName: string) => {
        const correction = get().multiCourseCorrection[projectId]?.[imageName];
        return correction ? correction.coarse + correction.fine : 0;
      },

      getCoarseCourseCorrection: (projectId: number, imageName: string) => {
        return get().multiCourseCorrection[projectId]?.[imageName]?.coarse ?? 0;
      },

      getFineCourseCorrection: (projectId: number, imageName: string) => {
        return get().multiCourseCorrection[projectId]?.[imageName]?.fine ?? 0;
      },

      getCourseCorrectionOrNull: (projectId: number, imageName: string) => {
        return get().multiCourseCorrection[projectId]?.[imageName] ?? null;
      },

      setCourseCorrection: (projectId: number, imageName: string, coarse: number, fine: number) => set((state) => ({
        multiCourseCorrection: {
          ...state.multiCourseCorrection,
          [projectId]: {
            ...state.multiCourseCorrection[projectId],
            [imageName]: { coarse, fine },
          },
        },
      })),

      removeCourseCorrection: (projectId: number, imageName: string) => set((state) => {
        const projectCorrections = { ...state.multiCourseCorrection[projectId] };
        delete projectCorrections[imageName];
        return {
          multiCourseCorrection: {
            ...state.multiCourseCorrection,
            [projectId]: projectCorrections,
          },
        };
      }),
    }),
    {
      name: 'multiTransformation'
    }
  )
);

export default useMultiTransformationStore;
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
  addTransformation: (id: number) => void;
  setTranslation: (id: number, translation: number[]) => void;
  getTransformation: (id: number) => Transformation3;
}

const useMultiTransformationStore3 = create<MultiTransformationState3>()(
  persist(
    (set, get) => ({
      transformations: {},

      addTransformation: (id: number) => set((state) => ({
        transformations: {
          ...state.transformations,
          [id]: new Transformation3(),
        },
      })),

      setTranslation: (id: number, translation: number[]) => set((state) => {
        const currentTransformation = state.transformations[id];
        if (!currentTransformation) return state;

        const newTransformation = currentTransformation.copy();
        newTransformation.translation = translation;
        return {
          transformations: {
            ...state.transformations,
            [id]: newTransformation,
          },
        };
      }),

      getTransformation: (id: number) => {
        const obj = get().transformations[id];
        return new Transformation3(obj.translation, obj.rotation, obj.scale);
      }

    }),
    {
      name: 'multiTransformation',
      // serialize: (state) => JSON.stringify(state),
      // deserialize: (state) => {
      //   const parsedState = JSON.parse(state);
      //   const transformations: Record<number, Transformation3> = {};

      //   // For-loop to reassign each transformation to a new Transformation3 instance
      //   for (const id in parsedState.transformations) {
      //     if (Object.prototype.hasOwnProperty.call(parsedState.transformations, id)) {
      //       const transformation = parsedState.transformations[id];

      //       // Check if the transformation is already an instance of Transformation3
      //       if (transformation instanceof Transformation3) {
      //         transformations[id] = transformation;
      //       } else {
      //         // Re-create the Transformation3 instance
      //         transformations[id] = new Transformation3(
      //           transformation.translation,
      //           transformation.rotation,
      //           transformation.scale
      //         );
      //       }
      //     }
      //   }

      //   return {
      //     ...parsedState,
      //     transformations,
      //   };
      // },
    },
  ),
);

export default useMultiTransformationStore3;
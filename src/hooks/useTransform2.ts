import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export class Transformation {
  translation: number[];
  rotation: number[];
  scale: number[];

  constructor(translation?: number[], rotation?: number[], scale?: number[]) {
    this.translation = translation || [0, 0, 0];
    this.rotation = rotation || [0, 0, 0];
    this.scale = scale || [1, 1, 1];
  }

  copy(): Transformation {
    return new Transformation([...this.translation], [...this.rotation], [...this.scale]);
  }
}

// TODO: make id number
interface MultiTransformationState {
  transformations: Record<string, Transformation>;
  addTransformation: (id: string) => void;
  removeTransformation: (id: string) => void;
  setTranslation: (id: string, translation: number[]) => void;
  setRotation: (id: string, rotation: number[]) => void;
  setScale: (id: string, scale: number[]) => void;
  reset: (id: string) => void;
  getTransformation: (id: string) => Transformation | undefined;
}

const useMultiTransformationStore = create<MultiTransformationState>()(
  persist(
    (set, get) => ({
      transformations: {},

      addTransformation: (id: string) => set((state) => ({
        transformations: {
          ...state.transformations,
          [id]: new Transformation(),
        },
      })),

      removeTransformation: (id: string) => set((state) => {
        const { [id]: _, ...rest } = state.transformations;
        return { transformations: rest };
      }),

      setTranslation: (id: string, translation: number[]) => set((state) => {
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

      setRotation: (id: string, rotation: number[]) => set((state) => {
        const currentTransformation = state.transformations[id];
        if (!currentTransformation) return state;

        const newTransformation = currentTransformation.copy();
        newTransformation.rotation = rotation;
        return {
          transformations: {
            ...state.transformations,
            [id]: newTransformation,
          },
        };
      }),

      setScale: (id: string, scale: number[]) => set((state) => {
        const currentTransformation = state.transformations[id];
        if (!currentTransformation) return state;

        const newTransformation = currentTransformation.copy();
        newTransformation.scale = scale;
        return {
          transformations: {
            ...state.transformations,
            [id]: newTransformation,
          },
        };
      }),

      reset: (id: string) => set((state) => ({
        transformations: {
          ...state.transformations,
          [id]: new Transformation(),
        },
      })),

      getTransformation: (id: string) => get().transformations[id],
    }),
    {
      name: 'multi-transformation-storage',
      storage: createJSONStorage(() => localStorage), serialize: (state) => JSON.stringify(state),
      deserialize: (state) => {
        const parsed = JSON.parse(state);
        console.log(parsed)
        const transformations = Object.fromEntries(
          Object.entries(parsed.transformations).map(([key, value]: [string, any]) => [
            key,
            new Transformation(value.translation, value.rotation, value.scale),
          ])
        );
        console.log(transformations)
        return {
          ...parsed,
          transformations: Object.fromEntries(
            Object.entries(parsed.transformations).map(([key, value]: [string, any]) => [
              key,
              new Transformation(value.translation, value.rotation, value.scale),
            ])
          ),
        }
      }

    }
  )
);

export default useMultiTransformationStore;
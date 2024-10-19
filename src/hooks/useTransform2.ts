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

interface TransformationState {
  transformation: Transformation;
  // eslint-disable-next-line no-unused-vars
  setTranslation: (translation: number[]) => void;
  // eslint-disable-next-line no-unused-vars
  setRotation: (rotation: number[]) => void;
  // eslint-disable-next-line no-unused-vars
  setScale: (scale: number[]) => void;
  reset: () => void;
}

const useTransformationStore = create<TransformationState>()(
  persist(
    (set) => ({
      transformation: new Transformation(),

      setTranslation: (translation: number[]) => set((state) => ({
        transformation: new Transformation(translation, state.transformation.rotation, state.transformation.scale)
      })),

      setRotation: (rotation: number[]) => set((state) => ({
        transformation: new Transformation(state.transformation.translation, rotation, state.transformation.scale)
      })),

      setScale: (scale: number[]) => set((state) => ({
        transformation: new Transformation(state.transformation.translation, state.transformation.rotation, scale)
      })),

      reset: () => set(() => ({
        transformation: new Transformation()
      })),
    }),
    {
      name: 'transformation-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        transformation: {
          translation: state.transformation.translation,
          rotation: state.transformation.rotation,
          scale: state.transformation.scale,
        }
      }),
    }
  )
);

export default useTransformationStore;
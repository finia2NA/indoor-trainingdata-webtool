/* eslint-disable no-unused-vars */

import { create } from 'zustand';

// Data definition
export enum CameraMode {
  PERSPECTIVE = 'perspective',
  ORTHOGRAPHIC = 'orthographic',
}

export enum EditorMode {
  LAYOUT = 'layout',
  MAP = 'map',
  GENERATE = 'generate',
}

export enum TransformMode {
  NONE = 'none',
  TRANSLATE = 'translate',
  ROTATE = 'rotate',
  SCALE = 'scale',
}

export type EditorState = {
  cameraMode: CameraMode;
  setCameraMode: (mode: CameraMode) => void;

  editorMode: EditorMode;
  setEditorMode: (mode: EditorMode) => void;

  transformMode: TransformMode;
  setTransformMode: (mode: TransformMode) => void;

  displayGrid: boolean;
  setDisplayGrid: (display: boolean) => void;
};

// --------------------------------------------

// Store creation
const useEditorStore = create((set) => ({
  cameraMode: 'perspective',
  setCameraMode: (mode: CameraMode) => set({ cameraMode: mode }),

  editorMode: 'layout',
  setEditorMode: (mode: EditorMode) => set({ editorMode: mode }),

  transformMode: 'none',
  setTransformMode: (mode: TransformMode) => set({ transformMode: mode }),

  displayGrid: true,
  setDisplayGrid: (display: boolean) => set({ displayGrid: display }),

}));

export default useEditorStore;
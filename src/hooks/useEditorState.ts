/* eslint-disable no-unused-vars */

import { create } from 'zustand';

// Data definition
enum CameraMode {
  PERSPECTIVE = 'perspective',
  ORTHOGRAPHIC = 'orthographic',
}

enum EditorMode {
  LAYOUT = 'layout',
  MAP = 'map',
  GENERATE = 'generate',
}

enum TransformMode {
  NONE = 'none',
  TRANSLATE = 'translate',
  ROTATE = 'rotate',
  SCALE = 'scale',
}

type EditorState = {
  cameraMode: CameraMode;
  setCameraMode: (mode: CameraMode) => void;

  editorMode: EditorMode;
  setEditorMode: (mode: EditorMode) => void;

  transformMode: TransformMode;
  setTransformMode: (mode: TransformMode) => void;
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

}));

export default useEditorStore;
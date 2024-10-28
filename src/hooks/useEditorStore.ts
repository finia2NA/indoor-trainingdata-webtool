/* eslint-disable no-unused-vars */

import { create } from 'zustand';

// Data definition
export enum Perspective {
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
  perspectiveMode: Perspective;
  setPerspectiveMode: (mode: Perspective) => void;

  editorMode: EditorMode;
  setEditorMode: (mode: EditorMode) => void;

  transformMode: TransformMode;
  setTransformMode: (mode: TransformMode) => void;

  showGrid: boolean;
  setShowGrid: (display: boolean) => void;
};

// --------------------------------------------

// Store creation
const useEditorStore = create((set) => ({
  perspectiveMode: Perspective.PERSPECTIVE,
  setPerspectiveMode: (mode: Perspective) => set({ perspectiveMode: mode }),

  editorMode: EditorMode.LAYOUT,
  setEditorMode: (mode: EditorMode) => set((state: EditorState) => ({
    editorMode: mode,
    transformMode: mode !== EditorMode.LAYOUT ? TransformMode.NONE : state.transformMode,
  })),

  transformMode: TransformMode.NONE,
  setTransformMode: (mode: TransformMode) => set({ transformMode: mode }),

  showGrid: true,
  setShowGrid: (showGrid: boolean) => set({ showGrid: showGrid }),
}));

export default useEditorStore;
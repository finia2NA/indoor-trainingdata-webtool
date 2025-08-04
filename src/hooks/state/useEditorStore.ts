/**
 * Zustand hook that stores the state of the editor.
 * This includes tools used and current editing step.
 * Does not store fast-changing information like if currently transforming and Orbit-Angle
 * Non-persistent.
 */


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
  DEBUG = 'debug',
}

export enum TransformMode {
  NONE = 'none',
  TRANSLATE = 'translate',
  ROTATE = 'rotate',
  SCALE = 'scale',
}

export enum PolygonToolMode {
  NONE = 'none', // no tool selected
  CREATE = 'create', // Adding new polygons
  EDIT = 'edit', // moving/deleting points
  SPLICE = 'splice', // inserting points on lines
}

export type EditorState = {
  perspectiveMode: Perspective;
  setPerspectiveMode: (mode: Perspective) => void;

  editorMode: EditorMode;
  setEditorMode: (mode: EditorMode) => void;

  transformMode: TransformMode;
  setTransformMode: (mode: TransformMode) => void;

  polygonToolMode: PolygonToolMode;
  setPolygonToolMode: (mode: PolygonToolMode) => void;

  showGrid: boolean;
  setShowGrid: (display: boolean) => void;

  showLabels: boolean;
  setShowLabel: (label: boolean) => void;

  showTriangulation: boolean;
  setShowTriangulation: (show: boolean) => void;

  showImages: boolean;
  setShowImages: (show: boolean) => void;

  showPoses: boolean;
  setShowPoses: (show: boolean) => void;

  // TODO: rename this and below to surface_, to distinguish from drawn polygon offset etc.
  polygonHeight: number;
  setPolygonHeight: (newHeight: number) => void;

  polygonSize: number;
  setPolygonSize: (newSize: number) => void;

  resetEditorConfig: () => void;
};

// --------------------------------------------

// Store creation
const useEditorStore = create<EditorState>((set) => ({
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
  setShowGrid: (showGrid: boolean) => set({ showGrid }),

  showLabels: false,
  setShowLabel: (showLabels: boolean) => set({ showLabels }),

  showTriangulation: false,
  setShowTriangulation: (show: boolean) => set({ showTriangulation: show }),

  showImages: true,
  setShowImages: (show: boolean) => set({ showImages: show }),

  showPoses: false,
  setShowPoses: (show: boolean) => set({ showPoses: show }),

  polygonHeight: 0,
  setPolygonHeight: (newHeight: number) => set({ polygonHeight: newHeight }),

  polygonSize: 5,
  setPolygonSize: (newSize: number) => set({ polygonSize: newSize }),

  polygonToolMode: PolygonToolMode.NONE,
  setPolygonToolMode: (mode: PolygonToolMode) => set({ polygonToolMode: mode }),

  resetEditorConfig: () => set({
    perspectiveMode: Perspective.PERSPECTIVE,
    editorMode: EditorMode.LAYOUT,
    transformMode: TransformMode.NONE,
    showGrid: true,
    showLabels: false,
    showTriangulation: false,
    showImages: true,
    showPoses: false,
    polygonHeight: 0,
    polygonSize: 5,
    polygonToolMode: PolygonToolMode.NONE,
  }),
}));

export default useEditorStore;
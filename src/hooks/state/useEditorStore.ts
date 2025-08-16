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

  fov: number;
  setFov: (fov: number) => void;

  wireframeMode: boolean;
  setWireframeMode: (wireframe: boolean) => void;

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

  showNormals: boolean;
  setShowNormals: (show: boolean) => void;

  // TODO: rename this and below to surface_, to distinguish from drawn polygon offset etc.
  polygonHeight: number;
  setPolygonHeight: (newHeight: number) => void;

  polygonSize: number;
  setPolygonSize: (newSize: number) => void;

  controlsExpanded: boolean;
  setControlsExpanded: (expanded: boolean) => void;

  resetEditorConfig: () => void;
};

// --------------------------------------------

// Default editor configuration
const defaults = {
  perspectiveMode: Perspective.PERSPECTIVE,
  fov: 75,
  wireframeMode: false,
  editorMode: EditorMode.LAYOUT,
  transformMode: TransformMode.NONE,
  polygonToolMode: PolygonToolMode.NONE,
  showGrid: true,
  showLabels: false,
  showTriangulation: false,
  showImages: true,
  showPoses: false,
  showNormals: false,
  // TODO: rename this and below to surface_, to distinguish from drawn polygon offset etc.
  polygonHeight: 0,
  polygonSize: 5,
  controlsExpanded: false,
};

// Store creation
const useEditorStore = create<EditorState>((set) => ({
  ...defaults,
  setFov: (fov: number) => set({ fov }),
  setPerspectiveMode: (mode: Perspective) => set({ perspectiveMode: mode }),
  setWireframeMode: (wireframe: boolean) => set({ wireframeMode: wireframe }),
  setEditorMode: (mode: EditorMode) => set((state: EditorState) => ({
    editorMode: mode,
    transformMode: mode !== EditorMode.LAYOUT ? TransformMode.NONE : state.transformMode,
  })),
  setTransformMode: (mode: TransformMode) => set({ transformMode: mode }),
  setShowGrid: (showGrid: boolean) => set({ showGrid }),
  setShowLabel: (showLabels: boolean) => set({ showLabels }),
  setShowTriangulation: (show: boolean) => set({ showTriangulation: show }),
  setShowImages: (show: boolean) => set({ showImages: show }),
  setShowPoses: (show: boolean) => set({ showPoses: show }),
  setShowNormals: (show: boolean) => set({ showNormals: show }),
  setPolygonHeight: (newHeight: number) => set({ polygonHeight: newHeight }),
  setPolygonSize: (newSize: number) => set({ polygonSize: newSize }),
  setPolygonToolMode: (mode: PolygonToolMode) => set({ polygonToolMode: mode }),
  setControlsExpanded: (expanded: boolean) => set({ controlsExpanded: expanded }),

  resetEditorConfig: () => set({ ...defaults }),
}));

export default useEditorStore;
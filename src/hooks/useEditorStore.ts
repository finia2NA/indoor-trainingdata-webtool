/**
 * Zustand hook that stores the state of the editor.
 * This includes tools used and current editing step.
 * Does not store fast-changing information like if currently transforming and Orbit-Angle
 * Non-persistent.
 */


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

  showGrid: boolean;
  setShowGrid: (display: boolean) => void;

  showLabels: boolean;
  setShowLabel: (label: boolean) => void;

  polygonHeight: number;
  setPolygonHeight: (newHeight: number) => void;

  polygonSize: number;
  setPolygonSize: (newSize: number) => void;

  polygonToolMode: PolygonToolMode;
  setPolygonToolMode: (mode: PolygonToolMode) => void;
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
  setShowGrid: (showGrid: boolean) => set({ showGrid }),

  showLabels: false,
  setShowLabel: (showLabels: boolean) => set({ showLabels }),

  polygonHeight: 0,
  setPolygonHeight: (newHeight: number) => set({ polygonHeight: newHeight }),

  polygonSize: 5,
  setPolygonSize: (newSize: number) => set({ polygonSize: newSize }),

  polygonToolMode: PolygonToolMode.NONE,
  setPolygonToolMode: (mode: PolygonToolMode) => set({ polygonToolMode: mode }),
}));

export default useEditorStore;
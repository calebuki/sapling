import type * as T from 'three';
export type IslandScene = {
  scene: T.Scene;
  renderer: T.WebGLRenderer;
  camera: T.PerspectiveCamera;
  buildings: T.Group;
  surface: HTMLDivElement;
};

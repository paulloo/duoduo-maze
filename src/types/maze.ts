export type CellType = "empty" | "wall" | "start" | "end";
export type ControlMode = "child" | "free";
export type ControlAction = "forward" | "backward" | "left" | "right";

export interface MoveVector {
  x: number;
  y: number;
}

export interface LookDelta {
  x: number;
  y: number;
}

export interface MazeData {
  id: string;
  name: string;
  rows: number;
  cols: number;
  cellSize: number;
  wallHeight: number;
  grid: CellType[][];
}

export interface MazePoint {
  row: number;
  col: number;
}

export interface PlayerPose extends MazePoint {
  yaw: number;
}



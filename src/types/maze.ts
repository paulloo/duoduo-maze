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

export type LearningCategory = "initial" | "final" | "tone" | "syllable";
export type LearningItemStatus = "collected" | "attempted";

export interface LearningItem {
  id: string;
  displayText: string;
  audioKey: string;
  category: LearningCategory;
  isCorrect: boolean;
  difficulty: number;
  position: MazePoint;
}

export interface PinyinLesson {
  id: string;
  unitId: string;
  mapId: string;
  order: number;
  title: string;
  targetText: string;
  targetAudioKey: string;
  instruction: string;
  requiredCorrect: number;
  threeStarCorrect: number;
  items: LearningItem[];
}

export interface PinyinUnit {
  id: string;
  order: number;
  title: string;
  description: string;
  lessons: PinyinLesson[];
}

export interface PinyinCourse {
  id: string;
  title: string;
  description: string;
  units: PinyinUnit[];
}

export interface PinyinProgress {
  currentLessonId: string;
  completedLessonStars: Record<string, number>;
}



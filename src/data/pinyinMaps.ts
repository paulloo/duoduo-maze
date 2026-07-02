import type { CellType, MazeData } from "../types/maze";
import { pinyinLessons } from "./pinyinCourse";

const baseGrid: CellType[][] = [
  ["wall", "wall", "wall", "wall", "wall", "wall", "wall", "wall", "wall", "wall"],
  ["wall", "empty", "empty", "empty", "wall", "empty", "empty", "empty", "end", "wall"],
  ["wall", "empty", "wall", "empty", "wall", "empty", "wall", "wall", "empty", "wall"],
  ["wall", "empty", "wall", "empty", "empty", "empty", "empty", "wall", "empty", "wall"],
  ["wall", "empty", "wall", "wall", "wall", "wall", "empty", "wall", "empty", "wall"],
  ["wall", "empty", "empty", "empty", "empty", "wall", "empty", "empty", "empty", "wall"],
  ["wall", "wall", "wall", "wall", "empty", "wall", "wall", "wall", "empty", "wall"],
  ["empty", "empty", "empty", "wall", "empty", "empty", "empty", "wall", "empty", "wall"],
  ["wall", "wall", "empty", "wall", "wall", "wall", "empty", "wall", "empty", "wall"],
  ["wall", "empty", "empty", "empty", "empty", "wall", "empty", "empty", "empty", "wall"],
  ["wall", "empty", "wall", "wall", "empty", "wall", "wall", "wall", "empty", "wall"],
  ["wall", "empty", "wall", "empty", "empty", "empty", "empty", "wall", "empty", "wall"],
  ["wall", "empty", "wall", "empty", "wall", "wall", "empty", "empty", "empty", "wall"],
  ["wall", "empty", "empty", "empty", "empty", "wall", "wall", "wall", "empty", "wall"],
  ["wall", "start", "wall", "empty", "empty", "empty", "empty", "empty", "empty", "wall"],
  ["wall", "wall", "wall", "wall", "wall", "wall", "wall", "wall", "wall", "wall"],
];

const optionalOpenings = [
  { row: 2, col: 4 },
  { row: 4, col: 3 },
  { row: 6, col: 3 },
  { row: 8, col: 5 },
  { row: 10, col: 5 },
  { row: 12, col: 5 },
];

export const pinyinMaps: Record<string, MazeData> = Object.fromEntries(
  pinyinLessons.map((lesson) => [lesson.mapId, createLessonMap(lesson.id, lesson.title, lesson.order)]),
);

export function getPinyinMap(mapId: string): MazeData {
  return pinyinMaps[mapId] ?? pinyinMaps[pinyinLessons[0].mapId];
}

function createLessonMap(lessonId: string, lessonTitle: string, order: number): MazeData {
  const grid = baseGrid.map((row) => [...row]);
  const mask = order - 1;

  optionalOpenings.forEach((opening, index) => {
    if ((mask & (1 << index)) !== 0) {
      grid[opening.row][opening.col] = "empty";
    }
  });

  return {
    id: `map-${lessonId}`,
    name: `多多拼音迷宫 ${order}: ${lessonTitle}`,
    rows: grid.length,
    cols: grid[0].length,
    cellSize: 2,
    wallHeight: 1.8,
    grid,
  };
}

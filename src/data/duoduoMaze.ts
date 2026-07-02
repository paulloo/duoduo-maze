import type { MazeData } from "../types/maze";

export const duoduoMaze: MazeData = {
  id: "duoduo-001",
  name: "多多的拼音迷宫",
  rows: 16,
  cols: 10,
  cellSize: 2,
  wallHeight: 1.8,
  grid: [
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
  ],
};

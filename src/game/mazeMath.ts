import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { MazeData, MazePoint } from "../types/maze";

export function findCell(maze: MazeData, type: "start" | "end"): MazePoint {
  for (let row = 0; row < maze.rows; row += 1) {
    for (let col = 0; col < maze.cols; col += 1) {
      if (maze.grid[row]?.[col] === type) {
        return { row, col };
      }
    }
  }

  throw new Error(`Maze is missing a ${type} cell.`);
}

export function cellToWorld(maze: MazeData, point: MazePoint, y = 0): Vector3 {
  const offsetX = ((maze.cols - 1) * maze.cellSize) / 2;
  const offsetZ = ((maze.rows - 1) * maze.cellSize) / 2;

  return new Vector3(
    point.col * maze.cellSize - offsetX,
    y,
    point.row * maze.cellSize - offsetZ,
  );
}

export function worldToCell(maze: MazeData, position: Vector3): MazePoint {
  const offsetX = ((maze.cols - 1) * maze.cellSize) / 2;
  const offsetZ = ((maze.rows - 1) * maze.cellSize) / 2;

  return {
    row: Math.round((position.z + offsetZ) / maze.cellSize),
    col: Math.round((position.x + offsetX) / maze.cellSize),
  };
}

export function canOccupy(maze: MazeData, position: Vector3, radius: number): boolean {
  const probes = [
    new Vector3(position.x, position.y, position.z),
    new Vector3(position.x + radius, position.y, position.z),
    new Vector3(position.x - radius, position.y, position.z),
    new Vector3(position.x, position.y, position.z + radius),
    new Vector3(position.x, position.y, position.z - radius),
  ];

  return probes.every((probe) => {
    const cell = worldToCell(maze, probe);
    const type = maze.grid[cell.row]?.[cell.col];
    return type === "empty" || type === "start" || type === "end";
  });
}

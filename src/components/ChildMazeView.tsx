import type { ControlAction, MazeData, PlayerPose } from "../types/maze";

interface ChildMazeViewProps {
  maze: MazeData;
  playerPose: PlayerPose | null;
  onMove: (action: ControlAction) => void;
}

export function ChildMazeView({ maze, playerPose, onMove }: ChildMazeViewProps) {
  return (
    <div className="child-maze-stage" aria-label="儿童 2D 迷宫">
      <div
        className="child-maze-grid"
        style={{ gridTemplateColumns: `repeat(${maze.cols}, minmax(0, 1fr))` }}
      >
        {maze.grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const isPlayer = playerPose?.row === rowIndex && playerPose.col === colIndex;
            return (
              <button
                key={`${rowIndex}-${colIndex}`}
                type="button"
                className={`child-maze-cell ${cell}`}
                onClick={() => {
                  if (!isPlayer) return;
                }}
                aria-label={`${rowIndex + 1} 行 ${colIndex + 1} 列`}
              >
                {cell === "start" ? "起" : null}
                {cell === "end" ? "终" : null}
                {isPlayer ? <span className="child-player" aria-label="当前位置">我</span> : null}
              </button>
            );
          }),
        )}
      </div>
      <div className="child-inline-controls" aria-label="2D 移动按钮">
        <button type="button" onClick={() => onMove("forward")}>上</button>
        <button type="button" onClick={() => onMove("left")}>左</button>
        <button type="button" onClick={() => onMove("right")}>右</button>
        <button type="button" onClick={() => onMove("backward")}>下</button>
      </div>
    </div>
  );
}

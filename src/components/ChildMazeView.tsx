import type { ControlAction, LearningItem, LearningItemStatus, MazeData, PlayerPose } from "../types/maze";

interface ChildMazeViewProps {
  maze: MazeData;
  playerPose: PlayerPose | null;
  learningItems: LearningItem[];
  learningProgress: Record<string, LearningItemStatus>;
  onMove: (action: ControlAction) => void;
}

export function ChildMazeView({ maze, playerPose, learningItems, learningProgress, onMove }: ChildMazeViewProps) {
  return (
    <div className="child-maze-stage" aria-label="儿童 2D 迷宫">
      <div
        className="child-maze-grid"
        style={{ gridTemplateColumns: `repeat(${maze.cols}, minmax(0, 1fr))` }}
      >
        {maze.grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const isPlayer = playerPose?.row === rowIndex && playerPose.col === colIndex;
            const learningItem = learningItems.find(
              (item) => item.position.row === rowIndex && item.position.col === colIndex,
            );
            const itemStatus = learningItem ? learningProgress[learningItem.id] : null;
            const shouldShowLearningItem = learningItem && itemStatus !== "collected";

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
                {shouldShowLearningItem ? (
                  <span
                    className={`learning-token ${learningItem.isCorrect ? "correct" : "distractor"} ${
                      itemStatus === "attempted" ? "attempted" : ""
                    }`}
                    aria-label={`${learningItem.displayText} 拼音卡`}
                  >
                    {learningItem.displayText}
                  </span>
                ) : null}
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

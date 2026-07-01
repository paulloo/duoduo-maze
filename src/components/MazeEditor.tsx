import type { CellType, MazeData, MazePoint } from "../types/maze";

interface MazeEditorProps {
  maze: MazeData;
  selectedTool: CellType;
  onSelectedToolChange: (tool: CellType) => void;
  onCellChange: (row: number, col: number) => void;
  onResetDefault: () => void;
  onClear: () => void;
  onSave: () => void;
  onExport: () => void;
}

const toolLabels: Record<CellType, string> = {
  empty: "空地",
  wall: "墙",
  start: "起点",
  end: "终点",
};

const cellLabels: Record<CellType, string> = {
  empty: "",
  wall: "墙",
  start: "起",
  end: "终",
};

export function MazeEditor({
  maze,
  selectedTool,
  onSelectedToolChange,
  onCellChange,
  onResetDefault,
  onClear,
  onSave,
  onExport,
}: MazeEditorProps) {
  const start = findCell(maze, "start");
  const end = findCell(maze, "end");

  return (
    <aside className="editor-panel" aria-label="迷宫编辑器">
      <div className="editor-header">
        <div>
          <p className="eyebrow">Maze Editor</p>
          <h2>设计迷宫</h2>
        </div>
        <p className="editor-meta">
          {maze.rows} x {maze.cols}
        </p>
      </div>

      <div className="tool-grid" role="group" aria-label="编辑工具">
        {(Object.keys(toolLabels) as CellType[]).map((tool) => (
          <button
            key={tool}
            type="button"
            className={selectedTool === tool ? "active" : ""}
            onClick={() => onSelectedToolChange(tool)}
          >
            {toolLabels[tool]}
          </button>
        ))}
      </div>

      <div
        className="maze-editor-grid"
        style={{ gridTemplateColumns: `repeat(${maze.cols}, minmax(0, 1fr))` }}
      >
        {maze.grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <button
              key={`${rowIndex}-${colIndex}`}
              type="button"
              className={`editor-cell ${cell}`}
              aria-label={`${rowIndex + 1} 行 ${colIndex + 1} 列 ${toolLabels[cell]}`}
              onClick={() => onCellChange(rowIndex, colIndex)}
            >
              {cellLabels[cell]}
            </button>
          )),
        )}
      </div>

      <div className="editor-actions">
        <button type="button" onClick={onSave}>保存</button>
        <button type="button" onClick={onExport}>导出 JSON</button>
        <button type="button" onClick={onClear}>清空</button>
        <button type="button" onClick={onResetDefault}>默认关卡</button>
      </div>

      <div className="editor-note">
        <span>起点：{formatPoint(start)}</span>
        <span>终点：{formatPoint(end)}</span>
      </div>
    </aside>
  );
}

function findCell(maze: MazeData, type: "start" | "end"): MazePoint | null {
  for (let row = 0; row < maze.rows; row += 1) {
    for (let col = 0; col < maze.cols; col += 1) {
      if (maze.grid[row]?.[col] === type) {
        return { row, col };
      }
    }
  }

  return null;
}

function formatPoint(point: MazePoint | null): string {
  if (!point) {
    return "未设置";
  }

  return `${point.row + 1}, ${point.col + 1}`;
}

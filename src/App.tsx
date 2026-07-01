import { useCallback, useEffect, useMemo, useState } from "react";
import { ChildMazeView } from "./components/ChildMazeView";
import { MazeCanvas } from "./components/MazeCanvas";
import { MazeEditor } from "./components/MazeEditor";
import { SentinelMap } from "./components/SentinelMap";
import { TouchControls } from "./components/TouchControls";
import { duoduoMaze } from "./data/duoduoMaze";
import type { CellType, ControlAction, ControlMode, LookDelta, MazeData, MazePoint, MoveVector, PlayerPose } from "./types/maze";

const STORAGE_KEY = "duoduo-maze-current";
const EMPTY_TOUCH_INPUT: Record<ControlAction, boolean> = {
  forward: false,
  backward: false,
  left: false,
  right: false,
};
const ZERO_MOVE_VECTOR: MoveVector = { x: 0, y: 0 };

export function App() {
  const [maze, setMaze] = useState<MazeData>(() => loadSavedMaze() ?? cloneMaze(duoduoMaze));
  const [selectedTool, setSelectedTool] = useState<CellType>("wall");
  const [controlMode, setControlMode] = useState<ControlMode>("child");
  const [mouseLookEnabled, setMouseLookEnabled] = useState(false);
  const [sentinelEnabled, setSentinelEnabled] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [hudOpen, setHudOpen] = useState(() => window.matchMedia("(min-width: 901px)").matches);
  const [touchInput, setTouchInput] = useState<Record<ControlAction, boolean>>(EMPTY_TOUCH_INPUT);
  const [moveVector, setMoveVector] = useState<MoveVector>(ZERO_MOVE_VECTOR);
  const [lookDelta, setLookDelta] = useState<LookDelta | null>(null);
  const [playerPose, setPlayerPose] = useState<PlayerPose>(() => makePose(findRequiredCell(duoduoMaze, "start"), 0));
  const [resetToken, setResetToken] = useState(0);
  const [wonSeconds, setWonSeconds] = useState<number | null>(null);
  const [startedAt, setStartedAt] = useState(() => performance.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [saveMessage, setSaveMessage] = useState("未保存");

  const resetGame = useCallback(() => {
    const start = findRequiredCell(maze, "start");
    setPlayerPose(makePose(start, 0));
    setWonSeconds(null);
    setStartedAt(performance.now());
    setElapsedSeconds(0);
    setTouchInput(EMPTY_TOUCH_INPUT);
    setMoveVector(ZERO_MOVE_VECTOR);
    setLookDelta(null);
    setResetToken((token) => token + 1);
  }, [maze]);

  const finishChildGame = useCallback(() => {
    setWonSeconds((current) => {
      if (current !== null) return current;
      const seconds = (performance.now() - startedAt) / 1000;
      setElapsedSeconds(seconds);
      return seconds;
    });
  }, [startedAt]);

  const moveChildPlayer = useCallback(
    (action: ControlAction) => {
      if (controlMode !== "child" || wonSeconds !== null) return;

      setPlayerPose((current) => {
        const next = getNextPoint(current, action);
        const nextType = maze.grid[next.row]?.[next.col];
        if (nextType !== "empty" && nextType !== "start" && nextType !== "end") {
          return { ...current, yaw: yawForAction(action) };
        }

        const nextPose = makePose(next, yawForAction(action));
        if (nextType === "end") {
          window.setTimeout(finishChildGame, 0);
        }
        return nextPose;
      });
    },
    [controlMode, finishChildGame, maze, wonSeconds],
  );

  const handleControlModeChange = useCallback(() => {
    setControlMode((mode) => {
      const nextMode = mode === "child" ? "free" : "child";
      if (nextMode === "child") {
        setMouseLookEnabled(false);
      }
      setTouchInput(EMPTY_TOUCH_INPUT);
      setMoveVector(ZERO_MOVE_VECTOR);
      setLookDelta(null);
      window.setTimeout(resetGame, 0);
      return nextMode;
    });
  }, [resetGame]);

  const handleTouchControlChange = useCallback(
    (action: ControlAction, active: boolean) => {
      if (controlMode === "child") {
        if (active) moveChildPlayer(action);
        return;
      }

      setTouchInput((current) => ({ ...current, [action]: active }));
    },
    [controlMode, moveChildPlayer],
  );

  const handleFreePlayerMove = useCallback((pose: PlayerPose) => {
    setPlayerPose(pose);
  }, []);

  const handleWin = useCallback((seconds: number) => {
    setWonSeconds(seconds);
    setElapsedSeconds(seconds);
    setTouchInput(EMPTY_TOUCH_INPUT);
    setMoveVector(ZERO_MOVE_VECTOR);
    setLookDelta(null);
  }, []);

  const updateMaze = useCallback((updater: (maze: MazeData) => MazeData) => {
    setMaze((current) => {
      const nextMaze = updater(cloneMaze(current));
      const start = findRequiredCell(nextMaze, "start");
      setPlayerPose(makePose(start, 0));
      return nextMaze;
    });
    setSaveMessage("有未保存修改");
    setWonSeconds(null);
    setStartedAt(performance.now());
    setElapsedSeconds(0);
    setTouchInput(EMPTY_TOUCH_INPUT);
    setMoveVector(ZERO_MOVE_VECTOR);
    setLookDelta(null);
    setResetToken((token) => token + 1);
  }, []);

  const handleCellChange = useCallback(
    (targetRow: number, targetCol: number) => {
      updateMaze((draft) => {
        const currentCell = draft.grid[targetRow][targetCol];
        if ((currentCell === "start" || currentCell === "end") && selectedTool !== currentCell) {
          return draft;
        }

        if (selectedTool === "start" || selectedTool === "end") {
          for (let row = 0; row < draft.rows; row += 1) {
            for (let col = 0; col < draft.cols; col += 1) {
              if (draft.grid[row]?.[col] === selectedTool) {
                draft.grid[row][col] = "empty";
              }
            }
          }
        }

        draft.grid[targetRow][targetCol] = selectedTool;
        return draft;
      });
    },
    [selectedTool, updateMaze],
  );

  const saveMaze = useCallback(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(maze));
    setSaveMessage("已保存到本机");
  }, [maze]);

  const exportMaze = useCallback(() => {
    const blob = new Blob([JSON.stringify(maze, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${maze.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [maze]);

  const clearMaze = useCallback(() => {
    const grid = Array.from({ length: maze.rows }, () => Array<CellType>(maze.cols).fill("empty"));
    grid[maze.rows - 2][1] = "start";
    grid[1][maze.cols - 2] = "end";
    const nextMaze = { ...maze, grid };
    setMaze(nextMaze);
    setPlayerPose(makePose(findRequiredCell(nextMaze, "start"), 0));
    setSaveMessage("有未保存修改");
    resetGame();
  }, [maze, resetGame]);

  const resetDefaultMaze = useCallback(() => {
    const nextMaze = cloneMaze(duoduoMaze);
    setMaze(nextMaze);
    setPlayerPose(makePose(findRequiredCell(nextMaze, "start"), 0));
    setSaveMessage("已恢复默认关卡，尚未保存");
    resetGame();
  }, [resetGame]);

  useEffect(() => {
    const start = findRequiredCell(maze, "start");
    setPlayerPose(makePose(start, 0));
  }, [maze.id, maze.rows, maze.cols]);

  useEffect(() => {
    if (controlMode !== "child") return;

    function handleKeyDown(event: KeyboardEvent): void {
      const action = actionForKey(event.key);
      if (!action) return;
      event.preventDefault();
      moveChildPlayer(action);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [controlMode, moveChildPlayer]);

  useEffect(() => {
    if (wonSeconds !== null) {
      return;
    }

    const timer = window.setInterval(() => {
      setElapsedSeconds((performance.now() - startedAt) / 1000);
    }, 100);

    return () => window.clearInterval(timer);
  }, [startedAt, wonSeconds]);

  const formattedTime = useMemo(() => `${elapsedSeconds.toFixed(1)} 秒`, [elapsedSeconds]);
  const isChildMode = controlMode === "child";
  const controlHint = isChildMode
    ? "儿童模式：方向键 / 触控按钮上下左右移动"
    : "自由视角：PC 用 WASD + 鼠标，移动端左摇杆移动、右侧拖动视角";

  return (
    <main className={`app-shell ${editorOpen ? "editor-open" : "editor-closed"} ${isChildMode ? "app-child" : "app-free"}`}>
      <section className={`play-area ${isChildMode ? "child-mode" : "free-mode"}`}>
        {isChildMode ? (
          <ChildMazeView maze={maze} playerPose={playerPose} onMove={moveChildPlayer} />
        ) : (
          <MazeCanvas
            maze={maze}
            controlMode={controlMode}
            mouseLookEnabled={mouseLookEnabled}
            touchInput={touchInput}
            moveVector={moveVector}
            lookDelta={lookDelta}
            resetToken={resetToken}
            onPlayerMove={handleFreePlayerMove}
            onWin={handleWin}
          />
        )}

        <section className={`hud ${hudOpen ? "open" : "collapsed"}`} aria-label="游戏状态">
          <div className="hud-topline">
            <div className="hud-title">
              <p className="eyebrow">DuoDuo Maze</p>
              <h1>{maze.name}</h1>
            </div>
            <button type="button" className="hud-toggle" onClick={() => setHudOpen((open) => !open)} aria-expanded={hudOpen}>
              {hudOpen ? "收起" : "菜单"}
            </button>
          </div>
          <div className="status-row">
            <span>用时 {formattedTime}</span>
            <span>{isChildMode ? "儿童 2D" : "自由视角"}</span>
            <span>{saveMessage}</span>
          </div>
          <div className="button-row">
            <button type="button" onClick={resetGame}>重开</button>
            <button type="button" className="active" onClick={handleControlModeChange}>
              {isChildMode ? "切到自由视角" : "切到儿童 2D"}
            </button>
            <button type="button" className={editorOpen ? "active" : ""} onClick={() => setEditorOpen((open) => !open)}>
              {editorOpen ? "收起编辑" : "编辑地图"}
            </button>
            {!isChildMode ? (
              <button
                type="button"
                className={sentinelEnabled ? "active" : ""}
                onClick={() => setSentinelEnabled((enabled) => !enabled)}
              >
                哨兵模式：{sentinelEnabled ? "开" : "关"}
              </button>
            ) : null}
            {!isChildMode ? (
              <button
                type="button"
                className={mouseLookEnabled ? "active" : ""}
                onClick={() => setMouseLookEnabled((enabled) => !enabled)}
              >
                鼠标视角：{mouseLookEnabled ? "开" : "关"}
              </button>
            ) : null}
          </div>
        </section>

        <SentinelMap maze={maze} playerPose={playerPose} enabled={!isChildMode && sentinelEnabled} />

        <section className="control-hint" aria-label="控制方式">
          <span>{controlHint}</span>
          {!isChildMode ? <span>Esc 释放鼠标</span> : null}
        </section>

        <p className="orientation-hint">横屏体验更好</p>
        <TouchControls onControlChange={handleTouchControlChange} onMoveVectorChange={setMoveVector} onLookDelta={setLookDelta} mode={controlMode} />

        {wonSeconds !== null ? (
          <div className="win-dialog" role="dialog" aria-modal="true" aria-label="通关结果">
            <div className="win-panel">
              <p className="eyebrow">通关完成</p>
              <h2>恭喜通关</h2>
              <p>用时 {wonSeconds.toFixed(1)} 秒</p>
              <button type="button" onClick={resetGame}>再玩一次</button>
            </div>
          </div>
        ) : null}
      </section>

      {editorOpen ? (
        <MazeEditor
          maze={maze}
          selectedTool={selectedTool}
          onSelectedToolChange={setSelectedTool}
          onCellChange={handleCellChange}
          onResetDefault={resetDefaultMaze}
          onClear={clearMaze}
          onSave={saveMaze}
          onExport={exportMaze}
        />
      ) : null}
    </main>
  );
}

function cloneMaze(maze: MazeData): MazeData {
  return {
    ...maze,
    grid: maze.grid.map((row) => [...row]),
  };
}

function loadSavedMaze(): MazeData | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as MazeData;
    if (!isValidMaze(parsed)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function isValidMaze(value: MazeData): boolean {
  if (!value || !Array.isArray(value.grid) || value.rows <= 0 || value.cols <= 0) {
    return false;
  }

  const flat = value.grid.flat();
  return flat.includes("start") && flat.includes("end");
}

function findRequiredCell(maze: MazeData, type: "start" | "end"): MazePoint {
  for (let row = 0; row < maze.rows; row += 1) {
    for (let col = 0; col < maze.cols; col += 1) {
      if (maze.grid[row]?.[col] === type) {
        return { row, col };
      }
    }
  }

  return { row: 0, col: 0 };
}

function makePose(point: MazePoint, yaw: number): PlayerPose {
  return { ...point, yaw };
}

function getNextPoint(point: MazePoint, action: ControlAction): MazePoint {
  if (action === "forward") return { row: point.row - 1, col: point.col };
  if (action === "backward") return { row: point.row + 1, col: point.col };
  if (action === "left") return { row: point.row, col: point.col - 1 };
  return { row: point.row, col: point.col + 1 };
}

function yawForAction(action: ControlAction): number {
  if (action === "forward") return 0;
  if (action === "right") return Math.PI / 2;
  if (action === "backward") return Math.PI;
  return Math.PI * 1.5;
}

function actionForKey(key: string): ControlAction | null {
  const normalized = key.toLowerCase();
  if (normalized === "arrowup" || normalized === "w") return "forward";
  if (normalized === "arrowdown" || normalized === "s") return "backward";
  if (normalized === "arrowleft" || normalized === "a") return "left";
  if (normalized === "arrowright" || normalized === "d") return "right";
  return null;
}




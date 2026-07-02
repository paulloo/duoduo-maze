import { useCallback, useEffect, useMemo, useState } from "react";
import { ChildMazeView } from "./components/ChildMazeView";
import { MazeCanvas } from "./components/MazeCanvas";
import { MazeEditor } from "./components/MazeEditor";
import { SentinelMap } from "./components/SentinelMap";
import { TouchControls } from "./components/TouchControls";
import { playPinyinAudio } from "./audio/pinyinAudio";
import { getPinyinMap } from "./data/pinyinMaps";
import { getLessonById, getLessonIndex, pinyinCourse, pinyinLessons } from "./data/pinyinCourse";
import type {
  CellType,
  ControlAction,
  ControlMode,
  LearningItem,
  LearningItemStatus,
  LookDelta,
  MazeData,
  MazePoint,
  MoveVector,
  PinyinLesson,
  PinyinProgress,
  PlayerPose,
} from "./types/maze";

const STORAGE_KEY = "duoduo-maze-current";
const PINYIN_PROGRESS_STORAGE_KEY = "duoduo-maze-pinyin-progress";
const EMPTY_TOUCH_INPUT: Record<ControlAction, boolean> = {
  forward: false,
  backward: false,
  left: false,
  right: false,
};
const ZERO_MOVE_VECTOR: MoveVector = { x: 0, y: 0 };

export function App() {
  const [maze, setMaze] = useState<MazeData>(() => cloneMaze(getInitialLessonMap()));
  const [pinyinProgress, setPinyinProgress] = useState<PinyinProgress>(() => loadSavedPinyinProgress());
  const [selectedTool, setSelectedTool] = useState<CellType>("wall");
  const [controlMode, setControlMode] = useState<ControlMode>("child");
  const [mouseLookEnabled, setMouseLookEnabled] = useState(false);
  const [sentinelEnabled, setSentinelEnabled] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [hudOpen, setHudOpen] = useState(() => window.matchMedia("(min-width: 901px)").matches);
  const [touchInput, setTouchInput] = useState<Record<ControlAction, boolean>>(EMPTY_TOUCH_INPUT);
  const [moveVector, setMoveVector] = useState<MoveVector>(ZERO_MOVE_VECTOR);
  const [lookDelta, setLookDelta] = useState<LookDelta | null>(null);
  const [playerPose, setPlayerPose] = useState<PlayerPose>(() => makePose(findRequiredCell(getInitialLessonMap(), "start"), 0));
  const [resetToken, setResetToken] = useState(0);
  const [wonSeconds, setWonSeconds] = useState<number | null>(null);
  const [startedAt, setStartedAt] = useState(() => performance.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [saveMessage, setSaveMessage] = useState("未保存");
  const [lessonItemProgress, setLessonItemProgress] = useState<Record<string, LearningItemStatus>>({});
  const [learningMessage, setLearningMessage] = useState(() => getLessonById(loadSavedPinyinProgress().currentLessonId).instruction);

  const currentLesson = getLessonById(pinyinProgress.currentLessonId);
  const currentLessonIndex = getLessonIndex(currentLesson.id);
  const currentUnit = pinyinCourse.units.find((unit) => unit.id === currentLesson.unitId) ?? pinyinCourse.units[0];
  const collectedCorrect = countCollectedCorrect(currentLesson, lessonItemProgress);
  const totalCorrect = currentLesson.items.filter((item) => item.isCorrect).length;
  const requiredCorrect = currentLesson.requiredCorrect;
  const neededCorrectCards = Math.max(0, requiredCorrect - collectedCorrect);
  const canFinishCurrentLesson = canFinishLesson(currentLesson, lessonItemProgress);

  const resetRun = useCallback(
    (targetMaze: MazeData = maze, targetLesson: PinyinLesson = currentLesson, message: string = targetLesson.instruction) => {
      const start = findRequiredCell(targetMaze, "start");
      setPlayerPose(makePose(start, 0));
      setWonSeconds(null);
      setStartedAt(performance.now());
      setElapsedSeconds(0);
      setTouchInput(EMPTY_TOUCH_INPUT);
      setMoveVector(ZERO_MOVE_VECTOR);
      setLookDelta(null);
      setLessonItemProgress({});
      setLearningMessage(message);
      setResetToken((token) => token + 1);
    },
    [currentLesson, maze],
  );

  const finishChildGame = useCallback(
    (finishedProgress: Record<string, LearningItemStatus>) => {
      setWonSeconds((current) => {
        if (current !== null) return current;

        const seconds = (performance.now() - startedAt) / 1000;
        const stars = getCompletionStars(currentLesson, finishedProgress);
        setElapsedSeconds(seconds);
        setPinyinProgress((progress) => ({
          ...progress,
          completedLessonStars: {
            ...progress.completedLessonStars,
            [currentLesson.id]: Math.max(progress.completedLessonStars[currentLesson.id] ?? 0, stars),
          },
        }));
        return seconds;
      });
    },
    [currentLesson, startedAt],
  );

  const changeLesson = useCallback(
    (nextIndex: number) => {
      const boundedIndex = Math.max(0, Math.min(pinyinLessons.length - 1, nextIndex));
      const nextLesson = pinyinLessons[boundedIndex];
      const nextMaze = cloneMaze(getPinyinMap(nextLesson.mapId));
      setMaze(nextMaze);
      setPinyinProgress((progress) => ({ ...progress, currentLessonId: nextLesson.id }));
      resetRun(nextMaze, nextLesson);
    },
    [resetRun],
  );

  const handleLearningItemEncounter = useCallback(
    (learningItem: LearningItem) => {
      if (wonSeconds !== null) return;

      setLessonItemProgress((current) => {
        const currentStatus = current[learningItem.id];

          if (learningItem.isCorrect && currentStatus !== "collected") {
            setLearningMessage(`收集到 ${learningItem.displayText}，读一读再继续。`);
            playPinyinAudio(learningItem.audioKey, learningItem.displayText);
            return { ...current, [learningItem.id]: "collected" };
        }

        if (!learningItem.isCorrect) {
          setLearningMessage(`${learningItem.displayText} 不是本关目标，没关系，继续找。`);
          return { ...current, [learningItem.id]: "attempted" };
        }

        return current;
      });
    },
    [wonSeconds],
  );

  const handleBlockedFinish = useCallback((neededCards: number) => {
    setLearningMessage(`还需要再收集 ${neededCards} 张正确拼音卡。`);
  }, []);

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
        const learningItem = findLearningItem(currentLesson, next);
        let nextLessonItemProgress = lessonItemProgress;

        if (learningItem) {
          const currentStatus = lessonItemProgress[learningItem.id];

          if (learningItem.isCorrect && currentStatus !== "collected") {
            nextLessonItemProgress = { ...lessonItemProgress, [learningItem.id]: "collected" };
            setLessonItemProgress(nextLessonItemProgress);
            setLearningMessage(`收集到 ${learningItem.displayText}，读一读再继续。`);
            playPinyinAudio(learningItem.audioKey, learningItem.displayText);
          } else if (!learningItem.isCorrect) {
            nextLessonItemProgress = { ...lessonItemProgress, [learningItem.id]: "attempted" };
            setLessonItemProgress(nextLessonItemProgress);
            setLearningMessage(`${learningItem.displayText} 不是本关目标，没关系，继续找。`);
          }
        }

        if (nextType === "end") {
          if (!canFinishLesson(currentLesson, nextLessonItemProgress)) {
            const needed = Math.max(0, currentLesson.requiredCorrect - countCollectedCorrect(currentLesson, nextLessonItemProgress));
            setLearningMessage(`还需要再收集 ${needed} 张正确拼音卡。`);
            return nextPose;
          }
          window.setTimeout(() => finishChildGame(nextLessonItemProgress), 0);
        }
        return nextPose;
      });
    },
    [controlMode, currentLesson, finishChildGame, lessonItemProgress, maze, wonSeconds],
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
      window.setTimeout(() => resetRun(), 0);
      return nextMode;
    });
  }, [resetRun]);

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

  const handleWin = useCallback(
    (seconds: number) => {
      const stars = getCompletionStars(currentLesson, lessonItemProgress);
      setWonSeconds(seconds);
      setElapsedSeconds(seconds);
      setTouchInput(EMPTY_TOUCH_INPUT);
      setMoveVector(ZERO_MOVE_VECTOR);
      setLookDelta(null);
      setPinyinProgress((progress) => ({
        ...progress,
        completedLessonStars: {
          ...progress.completedLessonStars,
          [currentLesson.id]: Math.max(progress.completedLessonStars[currentLesson.id] ?? 0, stars),
        },
      }));
    },
    [currentLesson, lessonItemProgress],
  );

  const updateMaze = useCallback(
    (updater: (maze: MazeData) => MazeData) => {
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
      setLessonItemProgress({});
      setLearningMessage("地图已更新，重新开始收集拼音卡。");
      setResetToken((token) => token + 1);
    },
    [],
  );

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
    resetRun(nextMaze);
  }, [maze, resetRun]);

  const resetDefaultMaze = useCallback(() => {
    const nextMaze = cloneMaze(getPinyinMap(currentLesson.mapId));
    setMaze(nextMaze);
    setPlayerPose(makePose(findRequiredCell(nextMaze, "start"), 0));
    setSaveMessage("已恢复默认关卡，尚未保存");
    resetRun(nextMaze);
  }, [currentLesson, resetRun]);

  useEffect(() => {
    window.localStorage.setItem(PINYIN_PROGRESS_STORAGE_KEY, JSON.stringify(pinyinProgress));
  }, [pinyinProgress]);

  useEffect(() => {
    const start = findRequiredCell(maze, "start");
    setPlayerPose(makePose(start, 0));
    setLessonItemProgress({});
    setLearningMessage(currentLesson.instruction);
  }, [currentLesson.id, maze.id, maze.rows, maze.cols]);

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
  const completionStars = wonSeconds !== null ? getCompletionStars(currentLesson, lessonItemProgress) : 0;
  const savedStars = pinyinProgress.completedLessonStars[currentLesson.id] ?? 0;
  const completedLessons = Object.keys(pinyinProgress.completedLessonStars).length;
  const controlHint = isChildMode
    ? "儿童模式：方向键 / 触控按钮上下左右移动"
    : "自由视角：PC 用 WASD + 鼠标，移动端左摇杆移动、右侧拖动视角";

  return (
    <main className={`app-shell ${editorOpen ? "editor-open" : "editor-closed"} ${isChildMode ? "app-child" : "app-free"}`}>
      <section className={`play-area ${isChildMode ? "child-mode" : "free-mode"}`}>
        {isChildMode ? (
          <ChildMazeView
            maze={maze}
            playerPose={playerPose}
            learningItems={currentLesson.items}
            learningProgress={lessonItemProgress}
            onMove={moveChildPlayer}
          />
        ) : (
          <MazeCanvas
            maze={maze}
            controlMode={controlMode}
            mouseLookEnabled={mouseLookEnabled}
            touchInput={touchInput}
            moveVector={moveVector}
            lookDelta={lookDelta}
            learningItems={currentLesson.items}
            learningProgress={lessonItemProgress}
            canFinishLesson={canFinishCurrentLesson}
            neededCorrectCards={neededCorrectCards}
            resetToken={resetToken}
            onPlayerMove={handleFreePlayerMove}
            onLearningItemEncounter={handleLearningItemEncounter}
            onBlockedFinish={handleBlockedFinish}
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
            <span>拼音 {collectedCorrect} / {requiredCorrect}</span>
            <span>{saveMessage}</span>
          </div>
          <section className="learning-card" aria-label="拼音学习目标">
            <div className="course-meta">
              <span>{pinyinCourse.title}</span>
              <span>{completedLessons} / {pinyinLessons.length} 关已完成</span>
            </div>
            <button type="button" className="learning-target" onClick={() => playPinyinAudio(currentLesson.targetAudioKey, currentLesson.targetText)}>
              <span>{currentUnit.title} · 第 {currentLessonIndex + 1} 关</span>
              <strong>{currentLesson.targetText}</strong>
            </button>
            <p>{learningMessage}</p>
            <div className="lesson-picker-row">
              <button type="button" onClick={() => changeLesson(currentLessonIndex - 1)} disabled={currentLessonIndex === 0}>
                上一关
              </button>
              <select
                value={currentLesson.id}
                aria-label="选择拼音关卡"
                onChange={(event) => changeLesson(getLessonIndex(event.target.value))}
              >
                {pinyinLessons.map((lesson, index) => {
                  const lessonUnit = pinyinCourse.units.find((unit) => unit.id === lesson.unitId);
                  const stars = pinyinProgress.completedLessonStars[lesson.id] ?? 0;
                  return (
                    <option key={lesson.id} value={lesson.id}>
                      {index + 1}. {lessonUnit?.title ?? "拼音"} - {lesson.title} {stars > 0 ? `(${stars}星)` : ""}
                    </option>
                  );
                })}
              </select>
              <button type="button" onClick={() => changeLesson(currentLessonIndex + 1)} disabled={currentLessonIndex === pinyinLessons.length - 1}>
                下一关
              </button>
            </div>
            <div className="lesson-stars" aria-label={`本关历史最高 ${savedStars} 星`}>
              {"★".repeat(savedStars)}{"☆".repeat(3 - savedStars)}
            </div>
            <div className="learning-progress" aria-label={`已收集 ${collectedCorrect} 张，通关需要 ${requiredCorrect} 张`}>
              <span style={{ width: `${requiredCorrect > 0 ? Math.min(100, (collectedCorrect / requiredCorrect) * 100) : 0}%` }} />
            </div>
          </section>
          <div className="button-row">
            <button type="button" onClick={() => resetRun()}>重开</button>
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
              <p className="result-stars">{"★".repeat(completionStars)}{"☆".repeat(3 - completionStars)}</p>
              <p>收集到 {collectedCorrect} / {totalCorrect} 张正确拼音卡</p>
              <div className="win-actions">
                <button type="button" onClick={() => resetRun()}>再玩一次</button>
                {currentLessonIndex < pinyinLessons.length - 1 ? (
                  <button type="button" onClick={() => changeLesson(currentLessonIndex + 1)}>下一关</button>
                ) : null}
              </div>
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

    const parsed = JSON.parse(raw) as MazeData & { learning?: unknown };
    if (!isValidMaze(parsed)) {
      return null;
    }

    return stripLegacyLearning(parsed);
  } catch {
    return null;
  }
}

function loadSavedPinyinProgress(): PinyinProgress {
  try {
    const raw = window.localStorage.getItem(PINYIN_PROGRESS_STORAGE_KEY);
    if (!raw) {
      return createDefaultPinyinProgress();
    }

    const parsed = JSON.parse(raw) as PinyinProgress;
    if (!parsed || !getLessonById(parsed.currentLessonId)) {
      return createDefaultPinyinProgress();
    }

    return {
      currentLessonId: getLessonById(parsed.currentLessonId).id,
      completedLessonStars: parsed.completedLessonStars ?? {},
    };
  } catch {
    return createDefaultPinyinProgress();
  }
}

function createDefaultPinyinProgress(): PinyinProgress {
  return {
    currentLessonId: pinyinLessons[0].id,
    completedLessonStars: {},
  };
}

function getInitialLessonMap(): MazeData {
  const progress = loadSavedPinyinProgress();
  const lesson = getLessonById(progress.currentLessonId);
  return getPinyinMap(lesson.mapId);
}

function stripLegacyLearning(maze: MazeData & { learning?: unknown }): MazeData {
  const { learning: _legacyLearning, ...cleanMaze } = maze;
  return cleanMaze;
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

function findLearningItem(lesson: PinyinLesson, point: MazePoint): LearningItem | null {
  return lesson.items.find((item) => item.position.row === point.row && item.position.col === point.col) ?? null;
}

function countCollectedCorrect(lesson: PinyinLesson, progress: Record<string, LearningItemStatus>): number {
  return lesson.items.filter((item) => item.isCorrect && progress[item.id] === "collected").length;
}

function canFinishLesson(lesson: PinyinLesson, progress: Record<string, LearningItemStatus>): boolean {
  return countCollectedCorrect(lesson, progress) >= lesson.requiredCorrect;
}

function getCompletionStars(lesson: PinyinLesson, progress: Record<string, LearningItemStatus>): number {
  const collectedCorrect = countCollectedCorrect(lesson, progress);
  const totalCorrect = lesson.items.filter((item) => item.isCorrect).length;

  if (collectedCorrect >= Math.max(lesson.threeStarCorrect, totalCorrect)) {
    return 3;
  }

  return collectedCorrect >= lesson.requiredCorrect ? 2 : 1;
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

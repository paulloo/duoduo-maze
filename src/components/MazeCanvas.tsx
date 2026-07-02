import { useEffect, useRef } from "react";
import { createMazeScene, type MazeSceneApi } from "../game/createMazeScene";
import type {
  ControlAction,
  ControlMode,
  LearningItem,
  LearningItemStatus,
  LookDelta,
  MazeData,
  MoveVector,
  PlayerPose,
} from "../types/maze";

interface MazeCanvasProps {
  maze: MazeData;
  controlMode: ControlMode;
  mouseLookEnabled: boolean;
  touchInput: Record<ControlAction, boolean>;
  moveVector: MoveVector;
  lookDelta: LookDelta | null;
  learningItems: LearningItem[];
  learningProgress: Record<string, LearningItemStatus>;
  canFinishLesson: boolean;
  neededCorrectCards: number;
  resetToken: number;
  onPlayerMove: (pose: PlayerPose) => void;
  onLearningItemEncounter: (item: LearningItem) => void;
  onBlockedFinish: (neededCards: number) => void;
  onWin: (elapsedSeconds: number) => void;
}

export function MazeCanvas({
  maze,
  controlMode,
  mouseLookEnabled,
  touchInput,
  moveVector,
  lookDelta,
  learningItems,
  learningProgress,
  canFinishLesson,
  neededCorrectCards,
  resetToken,
  onPlayerMove,
  onLearningItemEncounter,
  onBlockedFinish,
  onWin,
}: MazeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<MazeSceneApi | null>(null);
  const onPlayerMoveRef = useRef(onPlayerMove);
  const onLearningItemEncounterRef = useRef(onLearningItemEncounter);
  const onBlockedFinishRef = useRef(onBlockedFinish);
  const onWinRef = useRef(onWin);

  useEffect(() => {
    onPlayerMoveRef.current = onPlayerMove;
    onLearningItemEncounterRef.current = onLearningItemEncounter;
    onBlockedFinishRef.current = onBlockedFinish;
    onWinRef.current = onWin;
  }, [onBlockedFinish, onLearningItemEncounter, onPlayerMove, onWin]);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    const api = createMazeScene({
      canvas: canvasRef.current,
      maze,
      controlMode,
      mouseLookEnabled,
      learningItems,
      learningProgress,
      canFinishLesson,
      neededCorrectCards,
      onPlayerMove: (pose) => onPlayerMoveRef.current(pose),
      onLearningItemEncounter: (item) => onLearningItemEncounterRef.current(item),
      onBlockedFinish: (neededCards) => onBlockedFinishRef.current(neededCards),
      onWin: (elapsedSeconds) => onWinRef.current(elapsedSeconds),
    });

    sceneRef.current = api;

    return () => {
      api.dispose();
      sceneRef.current = null;
    };
  }, [maze]);

  useEffect(() => {
    sceneRef.current?.setControlMode(controlMode);
  }, [controlMode]);

  useEffect(() => {
    sceneRef.current?.setMouseLookEnabled(mouseLookEnabled);
  }, [mouseLookEnabled]);

  useEffect(() => {
    sceneRef.current?.setTouchInput(touchInput);
  }, [touchInput]);

  useEffect(() => {
    sceneRef.current?.setMoveVector(moveVector);
  }, [moveVector]);

  useEffect(() => {
    if (lookDelta) {
      sceneRef.current?.addLookDelta(lookDelta);
    }
  }, [lookDelta]);

  useEffect(() => {
    sceneRef.current?.setLearningState(learningItems, learningProgress);
  }, [learningItems, learningProgress]);

  useEffect(() => {
    sceneRef.current?.setFinishGate(canFinishLesson, neededCorrectCards);
  }, [canFinishLesson, neededCorrectCards]);

  useEffect(() => {
    sceneRef.current?.reset();
  }, [resetToken]);

  return <canvas ref={canvasRef} className="maze-canvas" aria-label="多多迷宫 3D 场景" />;
}

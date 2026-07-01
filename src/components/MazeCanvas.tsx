import { useEffect, useRef } from "react";
import { createMazeScene, type MazeSceneApi } from "../game/createMazeScene";
import type { ControlAction, ControlMode, LookDelta, MazeData, MoveVector, PlayerPose } from "../types/maze";

interface MazeCanvasProps {
  maze: MazeData;
  controlMode: ControlMode;
  mouseLookEnabled: boolean;
  touchInput: Record<ControlAction, boolean>;
  moveVector: MoveVector;
  lookDelta: LookDelta | null;
  resetToken: number;
  onPlayerMove: (pose: PlayerPose) => void;
  onWin: (elapsedSeconds: number) => void;
}

export function MazeCanvas({
  maze,
  controlMode,
  mouseLookEnabled,
  touchInput,
  moveVector,
  lookDelta,
  resetToken,
  onPlayerMove,
  onWin,
}: MazeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<MazeSceneApi | null>(null);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    const api = createMazeScene({
      canvas: canvasRef.current,
      maze,
      controlMode,
      mouseLookEnabled,
      onPlayerMove,
      onWin,
    });

    sceneRef.current = api;

    return () => {
      api.dispose();
      sceneRef.current = null;
    };
  }, [maze, onPlayerMove, onWin]);

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
    sceneRef.current?.reset();
  }, [resetToken]);

  return <canvas ref={canvasRef} className="maze-canvas" aria-label="多多迷宫 3D 场景" />;
}

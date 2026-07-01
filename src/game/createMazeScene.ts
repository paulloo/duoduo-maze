import {
  Color3,
  Color4,
  Engine,
  FreeCamera,
  HemisphericLight,
  Mesh,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Vector3,
} from "@babylonjs/core";
import type { ControlAction, ControlMode, LookDelta, MazeData, MoveVector, PlayerPose } from "../types/maze";
import { canOccupy, cellToWorld, findCell, worldToCell } from "./mazeMath";

export interface MazeSceneApi {
  dispose: () => void;
  reset: () => void;
  setControlMode: (mode: ControlMode) => void;
  setMouseLookEnabled: (enabled: boolean) => void;
  setTouchInput: (input: Record<ControlAction, boolean>) => void;
  setMoveVector: (vector: MoveVector) => void;
  addLookDelta: (delta: LookDelta) => void;
}

interface CreateMazeSceneOptions {
  canvas: HTMLCanvasElement;
  maze: MazeData;
  controlMode: ControlMode;
  mouseLookEnabled: boolean;
  onPlayerMove: (pose: PlayerPose) => void;
  onWin: (elapsedSeconds: number) => void;
}

const PLAYER_RADIUS = 0.34;
const PLAYER_HEIGHT = 1.28;
const PLAYER_SPEED = 4.2;
const TURN_SPEED = 2.5;
const MOUSE_SENSITIVITY = 0.0024;
const TOUCH_LOOK_SENSITIVITY = 0.0048;
const MAX_PITCH = Math.PI / 2.8;

export function createMazeScene({
  canvas,
  maze,
  controlMode,
  mouseLookEnabled,
  onPlayerMove,
  onWin,
}: CreateMazeSceneOptions): MazeSceneApi {
  const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
  const scene = new Scene(engine);
  scene.clearColor = new Color4(0.72, 0.84, 0.9, 1);

  const startCell = findCell(maze, "start");
  const endCell = findCell(maze, "end");
  const startPosition = cellToWorld(maze, startCell, PLAYER_HEIGHT);
  const endPosition = cellToWorld(maze, endCell, 0.04);
  const keys = new Set<string>();
  let mode = controlMode;
  let touchInput: Record<ControlAction, boolean> = {
    forward: false,
    backward: false,
    left: false,
    right: false,
  };
  let moveVector: MoveVector = { x: 0, y: 0 };
  let finished = false;
  let startedAt = performance.now();
  let pointerLocked = false;
  let mouseLook = mouseLookEnabled;
  let lastPoseKey = "";

  new HemisphericLight("main-light", new Vector3(0.2, 1, 0.35), scene).intensity = 0.92;

  const camera = new FreeCamera("first-person-camera", startPosition.clone(), scene);
  camera.minZ = 0.04;
  camera.maxZ = 160;
  camera.fov = 1.08;
  camera.rotation = new Vector3(0, Math.PI, 0);
  scene.activeCamera = camera;

  const floorMaterial = new StandardMaterial("floor-material", scene);
  floorMaterial.diffuseColor = new Color3(0.66, 0.78, 0.73);
  floorMaterial.specularColor = new Color3(0.05, 0.08, 0.08);

  const floor = MeshBuilder.CreateBox(
    "floor",
    {
      width: maze.cols * maze.cellSize,
      depth: maze.rows * maze.cellSize,
      height: 0.08,
    },
    scene,
  );
  floor.position.y = -0.06;
  floor.material = floorMaterial;

  const wallColors = [
    new Color3(0.08, 0.42, 0.56),
    new Color3(0.77, 0.27, 0.12),
    new Color3(0.2, 0.54, 0.28),
    new Color3(0.78, 0.58, 0.12),
    new Color3(0.38, 0.25, 0.62),
  ];

  const wallMaterials = wallColors.map((color, index) => {
    const material = new StandardMaterial(`solid-wall-${index}`, scene);
    material.diffuseColor = color;
    material.emissiveColor = color.scale(0.04);
    material.specularColor = Color3.White().scale(0.18);
    return material;
  });

  maze.grid.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      const position = cellToWorld(maze, { row: rowIndex, col: colIndex }, maze.wallHeight / 2);

      if (cell === "wall") {
        const wall = MeshBuilder.CreateBox(
          `wall-${rowIndex}-${colIndex}`,
          {
            width: maze.cellSize * 0.98,
            depth: maze.cellSize * 0.98,
            height: maze.wallHeight,
          },
          scene,
        );
        wall.position = position;
        wall.material = wallMaterials[(rowIndex + colIndex) % wallMaterials.length];
      }

      if (cell === "start" || cell === "end") {
        const marker = MeshBuilder.CreateBox(
          `${cell}-marker`,
          {
            width: maze.cellSize * 0.84,
            depth: maze.cellSize * 0.84,
            height: 0.08,
          },
          scene,
        );
        marker.position = cellToWorld(maze, { row: rowIndex, col: colIndex }, 0.02);

        const markerMaterial = new StandardMaterial(`${cell}-material`, scene);
        markerMaterial.diffuseColor = cell === "start" ? new Color3(0.1, 0.62, 0.25) : new Color3(0.92, 0.63, 0.05);
        markerMaterial.emissiveColor = markerMaterial.diffuseColor.scale(0.2);
        marker.material = markerMaterial;
      }
    });
  });

  createFinishFlag(scene, endPosition);
  notifyPlayerMove(true);

  function reset(): void {
    camera.position = startPosition.clone();
    camera.rotation = new Vector3(0, Math.PI, 0);
    finished = false;
    startedAt = performance.now();
    notifyPlayerMove(true);
  }

  function setControlMode(nextMode: ControlMode): void {
    mode = nextMode;
    keys.clear();
    touchInput = { forward: false, backward: false, left: false, right: false };
    moveVector = { x: 0, y: 0 };
    if (nextMode === "child" && document.pointerLockElement === canvas) {
      document.exitPointerLock();
    }
  }

  function setMouseLookEnabled(enabled: boolean): void {
    mouseLook = enabled;
    if (!enabled && document.pointerLockElement === canvas) {
      document.exitPointerLock();
    }
  }

  function setTouchInput(input: Record<ControlAction, boolean>): void {
    touchInput = input;
  }


  function setMoveVector(vector: MoveVector): void {
    moveVector = vector;
  }

  function addLookDelta(delta: LookDelta): void {
    if (mode !== "free") {
      return;
    }

    rotateLook(delta.x, delta.y, TOUCH_LOOK_SENSITIVITY);
  }
  function movePlayer(deltaSeconds: number): void {
    if (mode === "child") {
      movePlayerChild(deltaSeconds);
    } else {
      movePlayerFree(deltaSeconds);
    }

    const currentCell = worldToCell(maze, camera.position);
    if (!finished && currentCell.row === endCell.row && currentCell.col === endCell.col) {
      finished = true;
      onWin((performance.now() - startedAt) / 1000);
    }

    notifyPlayerMove(false);
  }

  function movePlayerChild(deltaSeconds: number): void {
    if (isActionActive("left")) {
      camera.rotation.y -= TURN_SPEED * deltaSeconds;
    }
    if (isActionActive("right")) {
      camera.rotation.y += TURN_SPEED * deltaSeconds;
    }

    const forward = getCameraForward();
    const direction = new Vector3(0, 0, 0);
    if (isActionActive("forward")) direction.addInPlace(forward);
    if (isActionActive("backward")) direction.subtractInPlace(forward);

    applyMovement(direction, deltaSeconds);
  }

  function movePlayerFree(deltaSeconds: number): void {
    const forward = getCameraForward();
    const right = getCameraRight();
    const direction = new Vector3(0, 0, 0);
    const vectorStrength = Math.min(1, Math.hypot(moveVector.x, moveVector.y));

    if (isActionActive("forward")) direction.addInPlace(forward);
    if (isActionActive("backward")) direction.subtractInPlace(forward);
    if (isActionActive("right")) direction.addInPlace(right);
    if (isActionActive("left")) direction.subtractInPlace(right);

    if (vectorStrength > 0.03) {
      direction.addInPlace(forward.scale(moveVector.y));
      direction.addInPlace(right.scale(moveVector.x));
    }

    applyMovement(direction, deltaSeconds, vectorStrength > 0.03 ? Math.max(0.35, vectorStrength) : 1);
  }


  function getCameraForward(): Vector3 {
    return new Vector3(Math.sin(camera.rotation.y), 0, Math.cos(camera.rotation.y));
  }

  function getCameraRight(): Vector3 {
    return new Vector3(Math.cos(camera.rotation.y), 0, -Math.sin(camera.rotation.y));
  }
  function applyMovement(direction: Vector3, deltaSeconds: number, speedScale = 1): void {
    if (direction.lengthSquared() === 0) {
      return;
    }

    direction.normalize().scaleInPlace(PLAYER_SPEED * speedScale * deltaSeconds);

    const nextX = camera.position.add(new Vector3(direction.x, 0, 0));
    if (canOccupy(maze, nextX, PLAYER_RADIUS)) {
      camera.position.x = nextX.x;
    }

    const nextZ = camera.position.add(new Vector3(0, 0, direction.z));
    if (canOccupy(maze, nextZ, PLAYER_RADIUS)) {
      camera.position.z = nextZ.z;
    }
  }

  function isActionActive(action: ControlAction): boolean {
    if (touchInput[action]) {
      return true;
    }

    if (action === "forward") return keys.has("arrowup") || keys.has("w");
    if (action === "backward") return keys.has("arrowdown") || keys.has("s");
    if (action === "left") return keys.has("arrowleft") || keys.has("a");
    return keys.has("arrowright") || keys.has("d");
  }

  function notifyPlayerMove(force: boolean): void {
    const cell = worldToCell(maze, camera.position);
    const yaw = normalizeYaw(camera.rotation.y);
    const poseKey = `${cell.row}:${cell.col}:${Math.round(yaw * 100)}`;

    if (!force && poseKey === lastPoseKey) {
      return;
    }

    lastPoseKey = poseKey;
    onPlayerMove({ row: cell.row, col: cell.col, yaw });
  }

  function handleKeyDown(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    keys.add(key);

    if (key === "r") {
      reset();
    }

    if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) {
      event.preventDefault();
    }
  }

  function handleKeyUp(event: KeyboardEvent): void {
    keys.delete(event.key.toLowerCase());
  }

  function handleCanvasClick(): void {
    canvas.focus();
    if (mode === "free" && mouseLook) {
      canvas.requestPointerLock();
    }
  }

  function handlePointerLockChange(): void {
    pointerLocked = document.pointerLockElement === canvas;
  }

  function handleMouseMove(event: MouseEvent): void {
    if (mode !== "free" || !mouseLook || !pointerLocked) {
      return;
    }

    rotateLook(event.movementX, event.movementY, MOUSE_SENSITIVITY);
  }

  function rotateLook(deltaX: number, deltaY: number, sensitivity: number): void {
    camera.rotation.y += deltaX * sensitivity;
    camera.rotation.x += deltaY * sensitivity;
    camera.rotation.x = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, camera.rotation.x));
  }

  function handleResize(): void {
    engine.resize();
  }

  canvas.tabIndex = 0;
  canvas.addEventListener("click", handleCanvasClick);
  document.addEventListener("pointerlockchange", handlePointerLockChange);
  document.addEventListener("mousemove", handleMouseMove);
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);
  window.addEventListener("resize", handleResize);

  engine.runRenderLoop(() => {
    movePlayer(engine.getDeltaTime() / 1000);
    scene.render();
  });

  return {
    dispose: () => {
      if (document.pointerLockElement === canvas) {
        document.exitPointerLock();
      }
      canvas.removeEventListener("click", handleCanvasClick);
      document.removeEventListener("pointerlockchange", handlePointerLockChange);
      document.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("resize", handleResize);
      engine.stopRenderLoop();
      scene.dispose();
      engine.dispose();
    },
    reset,
    setControlMode,
    setMouseLookEnabled,
    setTouchInput,
    setMoveVector,
    addLookDelta,
  };
}

function normalizeYaw(yaw: number): number {
  const fullTurn = Math.PI * 2;
  return ((yaw % fullTurn) + fullTurn) % fullTurn;
}

function createFinishFlag(scene: Scene, position: Vector3): Mesh {
  const poleMaterial = new StandardMaterial("flag-pole-material", scene);
  poleMaterial.diffuseColor = new Color3(0.2, 0.16, 0.12);

  const flagMaterial = new StandardMaterial("flag-material", scene);
  flagMaterial.diffuseColor = new Color3(0.92, 0.63, 0.05);
  flagMaterial.emissiveColor = new Color3(0.22, 0.14, 0.02);

  const root = new Mesh("finish-flag", scene);

  const pole = MeshBuilder.CreateCylinder("finish-flag-pole", { height: 1.8, diameter: 0.08 }, scene);
  pole.position = new Vector3(position.x - 0.34, 0.94, position.z);
  pole.material = poleMaterial;
  pole.parent = root;

  const flag = MeshBuilder.CreateBox("finish-flag-cloth", { width: 0.82, height: 0.48, depth: 0.04 }, scene);
  flag.position = new Vector3(position.x + 0.1, 1.42, position.z);
  flag.material = flagMaterial;
  flag.parent = root;

  root.position = Vector3.Zero();
  return root;
}










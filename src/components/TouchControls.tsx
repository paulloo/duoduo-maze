import { useRef, useState, type PointerEvent } from "react";
import type { ControlAction, ControlMode, LookDelta, MoveVector } from "../types/maze";

interface TouchControlsProps {
  mode: ControlMode;
  onControlChange: (action: ControlAction, active: boolean) => void;
  onMoveVectorChange: (vector: MoveVector) => void;
  onLookDelta: (delta: LookDelta) => void;
}

const controls: Array<{ action: ControlAction; childLabel: string; className: string }> = [
  { action: "forward", childLabel: "上", className: "forward" },
  { action: "left", childLabel: "左", className: "left" },
  { action: "right", childLabel: "右", className: "right" },
  { action: "backward", childLabel: "下", className: "backward" },
];

export function TouchControls({ mode, onControlChange, onMoveVectorChange, onLookDelta }: TouchControlsProps) {
  const movePadRef = useRef<HTMLDivElement | null>(null);
  const movePointerIdRef = useRef<number | null>(null);
  const lookPointerIdRef = useRef<number | null>(null);
  const lastLookPointRef = useRef<{ x: number; y: number } | null>(null);
  const [moveKnob, setMoveKnob] = useState<MoveVector>({ x: 0, y: 0 });

  if (mode === "free") {
    return (
      <section className="mobile-fps-controls" aria-label="移动端自由视角控制">
        <div
          ref={movePadRef}
          className="move-joystick"
          onPointerDown={(event) => {
            movePointerIdRef.current = event.pointerId;
            event.currentTarget.setPointerCapture(event.pointerId);
            updateMoveStick(event);
          }}
          onPointerMove={updateMoveStick}
          onPointerUp={resetMoveStick}
          onPointerCancel={resetMoveStick}
        >
          <span className="joystick-caption">移动</span>
          <span
            className="joystick-knob"
            style={{ transform: `translate(calc(-50% + ${moveKnob.x * 42}px), calc(-50% + ${-moveKnob.y * 42}px))` }}
          />
        </div>

        <div
          className="look-touch-zone"
          onPointerDown={(event) => {
            lookPointerIdRef.current = event.pointerId;
            lastLookPointRef.current = { x: event.clientX, y: event.clientY };
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={updateLookDrag}
          onPointerUp={endLookDrag}
          onPointerCancel={endLookDrag}
        >
          <span>拖动视角</span>
        </div>
      </section>
    );
  }

  return (
    <section className="touch-controls" aria-label="触控方向按钮">
      {controls.map((control) => (
        <button
          key={control.action}
          type="button"
          className={`touch-control ${control.className}`}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            onControlChange(control.action, true);
          }}
          onPointerUp={(event) => {
            event.currentTarget.releasePointerCapture(event.pointerId);
            onControlChange(control.action, false);
          }}
          onPointerCancel={() => onControlChange(control.action, false)}
          onPointerLeave={() => onControlChange(control.action, false)}
        >
          {control.childLabel}
        </button>
      ))}
    </section>
  );

  function updateMoveStick(event: PointerEvent<HTMLDivElement>): void {
    if (movePointerIdRef.current !== event.pointerId || !movePadRef.current) return;

    const rect = movePadRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const radius = rect.width / 2;
    const rawX = (event.clientX - centerX) / radius;
    const rawY = (centerY - event.clientY) / radius;
    const length = Math.hypot(rawX, rawY);
    const scale = length > 1 ? 1 / length : 1;
    const vector = { x: rawX * scale, y: rawY * scale };

    setMoveKnob(vector);
    onMoveVectorChange(vector);
  }

  function resetMoveStick(event: PointerEvent<HTMLDivElement>): void {
    if (movePointerIdRef.current !== event.pointerId) return;

    movePointerIdRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
    setMoveKnob({ x: 0, y: 0 });
    onMoveVectorChange({ x: 0, y: 0 });
  }

  function updateLookDrag(event: PointerEvent<HTMLDivElement>): void {
    if (lookPointerIdRef.current !== event.pointerId || !lastLookPointRef.current) return;

    const delta = {
      x: event.clientX - lastLookPointRef.current.x,
      y: event.clientY - lastLookPointRef.current.y,
    };

    lastLookPointRef.current = { x: event.clientX, y: event.clientY };

    if (delta.x !== 0 || delta.y !== 0) {
      onLookDelta(delta);
    }
  }

  function endLookDrag(event: PointerEvent<HTMLDivElement>): void {
    if (lookPointerIdRef.current !== event.pointerId) return;

    lookPointerIdRef.current = null;
    lastLookPointRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }
}

import type { CellType, MazeData, PlayerPose } from "../types/maze";

interface SentinelMapProps {
  maze: MazeData;
  playerPose: PlayerPose | null;
  enabled: boolean;
}

const cellLabels: Record<CellType, string> = {
  empty: "",
  wall: "",
  start: "起",
  end: "终",
};

export function SentinelMap({ maze, playerPose, enabled }: SentinelMapProps) {
  if (!enabled) {
    return null;
  }

  return (
    <section className="sentinel-map" aria-label="哨兵小地图">
      <div className="sentinel-map-header">
        <span>哨兵地图</span>
        <span>{maze.rows} x {maze.cols}</span>
      </div>
      <div
        className="sentinel-grid"
        style={{ gridTemplateColumns: `repeat(${maze.cols}, minmax(0, 1fr))` }}
      >
        {maze.grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const isPlayer = playerPose?.row === rowIndex && playerPose.col === colIndex;
            return (
              <div key={`${rowIndex}-${colIndex}`} className={`sentinel-cell ${cell}`}>
                {cellLabels[cell]}
                {isPlayer ? (
                  <span
                    className="sentinel-player"
                    style={{ transform: `translate(-50%, -50%) rotate(${Math.PI - playerPose.yaw}rad)` }}
                    aria-label="当前位置"
                  />
                ) : null}
              </div>
            );
          }),
        )}
      </div>
    </section>
  );
}

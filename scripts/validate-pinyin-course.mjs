import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const repoRoot = path.resolve(import.meta.dirname, "..");
const tempDir = await mkdtemp(path.join(tmpdir(), "duoduo-pinyin-"));

try {
  const pinyinModulePath = await transpileTsModule("src/data/pinyinCourse.ts", "pinyinCourse.mjs");
  const audioModulePath = await transpileTsModule("src/audio/pinyinAudio.ts", "pinyinAudio.mjs");
  const mapsModulePath = await transpileTsModule("src/data/pinyinMaps.ts", "pinyinMaps.mjs", [
    ['from "./pinyinCourse"', 'from "./pinyinCourse.mjs"'],
  ]);
  const { pinyinCourse, pinyinLessons } = await import(pathToFileURL(pinyinModulePath).href);
  const { pinyinMaps } = await import(pathToFileURL(mapsModulePath).href);
  const { resolvePinyinAudioCandidates } = await import(pathToFileURL(audioModulePath).href);

  assert(pinyinCourse.units.length === 6, "course should contain 6 units");
  assert(pinyinLessons.length === 32, "course should contain 32 lessons");
  assert(Object.keys(pinyinMaps).length === 32, "course should contain 32 lesson maps");

  const lessonIds = new Set();
  const mapIds = new Set();
  const mapLayouts = new Set();
  const expectedOrders = pinyinLessons.map((lesson) => lesson.order);
  assert(expectedOrders.every((order, index) => order === index + 1), "lesson orders should be 1 through 32");

  for (const unit of pinyinCourse.units) {
    assert(unit.id && unit.title && unit.description, `unit ${unit.id} should have metadata`);
    assert(unit.lessons.length > 0, `unit ${unit.id} should contain lessons`);
  }

  for (const lesson of pinyinLessons) {
    assert(!lessonIds.has(lesson.id), `duplicate lesson id: ${lesson.id}`);
    lessonIds.add(lesson.id);
    assert(lesson.mapId, `${lesson.id} should declare a mapId`);
    assert(!mapIds.has(lesson.mapId), `duplicate map id: ${lesson.mapId}`);
    mapIds.add(lesson.mapId);

    const map = pinyinMaps[lesson.mapId];
    assert(map, `${lesson.id} references missing map ${lesson.mapId}`);
    assert(map.id === lesson.mapId, `${lesson.id} map id should match referenced map`);
    const layoutKey = JSON.stringify(map.grid);
    assert(!mapLayouts.has(layoutKey), `${lesson.id} should use a unique map layout`);
    mapLayouts.add(layoutKey);
    assert(isReachable(map, findCell(map, "start"), findCell(map, "end")), `${lesson.id} should have a reachable exit`);

    assert(lesson.title && lesson.targetText && lesson.instruction, `${lesson.id} should have visible copy`);
    assert(lesson.requiredCorrect === 3, `${lesson.id} should require 3 correct cards`);

    const correctItems = lesson.items.filter((item) => item.isCorrect);
    const distractorItems = lesson.items.filter((item) => !item.isCorrect);
    assert(correctItems.length >= 3, `${lesson.id} should have at least 3 correct cards`);
    assert(distractorItems.length >= 1, `${lesson.id} should have at least 1 distractor card`);
    assert(lesson.threeStarCorrect === correctItems.length, `${lesson.id} three-star target should match correct cards`);

    const itemIds = new Set();
    const occupiedCells = new Set();
    for (const item of lesson.items) {
      assert(!itemIds.has(item.id), `${lesson.id} has duplicate item id ${item.id}`);
      itemIds.add(item.id);
      assert(item.displayText && item.audioKey && item.category, `${lesson.id}/${item.id} should have learning fields`);

      const cell = map.grid[item.position.row]?.[item.position.col];
      assert(cell === "empty" || cell === "start" || cell === "end", `${lesson.id}/${item.id} should be on a walkable cell`);
      assert(isReachable(map, findCell(map, "start"), item.position), `${lesson.id}/${item.id} should be reachable from start`);
      const cellKey = `${item.position.row},${item.position.col}`;
      assert(!occupiedCells.has(cellKey), `${lesson.id} has multiple cards on ${cellKey}`);
      occupiedCells.add(cellKey);
    }
  }

  assertAudioCandidate(resolvePinyinAudioCandidates, "b", "audio/pinyin/female/bo1.mp3");
  assertAudioCandidate(resolvePinyinAudioCandidates, "zh", "audio/pinyin/female/zhi1.mp3");
  assertAudioCandidate(resolvePinyinAudioCandidates, "má", "audio/pinyin/female/ma2.mp3");
  assertAudioCandidate(resolvePinyinAudioCandidates, "ü", "audio/pinyin/female/yu1.mp3");
  assertAudioCandidate(resolvePinyinAudioCandidates, "üe", "audio/pinyin/female/yue1.mp3");

  console.log("Pinyin course validation passed.");
} finally {
  await rm(tempDir, { recursive: true, force: true });
}

async function transpileTsModule(sourcePath, outputName, replacements = []) {
  const absoluteSourcePath = path.join(repoRoot, sourcePath);
  const source = await readFile(absoluteSourcePath, "utf8");
  const result = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
      verbatimModuleSyntax: false,
    },
    fileName: absoluteSourcePath,
  });
  let outputText = result.outputText;
  for (const [from, to] of replacements) {
    outputText = outputText.replaceAll(from, to);
  }
  const outputPath = path.join(tempDir, outputName);
  await writeFile(outputPath, outputText, "utf8");
  return outputPath;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertAudioCandidate(resolveCandidates, audioKey, expectedPath) {
  const candidates = resolveCandidates(audioKey);
  assert(candidates.includes(expectedPath), `${audioKey} should resolve to ${expectedPath}`);
}

function findCell(map, type) {
  for (let row = 0; row < map.rows; row += 1) {
    for (let col = 0; col < map.cols; col += 1) {
      if (map.grid[row]?.[col] === type) {
        return { row, col };
      }
    }
  }
  throw new Error(`${map.id} is missing ${type}`);
}

function isReachable(map, from, to) {
  const queue = [from];
  const visited = new Set([pointKey(from)]);

  while (queue.length > 0) {
    const current = queue.shift();
    if (current.row === to.row && current.col === to.col) {
      return true;
    }

    for (const next of neighbors(current)) {
      const key = pointKey(next);
      const cell = map.grid[next.row]?.[next.col];
      if (visited.has(key) || !["empty", "start", "end"].includes(cell)) {
        continue;
      }
      visited.add(key);
      queue.push(next);
    }
  }

  return false;
}

function neighbors(point) {
  return [
    { row: point.row - 1, col: point.col },
    { row: point.row + 1, col: point.col },
    { row: point.row, col: point.col - 1 },
    { row: point.row, col: point.col + 1 },
  ];
}

function pointKey(point) {
  return `${point.row},${point.col}`;
}

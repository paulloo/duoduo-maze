const configuredAudioAssets: Record<string, string> = {};

const initialPronunciations: Record<string, string> = {
  b: "bo1",
  p: "po1",
  m: "mo1",
  f: "fo1",
  d: "de1",
  t: "te1",
  n: "ne1",
  l: "le1",
  g: "ge1",
  k: "ke1",
  h: "he1",
  j: "ji1",
  q: "qi1",
  x: "xi1",
  z: "zi1",
  c: "ci1",
  s: "si1",
  zh: "zhi1",
  ch: "chi1",
  sh: "shi1",
  r: "ri1",
  y: "yi1",
  w: "wu1",
};

let currentAudio: HTMLAudioElement | null = null;

export function playPinyinAudio(audioKey: string, fallbackText: string): void {
  stopCurrentAudio();

  const tokens = splitAudioKey(audioKey);
  if (tokens.length > 1) {
    void playTokenQueue(tokens, fallbackText);
    return;
  }

  void playSingleToken(tokens[0] ?? audioKey, fallbackText);
}

export function resolvePinyinAudioCandidates(audioKey: string): string[] {
  const configuredSrc = configuredAudioAssets[audioKey];
  const normalizedName = toAudioFileName(audioKey);
  const candidates = [
    configuredSrc,
    `audio/pinyin/female/${normalizedName}.mp3`,
    `audio/pinyin/${normalizedName}.mp3`,
  ].filter(Boolean) as string[];

  return [...new Set(candidates)];
}

function stopCurrentAudio(): void {
  if (!currentAudio) {
    return;
  }

  currentAudio.pause();
  currentAudio.currentTime = 0;
  currentAudio = null;
}

async function playTokenQueue(tokens: string[], fallbackText: string): Promise<void> {
  for (const token of tokens) {
    const played = await playSingleToken(token, token, false);
    if (!played) {
      speakLearningText(token);
    }
  }

  if (tokens.length === 0) {
    speakLearningText(fallbackText);
  }
}

async function playSingleToken(audioKey: string, fallbackText: string, speakOnMiss = true): Promise<boolean> {
  for (const src of resolvePinyinAudioCandidates(audioKey)) {
    const played = await tryPlayAudio(src);
    if (played) {
      return true;
    }
  }

  if (speakOnMiss) {
    speakLearningText(fallbackText);
  }
  return false;
}

function tryPlayAudio(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    const audio = new Audio(src);
    currentAudio = audio;

    const cleanup = () => {
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("canplaythrough", handleCanPlay);
    };

    const handleEnded = () => {
      cleanup();
      resolve(true);
    };

    const handleError = () => {
      cleanup();
      resolve(false);
    };

    const handleCanPlay = () => {
      audio.play().catch(() => {
        cleanup();
        resolve(false);
      });
    };

    audio.addEventListener("ended", handleEnded, { once: true });
    audio.addEventListener("error", handleError, { once: true });
    audio.addEventListener("canplaythrough", handleCanPlay, { once: true });
    audio.load();
  });
}

function splitAudioKey(audioKey: string): string[] {
  return audioKey
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

function toAudioFileName(audioKey: string): string {
  const normalized = normalizeToneMarks(audioKey.trim().toLowerCase());
  const initialName = initialPronunciations[normalized];
  if (initialName) {
    return initialName;
  }

  if (normalized === "v") return "yu1";
  if (normalized === "ve") return "yue1";
  if (normalized === "vn") return "yun1";
  if (normalized === "van") return "yuan1";

  if (/^[a-zv]+$/.test(normalized)) {
    return `${normalized.replaceAll("v", "yu")}1`;
  }

  return normalized
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeToneMarks(value: string): string {
  return value
    .replaceAll("ā", "a1")
    .replaceAll("á", "a2")
    .replaceAll("ǎ", "a3")
    .replaceAll("à", "a4")
    .replaceAll("ō", "o1")
    .replaceAll("ó", "o2")
    .replaceAll("ǒ", "o3")
    .replaceAll("ò", "o4")
    .replaceAll("ē", "e1")
    .replaceAll("é", "e2")
    .replaceAll("ě", "e3")
    .replaceAll("è", "e4")
    .replaceAll("ī", "i1")
    .replaceAll("í", "i2")
    .replaceAll("ǐ", "i3")
    .replaceAll("ì", "i4")
    .replaceAll("ū", "u1")
    .replaceAll("ú", "u2")
    .replaceAll("ǔ", "u3")
    .replaceAll("ù", "u4")
    .replaceAll("ǖ", "v1")
    .replaceAll("ǘ", "v2")
    .replaceAll("ǚ", "v3")
    .replaceAll("ǜ", "v4")
    .replaceAll("ü", "v");
}

function speakLearningText(text: string): void {
  if (!("speechSynthesis" in window)) {
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-CN";
  utterance.rate = 0.72;
  window.speechSynthesis.speak(utterance);
}

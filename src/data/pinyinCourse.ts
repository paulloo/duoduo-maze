import type { LearningCategory, LearningItem, MazePoint, PinyinCourse, PinyinLesson } from "../types/maze";

const itemPositions: MazePoint[] = [
  { row: 13, col: 2 },
  { row: 11, col: 4 },
  { row: 9, col: 7 },
  { row: 14, col: 4 },
  { row: 12, col: 8 },
  { row: 5, col: 7 },
];

export const pinyinCourse: PinyinCourse = {
  id: "pinyin-foundation-001",
  title: "拼音闯关课程",
  description: "从声母、韵母、声调到拼读的完整拼音收集挑战。",
  units: [
    {
      id: "initials",
      order: 1,
      title: "声母识别",
      description: "先认识常见声母，再区分平舌音、翘舌音和易混声母。",
      lessons: [
        createLesson("initials-bpmf", "initials", 1, "b p m f", "收集 b / p / m / f", "声母 b p m f", "initial", ["b", "p", "m", "f"], ["d", "t"]),
        createLesson("initials-dtnl", "initials", 2, "d t n l", "收集 d / t / n / l", "声母 d t n l", "initial", ["d", "t", "n", "l"], ["b", "p"]),
        createLesson("initials-gkh", "initials", 3, "g k h", "收集 g / k / h", "声母 g k h", "initial", ["g", "k", "h"], ["j", "q", "x"]),
        createLesson("initials-jqx", "initials", 4, "j q x", "收集 j / q / x", "声母 j q x", "initial", ["j", "q", "x"], ["g", "k", "h"]),
        createLesson("initials-zcs", "initials", 5, "z c s", "收集 z / c / s", "平舌音 z c s", "initial", ["z", "c", "s"], ["zh", "ch", "sh"]),
        createLesson("initials-zhchshr", "initials", 6, "zh ch sh r", "收集 zh / ch / sh / r", "翘舌音 zh ch sh r", "initial", ["zh", "ch", "sh", "r"], ["z", "c"]),
        createLesson("initials-yw", "initials", 7, "y w", "收集 y / w / yi", "声母 y w", "initial", ["y", "w", "yi"], ["u", "ü", "i"]),
        createLesson("initials-review", "initials", 8, "声母复习", "收集正确声母", "声母综合复习", "initial", ["b", "d", "g", "zh"], ["ai", "an"]),
      ],
    },
    {
      id: "simple-finals",
      order: 2,
      title: "单韵母与特殊韵母",
      description: "认识单韵母，重点区分 i、u、ü。",
      lessons: [
        createLesson("finals-aoe", "simple-finals", 9, "a o e", "收集 a / o / e", "单韵母 a o e", "final", ["a", "o", "e"], ["ai", "ou", "en"]),
        createLesson("finals-iuu", "simple-finals", 10, "i u ü", "收集 i / u / ü", "单韵母 i u ü", "final", ["i", "u", "ü"], ["y", "w", "yu"]),
        createLesson("finals-iuu-compare", "simple-finals", 11, "i/u/ü 区分", "收集 i / u / ü", "区分 i u ü", "final", ["i", "u", "ü"], ["ui", "iu", "un"]),
        createLesson("finals-simple-review", "simple-finals", 12, "单韵母复习", "收集单韵母", "单韵母综合复习", "final", ["a", "e", "i", "ü"], ["ai", "ei"]),
        createLesson("finals-confusing-review", "simple-finals", 13, "易混复习", "收集目标韵母", "易混韵母复习", "final", ["u", "ü", "o"], ["ou", "uo", "iu"]),
      ],
    },
    {
      id: "compound-finals",
      order: 3,
      title: "复韵母",
      description: "分组认识复韵母和鼻韵母。",
      lessons: [
        createLesson("compound-ai-ei-ui", "compound-finals", 14, "ai ei ui", "收集 ai / ei / ui", "复韵母 ai ei ui", "final", ["ai", "ei", "ui"], ["a", "e", "u"]),
        createLesson("compound-ao-ou-iu", "compound-finals", 15, "ao ou iu", "收集 ao / ou / iu", "复韵母 ao ou iu", "final", ["ao", "ou", "iu"], ["o", "u", "ui"]),
        createLesson("compound-ie-ue-er", "compound-finals", 16, "ie üe er", "收集 ie / üe / er", "复韵母 ie üe er", "final", ["ie", "üe", "er"], ["ei", "ue", "e"]),
        createLesson("nasal-an-en-in", "compound-finals", 17, "an en in", "收集 an / en / in", "前鼻韵母 an en in", "final", ["an", "en", "in"], ["ang", "eng", "ing"]),
        createLesson("nasal-un-un", "compound-finals", 18, "un ün", "收集 un / ün / yuan", "前鼻韵母 un ün", "final", ["un", "ün", "yuan"], ["u", "ü", "ong"]),
        createLesson("nasal-ang-eng-ing-ong", "compound-finals", 19, "ang eng ing ong", "收集 ang / eng / ing / ong", "后鼻韵母 ang eng ing ong", "final", ["ang", "eng", "ing", "ong"], ["an", "en"]),
        createLesson("compound-review", "compound-finals", 20, "复韵母综合", "收集复韵母", "复韵母综合复习", "final", ["ai", "ou", "üe", "ing"], ["b", "zh"]),
      ],
    },
    {
      id: "tones",
      order: 4,
      title: "声调",
      description: "用最小对比识别四声和轻声。",
      lessons: [
        createLesson("tone-first", "tones", 21, "一声", "收集一声", "一声识别", "tone", ["mā", "bā", "shī"], ["má", "mǎ", "mà"]),
        createLesson("tone-second", "tones", 22, "二声", "收集二声", "二声识别", "tone", ["má", "bá", "shí"], ["mā", "mǎ", "mà"]),
        createLesson("tone-third", "tones", 23, "三声", "收集三声", "三声识别", "tone", ["mǎ", "bǎ", "shǐ"], ["mā", "má", "mà"]),
        createLesson("tone-fourth", "tones", 24, "四声", "收集四声", "四声识别", "tone", ["mà", "bà", "shì"], ["mā", "má", "mǎ"]),
        createLesson("tone-neutral-review", "tones", 25, "轻声与综合", "收集轻声和目标声调", "轻声与声调综合", "tone", ["ma", "ba", "de"], ["mā", "má", "mǎ"]),
      ],
    },
    {
      id: "spelling",
      order: 5,
      title: "拼读",
      description: "从两拼到三拼，再认识整体认读音节。",
      lessons: [
        createLesson("spelling-two-part", "spelling", 26, "两拼音节", "收集两拼音节", "两拼音节", "syllable", ["ba", "ma", "shi"], ["b", "a", "ai"]),
        createLesson("spelling-three-part", "spelling", 27, "三拼音节", "收集三拼音节", "三拼音节", "syllable", ["gua", "kuai", "xiong"], ["ga", "kai", "xiu"]),
        createLesson("spelling-whole", "spelling", 28, "整体认读音节", "收集整体认读音节", "整体认读音节", "syllable", ["zhi", "chi", "shi", "ri"], ["zh", "ch"]),
        createLesson("spelling-confusing", "spelling", 29, "易混拼读", "收集目标拼读", "易混拼读", "syllable", ["zi", "ci", "si"], ["zhi", "chi", "shi"]),
        createLesson("spelling-review", "spelling", 30, "拼读综合", "收集正确音节", "拼读综合复习", "syllable", ["ba", "xue", "yuan", "shi"], ["b", "üe"]),
      ],
    },
    {
      id: "integrated",
      order: 6,
      title: "综合应用",
      description: "用拼音线索连接简单词语，不加入阅读理解。",
      lessons: [
        createLesson("integrated-word-match", "integrated", 31, "拼音找词语", "收集词语拼音", "拼音找词语", "syllable", ["māma", "bàba", "mǐfàn"], ["ma", "ba", "fan"]),
        createLesson("integrated-listen-find", "integrated", 32, "听提示找拼音", "收集听到的拼音", "听提示找拼音", "syllable", ["duōduō", "mí gōng", "xué xí"], ["duo", "gong", "xi"]),
      ],
    },
  ],
};

export const pinyinLessons = pinyinCourse.units.flatMap((unit) => unit.lessons);

export function getLessonById(lessonId: string): PinyinLesson {
  return pinyinLessons.find((lesson) => lesson.id === lessonId) ?? pinyinLessons[0];
}

export function getLessonIndex(lessonId: string): number {
  const index = pinyinLessons.findIndex((lesson) => lesson.id === lessonId);
  return index >= 0 ? index : 0;
}

function createLesson(
  id: string,
  unitId: string,
  order: number,
  title: string,
  targetText: string,
  instructionTopic: string,
  category: LearningCategory,
  correctItems: string[],
  distractorItems: string[],
): PinyinLesson {
  const lessonItems = [
    ...correctItems.map((text) => ({ text, isCorrect: true })),
    ...distractorItems.map((text) => ({ text, isCorrect: false })),
  ].slice(0, itemPositions.length);

  return {
    id,
    unitId,
    mapId: `map-${id}`,
    order,
    title,
    targetText,
    targetAudioKey: correctItems.join(" "),
    instruction: `找到 ${instructionTopic} 的正确拼音卡，碰到其他卡片不会扣分。`,
    requiredCorrect: 3,
    threeStarCorrect: correctItems.length,
    items: lessonItems.map((item, index) =>
      createLearningItem(`${id}-${index + 1}`, item.text, category, item.isCorrect, lessonDifficulty(order), itemPositions[index]),
    ),
  };
}

function createLearningItem(
  id: string,
  displayText: string,
  category: LearningCategory,
  isCorrect: boolean,
  difficulty: number,
  position: MazePoint,
): LearningItem {
  return {
    id,
    displayText,
    audioKey: displayText,
    category,
    isCorrect,
    difficulty,
    position,
  };
}

function lessonDifficulty(order: number): number {
  if (order <= 13) return 1;
  if (order <= 25) return 2;
  return 3;
}

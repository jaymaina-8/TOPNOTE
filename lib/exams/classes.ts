/** Canonical exam class keys stored in `exam_session_prices.class_key`. */
export const EXAM_CLASS_KEYS = [
  "playgroup",
  "pp1",
  "pp2",
  "grade_1",
  "grade_2",
  "grade_3",
  "grade_4",
  "grade_5",
  "grade_6",
  "grade_7",
  "grade_8",
  "grade_9",
] as const;

export type ExamClassKey = (typeof EXAM_CLASS_KEYS)[number];

export type ExamClassDefinition = {
  key: ExamClassKey;
  label: string;
};

export const EXAM_CLASSES: readonly ExamClassDefinition[] = [
  { key: "playgroup", label: "Playgroup" },
  { key: "pp1", label: "PP1" },
  { key: "pp2", label: "PP2" },
  { key: "grade_1", label: "Grade 1" },
  { key: "grade_2", label: "Grade 2" },
  { key: "grade_3", label: "Grade 3" },
  { key: "grade_4", label: "Grade 4" },
  { key: "grade_5", label: "Grade 5" },
  { key: "grade_6", label: "Grade 6" },
  { key: "grade_7", label: "Grade 7" },
  { key: "grade_8", label: "Grade 8" },
  { key: "grade_9", label: "Grade 9" },
] as const;

const EXAM_CLASS_LABEL_BY_KEY = new Map(EXAM_CLASSES.map((item) => [item.key, item.label]));

export function getExamClassLabel(classKey: string): string {
  return EXAM_CLASS_LABEL_BY_KEY.get(classKey as ExamClassKey) ?? classKey;
}

export function isExamClassKey(value: string): value is ExamClassKey {
  return EXAM_CLASS_KEYS.includes(value as ExamClassKey);
}

export function defaultExamClassPrices(): Record<ExamClassKey, number> {
  return EXAM_CLASSES.reduce(
    (acc, item) => {
      acc[item.key] = 0;
      return acc;
    },
    {} as Record<ExamClassKey, number>,
  );
}

export function buildPriceMap(
  prices: ReadonlyArray<{ class_key: ExamClassKey; price: number }>,
): Record<ExamClassKey, number> {
  const map = defaultExamClassPrices();
  for (const row of prices) {
    map[row.class_key] = Number(row.price);
  }
  return map;
}

type SortableRow = {
  discipline?: string;
  semester?: "осенний" | "весенний" | string;
  faculty?: string;
  course?: number | string;
  specialization?: string;
};

const semesterOrder: Record<string, number> = {
  осенний: 1,
  весенний: 2,
};

const normalizeText = (v: unknown) => String(v ?? "").trim().toLowerCase();

const toNumber = (v: unknown): number => {
  const n = typeof v === "number" ? v : Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : Number.NaN;
};

const compareText = (a: unknown, b: unknown) => normalizeText(a).localeCompare(normalizeText(b), "ru");

const compareCourse = (a: unknown, b: unknown) => {
  const na = toNumber(a);
  const nb = toNumber(b);
  if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
  if (Number.isFinite(na)) return -1;
  if (Number.isFinite(nb)) return 1;
  return compareText(a, b);
};

const compareSemester = (a: unknown, b: unknown) => {
  const oa = semesterOrder[normalizeText(a)] ?? 999;
  const ob = semesterOrder[normalizeText(b)] ?? 999;
  if (oa !== ob) return oa - ob;
  return compareText(a, b);
};

export const sortTableData = <T extends SortableRow>(rows: T[]): T[] => {
  return [...rows].sort((a, b) => {
    const byDiscipline = compareText(a.discipline, b.discipline);
    if (byDiscipline) return byDiscipline;

    const bySemester = compareSemester(a.semester, b.semester);
    if (bySemester) return bySemester;

    const byFaculty = compareText(a.faculty, b.faculty);
    if (byFaculty) return byFaculty;

    const byCourse = compareCourse(a.course, b.course);
    if (byCourse) return byCourse;

    return compareText(a.specialization, b.specialization);
  });
};


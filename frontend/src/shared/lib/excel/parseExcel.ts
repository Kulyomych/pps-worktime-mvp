import * as XLSX from "xlsx";
import type { ExcelAssignment, ExcelWorkloadRow, ParsedExcelData, ParseExcelResult, ParseExcelWarning } from "../../types/excel";
import type { Teacher } from "../../types/workload";

const normalizeText = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return String(value).trim();
  return String(value).trim();
};

const normalizeHeader = (value: unknown): string => normalizeText(value).replace(/\s+/g, " ").toLowerCase();

const parseNumber = (value: unknown): number => {
  const v = typeof value === "number" ? value : parseFloat(normalizeText(value).replace(",", "."));
  return Number.isFinite(v) ? v : NaN;
};

const round1 = (value: number): number => Math.round(value * 10) / 10;

const toSemester = (value: unknown): "осенний" | "весенний" | null => {
  const raw = normalizeText(value);
  if (!raw) return null;
  const n = parseNumber(raw);
  if (n === 1) return "осенний";
  if (n === 2) return "весенний";

  // Fallback for textual values (just in case the template changes)
  const lowered = raw.toLowerCase();
  if (lowered.includes("осен")) return "осенний";
  if (lowered.includes("весен")) return "весенний";
  return null;
};

const makeWorkloadId = (idPart: string, workType: string): string => {
  const safeWorkType = normalizeText(workType).replace(/\s+/g, "_").replace(/[^\p{L}\p{N}_-]/gu, "");
  return `${idPart}-${safeWorkType}`;
};

type MetaColumnKey =
  | "id"
  | "department"
  | "disciplineCode"
  | "disciplineName"
  | "disciplineRowNumber"
  | "semester"
  | "faculty"
  | "admissionYear"
  | "course"
  | "specialization"
  | "streams"
  | "groups"
  | "practiceGroups"
  | "labGroups"
  | "students"
  | "teacher"
  | "total";

const headerAliases: Record<string, MetaColumnKey> = {
  id: "id",
  каф: "department",
  "код дисц": "disciplineCode",
  "коддисц": "disciplineCode",
  "дисциплина": "disciplineName",
  "№ пп": "disciplineRowNumber",
  "номер пп": "disciplineRowNumber",
  сем: "semester",
  "факультет": "faculty",
  "год набора": "admissionYear",
  курс: "course",
  профиль: "specialization",
  поточков: "streams",
  "потоков": "streams",
  "групп": "groups",
  "групп для практ": "practiceGroups",
  "групп для лаб раб": "labGroups",
  "кол-во студентов": "students",
  "кол-воучащихся": "students",
  преподаватель: "teacher",
  всегo: "total",
  всего: "total",
};

const findHeaderRow = (rows: unknown[][]): number => {
  for (let r = 0; r < Math.min(rows.length, 50); r++) {
    const normalized = new Set(rows[r].map((c) => normalizeHeader(c)));
    if (normalized.has(normalizeHeader("Код дисц")) && normalized.has(normalizeHeader("Дисциплина"))) {
      return r;
    }
  }
  return -1;
};

const getHeaderMap = (headerRow: unknown[]): {
  meta: Partial<Record<MetaColumnKey, number>>;
  workTypeColumns: Array<{ index: number; workType: string }>;
} => {
  const requiredMeta: Array<{ key: MetaColumnKey; names: string[] }> = [
    { key: "id", names: ["ID"] },
    { key: "disciplineCode", names: ["Код дисц"] },
    { key: "disciplineName", names: ["Дисциплина"] },
    { key: "semester", names: ["Сем"] },
    { key: "faculty", names: ["Факультет"] },
    { key: "course", names: ["Курс"] },
    { key: "specialization", names: ["Профиль"] },
    { key: "streams", names: ["Потоков"] },
    { key: "groups", names: ["Групп"] },
    { key: "students", names: ["Кол-во студентов"] },
    { key: "teacher", names: ["Преподаватель"] },
  ];

  const meta: Partial<Record<MetaColumnKey, number>> = {};
  const metaByNormalized = new Map<string, number>();
  headerRow.forEach((cell, idx) => {
    const normalized = normalizeHeader(cell);
    if (!normalized) return;
    metaByNormalized.set(normalized, idx);
  });

  for (const item of requiredMeta) {
    for (const name of item.names) {
      const keyNormalized = normalizeHeader(name);
      const alias = headerAliases[keyNormalized] ?? item.key;
      if (alias === item.key && metaByNormalized.has(keyNormalized)) {
        meta[item.key] = metaByNormalized.get(keyNormalized);
      } else {
        // Try alias mapping by normalized header value as-is
        const aliasKey = headerAliases[keyNormalized];
        if (aliasKey === item.key && metaByNormalized.has(keyNormalized)) {
          meta[item.key] = metaByNormalized.get(keyNormalized);
        }
      }
    }
  }

  const workTypeColumns: Array<{ index: number; workType: string }> = [];
  headerRow.forEach((cell, idx) => {
    const header = normalizeText(cell);
    const normalized = normalizeHeader(cell);
    if (!header) return;
    if (normalized === normalizeHeader("Всего")) return;
    if (headerAliases[normalized]) return; // meta column
    // Exclude group-columns used for meta
    if (normalized.startsWith("групп для ")) return;
    workTypeColumns.push({ index: idx, workType: header });
  });

  return { meta, workTypeColumns };
};

export const parseWorkloadExcel = async (file: File): Promise<ParseExcelResult> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const wb = XLSX.read(arrayBuffer, { type: "array" });
    const sheetName = wb.SheetNames.find((n) => n.trim()) ?? wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];

    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" }) as unknown[][];
    if (!rows.length) {
      return { ok: false, errors: ["Excel пустой."], warnings: [] };
    }

    const headerRowIndex = findHeaderRow(rows);
    if (headerRowIndex < 0) {
      return { ok: false, errors: ["Не найдена строка заголовков Excel."], warnings: [] };
    }

    const headerRow = rows[headerRowIndex];
    const { meta, workTypeColumns } = getHeaderMap(headerRow);

    const missingMetaKeys = (["disciplineCode", "disciplineName", "semester", "faculty", "course", "specialization", "streams", "groups", "students", "teacher"] as MetaColumnKey[])
      .filter((k) => meta[k] === undefined);

    if (missingMetaKeys.length) {
      return {
        ok: false,
        errors: [`Отсутствуют обязательные колонки: ${missingMetaKeys.join(", ")}.`],
        warnings: [],
      };
    }

    if (!workTypeColumns.length) {
      return { ok: false, errors: ["Не найдены колонки видов нагрузки."], warnings: [] };
    }

    const disciplineMap = new Map<string, { id: string; code: string; name: string }>();
    const teacherMap = new Map<string, Teacher>();
    const assignmentsMap = new Map<string, string>(); // disciplineId -> teacherId
    const facultySet = new Set<string>();
    const workTypeSet = new Set<string>();
    const workloads: ExcelWorkloadRow[] = [];
    const warnings: ParseExcelWarning[] = [];
    let fallbackIdCounter = 1;

    const requiredIdIndex = meta.id ?? undefined;

    for (let r = headerRowIndex + 1; r < rows.length; r++) {
      const row = rows[r];
      const disciplineCode = normalizeText(row[meta.disciplineCode!]);
      const disciplineName = normalizeText(row[meta.disciplineName!]);
      const teacherName = normalizeText(row[meta.teacher!]);
      const semester = toSemester(row[meta.semester!]);
      const faculty = normalizeText(row[meta.faculty!]);
      const course = parseNumber(row[meta.course!]);
      const specialization = normalizeText(row[meta.specialization!]);
      const streams = parseNumber(row[meta.streams!]);
      const groups = parseNumber(row[meta.groups!]);
      const students = parseNumber(row[meta.students!]);

      // Stop if we hit a long empty tail
      if (!disciplineCode && !disciplineName && !teacherName && !faculty) continue;

      if (!disciplineCode || !disciplineName) continue;
      if (!semester) {
        warnings.push({ rowIndex: r + 1, message: `Не распознан семестр для дисциплины "${disciplineName}".` });
        continue;
      }

      const disciplineId = disciplineCode;
      disciplineMap.set(disciplineId, disciplineMap.get(disciplineId) ?? { id: disciplineId, code: disciplineCode, name: disciplineName });

      const teacherId = teacherName;
      if (teacherId) {
        teacherMap.set(
          teacherId,
          teacherMap.get(teacherId) ?? { id: teacherId, fullName: teacherName, roles: ["teacher"] }
        );
      }

      if (faculty) facultySet.add(faculty);
      if (Number.isFinite(course)) void 0;

      // Determine assignment (first teacher wins for the discipline)
      if (teacherId) {
        const prev = assignmentsMap.get(disciplineId);
        if (prev && prev !== teacherId) {
          warnings.push({
            rowIndex: r + 1,
            message: `Для дисциплины "${disciplineName}" встретились разные преподаватели. Берем первый.`,
          });
        } else {
          assignmentsMap.set(disciplineId, teacherId);
        }
      }

      const idPart =
        requiredIdIndex !== undefined && row[requiredIdIndex] !== undefined && normalizeText(row[requiredIdIndex])
          ? normalizeText(row[requiredIdIndex])
          : String(fallbackIdCounter++);

      for (const { index: workTypeIndex, workType } of workTypeColumns) {
        const planned = parseNumber(row[workTypeIndex]);
        if (!Number.isFinite(planned)) continue;
        if (planned === 0) continue;

        workTypeSet.add(workType);
        workloads.push({
          id: makeWorkloadId(idPart, workType),
          discipline: disciplineName,
          disciplineId,
          semester,
          faculty,
          course: Number.isFinite(course) ? course : 1,
          specialization,
          streams: Number.isFinite(streams) ? streams : 0,
          groups: Number.isFinite(groups) ? groups : 0,
          students: Number.isFinite(students) ? students : 0,
          workType,
          plannedHours: round1(planned),
          actualHours: 0,
        });
      }
    }

    const assignments: ExcelAssignment[] = [];
    for (const [disciplineId, teacherId] of assignmentsMap.entries()) {
      if (!teacherId) continue;
      assignments.push({ teacherId, disciplineId });
    }

    const parsed: ParsedExcelData = {
      teachers: Array.from(teacherMap.values()),
      disciplines: Array.from(disciplineMap.values()),
      faculties: Array.from(facultySet),
      assignments,
      workloads,
      workTypes: Array.from(workTypeSet).sort((a, b) => a.localeCompare(b, "ru")),
    };

    if (!workloads.length) {
      return { ok: false, errors: ["Не удалось извлечь строки нагрузки из Excel."], warnings };
    }

    return { ok: true, data: parsed, warnings };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ошибка чтения Excel.";
    const warn: ParseExcelWarning = { message };
    return { ok: false, errors: [message], warnings: [warn] };
  }
};


import type { DepartmentReport, FacultyReportItem } from "../../../shared/types/workload";
import type { ExcelDataState } from "../store/excelDataStore";

const semesterKeys = ["осенний", "весенний"] as const;
type SemesterKey = (typeof semesterKeys)[number];

const sumByWorkType = (workloads: { workType: string; plannedHours: number; actualHours: number }[], workTypes: string[]) => {
  const planned: Record<string, number> = {};
  const actual: Record<string, number> = {};
  for (const wt of workTypes) {
    planned[wt] = 0;
    actual[wt] = 0;
  }

  for (const w of workloads) {
    if (planned[w.workType] !== undefined) {
      planned[w.workType] += Number(w.plannedHours) || 0;
      actual[w.workType] += Number(w.actualHours) || 0;
    }
  }

  return { planned, actual };
};

export const buildDepartmentReportFromExcel = (state: ExcelDataState): DepartmentReport => {
  const workTypes = state.workTypes.length
    ? state.workTypes
    : Array.from(new Set(state.workloads.map((w) => w.workType))).sort((a, b) => a.localeCompare(b, "ru"));

  const plannedTotal = state.workloads.reduce((acc, w) => acc + (Number(w.plannedHours) || 0), 0);
  const actualTotal = state.workloads.reduce((acc, w) => acc + (Number(w.actualHours) || 0), 0);
  const deviationTotal = plannedTotal - actualTotal;

  const workloadSummary = state.teachers.map((teacher) => {
    const teacherWorkloads = state.workloads.filter((w) => {
      const assignment = state.assignments.find((a) => a.disciplineId === w.disciplineId);
      return assignment?.teacherId === teacher.id;
    });

    const plannedHours = teacherWorkloads.reduce((acc, w) => acc + (Number(w.plannedHours) || 0), 0);
    const actualHours = teacherWorkloads.reduce((acc, w) => acc + (Number(w.actualHours) || 0), 0);
    return {
      teacherId: teacher.id,
      teacherName: teacher.fullName,
      plannedHours,
      actualHours,
      deviation: plannedHours - actualHours,
    };
  });

  const workTypeSummary = workTypes.map((workType) => {
    const plannedHours = state.workloads
      .filter((w) => w.workType === workType)
      .reduce((acc, w) => acc + (Number(w.plannedHours) || 0), 0);
    const actualHours = state.workloads
      .filter((w) => w.workType === workType)
      .reduce((acc, w) => acc + (Number(w.actualHours) || 0), 0);
    return {
      workType,
      plannedHours,
      actualHours,
      deviation: plannedHours - actualHours,
    };
  });

  const workloadsBySemester = semesterKeys.reduce(
    (acc, key) => {
      acc[key] = state.workloads.filter((w) => w.semester === key);
      return acc;
    },
    {} as Record<SemesterKey, typeof state.workloads>
  );

  const plannedByOsen = sumByWorkType(workloadsBySemester["осенний"], workTypes).planned;
  const plannedByVesen = sumByWorkType(workloadsBySemester["весенний"], workTypes).planned;

  const workloadsAll = state.workloads;
  const { planned: plannedAll, actual: actualAll } = sumByWorkType(workloadsAll, workTypes);

  const valuesForYear: Record<string, number> = {};
  for (const wt of workTypes) valuesForYear[wt] = (plannedByOsen[wt] || 0) + (plannedByVesen[wt] || 0);

  const valuesForPlan: Record<string, number> = { ...valuesForYear };

  const valuesForFact: Record<string, number> = { ...actualAll };

  const valuesForDeviation: Record<string, number> = {};
  for (const wt of workTypes) valuesForDeviation[wt] = (plannedAll[wt] || 0) - (actualAll[wt] || 0);

  const semesterWorkTypeTable: DepartmentReport["semesterWorkTypeTable"] = [
    {
      key: "осенний",
      label: "Осенний семестр",
      total: Object.values(plannedByOsen).reduce((a, b) => a + (Number(b) || 0), 0),
      values: plannedByOsen,
    },
    {
      key: "весенний",
      label: "Весенний семестр",
      total: Object.values(plannedByVesen).reduce((a, b) => a + (Number(b) || 0), 0),
      values: plannedByVesen,
    },
    {
      key: "год",
      label: "Год",
      total: Object.values(valuesForYear).reduce((a, b) => a + (Number(b) || 0), 0),
      values: valuesForYear,
    },
    {
      key: "plan",
      label: "Плановые часы",
      total: Object.values(valuesForPlan).reduce((a, b) => a + (Number(b) || 0), 0),
      values: valuesForPlan,
    },
    {
      key: "fact",
      label: "Фактические часы",
      total: Object.values(valuesForFact).reduce((a, b) => a + (Number(b) || 0), 0),
      values: valuesForFact,
    },
    {
      key: "deviation",
      label: "Расхождение",
      total: deviationTotal,
      values: valuesForDeviation,
    },
  ];

  return {
    totals: {
      plannedHours: plannedTotal,
      actualHours: actualTotal,
      deviation: deviationTotal,
    },
    workloadSummary,
    workTypeSummary,
    semesterWorkTypeTable,
  };
};

export const buildFacultyReportFromExcel = (state: ExcelDataState): FacultyReportItem[] => {
  const map = new Map<
    string,
    {
      plannedOsen: number;
      plannedVesen: number;
      actualOsen: number;
      actualVesen: number;
    }
  >();

  for (const w of state.workloads) {
    const key = w.faculty;
    const prev = map.get(key) ?? { plannedOsen: 0, plannedVesen: 0, actualOsen: 0, actualVesen: 0 };

    const planned = Number(w.plannedHours) || 0;
    const actual = Number(w.actualHours) || 0;

    if (w.semester === "осенний") {
      map.set(key, { ...prev, plannedOsen: prev.plannedOsen + planned, actualOsen: prev.actualOsen + actual });
    } else {
      map.set(key, { ...prev, plannedVesen: prev.plannedVesen + planned, actualVesen: prev.actualVesen + actual });
    }
  }

  return Array.from(map.entries())
    .map(([faculty, values]) => {
      const plannedYear = values.plannedOsen + values.plannedVesen;
      const actualYear = values.actualOsen + values.actualVesen;
      return {
      faculty,
      plannedOsen: values.plannedOsen,
      plannedVesen: values.plannedVesen,
      plannedYear,
      actualOsen: values.actualOsen,
      actualVesen: values.actualVesen,
      actualYear,
      deviationOsen: values.plannedOsen - values.actualOsen,
      deviationVesen: values.plannedVesen - values.actualVesen,
      deviationYear: plannedYear - actualYear,
    };
    })
    .sort((a, b) => a.faculty.localeCompare(b.faculty, "ru"));
};


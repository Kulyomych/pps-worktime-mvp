import type { TeacherWorkloadListItem } from "../../../shared/types/workload";
import type { ExcelWorkloadRow } from "../../../shared/types/excel";
import type { ExcelDataState } from "../store/excelDataStore";

const buildDisciplineToTeacherMap = (state: ExcelDataState): Map<string, string> => {
  const map = new Map<string, string>();
  for (const a of state.assignments) map.set(a.disciplineId, a.teacherId);
  return map;
};

export const selectTeacherRowsFromExcel = (state: ExcelDataState, teacherId: string): ExcelWorkloadRow[] => {
  const disciplineToTeacher = buildDisciplineToTeacherMap(state);
  return state.workloads.filter((w) => disciplineToTeacher.get(w.disciplineId) === teacherId);
};

export const selectAllTeacherWorkloadsFromExcel = (state: ExcelDataState): TeacherWorkloadListItem[] => {
  const disciplineToTeacher = buildDisciplineToTeacherMap(state);

  return state.teachers.map((teacher) => ({
    teacherId: teacher.id,
    teacherName: teacher.fullName,
    rows: state.workloads.filter((w) => disciplineToTeacher.get(w.disciplineId) === teacher.id),
  }));
};

export const selectWorkTypesFromExcel = (state: ExcelDataState): string[] => state.workTypes;

export const selectFacultiesFromExcel = (state: ExcelDataState): string[] => state.faculties;


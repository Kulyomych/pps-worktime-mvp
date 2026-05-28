import type { Teacher, WorkloadRow } from "./workload";

export type Semester = WorkloadRow["semester"];

export interface Discipline {
  id: string; // Stable key for assignments (from "Код дисц")
  code: string;
  name: string; // From "Дисциплина"
}

export interface ExcelAssignment {
  teacherId: string; // From "Преподаватель" (fullName-based)
  disciplineId: string; // From Discipline.id
}

export interface ExcelWorkloadRow extends WorkloadRow {
  disciplineId: string;
}

export interface ParsedExcelData {
  teachers: Teacher[];
  disciplines: Discipline[];
  faculties: string[];
  assignments: ExcelAssignment[];
  workloads: ExcelWorkloadRow[]; // Planned rows + actualHours initialized to 0 (or preserved later in store)
  workTypes: string[]; // Distinct workType headers found in the excel
}

export interface ExcelDataSnapshot {
  initializedFromExcel: boolean;
  teachers: Teacher[];
  disciplines: Discipline[];
  faculties: string[];
  assignments: ExcelAssignment[];
  workloads: ExcelWorkloadRow[];
  workTypes: string[];
}

export interface ParseExcelWarning {
  rowIndex?: number;
  message: string;
}

export interface ParseExcelResultOk {
  ok: true;
  data: ParsedExcelData;
  warnings: ParseExcelWarning[];
}

export interface ParseExcelResultError {
  ok: false;
  errors: string[];
  warnings: ParseExcelWarning[];
}

export type ParseExcelResult = ParseExcelResultOk | ParseExcelResultError;


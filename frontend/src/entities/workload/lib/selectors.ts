import type { TeacherWorkloadListItem, WorkloadRow } from "../../../shared/types/workload";

export interface DepartmentWorkloadRow extends WorkloadRow {
  teacherId: string;
  teacherName: string;
}

export const selectDepartmentWorkloadRows = (allWorkloads: TeacherWorkloadListItem[]): DepartmentWorkloadRow[] =>
  allWorkloads.flatMap((item) =>
    item.rows.map((row) => ({
      ...row,
      teacherId: item.teacherId,
      teacherName: item.teacherName,
    }))
  );

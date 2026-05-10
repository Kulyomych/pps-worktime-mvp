export type UserMode = "teacher" | "head";

export interface Teacher {
  id: string;
  fullName: string;
  roles: UserMode[];
}

export interface WorkloadRow {
  id: string;
  discipline: string;
  semester: "осенний" | "весенний";
  faculty: string;
  course: number;
  specialization: string;
  streams: number;
  groups: number;
  students: number;
  workType: string;
  plannedHours: number;
  actualHours: number;
}

export interface TeacherWorkloadResponse {
  teacherId: string;
  rows: WorkloadRow[];
}

export interface TeacherWorkloadListItem {
  teacherId: string;
  teacherName: string;
  rows: WorkloadRow[];
}

export interface DepartmentReport {
  totals: {
    plannedHours: number;
    actualHours: number;
    deviation: number;
  };
  workloadSummary: Array<{
    teacherId: string;
    teacherName: string;
    plannedHours: number;
    actualHours: number;
    deviation: number;
  }>;
  workTypeSummary: Array<{
    workType: string;
    plannedHours: number;
    actualHours: number;
    deviation: number;
  }>;
  semesterWorkTypeTable: Array<{
    key: "осенний" | "весенний" | "год" | "plan" | "fact" | "deviation";
    label:
      | "Осенний семестр"
      | "Весенний семестр"
      | "Год"
      | "Плановые часы"
      | "Фактические часы"
      | "Расхождение";
    total: number;
    values: Record<string, number>;
  }>;
}

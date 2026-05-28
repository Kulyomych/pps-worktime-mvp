import axios from "axios";
import type {
  DepartmentReport,
  TeacherWorkloadListItem,
  TeacherWorkloadResponse,
  WorkloadRow,
} from "../types/workload";
import type { ExcelDataSnapshot } from "../types/excel";

const api = axios.create({
  baseURL: "http://amvera-Kulyomych17-teacherbackend.amvera.io",
});

export const saveTeacherWorkload = async (
  teacherId: string,
  rows: WorkloadRow[],
) => {
  await api.post("/workload", { teacherId, rows });
};

export const getTeacherWorkload = async (
  teacherId: string,
): Promise<TeacherWorkloadResponse> => {
  const response = await api.get(`/workload/${teacherId}`);
  return response.data;
};

export const getDepartmentReport = async (): Promise<DepartmentReport> => {
  const response = await api.get("/report");
  return response.data;
};

export const getAllTeacherWorkloads = async (): Promise<
  TeacherWorkloadListItem[]
> => {
  const response = await api.get("/workload");
  return response.data;
};

export const getExcelState = async (): Promise<ExcelDataSnapshot> => {
  const response = await api.get("/state");
  return response.data.state;
};

export const saveExcelState = async (
  state: ExcelDataSnapshot,
): Promise<void> => {
  await api.put("/state", { state });
};

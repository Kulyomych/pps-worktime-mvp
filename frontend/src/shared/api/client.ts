import axios from "axios";
import type { DepartmentReport, TeacherWorkloadListItem, TeacherWorkloadResponse, WorkloadRow } from "../types/workload";

const api = axios.create({
  baseURL: "http://localhost:4000",
});

export const saveTeacherWorkload = async (teacherId: string, rows: WorkloadRow[]) => {
  await api.post("/workload", { teacherId, rows });
};

export const getTeacherWorkload = async (teacherId: string): Promise<TeacherWorkloadResponse> => {
  const response = await api.get(`/workload/${teacherId}`);
  return response.data;
};

export const getDepartmentReport = async (): Promise<DepartmentReport> => {
  const response = await api.get("/report");
  return response.data;
};

export const getAllTeacherWorkloads = async (): Promise<TeacherWorkloadListItem[]> => {
  const response = await api.get("/workload");
  return response.data;
};

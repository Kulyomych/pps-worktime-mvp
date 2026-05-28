import { create } from "zustand";
import type { WorkloadRow } from "../../../shared/types/workload";
import type { ExcelDataSnapshot, ExcelWorkloadRow, ParsedExcelData } from "../../../shared/types/excel";
import { loadExcelStateRaw, saveExcelStateRaw } from "../../../shared/lib/storage/localExcelStorage";
import { getExcelState, saveExcelState } from "../../../shared/api/client";

export interface ExcelDataState extends ExcelDataSnapshot {
  loadingFromBackend: boolean;
  initFromExcel: (parsed: ParsedExcelData) => void;
  updateWorkload: (id: string, patch: Partial<WorkloadRow>) => void;
  updateAssignment: (disciplineId: string, teacherId: string) => void;
  hydrateFromBackend: () => Promise<void>;
  resetData: () => void;
}

const defaultState: ExcelDataSnapshot = {
  initializedFromExcel: false,
  teachers: [],
  disciplines: [],
  faculties: [],
  assignments: [],
  workloads: [],
  workTypes: [],
};

export const useExcelDataStore = create<ExcelDataState>((set, get) => {
  const loaded = loadExcelStateRaw() as Partial<ExcelDataSnapshot> | null;
  const initialState: ExcelDataSnapshot = loaded ? { ...defaultState, ...loaded } : defaultState;

  // Ensure runtime shape (so selectors don't explode)
  if (!Array.isArray(initialState.workloads)) initialState.workloads = [];
  if (!Array.isArray(initialState.teachers)) initialState.teachers = [];
  if (!Array.isArray(initialState.disciplines)) initialState.disciplines = [];
  if (!Array.isArray(initialState.assignments)) initialState.assignments = [];
  if (!Array.isArray(initialState.faculties)) initialState.faculties = [];
  if (!Array.isArray(initialState.workTypes)) initialState.workTypes = [];

  const persist = (snapshot: ExcelDataSnapshot) => {
    saveExcelStateRaw(snapshot);
    void saveExcelState(snapshot).catch(() => {
      // If backend is temporarily unavailable, local storage still keeps state.
    });
  };

  const initFromExcel = (parsed: ParsedExcelData) => {
    const existingById = new Map(get().workloads.map((w) => [w.id, w]));

    const workloadsMerged: ExcelWorkloadRow[] = parsed.workloads.map((w) => {
      const existing = existingById.get(w.id);
      return existing
        ? {
            ...w,
            actualHours: existing.actualHours,
          }
        : w;
    });

    const snapshot: ExcelDataSnapshot = {
      initializedFromExcel: true,
      teachers: parsed.teachers,
      disciplines: parsed.disciplines,
      faculties: parsed.faculties,
      assignments: parsed.assignments,
      workloads: workloadsMerged,
      workTypes: parsed.workTypes,
    };

    persist(snapshot);
    set(() => snapshot);
  };

  const updateWorkload = (id: string, patch: Partial<WorkloadRow>) => {
    set((state) => {
      const nextWorkloads = state.workloads.map((w) => (w.id === id ? { ...w, ...patch } : w));
      const snapshot: ExcelDataSnapshot = {
        ...state,
        workloads: nextWorkloads,
      };
      persist(snapshot);
      return snapshot;
    });
  };

  const updateAssignment = (disciplineId: string, teacherId: string) => {
    set((state) => {
      const nextAssignments = state.assignments.some((a) => a.disciplineId === disciplineId)
        ? state.assignments.map((a) => (a.disciplineId === disciplineId ? { ...a, teacherId } : a))
        : [...state.assignments, { teacherId, disciplineId }];

      const snapshot: ExcelDataSnapshot = {
        ...state,
        assignments: nextAssignments,
      };
      persist(snapshot);
      return snapshot;
    });
  };

  const resetData = () => {
    const snapshot: ExcelDataSnapshot = { ...defaultState };
    persist(snapshot);
    set(() => snapshot);
  };

  const hydrateFromBackend = async () => {
    set((state) => ({ ...state, loadingFromBackend: true }));
    try {
      const backendState = await getExcelState();
      const snapshot: ExcelDataSnapshot = { ...defaultState, ...backendState };
      persist(snapshot);
      set(() => ({
        ...snapshot,
        loadingFromBackend: false,
      }));
    } catch {
      set((state) => ({ ...state, loadingFromBackend: false }));
    }
  };

  return {
    ...initialState,
    loadingFromBackend: false,
    initFromExcel,
    updateWorkload,
    updateAssignment,
    hydrateFromBackend,
    resetData,
  };
});


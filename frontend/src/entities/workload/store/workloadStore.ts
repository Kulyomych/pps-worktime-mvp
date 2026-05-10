import { create } from "zustand";
import type { UserMode, WorkloadRow } from "../../../shared/types/workload";

interface WorkloadState {
  mode: UserMode | null;
  selectedTeacherId: string | null;
  rows: WorkloadRow[];
  setMode: (mode: UserMode | null) => void;
  setSelectedTeacher: (teacherId: string | null) => void;
  setRows: (rows: WorkloadRow[]) => void;
  addRow: () => void;
  addRowFromPrevious: () => void;
  updateRow: (id: string, patch: Partial<WorkloadRow>) => void;
  deleteRow: (id: string) => void;
  resetSession: () => void;
}

const newRow = (): WorkloadRow => ({
  id: crypto.randomUUID(),
  discipline: "",
  semester: "осенний",
  faculty: "",
  course: 1,
  specialization: "",
  streams: 0,
  groups: 0,
  students: 0,
  workType: "",
  plannedHours: 0,
  actualHours: 0,
});

const buildRow = (base?: WorkloadRow): WorkloadRow => ({
  ...(base ? { ...base } : newRow()),
  id: crypto.randomUUID(),
});

export const useWorkloadStore = create<WorkloadState>((set) => ({
  mode: null,
  selectedTeacherId: null,
  rows: [],
  setMode: (mode) => set({ mode }),
  setSelectedTeacher: (selectedTeacherId) => set({ selectedTeacherId }),
  setRows: (rows) => set({ rows }),
  addRow: () => set((state) => ({ rows: [...state.rows, buildRow()] })),
  addRowFromPrevious: () =>
    set((state) => {
      const previousRow = state.rows[state.rows.length - 1];
      return { rows: [...state.rows, buildRow(previousRow)] };
    }),
  updateRow: (id, patch) =>
    set((state) => ({
      rows: state.rows.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    })),
  deleteRow: (id) => set((state) => ({ rows: state.rows.filter((row) => row.id !== id) })),
  resetSession: () => set({ mode: null, selectedTeacherId: null, rows: [] }),
}));

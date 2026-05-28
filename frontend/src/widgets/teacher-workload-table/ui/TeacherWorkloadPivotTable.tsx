import { Card, InputNumber, Space, Table, Typography } from "antd";
import type { ColumnsType, ColumnType } from "antd/es/table";
import type { ExcelWorkloadRow } from "../../../shared/types/excel";
import { round1 } from "../../../shared/lib/number/round1";
import { sortTableData } from "../../../shared/lib/sortTableData/sortTableData";
import { TableFrame } from "../../../shared/ui/table-frame/TableFrame";

type PivotRow = {
  key: string;
  discipline: string;
  semester: "осенний" | "весенний";
  faculty: string;
  course: number;
  specialization: string;
  streams: number;
  groups: number;
  students: number;
  cells: Record<
    string,
    | {
        workloadId: string;
        plannedHours: number;
        actualHours: number;
      }
    | undefined
  >;
};

interface Props {
  title?: string;
  rows: ExcelWorkloadRow[];
  workTypes: string[];
  editableActualHours?: boolean;
  onUpdateActualHours?: (workloadId: string, actualHours: number) => void;
}

const makeKey = (w: ExcelWorkloadRow) =>
  [
    w.disciplineId,
    w.semester,
    w.faculty,
    String(w.course ?? ""),
    w.specialization ?? "",
    String(w.streams ?? ""),
    String(w.groups ?? ""),
    String(w.students ?? ""),
  ].join("|");

const textFilter = <T,>(accessor: (row: T) => string): ColumnType<T> => ({
  filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
    <div style={{ padding: 8, width: 220 }}>
      <input
        style={{ width: "100%", padding: 6, border: "1px solid #d9d9d9", borderRadius: 6 }}
        value={(selectedKeys[0] as string) ?? ""}
        placeholder="Фильтр..."
        onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
        onKeyDown={(e) => e.key === "Enter" && confirm()}
      />
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button
          style={{ flex: 1, padding: "6px 10px", border: "1px solid #d9d9d9", borderRadius: 6, background: "#fff" }}
          onClick={() => confirm()}
        >
          Применить
        </button>
        <button
          style={{ flex: 1, padding: "6px 10px", border: "1px solid #d9d9d9", borderRadius: 6, background: "#fff" }}
          onClick={() => {
            clearFilters?.();
            confirm();
          }}
        >
          Сброс
        </button>
      </div>
    </div>
  ),
  onFilter: (value, record) => accessor(record).toLowerCase().includes(String(value).toLowerCase()),
});

export const TeacherWorkloadPivotTable = ({
  title = "Таблица учебной нагрузки",
  rows,
  workTypes,
  editableActualHours = true,
  onUpdateActualHours,
}: Props) => {
  const totalsBySemester = rows.reduce(
    (acc, w) => {
      const planned = Number(w.plannedHours) || 0;
      const actual = Number(w.actualHours) || 0;
      if (w.semester === "осенний") {
        acc.osen.planned += planned;
        acc.osen.actual += actual;
      } else {
        acc.vesen.planned += planned;
        acc.vesen.actual += actual;
      }
      return acc;
    },
    { osen: { planned: 0, actual: 0 }, vesen: { planned: 0, actual: 0 } }
  );
  const totalsYear = {
    planned: totalsBySemester.osen.planned + totalsBySemester.vesen.planned,
    actual: totalsBySemester.osen.actual + totalsBySemester.vesen.actual,
  };

  const pivotRowsMap = new Map<string, PivotRow>();

  for (const w of rows) {
    const key = makeKey(w);
    const existing =
      pivotRowsMap.get(key) ??
      ({
        key,
        discipline: w.discipline,
        semester: w.semester,
        faculty: w.faculty,
        course: w.course,
        specialization: w.specialization,
        streams: w.streams,
        groups: w.groups,
        students: w.students,
        cells: {},
      } satisfies PivotRow);

    existing.cells[w.workType] = {
      workloadId: w.id,
      plannedHours: round1(w.plannedHours),
      actualHours: round1(w.actualHours),
    };

    pivotRowsMap.set(key, existing);
  }

  const pivotRows = sortTableData(Array.from(pivotRowsMap.values()));

  const metaColumns: ColumnsType<PivotRow> = [
    { title: "Дисциплина", dataIndex: "discipline", key: "discipline", width: 220, ...textFilter((r) => r.discipline) },
    { title: "Семестр", dataIndex: "semester", key: "semester", width: 110, ...textFilter((r) => r.semester) },
    { title: "Факультет", dataIndex: "faculty", key: "faculty", width: 110, ...textFilter((r) => r.faculty) },
    { title: "Курс", dataIndex: "course", key: "course", width: 70, ...textFilter((r) => String(r.course ?? "")) },
    {
      title: "Специализация / Профиль",
      dataIndex: "specialization",
      key: "specialization",
      width: 180,
      ...textFilter((r) => r.specialization),
    },
    { title: "Потоков", dataIndex: "streams", key: "streams", width: 80, ...textFilter((r) => String(r.streams ?? "")) },
    { title: "Групп", dataIndex: "groups", key: "groups", width: 80, ...textFilter((r) => String(r.groups ?? "")) },
    { title: "Студентов", dataIndex: "students", key: "students", width: 100, ...textFilter((r) => String(r.students ?? "")) },
  ];

  const workloadColumns: ColumnsType<PivotRow> = workTypes.map((workType) => ({
    title: workType,
    key: workType,
    width: 140,
    ...textFilter((r) => {
      const cell = r.cells[workType];
      if (!cell) return "";
      return `${round1(cell.plannedHours)} ${round1(cell.actualHours)}`;
    }),
    render: (_: unknown, record: PivotRow) => {
      const cell = record.cells[workType];
      if (!cell) return null;
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ color: "rgba(0,0,0,0.65)" }}>План: {round1(cell.plannedHours)}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ color: "rgba(0,0,0,0.65)" }}>Факт:</div>
            <InputNumber
              size="small"
              min={0}
              style={{ width: 84 }}
              value={round1(cell.actualHours)}
              disabled={!editableActualHours}
              onChange={(v) => onUpdateActualHours?.(cell.workloadId, round1(v ?? 0))}
            />
          </div>
        </div>
      );
    },
  }));

  const totalColumns: ColumnsType<PivotRow> = [
    {
      title: "ИТОГО (план)",
      key: "totalPlanned",
      width: 120,
      render: (_: unknown, record) =>
        round1(
          workTypes.reduce((acc, wt) => acc + (Number(record.cells[wt]?.plannedHours) || 0), 0)
        ),
    },
    {
      title: "ИТОГО (факт)",
      key: "totalActual",
      width: 120,
      render: (_: unknown, record) =>
        round1(
          workTypes.reduce((acc, wt) => acc + (Number(record.cells[wt]?.actualHours) || 0), 0)
        ),
    },
    {
      title: "Отклонение",
      key: "totalDeviation",
      width: 120,
      render: (_: unknown, record) => {
        const planned = workTypes.reduce((acc, wt) => acc + (Number(record.cells[wt]?.plannedHours) || 0), 0);
        const actual = workTypes.reduce((acc, wt) => acc + (Number(record.cells[wt]?.actualHours) || 0), 0);
        return round1(planned - actual);
      },
    },
  ];

  const columns: ColumnsType<PivotRow> = [...metaColumns, ...workloadColumns, ...totalColumns];

  return (
    <Card>
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Typography.Title level={3} style={{ marginBottom: 0 }}>
          {title}
        </Typography.Title>
        <TableFrame fullscreenTitle={title}>
          <Table
            rowKey="key"
            size="small"
            className="dense-table"
            tableLayout="fixed"
            bordered
            pagination={false}
            locale={{ emptyText: "Нет данных. Загрузите Excel." }}
            columns={columns}
            dataSource={pivotRows}
            scroll={{ x: "max-content" }}
          />
        </TableFrame>

        <Space size="large" wrap>
          <div>
            <Typography.Text strong>Осенний:</Typography.Text>{" "}
            <Typography.Text>план {round1(totalsBySemester.osen.planned)}, факт {round1(totalsBySemester.osen.actual)}, откл. {round1(totalsBySemester.osen.planned - totalsBySemester.osen.actual)}</Typography.Text>
          </div>
          <div>
            <Typography.Text strong>Весенний:</Typography.Text>{" "}
            <Typography.Text>план {round1(totalsBySemester.vesen.planned)}, факт {round1(totalsBySemester.vesen.actual)}, откл. {round1(totalsBySemester.vesen.planned - totalsBySemester.vesen.actual)}</Typography.Text>
          </div>
          <div>
            <Typography.Text strong>Год:</Typography.Text>{" "}
            <Typography.Text>план {round1(totalsYear.planned)}, факт {round1(totalsYear.actual)}, откл. {round1(totalsYear.planned - totalsYear.actual)}</Typography.Text>
          </div>
        </Space>
      </Space>
    </Card>
  );
};


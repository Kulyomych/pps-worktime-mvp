import { Button, Card, message, Table } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { DepartmentWorkloadRow } from "../../../entities/workload/lib/selectors";
import { exportToExcel } from "../../../shared/lib/exportExcel/exportExcel";
import { round1 } from "../../../shared/lib/number/round1";
import { TableFrame } from "../../../shared/ui/table-frame/TableFrame";

interface TeacherReferenceRow {
  key: string;
  teacherName: string;
  disciplines: string;
  workTypes: string;
  plannedHours: number;
  actualHours: number;
}

interface Props {
  rows: DepartmentWorkloadRow[];
}

export const TeacherReferenceReport = ({ rows }: Props) => {
  const grouped = rows.reduce<Map<string, TeacherReferenceRow>>((acc, row) => {
    const existing = acc.get(row.teacherId) ?? {
      key: row.teacherId,
      teacherName: row.teacherName,
      disciplines: "",
      workTypes: "",
      plannedHours: 0,
      actualHours: 0,
    };

    const disciplineSet = new Set(existing.disciplines ? existing.disciplines.split("; ").filter(Boolean) : []);
    disciplineSet.add(row.discipline);

    const workTypeSet = new Set(existing.workTypes ? existing.workTypes.split("; ").filter(Boolean) : []);
    workTypeSet.add(row.workType);

    acc.set(row.teacherId, {
      ...existing,
      disciplines: Array.from(disciplineSet).sort((a, b) => a.localeCompare(b, "ru")).join("; "),
      workTypes: Array.from(workTypeSet).sort((a, b) => a.localeCompare(b, "ru")).join("; "),
      plannedHours: round1(existing.plannedHours + (Number(row.plannedHours) || 0)),
      actualHours: round1(existing.actualHours + (Number(row.actualHours) || 0)),
    });

    return acc;
  }, new Map());

  const data = Array.from(grouped.values()).sort((a, b) => a.teacherName.localeCompare(b.teacherName, "ru"));

  const columns: ColumnsType<TeacherReferenceRow> = [
    { title: "ФИО преподавателя", dataIndex: "teacherName", width: 260 },
    { title: "Дисциплины", dataIndex: "disciplines", width: 400 },
    { title: "Виды нагрузки", dataIndex: "workTypes", width: 260 },
    { title: "Плановые часы", dataIndex: "plannedHours", width: 140 },
    { title: "Фактические часы", dataIndex: "actualHours", width: 140 },
  ];

  const handleExport = () => {
    if (!data.length) {
      message.warning("Нет данных для экспорта справки.");
      return;
    }
    exportToExcel(
      data,
      [
        { key: "teacherName", title: "ФИО преподавателя" },
        { key: "disciplines", title: "Дисциплины" },
        { key: "workTypes", title: "Виды нагрузки" },
        { key: "plannedHours", title: "Плановые часы" },
        { key: "actualHours", title: "Фактические часы" },
      ],
      "spravka-prepodavateli"
    );
  };

  return (
    <Card title="Справка по преподавателям" extra={<Button icon={<DownloadOutlined />} onClick={handleExport}>Скачать Excel</Button>}>
      <TableFrame fullscreenTitle="Справка по преподавателям">
        <Table
          rowKey="key"
          size="small"
          className="dense-table"
          columns={columns}
          dataSource={data}
          pagination={false}
          locale={{ emptyText: "Нет данных для справки." }}
          tableLayout="fixed"
          bordered
          scroll={{ x: "max-content" }}
        />
      </TableFrame>
    </Card>
  );
};

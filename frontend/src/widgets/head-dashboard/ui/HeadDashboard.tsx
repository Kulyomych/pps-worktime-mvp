import { useMemo } from "react";
import { Button, Card, Select, Space, Table, Typography } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { DepartmentReport, Teacher } from "../../../shared/types/workload";
import { TableFrame } from "../../../shared/ui/table-frame/TableFrame";

interface Props {
  teachers: Teacher[];
  report: DepartmentReport | null;
  selectedTeacherId: string | null;
  onSelectTeacher: (teacherId: string) => void;
  workTypes?: string[];
  onExportReport?: () => void;
}

const semesterRowOrder = ["осенний", "весенний", "год"] as const;

export const HeadDashboard = ({ teachers, report, selectedTeacherId, onSelectTeacher, onExportReport, workTypes = [] }: Props) => {
  const semesterTableRows = useMemo(() => {
    const rows = report?.semesterWorkTypeTable ?? [];
    return semesterRowOrder.map((key) => rows.find((row) => row.key === key)).filter(Boolean) as DepartmentReport["semesterWorkTypeTable"];
  }, [report]);

  const effectiveWorkTypes = useMemo(() => {
    if (workTypes.length) return workTypes;
    const row = report?.semesterWorkTypeTable?.[0];
    return row ? Object.keys(row.values) : [];
  }, [workTypes, report]);

  return (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      <Card title="Преподаватели кафедры">
        <Select
          size="large"
          style={{ width: "100%" }}
          placeholder="Выберите преподавателя для просмотра таблицы"
          value={selectedTeacherId ?? undefined}
          options={teachers.map((teacher) => ({ value: teacher.id, label: teacher.fullName }))}
          onChange={onSelectTeacher}
        />
      </Card>

      <Card title="Общая справка по кафедре">
        <Space style={{ marginBottom: 12 }}>
          <Button icon={<DownloadOutlined />} onClick={onExportReport}>
            Скачать Excel
          </Button>
        </Space>
        <Typography.Title level={5} style={{ marginTop: 0 }}>
          Справка по семестрам и видам работ
        </Typography.Title>
        <TableFrame fullscreenTitle="Общая справка по кафедре">
          <Table
            rowKey="key"
            size="small"
            className="dense-table"
            columns={[
              {
                title: "Период",
                dataIndex: "label",
              },
              ...effectiveWorkTypes.map((workType) => ({
                title: workType,
                dataIndex: ["values", workType],
              })),
              {
                title: "ВСЕГО",
                dataIndex: "total",
              },
            ] as ColumnsType<DepartmentReport["semesterWorkTypeTable"][number]>}
            dataSource={semesterTableRows}
            pagination={false}
            locale={{ emptyText: "Нет данных для отчета." }}
            tableLayout="fixed"
            scroll={{ x: "max-content" }}
            bordered
          />
        </TableFrame>
      </Card>
    </Space>
  );
};

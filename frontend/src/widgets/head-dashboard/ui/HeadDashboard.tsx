import { useMemo } from "react";
import { Button, Card, Select, Space, Table, Typography } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { DepartmentReport, Teacher } from "../../../shared/types/workload";
import { workTypeOptions } from "../../../shared/config/workloadOptions";

interface Props {
  teachers: Teacher[];
  report: DepartmentReport | null;
  selectedTeacherId: string | null;
  onSelectTeacher: (teacherId: string) => void;
  onExportReport?: () => void;
}

const semesterRowOrder = ["осенний", "весенний", "год"] as const;

export const HeadDashboard = ({ teachers, report, selectedTeacherId, onSelectTeacher, onExportReport }: Props) => {
  const semesterTableRows = useMemo(() => {
    const rows = report?.semesterWorkTypeTable ?? [];
    return semesterRowOrder.map((key) => rows.find((row) => row.key === key)).filter(Boolean) as DepartmentReport["semesterWorkTypeTable"];
  }, [report]);

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
        <div className="table-responsive">
          <Table
            rowKey="key"
            size="small"
            className="dense-table"
            columns={[
              {
                title: "Период",
                dataIndex: "label",
              },
              ...workTypeOptions.map((workType) => ({
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
          />
        </div>
      </Card>
    </Space>
  );
};

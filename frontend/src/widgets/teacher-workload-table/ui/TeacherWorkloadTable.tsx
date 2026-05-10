import type { ReactNode } from "react";
import { Button, Card, Input, InputNumber, Select, Space, Statistic, Table, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { DeleteOutlined, PlusOutlined, SaveOutlined } from "@ant-design/icons";
import type { WorkloadRow } from "../../../shared/types/workload";
import { facultyOptions, workTypeOptions } from "../../../shared/config/workloadOptions";

type WorkloadTableRow = WorkloadRow & { teacherName?: string };

interface Props {
  rows: WorkloadTableRow[];
  title?: string;
  editable?: boolean;
  showTeacherColumn?: boolean;
  onAddRow?: () => void;
  onAddRowFromPrevious?: () => void;
  onDeleteRow?: (id: string) => void;
  onUpdateRow?: (id: string, patch: Partial<WorkloadRow>) => void;
  onSave?: () => void;
  saveLoading?: boolean;
  extraActions?: ReactNode;
}

const numberValue = (value: number | null) => value ?? 0;

export const TeacherWorkloadTable = ({
  rows,
  title = "Таблица учебной нагрузки",
  editable = true,
  showTeacherColumn = false,
  onAddRow,
  onAddRowFromPrevious,
  onDeleteRow,
  onUpdateRow,
  onSave,
  saveLoading,
  extraActions,
}: Props) => {
  const columns: ColumnsType<WorkloadTableRow> = [
    ...(showTeacherColumn
      ? [
          {
            title: "ФИО преподавателя",
            dataIndex: "teacherName",
            width: 180,
          },
        ]
      : []),
    {
      title: "Дисциплина",
      dataIndex: "discipline",
      width: 120,
      render: (_, record) =>
        editable ? (
          <Input value={record.discipline} onChange={(e) => onUpdateRow?.(record.id, { discipline: e.target.value })} />
        ) : (
          record.discipline
        ),
    },
    {
      title: "Семестр",
      dataIndex: "semester",
      width: 90,
      render: (_, record) =>
        editable ? (
          <Select
            value={record.semester}
            style={{ width: "100%" }}
            options={[
              { value: "осенний", label: "осенний" },
              { value: "весенний", label: "весенний" },
            ]}
            onChange={(value) => onUpdateRow?.(record.id, { semester: value })}
          />
        ) : (
          record.semester
        ),
    },
    {
      title: "Факультет",
      dataIndex: "faculty",
      width: 95,
      render: (_, record) =>
        editable ? (
          <Select
            value={record.faculty || undefined}
            placeholder="Выберите факультет"
            style={{ width: "100%" }}
            options={facultyOptions.map((value) => ({ value, label: value }))}
            onChange={(value) => onUpdateRow?.(record.id, { faculty: value })}
          />
        ) : (
          record.faculty
        ),
    },
    {
      title: "Курс",
      dataIndex: "course",
      width: 70,
      render: (_, record) =>
        editable ? (
          <InputNumber min={1} value={record.course} onChange={(value) => onUpdateRow?.(record.id, { course: numberValue(value) })} />
        ) : (
          record.course
        ),
    },
    {
      title: "Специализация / Профиль",
      dataIndex: "specialization",
      width: 130,
      render: (_, record) =>
        editable ? (
          <Input
            value={record.specialization}
            onChange={(e) => onUpdateRow?.(record.id, { specialization: e.target.value })}
          />
        ) : (
          record.specialization
        ),
    },
    {
      title: "Количество",
      children: [
        {
          title: "Потоков",
          dataIndex: "streams",
          width: 80,
          render: (_, record) =>
            editable ? (
              <InputNumber min={0} value={record.streams} onChange={(value) => onUpdateRow?.(record.id, { streams: numberValue(value) })} />
            ) : (
              record.streams
            ),
        },
        {
          title: "Групп",
          dataIndex: "groups",
          width: 75,
          render: (_, record) =>
            editable ? (
              <InputNumber min={0} value={record.groups} onChange={(value) => onUpdateRow?.(record.id, { groups: numberValue(value) })} />
            ) : (
              record.groups
            ),
        },
        {
          title: "Студентов",
          dataIndex: "students",
          width: 90,
          render: (_, record) =>
            editable ? (
              <InputNumber min={0} value={record.students} onChange={(value) => onUpdateRow?.(record.id, { students: numberValue(value) })} />
            ) : (
              record.students
            ),
        },
      ],
    },
    {
      title: "Вид работы",
      dataIndex: "workType",
      width: 130,
      render: (_, record) =>
        editable ? (
          <Select
            value={record.workType || undefined}
            placeholder="Выберите вид работы"
            style={{ width: "100%" }}
            options={workTypeOptions.map((value) => ({ value, label: value }))}
            onChange={(value) => onUpdateRow?.(record.id, { workType: value })}
            showSearch
            optionFilterProp="label"
          />
        ) : (
          record.workType
        ),
    },
    {
      title: "Планируемые часы",
      dataIndex: "plannedHours",
      width: 100,
      render: (_, record) =>
        editable ? (
          <InputNumber
            min={0}
            value={record.plannedHours}
            onChange={(value) => onUpdateRow?.(record.id, { plannedHours: numberValue(value) })}
          />
        ) : (
          record.plannedHours
        ),
    },
    {
      title: "Фактические часы",
      dataIndex: "actualHours",
      width: 100,
      render: (_, record) =>
        editable ? (
          <InputNumber
            min={0}
            value={record.actualHours}
            onChange={(value) => onUpdateRow?.(record.id, { actualHours: numberValue(value) })}
          />
        ) : (
          record.actualHours
        ),
    },
    {
      title: "Расхождение",
      key: "deviation",
      width: 90,
      render: (_, record) => record.plannedHours - record.actualHours,
    },
  ];

  if (editable) {
    columns.push({
      title: "",
      key: "actions",
      width: 60,
      render: (_, record) => (
        <Button danger icon={<DeleteOutlined />} onClick={() => onDeleteRow?.(record.id)} />
      ),
    });
  }

  const totals = rows.reduce(
    (acc, row) => {
      acc.planned += Number(row.plannedHours) || 0;
      acc.actual += Number(row.actualHours) || 0;
      return acc;
    },
    { planned: 0, actual: 0 }
  );

  return (
    <Card>
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Typography.Title level={3} style={{ marginBottom: 0 }}>
          {title}
        </Typography.Title>

        {editable && (
          <Space className="teacher-table-toolbar" wrap>
            <Button type="dashed" icon={<PlusOutlined />} onClick={onAddRow}>
              Добавить строку
            </Button>
            <Button type="dashed" onClick={onAddRowFromPrevious}>
              Добавить строку (копировать предыдущую)
            </Button>
            <Button type="primary" icon={<SaveOutlined />} loading={saveLoading} onClick={onSave}>
              Сохранить
            </Button>
            {extraActions}
          </Space>
        )}

        {!editable && extraActions && (
          <Space className="teacher-table-toolbar" wrap>
            {extraActions}
          </Space>
        )}

        <div className="table-responsive">
          <Table
            rowKey="id"
            columns={columns}
            dataSource={rows}
            pagination={false}
            size="small"
            className="dense-table"
            tableLayout="fixed"
            locale={{ emptyText: "Нет данных. Добавьте строку." }}
            bordered
          />
        </div>

        <Space size="large" wrap>
          <Statistic title="Сумма планируемых часов" value={totals.planned} />
          <Statistic title="Сумма фактических часов" value={totals.actual} />
          <Statistic title="Общее расхождение" value={totals.planned - totals.actual} />
        </Space>
      </Space>
    </Card>
  );
};

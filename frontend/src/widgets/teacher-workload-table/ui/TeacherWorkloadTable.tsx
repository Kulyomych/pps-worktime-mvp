import type { ReactNode } from "react";
import { Button, Card, Input, InputNumber, Select, Space, Statistic, Table, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { DeleteOutlined, PlusOutlined, SaveOutlined } from "@ant-design/icons";
import type { WorkloadRow } from "../../../shared/types/workload";
import { round1 } from "../../../shared/lib/number/round1";
import { TableFrame } from "../../../shared/ui/table-frame/TableFrame";

type WorkloadTableRow = WorkloadRow & { teacherName?: string };

interface Props {
  rows: WorkloadTableRow[];
  title?: string;
  editable?: boolean;
  actualHoursOnly?: boolean;
  showTeacherColumn?: boolean;
  facultyOptions?: string[];
  workTypeOptions?: string[];
  onAddRow?: () => void;
  onAddRowFromPrevious?: () => void;
  onDeleteRow?: (id: string) => void;
  onUpdateRow?: (id: string, patch: Partial<WorkloadRow>) => void;
  onSave?: () => void;
  saveLoading?: boolean;
  extraActions?: ReactNode;
}

const numberValue = (value: number | null) => value ?? 0;

const textFilter = <T,>(accessor: (row: T) => string) => ({
  filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => (
    <div style={{ padding: 8, width: 220 }}>
      <Input
        value={(selectedKeys[0] as string) ?? ""}
        placeholder="Фильтр..."
        onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
        onPressEnter={() => confirm()}
      />
      <Space style={{ marginTop: 8 }}>
        <Button type="primary" size="small" onClick={() => confirm()}>
          Применить
        </Button>
        <Button
          size="small"
          onClick={() => {
            clearFilters?.();
            confirm();
          }}
        >
          Сброс
        </Button>
      </Space>
    </div>
  ),
  onFilter: (value: unknown, record: T) => accessor(record).toLowerCase().includes(String(value).toLowerCase()),
});

export const TeacherWorkloadTable = ({
  rows,
  title = "Таблица учебной нагрузки",
  editable = true,
  actualHoursOnly = false,
  showTeacherColumn = false,
  facultyOptions = [],
  workTypeOptions = [],
  onAddRow,
  onAddRowFromPrevious,
  onDeleteRow,
  onUpdateRow,
  onSave,
  saveLoading,
  extraActions,
}: Props) => {
  const canEditStructure = editable && !actualHoursOnly;
  const canEditActualHours = editable;

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
      ...textFilter<WorkloadTableRow>((r) => r.discipline),
      render: (_, record) =>
        editable ? (
          <Input
            value={record.discipline}
            disabled={!canEditStructure}
            onChange={(e) => canEditStructure && onUpdateRow?.(record.id, { discipline: e.target.value })}
          />
        ) : (
          record.discipline
        ),
    },
    {
      title: "Семестр",
      dataIndex: "semester",
      width: 90,
      ...textFilter<WorkloadTableRow>((r) => r.semester),
      render: (_, record) =>
        editable ? (
          <Select
            value={record.semester}
            disabled={!canEditStructure}
            style={{ width: "100%" }}
            options={[
              { value: "осенний", label: "осенний" },
              { value: "весенний", label: "весенний" },
            ]}
            onChange={(value) => canEditStructure && onUpdateRow?.(record.id, { semester: value })}
          />
        ) : (
          record.semester
        ),
    },
    {
      title: "Факультет",
      dataIndex: "faculty",
      width: 95,
      ...textFilter<WorkloadTableRow>((r) => r.faculty),
      render: (_, record) =>
        editable ? (
          <Select
            value={record.faculty || undefined}
            disabled={!canEditStructure}
            placeholder="Выберите факультет"
            style={{ width: "100%" }}
            options={facultyOptions.map((value) => ({ value, label: value }))}
            onChange={(value) => canEditStructure && onUpdateRow?.(record.id, { faculty: value })}
          />
        ) : (
          record.faculty
        ),
    },
    {
      title: "Курс",
      dataIndex: "course",
      width: 70,
      ...textFilter<WorkloadTableRow>((r) => String(r.course ?? "")),
      render: (_, record) =>
        editable ? (
          <InputNumber
            min={1}
            value={record.course}
            disabled={!canEditStructure}
            onChange={(value) => canEditStructure && onUpdateRow?.(record.id, { course: numberValue(value) })}
          />
        ) : (
          record.course
        ),
    },
    {
      title: "Специализация / Профиль",
      dataIndex: "specialization",
      width: 130,
      ...textFilter<WorkloadTableRow>((r) => r.specialization),
      render: (_, record) =>
        editable ? (
          <Input
            value={record.specialization}
            disabled={!canEditStructure}
            onChange={(e) => canEditStructure && onUpdateRow?.(record.id, { specialization: e.target.value })}
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
              <InputNumber
                min={0}
                value={record.streams}
                disabled={!canEditStructure}
                onChange={(value) => canEditStructure && onUpdateRow?.(record.id, { streams: numberValue(value) })}
              />
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
              <InputNumber
                min={0}
                value={record.groups}
                disabled={!canEditStructure}
                onChange={(value) => canEditStructure && onUpdateRow?.(record.id, { groups: numberValue(value) })}
              />
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
              <InputNumber
                min={0}
                value={record.students}
                disabled={!canEditStructure}
                onChange={(value) => canEditStructure && onUpdateRow?.(record.id, { students: numberValue(value) })}
              />
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
      ...textFilter<WorkloadTableRow>((r) => r.workType),
      render: (_, record) =>
        editable ? (
          <Select
            value={record.workType || undefined}
            disabled={!canEditStructure}
            placeholder="Выберите вид работы"
            style={{ width: "100%" }}
            options={workTypeOptions.map((value) => ({ value, label: value }))}
            onChange={(value) => canEditStructure && onUpdateRow?.(record.id, { workType: value })}
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
      ...textFilter<WorkloadTableRow>((r) => String(round1(r.plannedHours))),
      render: (_, record) =>
        editable ? (
          <InputNumber
            min={0}
            value={record.plannedHours}
            disabled={!canEditStructure}
            onChange={(value) => canEditStructure && onUpdateRow?.(record.id, { plannedHours: round1(numberValue(value)) })}
          />
        ) : (
          round1(record.plannedHours)
        ),
    },
    {
      title: "Фактические часы",
      dataIndex: "actualHours",
      width: 100,
      ...textFilter<WorkloadTableRow>((r) => String(round1(r.actualHours))),
      render: (_, record) =>
        editable ? (
          <InputNumber
            min={0}
            value={record.actualHours}
            disabled={!canEditActualHours}
            onChange={(value) => onUpdateRow?.(record.id, { actualHours: round1(numberValue(value)) })}
          />
        ) : (
          round1(record.actualHours)
        ),
    },
    {
      title: "Расхождение",
      key: "deviation",
      width: 90,
      ...textFilter<WorkloadTableRow>((r) => String(round1((Number(r.plannedHours) || 0) - (Number(r.actualHours) || 0)))),
      render: (_, record) => round1((Number(record.plannedHours) || 0) - (Number(record.actualHours) || 0)),
    },
  ];

  if (editable) {
    columns.push({
      title: "",
      key: "actions",
      width: 60,
      render: (_, record) => (
        <Button danger disabled={actualHoursOnly} icon={<DeleteOutlined />} onClick={() => onDeleteRow?.(record.id)} />
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
            <Button type="dashed" disabled={actualHoursOnly} icon={<PlusOutlined />} onClick={onAddRow}>
              Добавить строку
            </Button>
            <Button type="dashed" disabled={actualHoursOnly} onClick={onAddRowFromPrevious}>
              Добавить строку (копировать предыдущую)
            </Button>
            <Button type="primary" disabled={actualHoursOnly} icon={<SaveOutlined />} loading={saveLoading} onClick={onSave}>
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

        <TableFrame fullscreenTitle={title}>
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
        </TableFrame>

        <Space size="large" wrap>
          <Statistic title="Сумма планируемых часов" value={round1(totals.planned)} />
          <Statistic title="Сумма фактических часов" value={round1(totals.actual)} />
          <Statistic title="Общее расхождение" value={round1(totals.planned - totals.actual)} />
        </Space>
      </Space>
    </Card>
  );
};

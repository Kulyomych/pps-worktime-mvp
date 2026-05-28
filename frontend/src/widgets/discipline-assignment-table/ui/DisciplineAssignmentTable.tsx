import { Select, Table } from "antd";
import { useMemo } from "react";
import type { Teacher } from "../../../shared/types/workload";
import type { Discipline, ExcelAssignment } from "../../../shared/types/excel";
import { TableFrame } from "../../../shared/ui/table-frame/TableFrame";

interface Props {
  disciplines: Discipline[];
  teachers: Teacher[];
  assignments: ExcelAssignment[];
  onChangeAssignment: (disciplineId: string, teacherId: string) => void;
}

export const DisciplineAssignmentTable = ({ disciplines, teachers, assignments, onChangeAssignment }: Props) => {
  const disciplineToTeacher = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of assignments) map.set(a.disciplineId, a.teacherId);
    return map;
  }, [assignments]);

  const sortedDisciplines = useMemo(() => {
    return [...disciplines].sort((a, b) => a.name.localeCompare(b.name, "ru"));
  }, [disciplines]);

  return (
    <TableFrame fullscreenTitle="Перераспределение дисциплин">
      <Table
        rowKey="id"
        size="small"
        bordered
        pagination={false}
        locale={{ emptyText: "Нет дисциплин для распределения." }}
        className="dense-table"
        tableLayout="fixed"
        columns={[
          {
            title: "Дисциплина",
            dataIndex: "name",
            key: "name",
            width: 240,
            render: (_: unknown, record: Discipline) => record.name,
          },
          {
            title: "Преподаватель",
            dataIndex: "teacherId",
            key: "teacherId",
            width: 260,
            render: (_: unknown, record: Discipline) => {
              const value = disciplineToTeacher.get(record.id);
              return (
                <Select
                  placeholder="Выберите преподавателя"
                  style={{ width: "100%" }}
                  value={value ?? undefined}
                  options={teachers.map((t) => ({ value: t.id, label: t.fullName }))}
                  onChange={(nextTeacherId) => onChangeAssignment(record.id, nextTeacherId)}
                  showSearch
                  optionFilterProp="label"
                />
              );
            },
          },
        ]}
        dataSource={sortedDisciplines}
      />
    </TableFrame>
  );
};


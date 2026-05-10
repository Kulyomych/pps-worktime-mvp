import { Card, Select, Space, Typography } from "antd";
import type { Teacher, UserMode } from "../../../shared/types/workload";

interface Props {
  mode: UserMode;
  teachers: Teacher[];
  selectedTeacherId: string | null;
  onSelectTeacher: (teacherId: string) => void;
}

const modeLabel: Record<UserMode, string> = {
  teacher: "преподавателя",
  head: "заведующего кафедрой",
};

export const HomePage = ({ mode, teachers, selectedTeacherId, onSelectTeacher }: Props) => (
  <Card>
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      <Typography.Title level={4} style={{ marginBottom: 0 }}>
        Выбран режим {modeLabel[mode]}
      </Typography.Title>
      <Typography.Text>Выберите ФИО из списка:</Typography.Text>
      <Select
        size="large"
        placeholder="Выберите пользователя"
        value={selectedTeacherId ?? undefined}
        options={teachers.map((teacher) => ({ value: teacher.id, label: teacher.fullName }))}
        onChange={onSelectTeacher}
      />
    </Space>
  </Card>
);

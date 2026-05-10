import { Button, Card, Space, Typography } from "antd";
import { TeamOutlined, UserOutlined } from "@ant-design/icons";
import type { UserMode } from "../../../shared/types/workload";

interface Props {
  onSelectRole: (mode: UserMode) => void;
}

export const RoleSelection = ({ onSelectRole }: Props) => (
  <Card>
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Typography.Title level={2}>Система учета учебной нагрузки</Typography.Title>
      <Typography.Paragraph>
        Выберите режим работы. Преподаватель вносит фактические часы, заведующий просматривает
        данные по кафедре и сводный отчет.
      </Typography.Paragraph>
      <Space wrap className="role-selection-buttons">
        <Button size="large" type="primary" icon={<UserOutlined />} onClick={() => onSelectRole("teacher")}>
          Режим преподавателя
        </Button>
        <Button size="large" icon={<TeamOutlined />} onClick={() => onSelectRole("head")}>
          Режим заведующего кафедрой
        </Button>
      </Space>
    </Space>
  </Card>
);

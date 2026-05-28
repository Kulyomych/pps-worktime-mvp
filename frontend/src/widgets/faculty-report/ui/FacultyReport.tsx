import { Button, Card, message, Space, Table } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { exportToExcel as exportToExcelFn } from "../../../shared/lib/exportExcel/exportExcel";
import type { FacultyReportItem } from "../../../shared/types/workload";
import { round1 } from "../../../shared/lib/number/round1";
import { TableFrame } from "../../../shared/ui/table-frame/TableFrame";

interface Props {
  items: FacultyReportItem[];
}

export const FacultyReport = ({ items }: Props) => {
  const columns: ColumnsType<FacultyReportItem> = [
    { title: "Факультет", dataIndex: "faculty", key: "faculty", width: 180 },
    {
      title: "План",
      children: [
        { title: "Осенний", dataIndex: "plannedOsen", key: "plannedOsen", width: 110, render: (v) => round1(v) },
        { title: "Весенний", dataIndex: "plannedVesen", key: "plannedVesen", width: 110, render: (v) => round1(v) },
        { title: "Год", dataIndex: "plannedYear", key: "plannedYear", width: 110, render: (v) => round1(v) },
      ],
    },
    {
      title: "Факт",
      children: [
        { title: "Осенний", dataIndex: "actualOsen", key: "actualOsen", width: 110, render: (v) => round1(v) },
        { title: "Весенний", dataIndex: "actualVesen", key: "actualVesen", width: 110, render: (v) => round1(v) },
        { title: "Год", dataIndex: "actualYear", key: "actualYear", width: 110, render: (v) => round1(v) },
      ],
    },
    {
      title: "Отклонение",
      children: [
        { title: "Осенний", dataIndex: "deviationOsen", key: "deviationOsen", width: 120, render: (v) => round1(v) },
        { title: "Весенний", dataIndex: "deviationVesen", key: "deviationVesen", width: 120, render: (v) => round1(v) },
        { title: "Год", dataIndex: "deviationYear", key: "deviationYear", width: 120, render: (v) => round1(v) },
      ],
    },
  ];

  const handleExport = () => {
    if (!items.length) {
      message.warning("Нет данных для экспорта справки.");
      return;
    }

    exportToExcelFn(
      items,
      [
        { key: "faculty", title: "Факультет" },
        { key: "plannedOsen", title: "План (осенний)" },
        { key: "plannedVesen", title: "План (весенний)" },
        { key: "plannedYear", title: "План (год)" },
        { key: "actualOsen", title: "Факт (осенний)" },
        { key: "actualVesen", title: "Факт (весенний)" },
        { key: "actualYear", title: "Факт (год)" },
        { key: "deviationOsen", title: "Отклонение (осенний)" },
        { key: "deviationVesen", title: "Отклонение (весенний)" },
        { key: "deviationYear", title: "Отклонение (год)" },
      ],
      "spravka-fakultety"
    );
  };

  return (
    <Card title="Справка по факультетам">
      <Space style={{ marginBottom: 12 }}>
        <Button icon={<DownloadOutlined />} onClick={handleExport}>
          Скачать Excel
        </Button>
      </Space>
      <TableFrame fullscreenTitle="Справка по факультетам">
        <Table
          rowKey="faculty"
          size="small"
          className="dense-table"
          columns={columns}
          dataSource={items}
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


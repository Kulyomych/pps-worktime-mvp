import { Upload, Button, message } from "antd";
import type { UploadProps } from "antd";
import { useState } from "react";
import { InboxOutlined } from "@ant-design/icons";
import { parseWorkloadExcel } from "../../../shared/lib/excel/parseExcel";
import { useExcelDataStore } from "../../../entities/excel-data/store/excelDataStore";

export const ExcelUploadButton = () => {
  const [loading, setLoading] = useState(false);
  const initFromExcel = useExcelDataStore((s) => s.initFromExcel);

  const handleBeforeUpload: UploadProps["beforeUpload"] = async (file) => {
    setLoading(true);
    try {
      const result = await parseWorkloadExcel(file as File);
      if (!result.ok) {
        const firstError = result.errors[0] ?? "Ошибка загрузки Excel";
        message.error(firstError);
        if (result.warnings?.length) {
          message.warning(result.warnings.map((w) => w.message).slice(0, 2).join(" "));
        }
        return Upload.LIST_IGNORE;
      }

      initFromExcel(result.data);
      message.success("Excel загружен. Данные обновлены.");
      if (result.warnings?.length) {
        message.warning(result.warnings.map((w) => w.message).slice(0, 3).join(" "));
      }
      return Upload.LIST_IGNORE;
    } catch (e) {
      message.error("Ошибка загрузки Excel.");
      return Upload.LIST_IGNORE;
    } finally {
      setLoading(false);
    }
  };

  return (
    <Upload
      showUploadList={false}
      accept=".xlsx,.xls"
      beforeUpload={handleBeforeUpload}
      disabled={loading}
    >
      <Button type="primary" loading={loading} icon={<InboxOutlined />}>
        Загрузить Excel
      </Button>
    </Upload>
  );
};


import * as XLSX from "xlsx";

export interface ExportExcelColumn<T extends object> {
  key: keyof T | string;
  title: string;
}

export const exportToExcel = <T extends object>(
  data: T[],
  columns: ExportExcelColumn<T>[],
  fileName: string
) => {
  const rows = data.map((item) =>
    columns.reduce<Record<string, unknown>>((acc, column) => {
      acc[column.title] = item[column.key as keyof T];
      return acc;
    }, {})
  );

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Данные");
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

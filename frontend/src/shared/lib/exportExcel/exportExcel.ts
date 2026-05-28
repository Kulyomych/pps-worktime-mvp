import * as XLSX from "xlsx-js-style";
import { round1 } from "../number/round1";

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
      const value = item[column.key as keyof T];
      acc[column.title] = typeof value === "number" ? round1(value) : value;
      return acc;
    }, {})
  );

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const headers = columns.map((column) => column.title);
  const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1:A1");

  for (let c = 0; c < headers.length; c += 1) {
    const address = XLSX.utils.encode_cell({ r: 0, c });
    if (worksheet[address]) {
      worksheet[address].s = {
        font: { bold: true },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } },
        },
      };
    }
  }

  for (let r = 1; r <= range.e.r; r += 1) {
    for (let c = 0; c < headers.length; c += 1) {
      const address = XLSX.utils.encode_cell({ r, c });
      if (!worksheet[address]) continue;
      worksheet[address].s = {
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } },
        },
      };
    }
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Данные");
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

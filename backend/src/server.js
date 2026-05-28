const express = require("express");
const cors = require("cors");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = process.env.PORT || 4000;
const DB_PATH =
  process.env.DB_PATH || path.join(__dirname, "..", "data.sqlite");

const db = new sqlite3.Database(DB_PATH);

const run = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(error) {
      if (error) return reject(error);
      return resolve(this);
    });
  });

const get = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => {
      if (error) return reject(error);
      return resolve(row);
    });
  });

app.use(cors());
app.use(express.json());

const defaultExcelState = {
  initializedFromExcel: false,
  teachers: [],
  disciplines: [],
  faculties: [],
  assignments: [],
  workloads: [],
  workTypes: [],
};

const isArrayOrDefault = (value) => (Array.isArray(value) ? value : []);

const sanitizeExcelState = (rawState) => ({
  initializedFromExcel: Boolean(rawState?.initializedFromExcel),
  teachers: isArrayOrDefault(rawState?.teachers),
  disciplines: isArrayOrDefault(rawState?.disciplines),
  faculties: isArrayOrDefault(rawState?.faculties),
  assignments: isArrayOrDefault(rawState?.assignments),
  workloads: isArrayOrDefault(rawState?.workloads),
  workTypes: isArrayOrDefault(rawState?.workTypes),
});

const initDb = async () => {
  await run(`
    CREATE TABLE IF NOT EXISTS app_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      data TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
};

const loadExcelState = async () => {
  const row = await get("SELECT data FROM app_state WHERE id = 1");
  if (!row?.data) return null;

  try {
    return sanitizeExcelState(JSON.parse(row.data));
  } catch {
    return null;
  }
};

const saveExcelState = async (state) => {
  const payload = JSON.stringify(sanitizeExcelState(state));
  const updatedAt = new Date().toISOString();
  await run(
    `
      INSERT INTO app_state (id, data, updated_at)
      VALUES (1, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        data = excluded.data,
        updated_at = excluded.updated_at
    `,
    [payload, updatedAt],
  );
};

app.get("/state", async (_req, res) => {
  try {
    const state = (await loadExcelState()) || defaultExcelState;
    return res.json({ state });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Cannot load state from database." });
  }
});

app.put("/state", async (req, res) => {
  try {
    const nextState = sanitizeExcelState(req.body?.state);
    await saveExcelState(nextState);
    return res.json({ message: "State saved" });
  } catch (error) {
    return res.status(500).json({ message: "Cannot save state to database." });
  }
});

const teachers = [
  {
    id: "ivanova-mo",
    fullName: "Иванова Мария Олеговна",
    roles: ["teacher", "head"],
  },
  {
    id: "babkina-ln",
    fullName: "Бабкина Людмила Николаевна",
    roles: ["teacher"],
  },
  {
    id: "ivanchenko-vn",
    fullName: "Иванченко Вера Николаевна",
    roles: ["teacher"],
  },
  {
    id: "galuzina-sm",
    fullName: "Галузина Светлана Михайловна",
    roles: ["teacher"],
  },
  {
    id: "kuznetsov-vn",
    fullName: "Кузнецов Владимир Николаевич",
    roles: ["teacher"],
  },
  { id: "zubov-ay", fullName: "Зубов Анатолий Юрьевич", roles: ["teacher"] },
  {
    id: "pyatkova-nn",
    fullName: "Пяткова Наталья Николаевна",
    roles: ["teacher"],
  },
  {
    id: "ivanova-vs",
    fullName: "Иванова Вероника Сергеевна",
    roles: ["teacher"],
  },
  {
    id: "efimova-av",
    fullName: "Ефимова Анна Владимировна",
    roles: ["teacher"],
  },
];

const workloadByTeacher = {};
const reportWorkTypes = [
  "ВКР",
  "Дифф. Зачеты",
  "Защита",
  "Инд. консультация",
  "КУП",
  "КУР",
  "Лекции",
  "ПЗ",
  "Приемная комиссия",
  "Проверка отчета по производственной практике",
  "Производственная практика (руководство)",
  "Руководство кафедрой",
  "Руководство учебной практикой",
  "Тек. консультация",
  "Экзамены",
];

const calculateTeacherTotals = (rows) =>
  rows.reduce(
    (acc, row) => {
      acc.plannedHours += Number(row.plannedHours) || 0;
      acc.actualHours += Number(row.actualHours) || 0;
      return acc;
    },
    { plannedHours: 0, actualHours: 0 },
  );

app.get("/teachers", (_req, res) => {
  res.json(teachers);
});

app.post("/workload", (req, res) => {
  const { teacherId, rows } = req.body;

  if (!teacherId || !Array.isArray(rows)) {
    return res.status(400).json({ message: "teacherId and rows are required" });
  }

  workloadByTeacher[teacherId] = rows;

  return res.json({
    message: "Workload saved",
    teacherId,
    rowsCount: rows.length,
  });
});

app.get("/workload/:teacherId", (req, res) => {
  const { teacherId } = req.params;
  return res.json({ teacherId, rows: workloadByTeacher[teacherId] || [] });
});

app.get("/workload", (_req, res) => {
  const allWorkloads = teachers.map((teacher) => ({
    teacherId: teacher.id,
    teacherName: teacher.fullName,
    rows: workloadByTeacher[teacher.id] || [],
  }));
  return res.json(allWorkloads);
});

app.get("/report", (_req, res) => {
  const byWorkType = {};
  const bySemester = {
    осенний: {},
    весенний: {},
  };
  const plannedByWorkType = {};
  const actualByWorkType = {};
  let plannedHours = 0;
  let actualHours = 0;

  Object.values(workloadByTeacher).forEach((rows) => {
    rows.forEach((row) => {
      const plan = Number(row.plannedHours) || 0;
      const fact = Number(row.actualHours) || 0;
      const workType = row.workType?.trim() || "Не указан";

      plannedHours += plan;
      actualHours += fact;

      if (!byWorkType[workType]) {
        byWorkType[workType] = { workType, plannedHours: 0, actualHours: 0 };
      }
      byWorkType[workType].plannedHours += plan;
      byWorkType[workType].actualHours += fact;
      plannedByWorkType[workType] = (plannedByWorkType[workType] || 0) + plan;
      actualByWorkType[workType] = (actualByWorkType[workType] || 0) + fact;

      if (row.semester === "осенний" || row.semester === "весенний") {
        bySemester[row.semester][workType] =
          (bySemester[row.semester][workType] || 0) + fact;
      }
    });
  });

  const totals = {
    plannedHours,
    actualHours,
    deviation: plannedHours - actualHours,
  };

  const workloadSummary = teachers.map((teacher) => {
    const rows = workloadByTeacher[teacher.id] || [];
    const result = calculateTeacherTotals(rows);
    return {
      teacherId: teacher.id,
      teacherName: teacher.fullName,
      plannedHours: result.plannedHours,
      actualHours: result.actualHours,
      deviation: result.plannedHours - result.actualHours,
    };
  });

  const workTypeSummary = Object.values(byWorkType).map((item) => ({
    ...item,
    deviation: item.plannedHours - item.actualHours,
  }));

  const buildRow = (key, label, source) => {
    const values = {};
    let total = 0;

    reportWorkTypes.forEach((workType) => {
      const value = source[workType] || 0;
      values[workType] = value;
      total += value;
    });

    return { key, label, values, total };
  };

  const autumnRow = buildRow("осенний", "Осенний семестр", bySemester.осенний);
  const springRow = buildRow(
    "весенний",
    "Весенний семестр",
    bySemester.весенний,
  );

  const yearValues = {};
  reportWorkTypes.forEach((workType) => {
    yearValues[workType] =
      (autumnRow.values[workType] || 0) + (springRow.values[workType] || 0);
  });
  const yearRow = buildRow("год", "Год", yearValues);
  const plannedRow = buildRow("plan", "Плановые часы", plannedByWorkType);
  const actualRow = buildRow("fact", "Фактические часы", actualByWorkType);
  const deviationValues = {};
  reportWorkTypes.forEach((workType) => {
    deviationValues[workType] =
      (plannedByWorkType[workType] || 0) - (actualByWorkType[workType] || 0);
  });
  const deviationRow = buildRow("deviation", "Расхождение", deviationValues);

  return res.json({
    totals,
    workloadSummary,
    workTypeSummary,
    semesterWorkTypeTable: [
      autumnRow,
      springRow,
      yearRow,
      plannedRow,
      actualRow,
      deviationRow,
    ],
  });
});

initDb()
  .then(() => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Backend is running at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("DB init error:", error);
    process.exit(1);
  });

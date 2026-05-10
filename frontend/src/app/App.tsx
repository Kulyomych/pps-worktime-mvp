import { useEffect, useMemo, useState } from "react";
import { Button, ConfigProvider, message, Select, Tabs, Typography } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import { teachers } from "../shared/config/teachers";
import { RoleSelection } from "../features/role-selection/ui/RoleSelection";
import { selectDepartmentWorkloadRows } from "../entities/workload/lib/selectors";
import { useWorkloadStore } from "../entities/workload/store/workloadStore";
import { HomePage } from "../pages/home/ui/HomePage";
import { TeacherWorkloadTable } from "../widgets/teacher-workload-table/ui/TeacherWorkloadTable";
import { HeadDashboard } from "../widgets/head-dashboard/ui/HeadDashboard";
import { getAllTeacherWorkloads, getDepartmentReport, getTeacherWorkload, saveTeacherWorkload } from "../shared/api/client";
import { workTypeOptions } from "../shared/config/workloadOptions";
import { exportToExcel } from "../shared/lib/exportExcel/exportExcel";
import type { DepartmentReport, TeacherWorkloadListItem } from "../shared/types/workload";
import { PlaneIcon } from "../shared/ui/icon/PlaneIcon";
import { PageLayout } from "../shared/ui/page-layout/PageLayout";

export const App = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [saveLoading, setSaveLoading] = useState(false);
  const [report, setReport] = useState<DepartmentReport | null>(null);
  const [allWorkloads, setAllWorkloads] = useState<TeacherWorkloadListItem[]>([]);
  const [departmentTeacherFilter, setDepartmentTeacherFilter] = useState<string | null>(null);

  const {
    mode,
    selectedTeacherId,
    rows,
    setMode,
    setSelectedTeacher,
    setRows,
    addRow,
    addRowFromPrevious,
    updateRow,
    deleteRow,
    resetSession,
  } = useWorkloadStore();

  const filteredTeachers = useMemo(
    () => teachers.filter((teacher) => (mode ? teacher.roles.includes(mode) : true)),
    [mode]
  );
  const headTeachers = useMemo(() => teachers.filter((teacher) => teacher.roles.includes("teacher")), []);

  useEffect(() => {
    if (!selectedTeacherId) {
      return;
    }

    getTeacherWorkload(selectedTeacherId)
      .then((response) => setRows(response.rows))
      .catch(() => messageApi.error("Не удалось загрузить данные преподавателя."));
  }, [selectedTeacherId, setRows, messageApi]);

  useEffect(() => {
    if (mode !== "head") {
      return;
    }

    getDepartmentReport()
      .then(setReport)
      .catch(() => messageApi.error("Не удалось загрузить отчет кафедры."));
  }, [mode, selectedTeacherId, rows, messageApi]);

  useEffect(() => {
    if (mode !== "head") {
      return;
    }

    getAllTeacherWorkloads()
      .then(setAllWorkloads)
      .catch(() => messageApi.error("Не удалось загрузить общую таблицу кафедры."));
  }, [mode, selectedTeacherId, rows, messageApi]);

  const departmentRows = useMemo(() => {
    const rowsWithTeachers = selectDepartmentWorkloadRows(allWorkloads);
    if (!departmentTeacherFilter) {
      return rowsWithTeachers;
    }
    return rowsWithTeachers.filter((row) => row.teacherId === departmentTeacherFilter);
  }, [allWorkloads, departmentTeacherFilter]);

  const handleSave = async () => {
    if (!selectedTeacherId) {
      return;
    }
    setSaveLoading(true);
    try {
      await saveTeacherWorkload(selectedTeacherId, rows);
      messageApi.success("Данные успешно сохранены.");
    } catch {
      messageApi.error("Ошибка при сохранении данных.");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleExportReport = () => {
    if (!report?.semesterWorkTypeTable.length) {
      messageApi.warning("Нет данных для экспорта справки.");
      return;
    }

    const columns = [
      { key: "label", title: "Период" },
      ...workTypeOptions.map((workType) => ({ key: workType as keyof (typeof report.semesterWorkTypeTable)[number]["values"], title: workType })),
      { key: "total", title: "ВСЕГО" },
    ];
    const data = report.semesterWorkTypeTable.map((row) => ({
      label: row.label,
      total: row.total,
      ...row.values,
    }));
    exportToExcel(data, columns, "spravka-kafedry");
  };

  const handleExportDepartmentTable = () => {
    if (!departmentRows.length) {
      messageApi.warning("Нет данных для экспорта общей таблицы.");
      return;
    }

    exportToExcel(
      departmentRows,
      [
        { key: "teacherName", title: "ФИО преподавателя" },
        { key: "discipline", title: "Дисциплина" },
        { key: "semester", title: "Семестр" },
        { key: "faculty", title: "Факультет" },
        { key: "course", title: "Курс" },
        { key: "specialization", title: "Специализация / Профиль" },
        { key: "streams", title: "Потоков" },
        { key: "groups", title: "Групп" },
        { key: "students", title: "Студентов" },
        { key: "workType", title: "Вид работы" },
        { key: "plannedHours", title: "Планируемые часы" },
        { key: "actualHours", title: "Фактические часы" },
      ],
      "obshaya-tablica-kafedry"
    );
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          borderRadius: 10,
          colorPrimary: "#1677ff",
          fontSize: 16,
        },
      }}
    >
      {contextHolder}
      <PageLayout>
        <header className="app-header">
          <PlaneIcon className="decor-left-cloud" />
          <PlaneIcon style={{ fontSize: 26, color: "#1677ff" }} />
          <Typography.Title level={3} style={{ margin: 0 }}>
            Учет рабочего времени ППС
          </Typography.Title>
          <PlaneIcon className="decor-right-cloud" />
        </header>

        <main className="app-main">
          {!mode && (
            <div className="app-block app-block-centered">
              <RoleSelection onSelectRole={setMode} />
            </div>
          )}

          {mode && (
            <div className="app-actions-row">
              <Button onClick={resetSession} style={{ width: "fit-content" }} icon={<PlaneIcon />}>
                На главный экран
              </Button>
            </div>
          )}

          {mode === "teacher" && (
            <div className="app-block">
              <HomePage
                mode={mode}
                teachers={filteredTeachers}
                selectedTeacherId={selectedTeacherId}
                onSelectTeacher={setSelectedTeacher}
              />
            </div>
          )}

          {mode === "teacher" && selectedTeacherId && (
            <div className="app-block">
              <TeacherWorkloadTable
                rows={rows}
                onAddRow={addRow}
                onAddRowFromPrevious={addRowFromPrevious}
                onDeleteRow={deleteRow}
                onUpdateRow={updateRow}
                onSave={handleSave}
                saveLoading={saveLoading}
              />
            </div>
          )}

          {mode === "head" && (
            <>
              <div className="app-block">
                <HeadDashboard
                  teachers={headTeachers}
                  report={report}
                  selectedTeacherId={selectedTeacherId}
                  onSelectTeacher={setSelectedTeacher}
                  onExportReport={handleExportReport}
                />
              </div>
              <div className="app-block">
                <Tabs
                  items={[
                    {
                      key: "teacher-table",
                      label: "Таблица преподавателя",
                      children: selectedTeacherId ? (
                        <TeacherWorkloadTable rows={rows} editable={false} />
                      ) : (
                        <Typography.Text>Выберите преподавателя для просмотра таблицы.</Typography.Text>
                      ),
                    },
                    {
                      key: "department-table",
                      label: "Общая таблица кафедры",
                      children: (
                        <>
                          <Select
                            allowClear
                            placeholder="Фильтр по преподавателю"
                            style={{ width: 360, marginBottom: 12 }}
                            value={departmentTeacherFilter ?? undefined}
                            options={headTeachers.map((teacher) => ({ value: teacher.id, label: teacher.fullName }))}
                            onChange={(value) => setDepartmentTeacherFilter(value ?? null)}
                          />
                          <TeacherWorkloadTable
                            rows={departmentRows}
                            editable={false}
                            showTeacherColumn
                            title="Общая таблица кафедры"
                            extraActions={
                              <Button icon={<DownloadOutlined />} onClick={handleExportDepartmentTable}>
                                Скачать Excel
                              </Button>
                            }
                          />
                        </>
                      ),
                    },
                  ]}
                />
              </div>
            </>
          )}
        </main>
      </PageLayout>
    </ConfigProvider>
  );
};

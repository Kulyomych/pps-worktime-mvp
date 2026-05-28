import { useEffect, useMemo, useState } from "react";
import { Button, ConfigProvider, message, Select, Spin, Tabs, Typography } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import { RoleSelection } from "../features/role-selection/ui/RoleSelection";
import { ExcelUploadButton } from "../features/excel-upload/ui/ExcelUploadButton";
import { useExcelDataStore } from "../entities/excel-data/store/excelDataStore";
import { selectTeacherRowsFromExcel, selectAllTeacherWorkloadsFromExcel } from "../entities/excel-data/lib/selectors";
import { buildDepartmentReportFromExcel, buildFacultyReportFromExcel } from "../entities/excel-data/lib/reportSelectors";
import { selectDepartmentWorkloadRows } from "../entities/workload/lib/selectors";
import { HomePage } from "../pages/home/ui/HomePage";
import { TeacherWorkloadTable } from "../widgets/teacher-workload-table/ui/TeacherWorkloadTable";
import { TeacherWorkloadPivotTable } from "../widgets/teacher-workload-table/ui/TeacherWorkloadPivotTable";
import { HeadDashboard } from "../widgets/head-dashboard/ui/HeadDashboard";
import { DisciplineAssignmentTable } from "../widgets/discipline-assignment-table/ui/DisciplineAssignmentTable";
import { FacultyReport } from "../widgets/faculty-report/ui/FacultyReport";
import { TeacherReferenceReport } from "../widgets/teacher-reference-report/ui/TeacherReferenceReport";
import { exportToExcel } from "../shared/lib/exportExcel/exportExcel";
import type { DepartmentReport, UserMode } from "../shared/types/workload";
import { PlaneIcon } from "../shared/ui/icon/PlaneIcon";
import { PageLayout } from "../shared/ui/page-layout/PageLayout";
import { sortTableData } from "../shared/lib/sortTableData/sortTableData";

export const App = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [departmentTeacherFilter, setDepartmentTeacherFilter] = useState<string | null>(null);

  const [mode, setMode] = useState<UserMode | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);

  const excelState = useExcelDataStore();

  useEffect(() => {
    void excelState.hydrateFromBackend();
  }, []);

  useEffect(() => {
    if (!mode) return;
    if (excelState.initializedFromExcel) return;
    messageApi.warning("Нет загруженных данных. Загрузите Excel-файл в режиме заведующего кафедрой.");
  }, [mode, excelState.initializedFromExcel, messageApi]);

  const headTeachers = excelState.teachers;

  const allTeacherWorkloads = useMemo(() => selectAllTeacherWorkloadsFromExcel(excelState), [
    excelState.teachers,
    excelState.assignments,
    excelState.workloads,
  ]);

  const departmentRowsAll = useMemo(() => sortTableData(selectDepartmentWorkloadRows(allTeacherWorkloads)), [allTeacherWorkloads]);

  const departmentRows = useMemo(() => {
    if (!departmentTeacherFilter) return departmentRowsAll;
    return departmentRowsAll.filter((row) => row.teacherId === departmentTeacherFilter);
  }, [departmentRowsAll, departmentTeacherFilter]);

  const report: DepartmentReport | null = useMemo(() => {
    if (!excelState.initializedFromExcel) return null;
    return buildDepartmentReportFromExcel(excelState);
  }, [excelState.initializedFromExcel, excelState.workloads, excelState.assignments, excelState.teachers, excelState.workTypes]);

  const facultyReport = useMemo(() => {
    if (!excelState.initializedFromExcel) return [];
    return buildFacultyReportFromExcel(excelState);
  }, [excelState.initializedFromExcel, excelState.workloads]);

  const resetSession = () => {
    setMode(null);
    setSelectedTeacherId(null);
    setDepartmentTeacherFilter(null);
  };

  const teacherRows = useMemo(() => {
    const rows = selectedTeacherId ? selectTeacherRowsFromExcel(excelState, selectedTeacherId) : [];
    return sortTableData(rows);
  }, [excelState.workloads, excelState.assignments, selectedTeacherId]);

  const handleExportReport = () => {
    if (!report?.semesterWorkTypeTable.length) {
      messageApi.warning("Нет данных для экспорта справки.");
      return;
    }

    const columns = [
      { key: "label", title: "Период" },
      ...excelState.workTypes.map((workType) => ({ key: workType as keyof (typeof report.semesterWorkTypeTable)[number]["values"], title: workType })),
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
              <RoleSelection
                onSelectRole={(nextMode) => {
                  setMode(nextMode);
                  setSelectedTeacherId(null);
                  setDepartmentTeacherFilter(null);
                }}
              />
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
              {!excelState.initializedFromExcel ? (
                <Typography.Text>Данные не загружены. Попросите заведующего кафедрой загрузить Excel-файл.</Typography.Text>
              ) : (
                <HomePage
                  mode={mode}
                  teachers={headTeachers}
                  selectedTeacherId={selectedTeacherId}
                  onSelectTeacher={(teacherId) => setSelectedTeacherId(teacherId)}
                />
              )}
            </div>
          )}

          {mode === "teacher" && excelState.initializedFromExcel && selectedTeacherId && (
            <div className="app-block">
              <TeacherWorkloadPivotTable
                rows={teacherRows}
                workTypes={excelState.workTypes}
                editableActualHours
                onUpdateActualHours={(id, actualHours) => excelState.updateWorkload(id, { actualHours })}
              />
            </div>
          )}

          {mode === "head" && (
            <>
              <div className="app-block">
                <ExcelUploadButton />
              </div>
              <div className="app-block">
                {excelState.initializedFromExcel ? (
                  <HeadDashboard
                    teachers={headTeachers}
                    report={report}
                    selectedTeacherId={selectedTeacherId}
                    onSelectTeacher={(teacherId) => setSelectedTeacherId(teacherId)}
                    workTypes={excelState.workTypes}
                    onExportReport={handleExportReport}
                  />
                ) : (
                  <Typography.Text>Нет загруженных данных. Загрузите Excel-файл, чтобы начать работу.</Typography.Text>
                )}
              </div>
              {excelState.loadingFromBackend && (
                <div className="app-block">
                  <Spin />
                </div>
              )}
              {excelState.initializedFromExcel && (
                <div className="app-block">
                  <Tabs
                    items={[
                      {
                        key: "teacher-table",
                        label: "Таблица преподавателя",
                        children: selectedTeacherId ? (
                          <TeacherWorkloadPivotTable
                            rows={teacherRows}
                            workTypes={excelState.workTypes}
                            editableActualHours={false}
                          />
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
                              editable
                              showTeacherColumn
                              title="Общая таблица кафедры"
                              onUpdateRow={(id, patch) => excelState.updateWorkload(id, patch)}
                              extraActions={
                                <Button icon={<DownloadOutlined />} onClick={handleExportDepartmentTable}>
                                  Скачать Excel
                                </Button>
                              }
                            />
                          </>
                        ),
                      },
                      {
                        key: "discipline-assignment",
                        label: "Перераспределение дисциплин",
                        children: (
                          <DisciplineAssignmentTable
                            disciplines={excelState.disciplines}
                            teachers={headTeachers}
                            assignments={excelState.assignments}
                            onChangeAssignment={(disciplineId, teacherId) => excelState.updateAssignment(disciplineId, teacherId)}
                          />
                        ),
                      },
                      {
                        key: "faculty-report",
                        label: "Справка по факультетам",
                        children: <FacultyReport items={facultyReport} />,
                      },
                      {
                        key: "teacher-reference",
                        label: "Справка по преподавателям",
                        children: <TeacherReferenceReport rows={departmentRowsAll} />,
                      },
                    ]}
                  />
                </div>
              )}
            </>
          )}
        </main>
      </PageLayout>
    </ConfigProvider>
  );
};

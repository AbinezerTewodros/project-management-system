import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { toast } from "react-toastify";
import { Download, ListOrdered, RefreshCw, TrendingUp } from "lucide-react";

import { useReports } from "@/hooks/useReports";
import {
  AnyReportResponse,
  IssueSummaryReportDto,
  ProjectSummaryReportDto,
  ReportFormat,
  ReportMetadataDto,
  ReportRequestDto,
  ReportResponseDto,
  ReportType,
  TaskProgressReportDto,
  TeamPerformanceReportDto,
} from "@/types/reportTypes";

type FormState = {
  startDate: string;
  endDate: string;
  department: string;
  projectIds: string;
  userIds: string;
};

const initialFormState: FormState = {
  startDate: "",
  endDate: "",
  department: "",
  projectIds: "",
  userIds: "",
};

function Report({ darkMode }: { darkMode: boolean }) {
  console.log('📄 Report component rendering');
  
  const [selectedReportType, setSelectedReportType] = useState<ReportType>(
    ReportType.ProjectSummary
  );
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [notes, setNotes] = useState("");
  const [reportFormat, setReportFormat] = useState<ReportFormat>(
    ReportFormat.Json
  );

  const {
    templates,
    metadata,
    scheduledReports,
    lastReport,
    loading,
    exporting,
    scheduling,
    error,
    fetchMetadata,
    generateReport,
    exportReport,
    refreshScheduledReports,
  } = useReports({
    autoFetchTemplates: false, // Disable auto-fetch to avoid blocking
    autoFetchScheduled: false,
  });

  useEffect(() => {
    // Temporarily disabled to avoid blocking
    // fetchMetadata(selectedReportType).catch((err) => {
    //   const message =
    //     err instanceof Error ? err.message : "Unable to load report metadata.";
    //   toast.error(message);
    // });
  }, [fetchMetadata, selectedReportType]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.type === selectedReportType),
    [templates, selectedReportType]
  );
  const selectedMetadata = metadata[selectedReportType];
  const availableFormats =
    selectedTemplate?.supportedFormats ?? Object.values(ReportFormat);

  // Determine which fields are relevant for the selected report type
  const relevantFields = useMemo(() => {
    switch (selectedReportType) {
      case ReportType.ProjectSummary:
        return {
          showDates: true,
          showDepartment: true,
          showProjectIds: true,
          showUserIds: false,
        };
      case ReportType.TaskProgress:
        return {
          showDates: true,
          showDepartment: false,
          showProjectIds: true,
          showUserIds: false,
        };
      case ReportType.TeamPerformance:
        return {
          showDates: true,
          showDepartment: true,
          showProjectIds: false,
          showUserIds: true,
        };
      case ReportType.IssueSummary:
        return {
          showDates: true,
          showDepartment: false,
          showProjectIds: true,
          showUserIds: false,
        };
      default:
        return {
          showDates: true,
          showDepartment: true,
          showProjectIds: true,
          showUserIds: true,
        };
    }
  }, [selectedReportType]);

  useEffect(() => {
    if (!availableFormats.includes(reportFormat)) {
      setReportFormat(availableFormats[0]);
    }
  }, [availableFormats, reportFormat]);

  // Clear irrelevant fields and errors when report type changes
  useEffect(() => {
    setFormState((prev) => ({
      ...prev,
      // Clear department if not relevant
      department: relevantFields.showDepartment ? prev.department : "",
      // Clear project IDs if not relevant
      projectIds: relevantFields.showProjectIds ? prev.projectIds : "",
      // Clear user IDs if not relevant
      userIds: relevantFields.showUserIds ? prev.userIds : "",
    }));
    // Clear any existing errors when switching report types
    if (error) {
      // The error will be cleared by the hook when generating a new report
    }
  }, [selectedReportType, error]); // Run when report type changes

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormState((previous) => ({ ...previous, [name]: value }));
  };

  const parseNumberList = (value: string): number[] | undefined => {
    const entries = value
      .split(",")
      .map((item) => Number.parseInt(item.trim(), 10))
      .filter((num) => !Number.isNaN(num));
    return entries.length > 0 ? entries : undefined;
  };

  const parseStringList = (value: string): string[] | undefined => {
    const entries = value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    return entries.length > 0 ? entries : undefined;
  };

  const buildPayload = (): ReportRequestDto => {
    const payload: ReportRequestDto = {
      reportType: selectedReportType,
      exportFormat: reportFormat,
    };
    
    // Only add optional fields if they have actual values
    if (formState.startDate) {
      // Ensure date is in ISO format (YYYY-MM-DD)
      payload.startDate = formState.startDate;
    }
    if (formState.endDate) {
      // Ensure date is in ISO format (YYYY-MM-DD)
      payload.endDate = formState.endDate;
    }
    if (formState.department && formState.department.trim()) {
      payload.department = formState.department.trim();
    }
    
    const projectIds = parseNumberList(formState.projectIds);
    if (projectIds && projectIds.length > 0) {
      payload.projectIds = projectIds;
    }
    
    const userIds = parseStringList(formState.userIds);
    if (userIds && userIds.length > 0) {
      payload.userIds = userIds;
    }
    
    return payload;
  };

  // Get field descriptions for the selected report type
  const getFieldDescription = (field: string): string => {
    const descriptions: Record<string, Record<string, string>> = {
      ProjectSummary: {
        startDate: "Filter projects created on or after this date",
        endDate: "Filter projects created on or before this date",
        department: "Filter by department name (e.g., SDC, IT, HR)",
        projectIds: "Specific project IDs to include (comma-separated)",
      },
      TaskProgress: {
        startDate: "Filter tasks created on or after this date",
        endDate: "Filter tasks created on or before this date",
        projectIds: "Filter tasks from specific projects (comma-separated IDs)",
      },
      TeamPerformance: {
        startDate: "Performance period start date",
        endDate: "Performance period end date",
        department: "Filter by department",
        userIds: "Specific user IDs to analyze (comma-separated)",
      },
      IssueSummary: {
        startDate: "Filter issues created on or after this date",
        endDate: "Filter issues created on or before this date",
        projectIds: "Filter issues from specific projects (comma-separated IDs)",
      },
    };
    
    return descriptions[selectedReportType]?.[field] || "";
  };

  const handleGenerate = async () => {
    console.log('🔵 handleGenerate called');
    console.log('🔵 Loading state:', loading);
    
    try {
      const payload = buildPayload();
      console.log('🔵 Payload built:', payload);
      
      console.log('🔵 Calling generateReport...');
      const result = await generateReport(payload);
      console.log('🔵 Report generated successfully:', result);
      
      const recordCount = result.summary.totalRecords || 0;
      toast.success(
        `Report generated successfully! Found ${recordCount} ${recordCount === 1 ? 'record' : 'records'}.`
      );
    } catch (generateError) {
      console.error('🔴 Generate error:', generateError);
      const message =
        generateError instanceof Error
          ? generateError.message
          : "Unable to generate report.";
      toast.error(message);
    }
  };

  const handleExport = async () => {
    try {
      const payload = buildPayload();
      const blob = await exportReport(payload);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${selectedReportType}-${Date.now()}.${exportExtension(
        reportFormat
      )}`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Export started.");
    } catch (exportError) {
      const message =
        exportError instanceof Error
          ? exportError.message
          : "Unable to export report.";
      toast.error(message);
    }
  };

  const handleRefreshSchedules = async () => {
    try {
      await refreshScheduledReports();
      toast.info("Scheduled reports updated.");
    } catch (refreshError) {
      const message =
        refreshError instanceof Error
          ? refreshError.message
          : "Unable to refresh scheduled reports.";
      toast.error(message);
    }
  };

  const generatedAt = lastReport
    ? format(new Date(lastReport.generatedAt), "PPpp")
    : null;
  const reportSummaryItems = lastReport
    ? Object.entries(lastReport.summary.keyMetrics || {})
    : [];

  // Count active filters
  const activeFilterCount = [
    formState.startDate,
    formState.endDate,
    formState.department,
    formState.projectIds,
    formState.userIds,
  ].filter(Boolean).length;

  return (
    <div
      className={`min-h-screen px-4 py-6 transition-colors ${
        darkMode ? "bg-zinc-900 text-gray-100" : "bg-gray-100 text-gray-900"
      }`}
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold leading-tight">
            Reports & Insights
          </h1>
          <p className="text-sm opacity-75">
            Generate real-time project analytics directly from the PMS backend.
            Choose a report type, configure filters, and export the results for
            sharing.
          </p>
        </header>

        {/* Error Banner */}
        {error && (
          <div
            className={`rounded-xl border p-4 ${
              darkMode
                ? "border-red-500/30 bg-red-500/10 text-red-100"
                : "border-red-500/30 bg-red-50 text-red-900"
            }`}
          >
            <div className="flex items-start gap-3">
              <svg
                className="mt-0.5 h-5 w-5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-semibold">Error generating report</p>
                <p className="mt-1 text-sm opacity-90">{error}</p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className={`rounded px-3 py-1 text-xs font-semibold transition ${
                  darkMode
                    ? "bg-red-500/20 hover:bg-red-500/30"
                    : "bg-red-100 hover:bg-red-200"
                }`}
              >
                Reload
              </button>
            </div>
          </div>
        )}

        {/* Info Banner */}
        {!error && (
          <div
            className={`rounded-xl border p-4 ${
              darkMode
                ? "border-blue-500/30 bg-blue-500/10 text-blue-100"
                : "border-blue-500/30 bg-blue-50 text-blue-900"
            }`}
          >
            <div className="flex items-start gap-3">
              <svg
                className="mt-0.5 h-5 w-5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="flex-1 text-sm">
                <p className="font-semibold">Report Generation Tips</p>
                <ul className="mt-2 list-inside list-disc space-y-1 opacity-90">
                  <li>
                    <strong>All filters are optional</strong> - leave fields empty to include all data
                  </li>
                  <li>
                    <strong>Dynamic fields</strong> - only relevant filters show for each report type
                  </li>
                  <li>
                    <strong>JSON format recommended</strong> - other formats may return placeholder data
                  </li>
                  <li>
                    <strong>Date range</strong> - filters data based on creation date
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        <section
          className={`rounded-2xl border shadow-sm ${
            darkMode
              ? "border-zinc-700 bg-zinc-800"
              : "border-gray-200 bg-white"
          }`}
        >
          <div className="flex flex-col gap-6 p-6">
            <div className="grid gap-4 lg:grid-cols-[1.5fr,1fr]">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide opacity-70">
                    Report Type
                  </label>
                  <div className="mt-2 grid grid-cols-2 gap-3 md:grid-cols-4">
                    {Object.values(ReportType).map((type) => {
                      const isActive = type === selectedReportType;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setSelectedReportType(type)}
                          className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                            isActive
                              ? "border-purple-500 bg-purple-500/10 text-purple-100"
                              : darkMode
                              ? "border-zinc-700 bg-zinc-800 text-gray-200 hover:border-purple-500/60"
                              : "border-gray-200 bg-white text-gray-700 hover:border-purple-500/40"
                          }`}
                        >
                          {friendlyReportName(type)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {relevantFields.showDates && (
                    <>
                      <FormField label="Start Date (Optional)">
                        <input
                          type="date"
                          name="startDate"
                          value={formState.startDate}
                          onChange={handleInputChange}
                          className={inputClassName(darkMode)}
                          title={getFieldDescription("startDate")}
                        />
                        {getFieldDescription("startDate") && (
                          <p className="mt-1 text-xs opacity-60">
                            {getFieldDescription("startDate")}
                          </p>
                        )}
                      </FormField>
                      <FormField label="End Date (Optional)">
                        <input
                          type="date"
                          name="endDate"
                          value={formState.endDate}
                          onChange={handleInputChange}
                          className={inputClassName(darkMode)}
                          title={getFieldDescription("endDate")}
                        />
                        {getFieldDescription("endDate") && (
                          <p className="mt-1 text-xs opacity-60">
                            {getFieldDescription("endDate")}
                          </p>
                        )}
                      </FormField>
                    </>
                  )}
                  {relevantFields.showDepartment && (
                    <FormField label="Department (Optional)">
                      <input
                        type="text"
                        name="department"
                        placeholder="e.g. SDC"
                        value={formState.department}
                        onChange={handleInputChange}
                        className={inputClassName(darkMode)}
                        title={getFieldDescription("department")}
                      />
                      {getFieldDescription("department") && (
                        <p className="mt-1 text-xs opacity-60">
                          {getFieldDescription("department")}
                        </p>
                      )}
                    </FormField>
                  )}
                  {relevantFields.showProjectIds && (
                    <FormField label="Project IDs (Optional)">
                      <input
                        type="text"
                        name="projectIds"
                        placeholder="e.g. 1,2,3"
                        value={formState.projectIds}
                        onChange={handleInputChange}
                        className={inputClassName(darkMode)}
                        title={getFieldDescription("projectIds")}
                      />
                      {getFieldDescription("projectIds") && (
                        <p className="mt-1 text-xs opacity-60">
                          {getFieldDescription("projectIds")}
                        </p>
                      )}
                    </FormField>
                  )}
                  {relevantFields.showUserIds && (
                    <FormField label="User IDs (Optional)">
                      <input
                        type="text"
                        name="userIds"
                        placeholder="e.g. user1,user2"
                        value={formState.userIds}
                        onChange={handleInputChange}
                        className={inputClassName(darkMode)}
                        title={getFieldDescription("userIds")}
                      />
                      {getFieldDescription("userIds") && (
                        <p className="mt-1 text-xs opacity-60">
                          {getFieldDescription("userIds")}
                        </p>
                      )}
                    </FormField>
                  )}
                  <FormField label="Export Format">
                    <select
                      value={reportFormat}
                      onChange={(event) =>
                        setReportFormat(event.target.value as ReportFormat)
                      }
                      className={inputClassName(darkMode)}
                      title="Select output format (JSON recommended)"
                    >
                      {availableFormats.map((format) => (
                        <option key={format} value={format}>
                          {format}
                          {format === "Json" && " (Recommended)"}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs opacity-60">
                      JSON format is fully supported. Other formats may return placeholder data.
                    </p>
                  </FormField>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      console.log('🔵🔵🔵 BUTTON CLICKED! 🔵🔵🔵');
                      console.log('Loading state before:', loading);
                      handleGenerate();
                    }}
                    disabled={loading}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                      loading
                        ? "cursor-wait opacity-60"
                        : darkMode
                        ? "bg-purple-600 text-white hover:bg-purple-500"
                        : "bg-purple-600 text-white hover:bg-purple-500"
                    }`}
                  >
                    <TrendingUp
                      className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                    />
                    {loading ? "Generating…" : "Generate Report"}
                  </button>
                  <button
                    type="button"
                    onClick={handleExport}
                    disabled={exporting}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                      exporting
                        ? "cursor-wait opacity-60"
                        : darkMode
                        ? "bg-zinc-700 text-gray-100 hover:bg-zinc-600"
                        : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                    }`}
                  >
                    <Download
                      className={`h-4 w-4 ${exporting ? "animate-pulse" : ""}`}
                    />
                    {exporting ? "Exporting…" : "Export"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormState(initialFormState)}
                    disabled={activeFilterCount === 0}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                      activeFilterCount === 0
                        ? "cursor-not-allowed opacity-40"
                        : darkMode
                        ? "bg-zinc-800 text-gray-300 hover:bg-zinc-700"
                        : "bg-white text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Reset Filters
                    {activeFilterCount > 0 && (
                      <span className={`ml-1 rounded-full px-2 py-0.5 text-xs ${
                        darkMode ? "bg-purple-500/30 text-purple-300" : "bg-purple-100 text-purple-700"
                      }`}>
                        {activeFilterCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              <MetadataPanel
                metadata={selectedMetadata}
                darkMode={darkMode}
                template={selectedTemplate}
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide opacity-70">
                Personal Notes
              </label>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={4}
                placeholder="Capture insights or follow-up actions for this report..."
                className={`mt-2 w-full rounded-xl border px-3 py-2 text-sm transition focus:ring-2 ${
                  darkMode
                    ? "border-zinc-700 bg-zinc-800 text-gray-100 focus:border-purple-500 focus:ring-purple-500/40"
                    : "border-gray-200 bg-white text-gray-900 focus:border-purple-500 focus:ring-purple-200"
                }`}
              />
            </div>
          </div>
        </section>

        <section
          className={`rounded-2xl border shadow-sm ${
            darkMode
              ? "border-zinc-700 bg-zinc-800"
              : "border-gray-200 bg-white"
          }`}
        >
          <div className="flex flex-col gap-6 p-6">
            <header className="flex items-center justify-between">
              <div className="flex-1">
                <h2 className="text-xl font-semibold">Report Output</h2>
                <p className="text-xs opacity-70">
                  {lastReport ? (
                    <span>
                      Last generated {generatedAt} by {lastReport.generatedBy}
                      {(lastReport.periodStart || lastReport.periodEnd) && (
                        <>
                          {" • Period: "}
                          {lastReport.periodStart && format(new Date(lastReport.periodStart), "PP")}
                          {lastReport.periodStart && lastReport.periodEnd && " - "}
                          {lastReport.periodEnd && format(new Date(lastReport.periodEnd), "PP")}
                        </>
                      )}
                    </span>
                  ) : (
                    "Run a report to see results here."
                  )}
                </p>
              </div>
              {lastReport && (
                <div
                  className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                    darkMode
                      ? "bg-purple-500/20 text-purple-300"
                      : "bg-purple-100 text-purple-700"
                  }`}
                >
                  {friendlyReportName(lastReport.reportType)}
                </div>
              )}
            </header>

            {reportSummaryItems.length > 0 && (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                {reportSummaryItems.map(([key, value]) => (
                  <StatCard
                    key={key}
                    title={startCase(key)}
                    value={formatStatValue(value)}
                    darkMode={darkMode}
                  />
                ))}
              </div>
            )}

            <div
              className={`rounded-xl border p-4 ${
                darkMode
                  ? "border-zinc-700 bg-zinc-900/40"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              {loading ? (
                <LoadingSkeleton darkMode={darkMode} />
              ) : lastReport ? (
                renderReportData(lastReport, darkMode)
              ) : (
                <EmptyState darkMode={darkMode} />
              )}
            </div>
          </div>
        </section>

        <section
          className={`rounded-2xl border shadow-sm ${
            darkMode
              ? "border-zinc-700 bg-zinc-800"
              : "border-gray-200 bg-white"
          }`}
        >
          <div className="flex flex-col gap-6 p-6">
            <header className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Scheduled Reports</h2>
                <p className="text-xs opacity-70">
                  View upcoming automated exports for your account.
                </p>
              </div>
              <button
                type="button"
                onClick={handleRefreshSchedules}
                disabled={scheduling}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  scheduling
                    ? "cursor-wait opacity-60"
                    : darkMode
                    ? "bg-zinc-700 text-gray-100 hover:bg-zinc-600"
                    : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                }`}
              >
                <RefreshCw
                  className={`h-4 w-4 ${scheduling ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
            </header>

            {scheduledReports.length === 0 ? (
              <p className="text-sm opacity-70">
                No scheduled reports yet. Schedule runs from the backend
                console.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead
                    className={
                      darkMode
                        ? "bg-zinc-900/60 text-gray-200"
                        : "bg-gray-100 text-gray-700"
                    }
                  >
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold">
                        Name
                      </th>
                      <th className="px-4 py-2 text-left font-semibold">
                        Report
                      </th>
                      <th className="px-4 py-2 text-left font-semibold">
                        Schedule
                      </th>
                      <th className="px-4 py-2 text-left font-semibold">
                        Format
                      </th>
                      <th className="px-4 py-2 text-left font-semibold">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody
                    className={
                      darkMode
                        ? "divide-y divide-zinc-700"
                        : "divide-y divide-gray-200"
                    }
                  >
                    {scheduledReports.map((job) => (
                      <tr key={job.jobId}>
                        <td className="px-4 py-2 font-medium">{job.name}</td>
                        <td className="px-4 py-2">
                          {friendlyReportName(job.reportType)}
                        </td>
                        <td className="px-4 py-2">
                          {job.scheduleType === "OneTime"
                            ? format(
                                new Date(job.scheduledDate ?? job.createdAt),
                                "PPpp"
                              )
                            : job.cronExpression}
                        </td>
                        <td className="px-4 py-2">{job.exportFormat}</td>
                        <td className="px-4 py-2">
                          {job.isActive ? "Active" : "Paused"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

const MetadataPanel = ({
  metadata,
  template,
  darkMode,
}: {
  metadata?: ReportMetadataDto;
  template?: {
    description: string;
    requiredParameters: string[];
    optionalParameters: string[];
  };
  darkMode: boolean;
}) => {
  if (!metadata && !template) {
    return (
      <div
        className={`rounded-xl border p-4 ${
          darkMode
            ? "border-zinc-700 bg-zinc-900/40 text-gray-200"
            : "border-gray-200 bg-gray-50 text-gray-700"
        }`}
      >
        <p className="text-sm">Select a report to see details and guidance.</p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border p-4 ${
        darkMode
          ? "border-zinc-700 bg-zinc-900/40 text-gray-200"
          : "border-gray-200 bg-gray-50 text-gray-700"
      }`}
    >
      {template && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">{template.description}</h3>
          <div className="text-xs opacity-80">
            <p className="font-semibold uppercase tracking-wide text-purple-400">
              Required params
            </p>
            <p>
              {template.requiredParameters.length > 0
                ? template.requiredParameters.join(", ")
                : "None"}
            </p>
          </div>
          <div className="text-xs opacity-80">
            <p className="font-semibold uppercase tracking-wide text-purple-400">
              Optional params
            </p>
            <p>
              {template.optionalParameters.length > 0
                ? template.optionalParameters.join(", ")
                : "None"}
            </p>
          </div>
        </div>
      )}

      {metadata && (
        <div className="mt-4 space-y-3 text-xs">
          <div>
            <p className="font-semibold uppercase tracking-wide text-purple-400">
              Available filters
            </p>
            <ul className="mt-1 space-y-1">
              {metadata.availableFilters.map((filter) => (
                <li key={filter.field}>
                  <span className="font-medium">{filter.label}</span> —{" "}
                  {filter.type} {filter.isRequired ? "(required)" : ""}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-semibold uppercase tracking-wide text-purple-400">
              Columns
            </p>
            <ul className="mt-1 space-y-1">
              {metadata.availableColumns.slice(0, 6).map((column) => (
                <li key={column.field}>
                  {column.label} ({column.dataType})
                </li>
              ))}
              {metadata.availableColumns.length > 6 && <li>…and more</li>}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

const LoadingSkeleton = ({ darkMode }: { darkMode: boolean }) => (
  <div className="space-y-4 animate-pulse">
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={`h-20 rounded-xl ${
            darkMode ? "bg-zinc-800" : "bg-gray-200"
          }`}
        />
      ))}
    </div>
    <div
      className={`h-64 rounded-xl ${
        darkMode ? "bg-zinc-800" : "bg-gray-200"
      }`}
    />
  </div>
);

const EmptyState = ({ darkMode }: { darkMode: boolean }) => (
  <div
    className={`flex flex-col items-center justify-center gap-3 py-10 text-center text-sm ${
      darkMode ? "text-gray-300" : "text-gray-500"
    }`}
  >
    <ListOrdered className="h-10 w-10" />
    <p>
      No report generated yet. Configure filters and click "Generate Report".
    </p>
  </div>
);

const StatCard = ({
  title,
  value,
  darkMode,
}: {
  title: string;
  value: string;
  darkMode: boolean;
}) => (
  <div
    className={`rounded-xl border px-4 py-3 ${
      darkMode
        ? "border-zinc-700 bg-zinc-900/40 text-gray-100"
        : "border-gray-200 bg-white text-gray-800"
    }`}
  >
    <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
      {title}
    </p>
    <p className="mt-2 text-2xl font-bold">{value}</p>
  </div>
);

const FormField = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <label className="flex flex-col gap-2 text-sm">
    <span className="text-xs font-semibold uppercase tracking-wide opacity-70">
      {label}
    </span>
    {children}
  </label>
);

const inputClassName = (darkMode: boolean) =>
  `rounded-xl border px-3 py-2 text-sm transition focus:ring-2 ${
    darkMode
      ? "border-zinc-700 bg-zinc-800 text-gray-100 focus:border-purple-500 focus:ring-purple-500/40"
      : "border-gray-200 bg-white text-gray-900 focus:border-purple-500 focus:ring-purple-200"
  }`;

const friendlyReportName = (reportType: ReportType) => {
  switch (reportType) {
    case ReportType.ProjectSummary:
      return "Project summary";
    case ReportType.TaskProgress:
      return "Task progress";
    case ReportType.TeamPerformance:
      return "Team performance";
    case ReportType.IssueSummary:
      return "Issue summary";
    default:
      return reportType;
  }
};

function renderReportData(report: AnyReportResponse, darkMode: boolean) {
  if (isProjectSummaryReport(report)) {
    return <ProjectSummaryView data={report.data} darkMode={darkMode} />;
  }
  if (isTaskProgressReport(report)) {
    return <TaskProgressView data={report.data} darkMode={darkMode} />;
  }
  if (isTeamPerformanceReport(report)) {
    return <TeamPerformanceView data={report.data} darkMode={darkMode} />;
  }
  if (isIssueSummaryReport(report)) {
    return <IssueSummaryView data={report.data} darkMode={darkMode} />;
  }

  const fallback = report as AnyReportResponse;
  return (
    <pre
      className={`overflow-x-auto text-xs ${
        darkMode ? "text-gray-100" : "text-gray-800"
      }`}
    >
      {JSON.stringify(fallback.data, null, 2)}
    </pre>
  );
}

const ProjectSummaryView = ({
  data,
  darkMode,
}: {
  data: ProjectSummaryReportDto;
  darkMode: boolean;
}) => (
  <div className="space-y-4 text-sm">
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
      <StatCard
        title="Total projects"
        value={data.overview.totalProjects.toString()}
        darkMode={darkMode}
      />
      <StatCard
        title="Active"
        value={data.overview.activeProjects.toString()}
        darkMode={darkMode}
      />
      <StatCard
        title="Completed"
        value={data.overview.completedProjects.toString()}
        darkMode={darkMode}
      />
      <StatCard
        title="Overdue"
        value={data.overview.overdueProjects.toString()}
        darkMode={darkMode}
      />
      <StatCard
        title="Average progress"
        value={`${Math.round(data.overview.averageProgress)}%`}
        darkMode={darkMode}
      />
    </div>
    
    {/* Project breakdown by status and department */}
    {(data.projectsByStatus?.length > 0 || data.projectsByDepartment?.length > 0) && (
      <div className="grid gap-3 md:grid-cols-2">
        {data.projectsByStatus?.length > 0 && (
          <div className={`rounded-xl border p-4 ${
            darkMode ? "border-zinc-700 bg-zinc-900/40" : "border-gray-200 bg-gray-50"
          }`}>
            <h4 className="text-sm font-semibold mb-3">Projects by Status</h4>
            <div className="space-y-2">
              {data.projectsByStatus.map((item) => (
                <div key={item.status} className="flex justify-between items-center">
                  <span className="text-xs">{item.status}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold">{item.count}</span>
                    <span className="text-xs opacity-60">({item.percentage.toFixed(1)}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {data.projectsByDepartment?.length > 0 && (
          <div className={`rounded-xl border p-4 ${
            darkMode ? "border-zinc-700 bg-zinc-900/40" : "border-gray-200 bg-gray-50"
          }`}>
            <h4 className="text-sm font-semibold mb-3">Projects by Department</h4>
            <div className="space-y-2">
              {data.projectsByDepartment.map((item) => (
                <div key={item.department} className="flex justify-between items-center">
                  <span className="text-xs">{item.department}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold">{item.count}</span>
                    <span className="text-xs opacity-60">({item.percentage.toFixed(1)}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )}
    
    <div className="overflow-x-auto rounded-xl border">
      <table className="min-w-full divide-y divide-gray-200 text-xs">
        <thead
          className={
            darkMode ? "bg-zinc-900/60 text-gray-200" : "bg-white text-gray-700"
          }
        >
          <tr>
            <th className="px-4 py-2 text-left font-semibold">Project</th>
            <th className="px-4 py-2 text-left font-semibold">Department</th>
            <th className="px-4 py-2 text-left font-semibold">Status</th>
            <th className="px-4 py-2 text-left font-semibold">Progress</th>
            <th className="px-4 py-2 text-left font-semibold">Tasks</th>
            <th className="px-4 py-2 text-left font-semibold">Due</th>
          </tr>
        </thead>
        <tbody
          className={
            darkMode ? "divide-y divide-zinc-700" : "divide-y divide-gray-200"
          }
        >
          {data.projects.slice(0, 10).map((project) => (
            <tr key={project.id}>
              <td className="px-4 py-2 font-medium">{project.projectName}</td>
              <td className="px-4 py-2">{project.department}</td>
              <td className="px-4 py-2">
                <span className={`inline-flex rounded px-2 py-1 text-xs font-medium ${
                  project.status === "Completed" 
                    ? darkMode ? "bg-green-500/20 text-green-300" : "bg-green-100 text-green-700"
                    : project.isOverdue
                    ? darkMode ? "bg-red-500/20 text-red-300" : "bg-red-100 text-red-700"
                    : darkMode ? "bg-blue-500/20 text-blue-300" : "bg-blue-100 text-blue-700"
                }`}>
                  {project.status}
                </span>
              </td>
              <td className="px-4 py-2">{Math.round(project.progress)}%</td>
              <td className="px-4 py-2">{project.completedTasks}/{project.totalTasks}</td>
              <td className="px-4 py-2">
                {project.dueDate
                  ? format(new Date(project.dueDate), "PP")
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {data.projects.length > 10 && (
        <div className={`px-4 py-3 text-center text-xs opacity-60 ${
          darkMode ? "bg-zinc-900/40" : "bg-gray-50"
        }`}>
          Showing 10 of {data.projects.length} projects
        </div>
      )}
    </div>
  </div>
);

const TaskProgressView = ({
  data,
  darkMode,
}: {
  data: TaskProgressReportDto;
  darkMode: boolean;
}) => (
  <div className="space-y-4 text-sm">
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
      <StatCard
        title="Total tasks"
        value={data.overview.totalTasks.toString()}
        darkMode={darkMode}
      />
      <StatCard
        title="Completed"
        value={data.overview.completedTasks.toString()}
        darkMode={darkMode}
      />
      <StatCard
        title="In Progress"
        value={data.overview.inProgressTasks.toString()}
        darkMode={darkMode}
      />
      <StatCard
        title="Overdue"
        value={data.overview.overdueTasks.toString()}
        darkMode={darkMode}
      />
      <StatCard
        title="Completion rate"
        value={`${Math.round(data.overview.completionRate)}%`}
        darkMode={darkMode}
      />
    </div>
    
    {/* Task breakdown by status and priority */}
    {(data.tasksByStatus?.length > 0 || data.tasksByPriority?.length > 0) && (
      <div className="grid gap-3 md:grid-cols-2">
        {data.tasksByStatus?.length > 0 && (
          <div className={`rounded-xl border p-4 ${
            darkMode ? "border-zinc-700 bg-zinc-900/40" : "border-gray-200 bg-gray-50"
          }`}>
            <h4 className="text-sm font-semibold mb-3">Tasks by Status</h4>
            <div className="space-y-2">
              {data.tasksByStatus.map((item) => (
                <div key={item.status} className="flex justify-between items-center">
                  <span className="text-xs">{item.status}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold">{item.count}</span>
                    <span className="text-xs opacity-60">({item.percentage.toFixed(1)}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {data.tasksByPriority?.length > 0 && (
          <div className={`rounded-xl border p-4 ${
            darkMode ? "border-zinc-700 bg-zinc-900/40" : "border-gray-200 bg-gray-50"
          }`}>
            <h4 className="text-sm font-semibold mb-3">Tasks by Priority</h4>
            <div className="space-y-2">
              {data.tasksByPriority.map((item) => (
                <div key={item.priority} className="flex justify-between items-center">
                  <span className="text-xs">{item.priority}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold">{item.count}</span>
                    <span className="text-xs opacity-60">({item.percentage.toFixed(1)}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )}
    
    <div className="overflow-x-auto rounded-xl border">
      <table className="min-w-full divide-y divide-gray-200 text-xs">
        <thead
          className={
            darkMode ? "bg-zinc-900/60 text-gray-200" : "bg-white text-gray-700"
          }
        >
          <tr>
            <th className="px-4 py-2 text-left font-semibold">Task</th>
            <th className="px-4 py-2 text-left font-semibold">Status</th>
            <th className="px-4 py-2 text-left font-semibold">Priority</th>
            <th className="px-4 py-2 text-left font-semibold">Progress</th>
            <th className="px-4 py-2 text-left font-semibold">Due</th>
          </tr>
        </thead>
        <tbody
          className={
            darkMode ? "divide-y divide-zinc-700" : "divide-y divide-gray-200"
          }
        >
          {data.tasks.slice(0, 10).map((task) => (
            <tr key={task.id}>
              <td className="px-4 py-2 font-medium">{task.title}</td>
              <td className="px-4 py-2">
                <span className={`inline-flex rounded px-2 py-1 text-xs font-medium ${
                  task.status === "Completed" 
                    ? darkMode ? "bg-green-500/20 text-green-300" : "bg-green-100 text-green-700"
                    : task.isOverdue
                    ? darkMode ? "bg-red-500/20 text-red-300" : "bg-red-100 text-red-700"
                    : darkMode ? "bg-blue-500/20 text-blue-300" : "bg-blue-100 text-blue-700"
                }`}>
                  {task.status}
                </span>
              </td>
              <td className="px-4 py-2">
                <span className={`inline-flex rounded px-2 py-1 text-xs font-medium ${
                  task.priority === "High" 
                    ? darkMode ? "bg-red-500/20 text-red-300" : "bg-red-100 text-red-700"
                    : task.priority === "Medium"
                    ? darkMode ? "bg-yellow-500/20 text-yellow-300" : "bg-yellow-100 text-yellow-700"
                    : darkMode ? "bg-gray-500/20 text-gray-300" : "bg-gray-100 text-gray-700"
                }`}>
                  {task.priority}
                </span>
              </td>
              <td className="px-4 py-2">{task.progress}%</td>
              <td className="px-4 py-2">
                {task.dueDate ? format(new Date(task.dueDate), "PP") : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {data.tasks.length > 10 && (
        <div className={`px-4 py-3 text-center text-xs opacity-60 ${
          darkMode ? "bg-zinc-900/40" : "bg-gray-50"
        }`}>
          Showing 10 of {data.tasks.length} tasks
        </div>
      )}
    </div>
  </div>
);

const TeamPerformanceView = ({
  data,
  darkMode,
}: {
  data: TeamPerformanceReportDto;
  darkMode: boolean;
}) => (
  <div className="space-y-4 text-sm">
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Team members"
        value={data.overview.totalTeamMembers.toString()}
        darkMode={darkMode}
      />
      <StatCard
        title="Average completion"
        value={`${Math.round(data.overview.averageCompletionRate)}%`}
        darkMode={darkMode}
      />
      <StatCard
        title="Overdue tasks"
        value={data.overview.totalOverdueTasks.toString()}
        darkMode={darkMode}
      />
      <StatCard
        title="Avg task duration"
        value={`${Math.round(data.overview.averageTaskDuration)} days`}
        darkMode={darkMode}
      />
    </div>
    
    {/* Performance breakdown by department */}
    {data.performanceByDepartment?.length > 0 && (
      <div className={`rounded-xl border p-4 ${
        darkMode ? "border-zinc-700 bg-zinc-900/40" : "border-gray-200 bg-gray-50"
      }`}>
        <h4 className="text-sm font-semibold mb-3">Performance by Department</h4>
        <div className="space-y-2">
          {data.performanceByDepartment.map((dept) => (
            <div key={dept.department} className="flex justify-between items-center">
              <span className="text-xs font-medium">{dept.department}</span>
              <div className="flex items-center gap-4 text-xs">
                <span>{dept.memberCount} members</span>
                <span className="font-semibold">{Math.round(dept.averageCompletionRate)}% completion</span>
                <span className="opacity-60">{Math.round(dept.averageTaskDuration)} days avg</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
    
    <div className="overflow-x-auto rounded-xl border">
      <table className="min-w-full divide-y divide-gray-200 text-xs">
        <thead
          className={
            darkMode ? "bg-zinc-900/60 text-gray-200" : "bg-white text-gray-700"
          }
        >
          <tr>
            <th className="px-4 py-2 text-left font-semibold">Member</th>
            <th className="px-4 py-2 text-left font-semibold">Department</th>
            <th className="px-4 py-2 text-left font-semibold">Assigned</th>
            <th className="px-4 py-2 text-left font-semibold">Completed</th>
            <th className="px-4 py-2 text-left font-semibold">Overdue</th>
            <th className="px-4 py-2 text-left font-semibold">
              Completion rate
            </th>
          </tr>
        </thead>
        <tbody
          className={
            darkMode ? "divide-y divide-zinc-700" : "divide-y divide-gray-200"
          }
        >
          {data.teamMembers.slice(0, 10).map((member) => (
            <tr key={member.userId}>
              <td className="px-4 py-2 font-medium">{member.userName}</td>
              <td className="px-4 py-2">{member.department}</td>
              <td className="px-4 py-2">{member.assignedTasks}</td>
              <td className="px-4 py-2">{member.completedTasks}</td>
              <td className="px-4 py-2">
                <span className={member.overdueTasks > 0 ? (darkMode ? "text-red-300" : "text-red-600") : ""}>
                  {member.overdueTasks}
                </span>
              </td>
              <td className="px-4 py-2">
                <span className={`inline-flex rounded px-2 py-1 text-xs font-medium ${
                  member.completionRate >= 80
                    ? darkMode ? "bg-green-500/20 text-green-300" : "bg-green-100 text-green-700"
                    : member.completionRate >= 50
                    ? darkMode ? "bg-yellow-500/20 text-yellow-300" : "bg-yellow-100 text-yellow-700"
                    : darkMode ? "bg-red-500/20 text-red-300" : "bg-red-100 text-red-700"
                }`}>
                  {Math.round(member.completionRate)}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {data.teamMembers.length > 10 && (
        <div className={`px-4 py-3 text-center text-xs opacity-60 ${
          darkMode ? "bg-zinc-900/40" : "bg-gray-50"
        }`}>
          Showing 10 of {data.teamMembers.length} team members
        </div>
      )}
    </div>
  </div>
);

const IssueSummaryView = ({
  data,
  darkMode,
}: {
  data: IssueSummaryReportDto;
  darkMode: boolean;
}) => (
  <div className="space-y-4 text-sm">
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
      <StatCard
        title="Total issues"
        value={data.overview.totalIssues.toString()}
        darkMode={darkMode}
      />
      <StatCard
        title="Open"
        value={data.overview.openIssues.toString()}
        darkMode={darkMode}
      />
      <StatCard
        title="Resolved"
        value={data.overview.resolvedIssues.toString()}
        darkMode={darkMode}
      />
      <StatCard
        title="Closed"
        value={data.overview.closedIssues.toString()}
        darkMode={darkMode}
      />
      <StatCard
        title="Resolution rate"
        value={`${Math.round(data.overview.resolutionRate)}%`}
        darkMode={darkMode}
      />
    </div>
    
    {/* Issue breakdown by type and status */}
    {(data.issuesByType?.length > 0 || data.issuesByStatus?.length > 0) && (
      <div className="grid gap-3 md:grid-cols-2">
        {data.issuesByType?.length > 0 && (
          <div className={`rounded-xl border p-4 ${
            darkMode ? "border-zinc-700 bg-zinc-900/40" : "border-gray-200 bg-gray-50"
          }`}>
            <h4 className="text-sm font-semibold mb-3">Issues by Type</h4>
            <div className="space-y-2">
              {data.issuesByType.map((item) => (
                <div key={item.type} className="flex justify-between items-center">
                  <span className="text-xs">{item.type}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold">{item.count}</span>
                    <span className="text-xs opacity-60">({item.percentage.toFixed(1)}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {data.issuesByStatus?.length > 0 && (
          <div className={`rounded-xl border p-4 ${
            darkMode ? "border-zinc-700 bg-zinc-900/40" : "border-gray-200 bg-gray-50"
          }`}>
            <h4 className="text-sm font-semibold mb-3">Issues by Status</h4>
            <div className="space-y-2">
              {data.issuesByStatus.map((item) => (
                <div key={item.status} className="flex justify-between items-center">
                  <span className="text-xs">{item.status}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold">{item.count}</span>
                    <span className="text-xs opacity-60">({item.percentage.toFixed(1)}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )}
    
    <div className="overflow-x-auto rounded-xl border">
      <table className="min-w-full divide-y divide-gray-200 text-xs">
        <thead
          className={
            darkMode ? "bg-zinc-900/60 text-gray-200" : "bg-white text-gray-700"
          }
        >
          <tr>
            <th className="px-4 py-2 text-left font-semibold">Issue</th>
            <th className="px-4 py-2 text-left font-semibold">Status</th>
            <th className="px-4 py-2 text-left font-semibold">Priority</th>
            <th className="px-4 py-2 text-left font-semibold">Reporter</th>
            <th className="px-4 py-2 text-left font-semibold">Assignee</th>
            <th className="px-4 py-2 text-left font-semibold">Created</th>
          </tr>
        </thead>
        <tbody
          className={
            darkMode ? "divide-y divide-zinc-700" : "divide-y divide-gray-200"
          }
        >
          {data.issues.slice(0, 10).map((issue) => (
            <tr key={issue.id}>
              <td className="px-4 py-2 font-medium">{issue.title}</td>
              <td className="px-4 py-2">{issue.status}</td>
              <td className="px-4 py-2">{issue.priority}</td>
              <td className="px-4 py-2">{issue.reporterName}</td>
              <td className="px-4 py-2">{issue.assigneeName || "—"}</td>
              <td className="px-4 py-2">
                {format(new Date(issue.createdAt), "PP")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {data.issues.length > 10 && (
        <div className={`px-4 py-3 text-center text-xs opacity-60 ${
          darkMode ? "bg-zinc-900/40" : "bg-gray-50"
        }`}>
          Showing 10 of {data.issues.length} issues
        </div>
      )}
    </div>
  </div>
);

function isProjectSummaryReport(
  report: AnyReportResponse
): report is ReportResponseDto<ProjectSummaryReportDto> {
  return report.reportType === ReportType.ProjectSummary;
}

function isTaskProgressReport(
  report: AnyReportResponse
): report is ReportResponseDto<TaskProgressReportDto> {
  return report.reportType === ReportType.TaskProgress;
}

function isTeamPerformanceReport(
  report: AnyReportResponse
): report is ReportResponseDto<TeamPerformanceReportDto> {
  return report.reportType === ReportType.TeamPerformance;
}

function isIssueSummaryReport(
  report: AnyReportResponse
): report is ReportResponseDto<IssueSummaryReportDto> {
  return report.reportType === ReportType.IssueSummary;
}

function formatStatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "number")
    return Number.isInteger(value) ? value.toString() : value.toFixed(1);
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

function startCase(value: string) {
  return value
    .replace(/([A-Z])/g, " $1")
    .replace(/[-_]/g, " ")
    .replace(/^./, (char) => char.toUpperCase());
}

function exportExtension(format: ReportFormat) {
  switch (format) {
    case ReportFormat.Csv:
      return "csv";
    case ReportFormat.Excel:
      return "xlsx";
    case ReportFormat.Pdf:
      return "pdf";
    default:
      return "json";
  }
}

export default Report;

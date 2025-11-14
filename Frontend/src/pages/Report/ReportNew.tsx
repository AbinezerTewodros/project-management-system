import { useState } from "react";
import { format as formatDate } from "date-fns";
import { toast } from "react-toastify";
import { Download, TrendingUp, RefreshCw, AlertCircle } from "lucide-react";
import { apiClient } from "@/lib/api";

// Types
enum ReportType {
  ProjectSummary = "ProjectSummary",
  TaskProgress = "TaskProgress",
  TeamPerformance = "TeamPerformance",
  IssueSummary = "IssueSummary",
}

enum ReportFormat {
  Json = "Json",
  Csv = "Csv",
  Excel = "Excel",
  Pdf = "Pdf",
}

interface ReportProps {
  darkMode: boolean;
}

// Helper function to render charts
function renderReportCharts(reportData: any, darkMode: boolean) {
  console.log("🎨 renderReportCharts called with:", {
    reportData,
    hasData: !!reportData,
  });
  console.log("🎨 Full reportData:", JSON.stringify(reportData, null, 2));

  if (!reportData) {
    console.log("⚠️ No reportData provided");
    return null;
  }

  // The backend response structure is: { data: { actualData }, reportType, generatedAt, ... }
  // Extract the actual report data
  let data = reportData.data;

  // If there's no data property, use reportData directly
  if (!data) {
    console.log("📊 Using reportData directly (no nested data property)");
    data = reportData;
  }

  const reportType = reportData.reportType;

  console.log("📊 Report Type:", reportType);
  console.log("📊 Data type:", typeof data);
  console.log("📊 Data is array:", Array.isArray(data));
  console.log(
    "📊 Data keys:",
    data && typeof data === "object" ? Object.keys(data) : "N/A"
  );
  console.log("📊 Full data object:", JSON.stringify(data, null, 2));

  // Pie Chart Component
  const PieChart = ({
    title,
    items,
    darkMode,
  }: {
    title: string;
    items: Array<{ label: string; value: number; percentage?: number }>;
    darkMode: boolean;
  }) => {
    const total = items.reduce((sum, item) => sum + item.value, 0);
    const colors = [
      "#9333ea",
      "#a855f7",
      "#c084fc",
      "#d8b4fe",
      "#e9d5ff",
      "#f3e8ff",
    ];

    return (
      <div
        className={`rounded-lg border p-6 ${
          darkMode
            ? "border-zinc-700 bg-zinc-900/40"
            : "border-gray-200 bg-gray-50"
        }`}
      >
        <h3 className="mb-4 text-sm font-semibold">{title}</h3>
        <div className="flex flex-col items-center gap-4">
          {/* Pie Chart Visual */}
          <div className="relative h-48 w-48">
            <svg viewBox="0 0 100 100" className="transform -rotate-90">
              {items.map((item, index) => {
                const percentage = total > 0 ? (item.value / total) * 100 : 0;
                const prevPercentages = items
                  .slice(0, index)
                  .reduce(
                    (sum, i) => sum + (total > 0 ? (i.value / total) * 100 : 0),
                    0
                  );
                const strokeDasharray = `${percentage} ${100 - percentage}`;
                const strokeDashoffset = -prevPercentages;

                return (
                  <circle
                    key={index}
                    cx="50"
                    cy="50"
                    r="15.915"
                    fill="transparent"
                    stroke={colors[index % colors.length]}
                    strokeWidth="31.83"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-500"
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold">{total}</div>
                <div className="text-xs opacity-60">Total</div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="w-full space-y-2">
            {items.map((item, index) => {
              const percentage = total > 0 ? (item.value / total) * 100 : 0;
              return (
                <div
                  key={index}
                  className="flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-sm"
                      style={{ backgroundColor: colors[index % colors.length] }}
                    />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <span className="opacity-75">
                    {item.value} ({percentage.toFixed(1)}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Common chart component
  const BarChart = ({
    title,
    items,
    darkMode,
  }: {
    title: string;
    items: Array<{ label: string; value: number; percentage?: number }>;
    darkMode: boolean;
  }) => (
    <div
      className={`rounded-lg border p-4 ${
        darkMode
          ? "border-zinc-700 bg-zinc-900/40"
          : "border-gray-200 bg-gray-50"
      }`}
    >
      <h3 className="mb-4 text-sm font-semibold">{title}</h3>
      <div className="space-y-3">
        {items.map((item, index) => {
          const maxValue = Math.max(...items.map((i) => i.value));
          const widthPercent = maxValue > 0 ? (item.value / maxValue) * 100 : 0;

          return (
            <div key={index}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium">{item.label}</span>
                <span className="opacity-75">
                  {item.value}{" "}
                  {item.percentage !== undefined &&
                    `(${item.percentage.toFixed(1)}%)`}
                </span>
              </div>
              <div
                className={`h-8 w-full rounded ${
                  darkMode ? "bg-zinc-800" : "bg-gray-200"
                }`}
              >
                <div
                  className="h-full rounded bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-500"
                  style={{ width: `${widthPercent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // Data Table Component
  const DataTable = ({
    title,
    headers,
    rows,
    darkMode,
  }: {
    title: string;
    headers: string[];
    rows: string[][];
    darkMode: boolean;
  }) => (
    <div
      className={`rounded-lg border ${
        darkMode
          ? "border-zinc-700 bg-zinc-900/40"
          : "border-gray-200 bg-gray-50"
      }`}
    >
      <h3
        className={`border-b p-4 text-sm font-semibold ${
          darkMode ? "border-zinc-700" : "border-gray-200"
        }`}
      >
        {title}
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className={darkMode ? "bg-zinc-800" : "bg-gray-100"}>
            <tr>
              {headers.map((header, i) => (
                <th key={i} className="px-4 py-2 text-left font-semibold">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody
            className={`divide-y ${
              darkMode ? "divide-zinc-700" : "divide-gray-200"
            }`}
          >
            {rows.slice(0, 10).map((row, i) => (
              <tr
                key={i}
                className={
                  darkMode ? "hover:bg-zinc-800/50" : "hover:bg-gray-50"
                }
              >
                {row.map((cell, j) => (
                  <td key={j} className="px-4 py-2">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length > 10 && (
          <div
            className={`border-t px-4 py-2 text-center text-xs opacity-60 ${
              darkMode ? "border-zinc-700" : "border-gray-200"
            }`}
          >
            Showing 10 of {rows.length} rows
          </div>
        )}
      </div>
    </div>
  );

  // Project Summary Charts
  if (reportType === "ProjectSummary" || reportType === "Project Summary") {
    console.log("📊 Rendering Project Summary Charts");
    console.log("  - Full data object:", data);
    console.log("  - projectsByStatus:", data.projectsByStatus);
    console.log("  - projectsByDepartment:", data.projectsByDepartment);
    console.log("  - projects array:", data.projects);
    console.log("  - projects length:", data.projects?.length);
    console.log("  - summary:", data.summary);

    const charts = [];

    // Add graphs section header
    charts.push(
      <div key="header" className="col-span-full">
        <h3 className="text-lg font-bold mb-4">📊 Visual Analytics</h3>
      </div>
    );

    // EMERGENCY: Always try to create charts from projects array if we have projects
    if (
      data.projects &&
      Array.isArray(data.projects) &&
      data.projects.length > 0
    ) {
      console.log(
        "🚨 EMERGENCY FALLBACK: Creating charts from projects array. Projects count:",
        data.projects.length
      );

      // Create status breakdown from projects
      const statusCounts = data.projects.reduce((acc: any, project: any) => {
        const status = project.status || "Unknown";
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      const statusData = Object.entries(statusCounts).map(
        ([status, count]) => ({
          status,
          count: count as number,
          percentage: Math.round(
            ((count as number) / data.projects.length) * 100
          ),
        })
      );

      console.log("🚨 Created status data from projects:", statusData);

      if (statusData.length > 0) {
        charts.push(
          <PieChart
            key="status-pie"
            title="Projects by Status Distribution"
            items={statusData.map((item: any) => ({
              label: item.status,
              value: item.count,
              percentage: item.percentage,
            }))}
            darkMode={darkMode}
          />
        );
        charts.push(
          <BarChart
            key="status-bar"
            title="Projects by Status"
            items={statusData.map((item: any) => ({
              label: item.status,
              value: item.count,
              percentage: item.percentage,
            }))}
            darkMode={darkMode}
          />
        );
      }

      // Create department breakdown from projects
      const deptCounts = data.projects.reduce((acc: any, project: any) => {
        const dept = project.department || "Unknown";
        acc[dept] = (acc[dept] || 0) + 1;
        return acc;
      }, {});

      const deptData = Object.entries(deptCounts).map(
        ([department, count]) => ({
          department,
          count: count as number,
          percentage: Math.round(
            ((count as number) / data.projects.length) * 100
          ),
        })
      );

      console.log("🚨 Created department data from projects:", deptData);

      if (deptData.length > 0) {
        charts.push(
          <PieChart
            key="dept-pie"
            title="Projects by Department Distribution"
            items={deptData.map((item: any) => ({
              label: item.department,
              value: item.count,
              percentage: item.percentage,
            }))}
            darkMode={darkMode}
          />
        );
        charts.push(
          <BarChart
            key="dept-bar"
            title="Projects by Department"
            items={deptData.map((item: any) => ({
              label: item.department,
              value: item.count,
              percentage: item.percentage,
            }))}
            darkMode={darkMode}
          />
        );
      }
    }

    console.log("📊 Checking projectsByStatus:", {
      exists: !!data.projectsByStatus,
      isArray: Array.isArray(data.projectsByStatus),
      length: data.projectsByStatus?.length,
      data: data.projectsByStatus,
    });

    // Only use breakdown data if it exists AND we haven't already created charts
    if (
      charts.length === 1 &&
      data.projectsByStatus &&
      Array.isArray(data.projectsByStatus) &&
      data.projectsByStatus.length > 0
    ) {
      console.log("✅ Adding projectsByStatus charts");
      charts.push(
        <PieChart
          key="status-pie"
          title="Projects by Status Distribution"
          items={data.projectsByStatus.map((item: any) => ({
            label: item.status,
            value: item.count,
            percentage: item.percentage,
          }))}
          darkMode={darkMode}
        />
      );
      charts.push(
        <BarChart
          key="status-bar"
          title="Projects by Status"
          items={data.projectsByStatus.map((item: any) => ({
            label: item.status,
            value: item.count,
            percentage: item.percentage,
          }))}
          darkMode={darkMode}
        />
      );
    } else {
      console.log("❌ projectsByStatus check failed - no charts added");
    }

    console.log("📊 Checking projectsByDepartment:", {
      exists: !!data.projectsByDepartment,
      isArray: Array.isArray(data.projectsByDepartment),
      length: data.projectsByDepartment?.length,
      data: data.projectsByDepartment,
    });

    if (data.projectsByDepartment?.length > 0) {
      console.log("✅ Adding projectsByDepartment charts");
      charts.push(
        <PieChart
          key="department-pie"
          title="Projects by Department Distribution"
          items={data.projectsByDepartment.map((item: any) => ({
            label: item.department,
            value: item.count,
            percentage: item.percentage,
          }))}
          darkMode={darkMode}
        />
      );
      charts.push(
        <BarChart
          key="department-bar"
          title="Projects by Department"
          items={data.projectsByDepartment.map((item: any) => ({
            label: item.department,
            value: item.count,
            percentage: item.percentage,
          }))}
          darkMode={darkMode}
        />
      );
    } else {
      console.log("❌ projectsByDepartment check failed - no charts added");
    }

    if (data.projects?.length > 0) {
      // Return charts grid separately, then add full-width table
      const tableSection = (
        <div key="table-section" className="mt-6">
          <hr
            className={`my-4 ${
              darkMode ? "border-zinc-700" : "border-gray-200"
            }`}
          />
          <h3 className="text-lg font-bold mb-4">📋 Detailed Data</h3>
          <DataTable
            key="projects"
            title="Project Details"
            headers={[
              "Project",
              "Department",
              "Status",
              "Progress",
              "Tasks",
              "Due Date",
            ]}
            rows={data.projects.map((p: any) => [
              p.projectName,
              p.department,
              p.status,
              `${Math.round(p.progress)}%`,
              `${p.completedTasks}/${p.totalTasks}`,
              p.dueDate ? formatDate(new Date(p.dueDate), "PP") : "—",
            ])}
            darkMode={darkMode}
          />
        </div>
      );

      // Return both charts and table
      console.log(
        "📊 Total charts to render for ProjectSummary:",
        charts.length
      );
      console.log(
        "📊 Charts array:",
        charts.map((c: any) => c.key)
      );

      if (charts.length > 1) {
        return (
          <>
            <div className="grid gap-4 md:grid-cols-2">{charts}</div>
            {tableSection}
          </>
        );
      } else {
        console.warn(
          "⚠️ Not enough charts to display. Charts length:",
          charts.length
        );
        return (
          <>
            <div className="text-sm opacity-60">
              No chart data available. Check console for details.
            </div>
            {tableSection}
          </>
        );
      }
    }

    // If no breakdown data but we have projects, create charts from project data
    if (
      charts.length === 1 &&
      data.projects &&
      Array.isArray(data.projects) &&
      data.projects.length > 0
    ) {
      console.log(
        "📊 No breakdown data, creating charts from project array data. Projects count:",
        data.projects.length
      );

      // Create status breakdown from projects
      const statusCounts = data.projects.reduce((acc: any, project: any) => {
        const status = project.status || "Unknown";
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      console.log("📊 Status counts from projects:", statusCounts);

      const statusData = Object.entries(statusCounts).map(
        ([status, count]) => ({
          status,
          count: count as number,
          percentage: Math.round(
            ((count as number) / data.projects.length) * 100
          ),
        })
      );

      console.log("📊 Status data for charts:", statusData);

      if (statusData.length > 0) {
        charts.push(
          <PieChart
            key="status-pie-fallback"
            title="Projects by Status Distribution"
            items={statusData.map((item: any) => ({
              label: item.status,
              value: item.count,
              percentage: item.percentage,
            }))}
            darkMode={darkMode}
          />
        );
        charts.push(
          <BarChart
            key="status-bar-fallback"
            title="Projects by Status"
            items={statusData.map((item: any) => ({
              label: item.status,
              value: item.count,
              percentage: item.percentage,
            }))}
            darkMode={darkMode}
          />
        );
      }

      // Create department breakdown from projects
      const deptCounts = data.projects.reduce((acc: any, project: any) => {
        const dept = project.department || "Unknown";
        acc[dept] = (acc[dept] || 0) + 1;
        return acc;
      }, {});

      console.log("📊 Department counts from projects:", deptCounts);

      const deptData = Object.entries(deptCounts).map(
        ([department, count]) => ({
          department,
          count: count as number,
          percentage: Math.round(
            ((count as number) / data.projects.length) * 100
          ),
        })
      );

      console.log("📊 Department data for charts:", deptData);

      if (deptData.length > 0) {
        charts.push(
          <PieChart
            key="dept-pie-fallback"
            title="Projects by Department Distribution"
            items={deptData.map((item: any) => ({
              label: item.department,
              value: item.count,
              percentage: item.percentage,
            }))}
            darkMode={darkMode}
          />
        );
        charts.push(
          <BarChart
            key="dept-bar-fallback"
            title="Projects by Department"
            items={deptData.map((item: any) => ({
              label: item.department,
              value: item.count,
              percentage: item.percentage,
            }))}
            darkMode={darkMode}
          />
        );
      }
    }

    // Final return if no projects data
    console.log("📊 Total charts to render for ProjectSummary:", charts.length);
    console.log(
      "📊 Charts array:",
      charts.map((c: any) => c.key)
    );

    if (charts.length > 1) {
      return <div className="grid gap-4 md:grid-cols-2">{charts}</div>;
    } else {
      console.warn(
        "⚠️ Not enough charts to display. Charts length:",
        charts.length
      );
      return (
        <div className="text-sm opacity-60">
          No chart data available. Check console for details.
        </div>
      );
    }
  }

  // Task Progress Charts
  if (reportType === "TaskProgress") {
    const charts = [];

    // Add graphs section header
    charts.push(
      <div key="header" className="col-span-full">
        <h3 className="text-lg font-bold mb-4">📊 Visual Analytics</h3>
      </div>
    );

    if (data.tasksByStatus?.length > 0) {
      charts.push(
        <PieChart
          key="status-pie"
          title="Tasks by Status Distribution"
          items={data.tasksByStatus.map((item: any) => ({
            label: item.status,
            value: item.count,
            percentage: item.percentage,
          }))}
          darkMode={darkMode}
        />
      );
      charts.push(
        <BarChart
          key="status-bar"
          title="Tasks by Status"
          items={data.tasksByStatus.map((item: any) => ({
            label: item.status,
            value: item.count,
            percentage: item.percentage,
          }))}
          darkMode={darkMode}
        />
      );
    }

    if (data.tasksByPriority?.length > 0) {
      charts.push(
        <PieChart
          key="priority-pie"
          title="Tasks by Priority Distribution"
          items={data.tasksByPriority.map((item: any) => ({
            label: item.priority,
            value: item.count,
            percentage: item.percentage,
          }))}
          darkMode={darkMode}
        />
      );
      charts.push(
        <BarChart
          key="priority-bar"
          title="Tasks by Priority"
          items={data.tasksByPriority.map((item: any) => ({
            label: item.priority,
            value: item.count,
            percentage: item.percentage,
          }))}
          darkMode={darkMode}
        />
      );
    }

    if (data.tasks?.length > 0) {
      const tableSection = (
        <div key="table-section" className="mt-6">
          <hr
            className={`my-4 ${
              darkMode ? "border-zinc-700" : "border-gray-200"
            }`}
          />
          <h3 className="text-lg font-bold mb-4">📋 Detailed Data</h3>
          <DataTable
            key="tasks"
            title="Task Details"
            headers={["Task", "Status", "Priority", "Progress", "Due Date"]}
            rows={data.tasks.map((t: any) => [
              t.title,
              t.status,
              t.priority,
              `${t.progress}%`,
              t.dueDate ? formatDate(new Date(t.dueDate), "PP") : "—",
            ])}
            darkMode={darkMode}
          />
        </div>
      );

      console.log("📊 Total charts to render:", charts.length);
      if (charts.length > 1) {
        return (
          <>
            <div className="grid gap-4 md:grid-cols-2">{charts}</div>
            {tableSection}
          </>
        );
      } else {
        return (
          <>
            <div className="text-sm opacity-60">No chart data available</div>
            {tableSection}
          </>
        );
      }
    }

    console.log("📊 Total charts to render:", charts.length);
    return charts.length > 1 ? (
      <div className="grid gap-4 md:grid-cols-2">{charts}</div>
    ) : (
      <div className="text-sm opacity-60">No chart data available</div>
    );
  }

  // Team Performance Charts
  if (reportType === "TeamPerformance") {
    const charts = [];

    // Add graphs section header
    charts.push(
      <div key="header" className="col-span-full">
        <h3 className="text-lg font-bold mb-4">📊 Visual Analytics</h3>
      </div>
    );

    if (data.performanceByDepartment?.length > 0) {
      charts.push(
        <PieChart
          key="dept-pie"
          title="Team Distribution by Department"
          items={data.performanceByDepartment.map((item: any) => ({
            label: item.department,
            value: item.memberCount,
          }))}
          darkMode={darkMode}
        />
      );
      charts.push(
        <BarChart
          key="dept-bar"
          title="Average Completion by Department"
          items={data.performanceByDepartment.map((item: any) => ({
            label: `${item.department} (${item.memberCount} members)`,
            value: Math.round(item.averageCompletionRate),
            percentage: item.averageCompletionRate,
          }))}
          darkMode={darkMode}
        />
      );
    }

    if (data.teamMembers?.length > 0) {
      const tableSection = (
        <div key="table-section" className="mt-6">
          <hr
            className={`my-4 ${
              darkMode ? "border-zinc-700" : "border-gray-200"
            }`}
          />
          <h3 className="text-lg font-bold mb-4">📋 Detailed Data</h3>
          <DataTable
            key="members"
            title="Team Member Performance"
            headers={[
              "Member",
              "Department",
              "Assigned",
              "Completed",
              "Overdue",
              "Rate",
            ]}
            rows={data.teamMembers.map((m: any) => [
              m.userName,
              m.department,
              m.assignedTasks.toString(),
              m.completedTasks.toString(),
              m.overdueTasks.toString(),
              `${Math.round(m.completionRate)}%`,
            ])}
            darkMode={darkMode}
          />
        </div>
      );

      console.log("📊 Total charts to render:", charts.length);
      if (charts.length > 1) {
        return (
          <>
            <div className="grid gap-4 md:grid-cols-2">{charts}</div>
            {tableSection}
          </>
        );
      } else {
        return (
          <>
            <div className="text-sm opacity-60">No chart data available</div>
            {tableSection}
          </>
        );
      }
    }

    console.log("📊 Total charts to render:", charts.length);
    return charts.length > 1 ? (
      <div className="grid gap-4 md:grid-cols-2">{charts}</div>
    ) : (
      <div className="text-sm opacity-60">No chart data available</div>
    );
  }

  // Issue Summary Charts
  if (reportType === "IssueSummary") {
    const charts = [];

    // Add graphs section header
    charts.push(
      <div key="header" className="col-span-full">
        <h3 className="text-lg font-bold mb-4">📊 Visual Analytics</h3>
      </div>
    );

    if (data.issuesByType?.length > 0) {
      charts.push(
        <PieChart
          key="type-pie"
          title="Issues by Type Distribution"
          items={data.issuesByType.map((item: any) => ({
            label: item.type,
            value: item.count,
            percentage: item.percentage,
          }))}
          darkMode={darkMode}
        />
      );
      charts.push(
        <BarChart
          key="type-bar"
          title="Issues by Type"
          items={data.issuesByType.map((item: any) => ({
            label: item.type,
            value: item.count,
            percentage: item.percentage,
          }))}
          darkMode={darkMode}
        />
      );
    }

    if (data.issuesByStatus?.length > 0) {
      charts.push(
        <PieChart
          key="status-pie"
          title="Issues by Status Distribution"
          items={data.issuesByStatus.map((item: any) => ({
            label: item.status,
            value: item.count,
            percentage: item.percentage,
          }))}
          darkMode={darkMode}
        />
      );
      charts.push(
        <BarChart
          key="status-bar"
          title="Issues by Status"
          items={data.issuesByStatus.map((item: any) => ({
            label: item.status,
            value: item.count,
            percentage: item.percentage,
          }))}
          darkMode={darkMode}
        />
      );
    }

    if (data.issues?.length > 0) {
      const tableSection = (
        <div key="table-section" className="mt-6">
          <hr
            className={`my-4 ${
              darkMode ? "border-zinc-700" : "border-gray-200"
            }`}
          />
          <h3 className="text-lg font-bold mb-4">📋 Detailed Data</h3>
          <DataTable
            key="issues"
            title="Issue Details"
            headers={[
              "Issue",
              "Status",
              "Priority",
              "Reporter",
              "Assignee",
              "Created",
            ]}
            rows={data.issues.map((i: any) => [
              i.title,
              i.status,
              i.priority,
              i.reporterName,
              i.assigneeName || "—",
              formatDate(new Date(i.createdAt), "PP"),
            ])}
            darkMode={darkMode}
          />
        </div>
      );

      console.log("📊 Total charts to render:", charts.length);
      if (charts.length > 1) {
        return (
          <>
            <div className="grid gap-4 md:grid-cols-2">{charts}</div>
            {tableSection}
          </>
        );
      } else {
        return (
          <>
            <div className="text-sm opacity-60">No chart data available</div>
            {tableSection}
          </>
        );
      }
    }

    console.log("📊 Total charts to render:", charts.length);
    return charts.length > 1 ? (
      <div className="grid gap-4 md:grid-cols-2">{charts}</div>
    ) : (
      <div className="text-sm opacity-60">No chart data available</div>
    );
  }

  console.log("⚠️ Unknown report type:", reportType);
  return <div className="text-sm opacity-60">Unknown report type</div>;
}

function ReportNew({ darkMode }: ReportProps) {
  const [selectedType, setSelectedType] = useState<ReportType>(
    ReportType.ProjectSummary
  );
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  // Form state
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [department, setDepartment] = useState("");
  const [projectIds, setProjectIds] = useState("");
  const [userIds, setUserIds] = useState("");
  const [exportFormat, setExportFormat] = useState<ReportFormat>(
    ReportFormat.Json
  );
  const [exporting, setExporting] = useState(false);

  const addDebug = (msg: string) => {
    setDebugInfo((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${msg}`,
    ]);
    console.log(msg);
  };

  // Determine which fields to show based on report type
  const showDates = true;
  const showDepartment =
    selectedType === ReportType.ProjectSummary ||
    selectedType === ReportType.TeamPerformance;
  const showProjectIds =
    selectedType === ReportType.ProjectSummary ||
    selectedType === ReportType.TaskProgress ||
    selectedType === ReportType.IssueSummary;
  const showUserIds = selectedType === ReportType.TeamPerformance;

  const getEndpoint = () => {
    switch (selectedType) {
      case ReportType.ProjectSummary:
        return "/Report/project-summary";
      case ReportType.TaskProgress:
        return "/Report/task-progress";
      case ReportType.TeamPerformance:
        return "/Report/team-performance";
      case ReportType.IssueSummary:
        return "/Report/issue-summary";
      default:
        return "/Report/generate";
    }
  };

  const buildPayload = () => {
    const payload: any = {
      reportType: selectedType,
      exportFormat: exportFormat,
    };

    if (startDate) payload.startDate = startDate;
    if (endDate) payload.endDate = endDate;
    if (department && department.trim()) payload.department = department.trim();

    if (projectIds && projectIds.trim()) {
      const ids = projectIds
        .split(",")
        .map((id) => parseInt(id.trim()))
        .filter((id) => !isNaN(id));
      if (ids.length > 0) payload.projectIds = ids;
    }

    if (userIds && userIds.trim()) {
      const ids = userIds
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);
      if (ids.length > 0) payload.userIds = ids;
    }

    return payload;
  };

  const handleGenerate = async () => {
    addDebug("🚀 Generate button clicked");
    setLoading(true);
    setError(null);

    try {
      // Always use JSON format for viewing in the UI
      const payload = {
        ...buildPayload(),
        exportFormat: ReportFormat.Json, // Override to JSON for display
      };
      addDebug("📦 Payload built: " + JSON.stringify(payload));

      const endpoint = getEndpoint();
      addDebug("🔗 Calling endpoint: " + endpoint);

      const response = await apiClient.post(endpoint, payload);
      addDebug(
        "✅ Response received: " + (response.success ? "SUCCESS" : "FAILED")
      );

      if (response.success && response.data) {
        const data = response.data as any;
        addDebug(`📊 Raw response data type: ${typeof data}`);
        addDebug(`📊 Raw response data keys: ${Object.keys(data).join(", ")}`);
        addDebug(`📊 Has 'data' property: ${!!data.data}`);
        addDebug(`📊 reportType: ${data.reportType}`);

        // Check if data has nested structure
        if (data.data) {
          addDebug(`📊 Nested data keys: ${Object.keys(data.data).join(", ")}`);
        }

        setReportData(data);
        addDebug(`📊 ReportData state set successfully`);
        const recordCount =
          data.summary?.totalRecords || data.data?.summary?.totalRecords || 0;
        addDebug(`✅ Report set with ${recordCount} records`);
        toast.success(`Report generated! Found ${recordCount} records.`);
      } else {
        throw new Error(response.message || "Failed to generate report");
      }
    } catch (err: any) {
      addDebug("❌ Error: " + err.message);
      const message = err.message || "Failed to generate report";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
      addDebug("✅ Loading finished");
    }
  };

  const handleReset = () => {
    setStartDate("");
    setEndDate("");
    setDepartment("");
    setProjectIds("");
    setUserIds("");
    setError(null);
  };

  const handleExport = async () => {
    console.log("📥 Export button clicked");
    setExporting(true);
    setError(null);

    try {
      const payload = buildPayload();
      console.log("📦 Export Payload:", payload);

      // Make raw fetch request to get blob properly
      const token = localStorage.getItem("authToken");
      const API_BASE_URL =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
      const response = await fetch(`${API_BASE_URL}/Report/export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      console.log("✅ Export Response Status:", response.status);
      console.log("📋 Content-Type:", response.headers.get("content-type"));

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      // Check content type
      const contentType = response.headers.get("content-type") || "";
      console.log("📄 Response Content Type:", contentType);

      // Get the blob from response
      const blob = await response.blob();
      console.log("📦 Blob size:", blob.size, "bytes");

      if (blob.size === 0) {
        throw new Error(
          "Exported file is empty. The backend may not support this format yet."
        );
      }

      // Check if backend returned JSON instead of the requested format
      if (contentType.includes("application/json")) {
        // Backend doesn't support this format, fallback to JSON
        console.warn("⚠️ Backend returned JSON instead of " + exportFormat);

        if (exportFormat !== ReportFormat.Json) {
          toast.warning(
            `${exportFormat} export not yet supported. Downloading as JSON instead.`,
            {
              autoClose: 5000,
            }
          );
        }

        // Download as JSON
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${selectedType}-${formatDate(
          new Date(),
          "yyyy-MM-dd-HHmmss"
        )}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast.info(
          `Report downloaded as JSON (${(blob.size / 1024).toFixed(2)} KB)`
        );
      } else {
        // Backend returned proper format
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;

        // Set filename based on format
        const extension =
          exportFormat === ReportFormat.Csv
            ? "csv"
            : exportFormat === ReportFormat.Excel
            ? "xlsx"
            : exportFormat === ReportFormat.Pdf
            ? "pdf"
            : "json";

        link.download = `${selectedType}-${formatDate(
          new Date(),
          "yyyy-MM-dd-HHmmss"
        )}.${extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast.success(
          `Report exported as ${exportFormat}! (${(blob.size / 1024).toFixed(
            2
          )} KB)`
        );
      }
    } catch (err: any) {
      console.error("❌ Export Error:", err);
      const message = err.message || "Failed to export report";
      setError(message);
      toast.error(message);
    } finally {
      setExporting(false);
    }
  };

  const activeFilters = [
    startDate,
    endDate,
    department,
    projectIds,
    userIds,
  ].filter(Boolean).length;

  // Debug: Log reportData on every render
  console.log("🔄 Component render - reportData:", reportData);
  console.log("🔄 Component render - reportData type:", typeof reportData);
  console.log(
    "🔄 Component render - reportData keys:",
    reportData ? Object.keys(reportData) : "null"
  );

  return (
    <div
      className={`min-h-screen px-4 py-6 ${
        darkMode ? "bg-zinc-900 text-gray-100" : "bg-gray-100 text-gray-900"
      }`}
    >
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <header>
          <h1 className="text-3xl font-bold">Reports & Insights</h1>
          <p className="mt-2 text-sm opacity-75">
            Generate real-time analytics from your project data
          </p>
        </header>

        {/* Error Banner */}
        {error && (
          <div
            className={`flex items-start gap-3 rounded-lg border p-4 ${
              darkMode
                ? "border-red-500/30 bg-red-500/10 text-red-100"
                : "border-red-300 bg-red-50 text-red-900"
            }`}
          >
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">Error</p>
              <p className="text-sm opacity-90">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-sm opacity-75 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        )}

        {/* Report Generation Form */}
        <div
          className={`rounded-lg border p-6 ${
            darkMode
              ? "border-zinc-700 bg-zinc-800"
              : "border-gray-200 bg-white"
          }`}
        >
          {/* Report Type Selection */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-semibold">
              Report Type
            </label>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {Object.values(ReportType).map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                    selectedType === type
                      ? "border-purple-500 bg-purple-500/20 text-purple-400"
                      : darkMode
                      ? "border-zinc-700 hover:border-purple-500/50"
                      : "border-gray-300 hover:border-purple-500/50"
                  }`}
                >
                  {type.replace(/([A-Z])/g, " $1").trim()}
                </button>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="grid gap-4 md:grid-cols-2">
            {showDates && (
              <>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Start Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={`w-full rounded-lg border px-3 py-2 text-sm ${
                      darkMode
                        ? "border-zinc-700 bg-zinc-900 text-gray-100"
                        : "border-gray-300 bg-white text-gray-900"
                    }`}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={`w-full rounded-lg border px-3 py-2 text-sm ${
                      darkMode
                        ? "border-zinc-700 bg-zinc-900 text-gray-100"
                        : "border-gray-300 bg-white text-gray-900"
                    }`}
                  />
                </div>
              </>
            )}

            {showDepartment && (
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Department (Optional)
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g., SDC, IT, HR"
                  className={`w-full rounded-lg border px-3 py-2 text-sm ${
                    darkMode
                      ? "border-zinc-700 bg-zinc-900 text-gray-100"
                      : "border-gray-300 bg-white text-gray-900"
                  }`}
                />
              </div>
            )}

            {showProjectIds && (
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Project IDs (Optional)
                </label>
                <input
                  type="text"
                  value={projectIds}
                  onChange={(e) => setProjectIds(e.target.value)}
                  placeholder="e.g., 1,2,3"
                  className={`w-full rounded-lg border px-3 py-2 text-sm ${
                    darkMode
                      ? "border-zinc-700 bg-zinc-900 text-gray-100"
                      : "border-gray-300 bg-white text-gray-900"
                  }`}
                />
              </div>
            )}

            {showUserIds && (
              <div>
                <label className="mb-1 block text-sm font-medium">
                  User IDs (Optional)
                </label>
                <input
                  type="text"
                  value={userIds}
                  onChange={(e) => setUserIds(e.target.value)}
                  placeholder="e.g., user1,user2"
                  className={`w-full rounded-lg border px-3 py-2 text-sm ${
                    darkMode
                      ? "border-zinc-700 bg-zinc-900 text-gray-100"
                      : "border-gray-300 bg-white text-gray-900"
                  }`}
                />
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium">
                Export Format
              </label>
              <select
                value={exportFormat}
                onChange={(e) =>
                  setExportFormat(e.target.value as ReportFormat)
                }
                className={`w-full rounded-lg border px-3 py-2 text-sm ${
                  darkMode
                    ? "border-zinc-700 bg-zinc-900 text-gray-100"
                    : "border-gray-300 bg-white text-gray-900"
                }`}
              >
                {Object.values(ReportFormat).map((fmt) => (
                  <option key={fmt} value={fmt}>
                    {fmt} {fmt === ReportFormat.Json && "✓ Supported"}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs opacity-60">
                Note: Currently only JSON export is fully supported.
                Excel/CSV/PDF will download as JSON.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold ${
                loading
                  ? "cursor-wait opacity-60"
                  : "bg-purple-600 text-white hover:bg-purple-700"
              }`}
            >
              <TrendingUp
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              {loading ? "Generating..." : "Generate Report"}
            </button>

            <button
              onClick={handleExport}
              disabled={exporting}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold ${
                exporting
                  ? "cursor-wait opacity-60"
                  : darkMode
                  ? "border border-zinc-600 bg-zinc-700 text-gray-100 hover:bg-zinc-600"
                  : "border border-gray-300 bg-gray-100 text-gray-900 hover:bg-gray-200"
              }`}
            >
              <Download
                className={`h-4 w-4 ${exporting ? "animate-pulse" : ""}`}
              />
              {exporting ? "Exporting..." : "Export Report"}
            </button>

            <button
              onClick={handleReset}
              disabled={activeFilters === 0}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold ${
                activeFilters === 0
                  ? "cursor-not-allowed opacity-40"
                  : darkMode
                  ? "border border-zinc-700 hover:bg-zinc-700"
                  : "border border-gray-300 hover:bg-gray-100"
              }`}
            >
              <RefreshCw className="h-4 w-4" />
              Reset {activeFilters > 0 && `(${activeFilters})`}
            </button>
          </div>
        </div>

        {/* Report Output */}
        {(() => {
          console.log("🔍 Checking reportData:", {
            reportData,
            hasData: !!reportData,
          });
          return reportData;
        })() && (
          <div
            className={`rounded-lg border p-6 ${
              darkMode
                ? "border-zinc-700 bg-zinc-800"
                : "border-gray-200 bg-white"
            }`}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Report Output</h2>
                <p className="text-xs opacity-75">
                  Generated{" "}
                  {formatDate(new Date(reportData.generatedAt), "PPpp")}
                  {reportData.generatedBy && ` by ${reportData.generatedBy}`}
                </p>
              </div>
              <div
                className={`rounded px-3 py-1 text-xs font-semibold ${
                  darkMode
                    ? "bg-purple-500/20 text-purple-300"
                    : "bg-purple-100 text-purple-700"
                }`}
              >
                {reportData.reportType?.replace(/([A-Z])/g, " $1").trim()}
              </div>
            </div>

            {/* Summary Stats */}
            {reportData.summary?.keyMetrics && (
              <div className="mb-6 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                {Object.entries(reportData.summary.keyMetrics).map(
                  ([key, value]: [string, any]) => (
                    <div
                      key={key}
                      className={`rounded-lg border p-4 ${
                        darkMode
                          ? "border-zinc-700 bg-zinc-900/40"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <p className="text-xs font-semibold uppercase opacity-70">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </p>
                      <p className="mt-2 text-2xl font-bold">
                        {typeof value === "number" ? value.toFixed(0) : value}
                      </p>
                    </div>
                  )
                )}
              </div>
            )}

            {/* Visual Charts */}
            <div className="mt-6">
              {(() => {
                console.log(
                  "🎨 About to call renderReportCharts with reportData:",
                  reportData
                );
                const result = renderReportCharts(reportData, darkMode);
                console.log("🎨 renderReportCharts returned:", result);
                return result;
              })()}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!reportData && !loading && (
          <div
            className={`rounded-lg border p-12 text-center ${
              darkMode
                ? "border-zinc-700 bg-zinc-800"
                : "border-gray-200 bg-white"
            }`}
          >
            <TrendingUp className="mx-auto h-12 w-12 opacity-50" />
            <p className="mt-4 text-sm opacity-75">
              No report generated yet. Configure filters and click "Generate
              Report".
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReportNew;

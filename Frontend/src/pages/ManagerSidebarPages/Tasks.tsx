import React, { useMemo, useState, useRef, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { tasks as allTasks } from "@/pages/MemberSidebarPages/MockData2";
import $ from "jquery";
import "datatables.net";

interface TasksProps {
  darkMode: boolean;
  setDarkMode: (darkMode: boolean) => void;
}

const roleToDisplayName: Record<string, string> = {
  president: "President Name",
  vice_president: "Vice President Name",
  director: "Mr. Getenet",
  manager: "Manager Name",
  supervisor: "Supervisor Name",
  teamLeader: "Team Leader Name",
};

const aboveRole: Record<string, string> = {
  manager: "director",
  supervisor: "manager",
  teamLeader: "manager",
  member: "supervisor",
};

const statusColor = (status: string, darkMode: boolean) => {
  switch (status) {
    case "in-progress":
      return darkMode ? "bg-yellow-900/30 text-yellow-400" : "bg-yellow-100 text-yellow-800";
    case "to-do":
      return darkMode ? "bg-zinc-700 text-zinc-300" : "bg-gray-100 text-gray-800";
    case "completed":
      return darkMode ? "bg-green-900/30 text-green-400" : "bg-green-100 text-green-800";
    default:
      return darkMode ? "bg-zinc-700 text-zinc-300" : "bg-gray-100 text-gray-800";
  }
};

const Tasks: React.FC<TasksProps> = ({ darkMode, setDarkMode }) => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const tableRef = useRef<HTMLTableElement>(null);
  const dataTableRef = useRef<any>(null);

  const aboveManagerRole = user?.role ? aboveRole[user.role] : undefined;
  const aboveManagerName = aboveManagerRole ? roleToDisplayName[aboveManagerRole] : undefined;

  const tasks = useMemo(() => {
    if (!aboveManagerName) return [];
    const s = search.toLowerCase();
    return allTasks.filter(
      (task) =>
        task.assignedBy === aboveManagerName &&
        (task.title.toLowerCase().includes(s) ||
          task.status.toLowerCase().includes(s) ||
          task.assignedBy.toLowerCase().includes(s))
    );
  }, [aboveManagerName, search]);

  useEffect(() => {
    if (tableRef.current) {
      if (dataTableRef.current) {
        dataTableRef.current.destroy();
        dataTableRef.current = null;
      }
      dataTableRef.current = $(tableRef.current).DataTable({
        destroy: true,
        retrieve: true,
        pageLength: 5,
        lengthMenu: [[5, 10, 25, 50, -1], [5, 10, 25, 50, "All"]],
        order: [[2, "asc"]],
        language: {
          paginate: {
            first: "First",
            previous: "Previous",
            next: "Next",
            last: "Last",
          },
          info: "Showing _START_ to _END_ of _TOTAL_ tasks",
          search: "",
          lengthMenu: "Show _MENU_ tasks",
        },
        dom: '<"flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 mt-2 ml-2"<"flex flex-col sm:flex-row items-start sm:items-center gap-2"l>>t<"flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-4 px-4 sm:px-6"<"text-sm text-gray-500"i><"flex items-center gap-2"p>>',
      });
    }
    return () => {
      if (dataTableRef.current) {
        dataTableRef.current.destroy();
        dataTableRef.current = null;
      }
    };
  }, [tasks, darkMode]);

  return (
    <Card className={`max-w-6xl mx-auto mt-4 shadow-lg ${darkMode ? "bg-zinc-900 border-zinc-800" : ""}`}>
      <CardHeader>
        <CardTitle className={`flex flex-col md:flex-row md:items-center md:justify-between gap-2 ${darkMode ? "text-zinc-100" : ""}`}>
          <span>Tasks Assigned</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row md:items-center md:justify-end gap-4 mb-4">
          <Input
            className={`max-w-lg w-full md:w-[32rem] ${
              darkMode ? "bg-zinc-800 border-zinc-700 text-zinc-100 focus:border-fuchsia-500 focus:ring-fuchsia-500" : ""
            }`}
            placeholder="Search by name, status, or assigned by..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {tasks.length === 0 ? (
          <div className={`text-center py-12 ${darkMode ? "text-zinc-400" : "text-gray-500"}`}>
            No tasks assigned by {aboveManagerName}.
          </div>
        ) : (
          <div className={`overflow-x-auto rounded-lg ${darkMode ? "border-zinc-700" : "border"}`}>
            <table
              ref={tableRef}
              className={`w-full text-left border-collapse display ${darkMode ? "text-zinc-200" : ""}`}
              style={{ width: "100%" }}
            >
              <thead className={darkMode ? "bg-zinc-800" : "bg-gray-50"}>
                <tr>
                  <th className={`py-3 px-4 border-b font-semibold ${darkMode ? "border-zinc-700 text-zinc-200" : ""}`}>
                    Task
                  </th>
                  <th className={`py-3 px-4 border-b font-semibold ${darkMode ? "border-zinc-700 text-zinc-200" : ""}`}>
                    Status
                  </th>
                  <th className={`py-3 px-4 border-b font-semibold ${darkMode ? "border-zinc-700 text-zinc-200" : ""}`}>
                    Due Date
                  </th>
                  <th className={`py-3 px-4 border-b font-semibold ${darkMode ? "border-zinc-700 text-zinc-200" : ""}`}>
                    Assigned By
                  </th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr
                    key={task.id}
                    className={`${darkMode ? "hover:bg-zinc-800 border-zinc-700" : "hover:bg-fuchsia-50"} transition`}
                  >
                    <td className={`py-2 px-4 border-b font-medium ${darkMode ? "border-zinc-700" : ""}`}>
                      {task.title}
                    </td>
                    <td className={`py-2 px-4 border-b ${darkMode ? "border-zinc-700" : ""}`}>
                      <Badge className={statusColor(task.status, darkMode)}>
                        {task.status.replace(/-/g, " ")}
                      </Badge>
                    </td>
                    <td className={`py-2 px-4 border-b ${darkMode ? "border-zinc-700" : ""}`}>{task.dueDate}</td>
                    <td className={`py-2 px-4 border-b ${darkMode ? "border-zinc-700" : ""}`}>{task.assignedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Tasks;
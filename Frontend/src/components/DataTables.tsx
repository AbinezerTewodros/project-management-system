import React, { useState, useMemo } from 'react';
import DataTable from 'react-data-table-component';
import { Search, X, Settings, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Props for the reusable DataTable
interface DataTablesProps {
  data: any[];
  columns?: any[];
  onRowClicked?: (row: any) => void;
  darkMode: boolean;
  loading?: boolean;
  pagination?: boolean;
  paginationPerPage?: number;
  paginationRowsPerPageOptions?: number[];
  customStyles?: any;
  selectableRows?: boolean;
  onSelectedRowsChange?: (selected: { selectedRows: any[] }) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  onSearch?: (searchTerm: string) => void;
  customizableColumns?: boolean;
  defaultVisibleColumns?: string[];
  onColumnsChange?: (columns: string[]) => void;
}

// NEW DEFAULT COLUMNS: Name, Assigned To, Due Date, Status, Priority, Type, Progress
export const getDefaultColumns = (darkMode: boolean) => [
  {
    name: "Name",
    selector: (row: any) => row.name || row.title,
    sortable: true,
    minWidth: "200px",
    cell: (row: any) => (
      <div>
        <div className="font-medium">{row.name || row.title}</div>
        {row.description && (
          <div className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            {row.description}
          </div>
        )}
      </div>
    ),
  },
  {
    name: "Assigned To",
    selector: (row: any) => row.assignedTo || row.assignee || "You",
    sortable: true,
    minWidth: "150px",
  },
  {
    name: "Due Date",
    selector: (row: any) => row.dueDate,
    sortable: true,
    minWidth: "120px",
    cell: (row: any) => (
      <div className="text-sm">
        {row.dueDate ? new Date(row.dueDate).toLocaleDateString() : "No due date"}
      </div>
    ),
  },
  {
    name: "Status",
    selector: (row: any) => row.status,
    sortable: true,
    minWidth: "130px",
    cell: (row: any) => (
      <span
        className={`px-2 py-1 text-xs rounded-full ${
          row.status === "Completed"
            ? darkMode
              ? "bg-green-900 text-green-300"
              : "bg-green-100 text-green-800"
            : row.status === "In Progress"
            ? darkMode
              ? "bg-purple-900 text-purple-300"
              : "bg-purple-100 text-purple-800"
            : row.status === "Active"
            ? darkMode
              ? "bg-blue-900 text-blue-300"
              : "bg-blue-100 text-blue-800"
            : row.status === "Pending Approval"
            ? darkMode
              ? "bg-orange-900 text-orange-300"
              : "bg-orange-100 text-orange-800"
            : row.status === "On Hold"
            ? darkMode
              ? "bg-yellow-900 text-yellow-300"
              : "bg-yellow-100 text-yellow-800"
            : row.status === "Not Started"
            ? darkMode
              ? "bg-gray-700 text-gray-300"
              : "bg-gray-100 text-gray-800"
            : darkMode
            ? "bg-gray-700 text-gray-300"
            : "bg-gray-100 text-gray-800"
        }`}
      >
        {row.status}
      </span>
    ),
  },
  {
    name: "Priority",
    selector: (row: any) => row.priority,
    sortable: true,
    minWidth: "100px",
    cell: (row: any) => (
      <span
        className={`px-2 py-1 rounded-full text-xs font-semibold ${
          row.priority === 'Critical'
            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            : row.priority === 'High'
            ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
            : row.priority === 'Medium'
            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
        }`}
      >
        {row.priority}
      </span>
    ),
  },
  {
    name: "Type",
    selector: (row: any) => row.type || "Project",
    sortable: true,
    minWidth: "120px",
    cell: (row: any) => (
      <span
        className={`px-2 py-1 text-xs rounded-full ${
          row.type === "Task"
            ? darkMode
              ? "bg-purple-900 text-purple-300"
              : "bg-purple-100 text-purple-800"
            : row.type === "Milestone"
            ? darkMode
              ? "bg-blue-900 text-blue-300"
              : "bg-blue-100 text-blue-800"
            : darkMode
            ? "bg-gray-700 text-gray-300"
            : "bg-gray-100 text-gray-800"
        }`}
      >
        {row.type || "Project"}
      </span>
    ),
  },
  {
    name: "Progress",
    selector: (row: any) => row.progress || 0,
    sortable: true,
    minWidth: "140px",
    cell: (row: any) => (
      <div className="flex items-center">
        <div
          className={`w-24 h-2 rounded-full ${darkMode ? "bg-gray-700" : "bg-gray-300"}`}
        >
          <div
            className={`h-full rounded-full ${
              (row.progress || 0) < 30
                ? "bg-red-500"
                : (row.progress || 0) < 70
                ? "bg-yellow-500"
                : "bg-green-500"
            }`}
            style={{ width: `${row.progress || 0}%` }}
          ></div>
        </div>
        <span className="ml-2 text-sm">{row.progress || 0}%</span>
      </div>
    ),
  },
];

// Custom column configurations for different use cases
export const columnConfigs = {
  // Default configuration uses the new default columns
  default: (darkMode: boolean) => getDefaultColumns(darkMode),
  
  // Dashboard specific configuration
  dashboard: (darkMode: boolean) => [
    {
      name: "Project Name",
      selector: (row: any) => row.title || row.projectName,
      sortable: true,
      minWidth: "200px",
      cell: (row: any) => (
        <div>
          <div className="font-medium">{row.title || row.projectName}</div>
          {row.description && (
            <div className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              {row.description}
            </div>
          )}
        </div>
      ),
    },
     {
      name: "Lead Time (days)",
      selector: (row: any) => row.leadTime,
      sortable: true,
      minWidth: "120px",
      cell: (row: any) => (
        <div className="text-sm">
          {typeof row.leadTime === 'number' ? `${row.leadTime} d` : '—'}
        </div>
      ),
    },
    {
      name: "Cycle Time (days)",
      selector: (row: any) => row.cycleTime,
      sortable: true,
      minWidth: "120px",
      cell: (row: any) => (
        <div className="text-sm">
          {typeof row.cycleTime === 'number' ? `${row.cycleTime} d` : '—'}
        </div>
      ),
    },
    {
      name: "Department",
      selector: (row: any) => row.department,
      sortable: true,
      minWidth: "150px",
    },
    {
      name: "Project Owner",
      selector: (row: any) => row.projectOwner || row.owner,
      sortable: true,
      minWidth: "150px",
    },
   
    {
      name: "Priority",
      selector: (row: any) => row.priority,
      sortable: true,
      minWidth: "100px",
      cell: (row: any) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold ${
            row.priority === 'Critical'
              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              : row.priority === 'High'
              ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
              : row.priority === 'Medium'
              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
              : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
          }`}
        >
          {row.priority}
        </span>
      ),
    },
    {
      name: "Status",
      selector: (row: any) => row.status,
      sortable: true,
      minWidth: "130px",
      cell: (row: any) => (
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            row.status === "Completed"
              ? darkMode
                ? "bg-green-900 text-green-300"
                : "bg-green-100 text-green-800"
              : row.status === "In Progress"
              ? darkMode
                ? "bg-purple-900 text-purple-300"
                : "bg-purple-100 text-purple-800"
              : row.status === "Active"
              ? darkMode
                ? "bg-blue-900 text-blue-300"
                : "bg-blue-100 text-blue-800"
              : row.status === "Pending Approval"
              ? darkMode
                ? "bg-orange-900 text-orange-300"
                : "bg-orange-100 text-orange-800"
              : row.status === "On Hold"
              ? darkMode
                ? "bg-yellow-900 text-yellow-300"
                : "bg-yellow-100 text-yellow-800"
              : row.status === "Not Started"
              ? darkMode
                ? "bg-gray-700 text-gray-300"
                : "bg-gray-100 text-gray-800"
              : darkMode
              ? "bg-gray-700 text-gray-300"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      name: "Due Date",
      selector: (row: any) => row.dueDate,
      sortable: true,
      minWidth: "120px",
      cell: (row: any) => (
        <div className="text-sm">
          {row.dueDate ? new Date(row.dueDate).toLocaleDateString() : "No due date"}
        </div>
      ),
    },
    {
      name: "Progress",
      selector: (row: any) => row.progress || 0,
      sortable: true,
      minWidth: "140px",
      cell: (row: any) => (
        <div className="flex items-center">
          <div
            className={`w-24 h-2 rounded-full ${darkMode ? "bg-gray-700" : "bg-gray-300"}`}
          >
            <div
              className={`h-full rounded-full ${
                (row.progress || 0) < 30
                  ? "bg-red-500"
                  : (row.progress || 0) < 70
                  ? "bg-yellow-500"
                  : "bg-green-500"
              }`}
              style={{ width: `${row.progress || 0}%` }}
            ></div>
          </div>
          <span className="ml-2 text-sm">{row.progress || 0}%</span>
        </div>
      ),
    },
  ],
  
  tasks: (darkMode: boolean) => [
    {
      name: "Task Name",
      selector: (row: any) => row.title,
      sortable: true,
      minWidth: "200px",
      cell: (row: any) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
            <span className="text-purple-600 dark:text-purple-400 font-semibold text-xs">
              T
            </span>
          </div>
          <div>
            <div className="font-semibold text-gray-900 dark:text-white text-sm">{row.title}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Task ID: {row.id}</div>
          </div>
        </div>
      ),
    },
    {
      name: "Assigned To",
      selector: (row: any) => row.assignedTo,
      sortable: true,
      minWidth: "150px",
    },
    {
      name: "Due Date",
      selector: (row: any) => row.dueDate,
      sortable: true,
      minWidth: "120px",
    },
    {
      name: "Status",
      selector: (row: any) => row.status,
      sortable: true,
      minWidth: "130px",
      cell: (row: any) => (
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            row.status === 'Completed'
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : row.status === 'In Progress'
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
              : row.status === 'To Do'
              ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      name: "Priority",
      selector: (row: any) => row.priority,
      sortable: true,
      minWidth: "100px",
      cell: (row: any) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold ${
            row.priority === 'Critical'
              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              : row.priority === 'High'
              ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
              : row.priority === 'Medium'
              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
              : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
          }`}
        >
          {row.priority}
        </span>
      ),
    },
    {
      name: "Type",
      selector: (row: any) => "Task",
      sortable: true,
      minWidth: "100px",
      cell: (row: any) => (
        <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
          Task
        </span>
      ),
    },
    {
      name: "Progress",
      selector: (row: any) => row.progress || 0,
      sortable: true,
      minWidth: "140px",
      cell: (row: any) => (
        <div className="flex items-center">
          <div
            className={`w-24 h-2 rounded-full ${darkMode ? "bg-gray-700" : "bg-gray-300"}`}
          >
            <div
              className={`h-full rounded-full ${
                (row.progress || 0) < 30
                  ? "bg-red-500"
                  : (row.progress || 0) < 70
                  ? "bg-yellow-500"
                  : "bg-green-500"
              }`}
              style={{ width: `${row.progress || 0}%` }}
            ></div>
          </div>
          <span className="ml-2 text-sm">{row.progress || 0}%</span>
        </div>
      ),
    },
  ],
  
  minimal: (darkMode: boolean) => [
    {
      name: "Name",
      selector: (row: any) => row.name || row.title,
      sortable: true,
      minWidth: "200px",
    },
    {
      name: "Description",
      selector: (row: any) => row.description,
      sortable: true,
    },
    {
      name: "Status",
      selector: (row: any) => row.status,
      sortable: true,
      minWidth: "120px",
    },
  ],
};

// Default custom styles
export const getDefaultStyles = (darkMode: boolean) => ({
  headCells: {
    style: {
      paddingLeft: "8px",
      paddingRight: "8px",
      backgroundColor: darkMode ? "#27272a" : "#e5e7eb",
      color: darkMode ? "#f3f4f6" : "#111827",
      fontWeight: "bold",
      fontSize: "0.75rem",
      textTransform: "uppercase" as const,
    },
  },
  cells: {
    style: {
      paddingLeft: "10px",
      paddingRight: "9px",
      color: darkMode ? "#e5e7eb" : "#111827",
    },
  },
  rows: {
    style: {
      minHeight: "72px",
      backgroundColor: darkMode ? "#1e1e1e" : "#ffffff",
    },
  },
});

const DataTables: React.FC<DataTablesProps> = ({
  data,
  columns,
  onRowClicked,
  darkMode,
  loading = false,
  pagination = true,
  paginationPerPage = 10,
  paginationRowsPerPageOptions = [5, 10, 15, 20],
  customStyles,
  selectableRows = false,
  onSelectedRowsChange,
  searchable = false,
  searchPlaceholder = "Search",
  onSearch,
  customizableColumns = false,
  defaultVisibleColumns,
  onColumnsChange,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showColumnSettings, setShowColumnSettings] = useState(false);

  // Get all available columns
  const allColumns = columns || getDefaultColumns(darkMode);
  
  // Initialize visible columns
  const [visibleColumns, setVisibleColumns] = useState(() => {
    if (defaultVisibleColumns) {
      return defaultVisibleColumns;
    }
    // Default to all columns visible
    return allColumns.map(col => col.name as string);
  });

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchable || !searchTerm.trim()) {
      return data;
    }

    const lowercasedSearch = searchTerm.toLowerCase();
    return data.filter(item => {
      return Object.keys(item).some(key => {
        const value = item[key];
        if (typeof value === 'string') {
          return value.toLowerCase().includes(lowercasedSearch);
        }
        if (value && typeof value === 'object') {
          return JSON.stringify(value).toLowerCase().includes(lowercasedSearch);
        }
        return String(value).toLowerCase().includes(lowercasedSearch);
      });
    });
  }, [data, searchTerm, searchable]);

  // Filter columns based on visibility
  const filteredColumns = useMemo(() => {
    return allColumns.filter(col => visibleColumns.includes(col.name as string));
  }, [allColumns, visibleColumns]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (onSearch) {
      onSearch(value);
    }
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
    if (onSearch) {
      onSearch('');
    }
  };

  // Toggle column visibility
  const toggleColumnVisibility = (columnName: string) => {
    const newVisibleColumns = visibleColumns.includes(columnName)
      ? visibleColumns.filter(col => col !== columnName)
      : [...visibleColumns, columnName];
    
    setVisibleColumns(newVisibleColumns);
    
    if (onColumnsChange) {
      onColumnsChange(newVisibleColumns);
    }
  };

  // Reset all columns to visible
  const resetColumns = () => {
    const allColumnNames = allColumns.map(col => col.name as string);
    setVisibleColumns(allColumnNames);
    
    if (onColumnsChange) {
      onColumnsChange(allColumnNames);
    }
  };

  // Use provided custom styles or default styles
  const tableStyles = customStyles || getDefaultStyles(darkMode);

  return (
    <div className="w-full">
      {/* Header with Search and Column Controls */}
      {(searchable || customizableColumns) && (
        <div className={`p-4 border-b ${
          darkMode ? "border-zinc-700 bg-zinc-800" : "border-gray-200 bg-gray-50"
        }`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            {/* Search Bar */}
            {searchable && (
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  } w-4 h-4`} />
                  <input
                    type="text"
                    placeholder={searchPlaceholder}
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none  ${
                      darkMode
                        ? "bg-zinc-700 border-zinc-600 text-white placeholder-gray-400"
                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                    }`}
                  />
                  {searchTerm && (
                    <button
                      onClick={clearSearch}
                      className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                        darkMode ? "text-gray-400 hover:text-gray-300" : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                {/* Search Results Info */}
                {searchTerm && (
                  <div className={`mt-2 text-sm ${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  }`}>
                    Showing {filteredData.length} of {data.length} results
                    {searchTerm && (
                      <span> for "<strong>{searchTerm}</strong>"</span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Column Settings */}
            {customizableColumns && (
              <div className="flex-shrink-0">
                <DropdownMenu open={showColumnSettings} >
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowColumnSettings(!showColumnSettings)}
                      className={`
                        ${darkMode 
                          ? "bg-zinc-700 hover:bg-zinc-600 text-white border-zinc-600" 
                          : "bg-white hover:bg-gray-100 text-gray-700 border-gray-300"
                        } transition-all duration-200
                      `}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Columns
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    className={`
                      w-56 ${darkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'}
                    `}
                    align="end"
                    onInteractOutside={() => {
                      setShowColumnSettings(false);
                     }}
                  >
                    <div className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-zinc-700">
                      <span className={darkMode ? "text-white" : "text-gray-900"}>Show Columns</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={resetColumns}
                        className="text-xs h-6 px-2"
                      >
                        Reset
                      </Button>
                    </div>
                    {allColumns.map((column) => (
                      <DropdownMenuCheckboxItem
                        key={column.name as string}
                        checked={visibleColumns.includes(column.name as string)}
                        onCheckedChange={() => toggleColumnVisibility(column.name as string)}
                        className={darkMode ? "text-white" : "text-gray-900"}
                      >
                        {visibleColumns.includes(column.name as string) ? 
                          <Eye className="h-4 w-4 mr-2" /> : 
                          <EyeOff className="h-4 w-4 mr-2" />
                        }
                        {column.name as string}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Data Table */}
      <DataTable
        columns={filteredColumns}
        data={onSearch ? data : filteredData}
        pagination={pagination}
        paginationPerPage={paginationPerPage}
        paginationRowsPerPageOptions={paginationRowsPerPageOptions}
        customStyles={tableStyles}
        onRowClicked={onRowClicked}
        highlightOnHover
        pointerOnHover
        progressPending={loading}
        selectableRows={selectableRows}
        onSelectedRowsChange={onSelectedRowsChange}
        noDataComponent={
          <div className="text-center py-8">
            {searchTerm ? (
              <div>
                <p className="text-gray-500 dark:text-gray-400 mb-2">
                  No results found for "<strong>{searchTerm}</strong>"
                </p>
                <button
                  onClick={clearSearch}
                  className={`px-3 py-1 text-sm rounded ${
                    darkMode
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-blue-500 hover:bg-blue-600 text-white"
                  }`}
                >
                  Clear Search
                </button>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No data available</p>
            )}
          </div>
        }
      />
    </div>
  );
};

export default DataTables;
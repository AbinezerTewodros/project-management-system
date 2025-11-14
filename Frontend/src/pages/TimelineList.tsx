import React from 'react';
import { useNavigate } from 'react-router-dom';
import DataTables, { columnConfigs } from '@/components/DataTables';
import { projectService } from '@/services/projectService';

type Priority = 'p1' | 'p2' | 'p3';

const TimelineList: React.FC<{ darkMode?: boolean }> = ({ darkMode = false }) => {
  const [priorityFilter, setPriorityFilter] = React.useState<Priority>('p1');
  const [rows, setRows] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔄 TimelineList: Fetching projects...');
        
        // Fetch all projects directly from the backend
        const projectsResponse = await projectService.getAllProjects();
        
        console.log('📦 TimelineList: Raw response:', projectsResponse);
        console.log('✅ TimelineList: Response success:', projectsResponse.success);
        console.log('📊 TimelineList: Response data:', projectsResponse.data);
        
        if (!projectsResponse.success || !projectsResponse.data) {
          console.warn('⚠️ TimelineList: No data or unsuccessful response');
          if (mounted) {
            setRows([]);
            setError('Failed to load projects. Please ensure the backend is running.');
          }
          return;
        }

        // Handle response - could be array directly or wrapped in an object
        let projects = projectsResponse.data as any;
        
        // If data is wrapped (e.g., {data: [...], success: true}), unwrap it
        if (projects && typeof projects === 'object' && !Array.isArray(projects)) {
          if (Array.isArray(projects.data)) {
            console.log('📦 TimelineList: Unwrapping nested data array');
            projects = projects.data;
          } else if (projects.items && Array.isArray(projects.items)) {
            console.log('📦 TimelineList: Using paginated items');
            projects = projects.items;
          }
        }
        
        // Ensure projects is an array
        if (!Array.isArray(projects)) {
          console.error('❌ TimelineList: Projects is not an array:', typeof projects, projects);
          if (mounted) {
            setRows([]);
            setError('Invalid data format received from server.');
          }
          return;
        }
        
        console.log('📋 TimelineList: Processing', projects.length, 'projects');
        
        if (projects.length === 0) {
          console.log('⚠️ TimelineList: No projects found in response');
          if (mounted) {
            setRows([]);
            setError('No projects found. Create a project to see it in the timeline.');
          }
          return;
        }
        
        console.log('📋 TimelineList: First project sample:', projects[0]);

        // Map projects to table rows
        const rowsComputed = projects.map((project: any) => {
          // Handle both camelCase and PascalCase field names
          const projectId = project.id || project.Id;
          const projectName = project.projectName || project.ProjectName || 
                             project.title || project.Title || 
                             `Project ${projectId}`;
          const priority = project.priority || project.Priority || 'Medium';
          const status = project.status || project.Status || 'Active';
          const department = project.department || project.Department || 'General';
          const owner = project.projectOwner || project.ProjectOwner || 
                       project.createUser || project.CreateUser || 
                       project.createdByUserId || project.CreatedByUserId || 
                       project.createdBy || project.CreatedBy || '';
          const dueDate = project.dueDate || project.DueDate;
          const startDate = project.startDate || project.StartDate;
          const progress = project.progress || project.Progress || 0;

          // Map priority to Priority type for filtering
          let priorityValue: Priority = 'p2';
          if (priority === 'High' || priority === 'Critical') priorityValue = 'p1';
          else if (priority === 'Medium') priorityValue = 'p2';
          else if (priority === 'Low') priorityValue = 'p3';

          return {
            id: String(projectId),
            title: projectName,
            projectName: projectName,
            department: department,
            projectOwner: owner,
            owner: owner,
            priority: priority,
            priorityValue: priorityValue,
            status: status,
            dueDate: dueDate,
            startDate: startDate,
            progress: progress,
          };
        });

        console.log('✅ TimelineList: Computed', rowsComputed.length, 'rows');
        console.log('📊 TimelineList: First row sample:', rowsComputed[0]);
        
        if (mounted) {
          setRows(rowsComputed);
        }
      } catch (e: any) {
        console.error('❌ TimelineList: Error loading projects:', e);
        console.error('❌ TimelineList: Error stack:', e.stack);
        if (mounted) {
          setRows([]);
          setError(e?.message || 'Failed to load projects. Please ensure the backend is running.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const columns = columnConfigs.dashboard(!!darkMode);

  return (
    <div className={`min-h-screen p-8 ${darkMode ? 'bg-zinc-900 text-gray-100' : 'bg-white text-gray-900'}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: darkMode ? '#f3f4f6' : '#2c0340' }}>Project Timelines</h1>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Select a project to view its timeline
            {rows.length > 0 && ` • ${rows.length} project${rows.length !== 1 ? 's' : ''} loaded`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className={`text-sm mr-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} htmlFor="priority-select">Filter:</label>
          <select
            id="priority-select"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as Priority)}
            className={`px-3 py-1 rounded-md border focus:outline-none  transition text-sm ${darkMode ? 'bg-zinc-700 border-zinc-600 text-gray-100 focus:ring-zinc-500' : 'bg-white border-gray-200 text-gray-800 focus:ring-violet-200'}`}
            style={priorityFilter ? (priorityFilter === 'p1' ? { background: '#581c87', color: '#ffffff' } : undefined) : undefined}
          >
            <option value="p1">P1 - Critical</option>
            <option value="p2">P2 - High</option>
            <option value="p3">P3 - Medium</option>
          </select>
        </div>
      </div>

      {error && (
        <div className={`mb-4 p-4 rounded-md ${darkMode ? 'bg-yellow-900/20 border border-yellow-700' : 'bg-yellow-50 border border-yellow-200'}`}>
          <p className={`text-sm ${darkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>{error}</p>
          <p className={`text-xs mt-2 ${darkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
            💡 Tip: Open browser console (F12) to see detailed debug information.
          </p>
        </div>
      )}
      
      {!loading && !error && rows.length === 0 && (
        <div className={`mb-4 p-4 rounded-md ${darkMode ? 'bg-blue-900/20 border border-blue-700' : 'bg-blue-50 border border-blue-200'}`}>
          <p className={`text-sm ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>
            No projects available yet. Projects created in the dashboard will appear here.
          </p>
        </div>
      )}
      
      <div className="rounded-lg shadow-sm overflow-hidden">
        {(() => {
          const filteredRows = rows.filter((p) => {
            // Filter by priority
            const priorityVal = p.priorityValue || 'p2';
            return priorityVal === priorityFilter;
          });
          
          return (
            <>
              {rows.length > 0 && filteredRows.length === 0 && (
                <div className={`mb-4 p-4 rounded-md ${darkMode ? 'bg-purple-900/20 border border-purple-700' : 'bg-purple-50 border border-purple-200'}`}>
                  <p className={`text-sm ${darkMode ? 'text-purple-200' : 'text-purple-800'}`}>
                    No projects match the current filter. Try selecting a different priority level.
                  </p>
                  <p className={`text-xs mt-1 ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>
                    Total projects available: {rows.length}
                  </p>
                </div>
              )}
              
              <DataTables
                data={filteredRows}
                columns={columns}
                darkMode={!!darkMode}
                searchable
                pagination
                customizableColumns
                defaultVisibleColumns={columns.map((c:any) => c.name)}
                loading={loading}
                onRowClicked={(row: any) => {
                  const id = row.id || row.projectId;
                  const name = row.title || row.projectName || row.name || '';
                  if (!id) return;
                  navigate(`/timeline/${encodeURIComponent(String(id))}${name ? `?name=${encodeURIComponent(name)}` : ''}`);
                }}
              />
            </>
          );
        })()}
      </div>
    </div>
  );
};

export default TimelineList;

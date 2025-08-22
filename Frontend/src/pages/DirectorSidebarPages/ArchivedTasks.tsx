import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Archive, Search, Trash2,  } from 'lucide-react';
import $ from 'jquery';
import 'datatables.net';
import 'datatables.net-dt/css/dataTables.dataTables.css';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface ArchivedTask {
    id: string;
    name: string;
    project: string;
    archivedDate: string;
    archivedBy: string;
    status: 'archived' | 'deleted';
}

const ArchivedTasks = ({ darkMode }: { darkMode: boolean }) => {
    const [tasks, setTasks] = useState<ArchivedTask[]>([
        { id: 'task001', name: 'Finalize quarterly report', project: 'Financial Audits', archivedDate: '2023-05-10', archivedBy: 'Abebe B.', status: 'archived' },
        { id: 'task002', name: 'Deploy security patch 1.2', project: 'System Maintenance', archivedDate: '2023-06-15', archivedBy: 'Tirunesh D.', status: 'archived' },
        { id: 'task003', name: 'User acceptance testing for login module', project: 'Mobile App V2', archivedDate: '2023-07-20', archivedBy: 'Abebe B.', status: 'archived' },
        { id: 'task004', name: 'Onboard new marketing team members', project: 'Internal Training', archivedDate: '2023-08-01', archivedBy: 'Haile G.', status: 'archived' },
        { id: 'task005', name: 'Design promotional materials for Q4', project: 'Marketing Campaign', archivedDate: '2023-09-22', archivedBy: 'Tirunesh D.', status: 'archived' },
    ]);
    
    const [selectedTask, setSelectedTask] = useState<ArchivedTask | null>(null);
    const tableRef = useRef<HTMLTableElement>(null);
    const dataTableRef = useRef<any>(null);

    useEffect(() => {
        if (tableRef.current) {
            dataTableRef.current = $(tableRef.current).DataTable({
                data: tasks,
                columns: [
                    { 
                        data: 'name', 
                        title: 'Task Name',
                        render: (data: string, type: string, row: ArchivedTask) => {
                            if (type === 'display') {
                                return `<div class="flex items-center gap-2">
                                    <span>${data}</span>
                                    ${row.status === 'deleted' ? 
                                        '<span class="px-2 py-1 text-xs rounded bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Deleted</span>' : 
                                        '<span class="px-2 py-1 text-xs rounded bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">Archived</span>'
                                    }
                                </div>`;
                            }
                            return data;
                        }
                    },
                    { data: 'project', title: 'Project' },
                    { 
                        data: 'archivedDate', 
                        title: 'Archived Date',
                        render: (data: string) => new Date(data).toLocaleDateString()
                    },
                    { data: 'archivedBy', title: 'Archived By' },
                    {
                        title: 'Actions',
                        orderable: false,
                        render: function(data: never, type: string, row: ArchivedTask){
                            if (type === 'display') {
                                return `<div class="flex gap-2">
                                    <button class="restore-btn px-2 py-1 text-sm rounded text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30" data-id="${row.id}">
                                        <i class="fas fa-undo-alt mr-1"></i> Restore
                                    </button>
                                    <button class="delete-btn px-2 py-1 text-sm rounded text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30" data-id="${row.id}">
                                        <i class="fas fa-trash-alt mr-1"></i> Delete
                                    </button>
                                </div>`;
                            }
                            return '';
                        }
                    }
                ],
                destroy: true,
                pageLength: 10,
                searching: true,
                dom: '<"flex flex-col md:flex-row md:items-center justify-between mb-4"f<"ml-0 md:ml-2">>rt<"flex flex-col md:flex-row justify-between items-center mt-4"ip>',
                language: {
                    search: "",
                    searchPlaceholder: "Search tasks...",
                    lengthMenu: "Show _MENU_ tasks per page",
                    info: "Showing _START_ to _END_ of _TOTAL_ tasks",
                    infoEmpty: "No tasks found",
                    paginate: {
                        first: "First",
                        last: "Last",
                        next: "Next",
                        previous: "Previous"
                    }
                },
                initComplete: function() {
                    // Add custom classes to DataTable elements
                    $('.dataTables_filter input').addClass(
                        `${darkMode ? 'bg-zinc-700 border-zinc-600 text-gray-300 focus:border-blue-500' : 'bg-white border-gray-300'} ` +
                        'border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500'
                    );
                    $('.dataTables_length select').addClass(
                        `${darkMode ? 'bg-zinc-700 border-zinc-600 text-gray-300' : 'bg-white border-gray-300'} ` +
                        'border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500'
                    );
                }
            });

            // Add event listeners for custom buttons
            $(tableRef.current).on('click', '.restore-btn', function() {
                const taskId = $(this).data('id');
                handleRestore(taskId);
            });

            $(tableRef.current).on('click', '.delete-btn', function() {
                const taskId = $(this).data('id');
                setSelectedTask(tasks.find(task => task.id === taskId) || null);
                ($('.delete-modal') as any).modal('show');
            });
        }

        return () => {
            if (dataTableRef.current) {
                dataTableRef.current.destroy();
            }
        };
    }, [tasks, darkMode]);

    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (dataTableRef.current) {
            dataTableRef.current.search(event.target.value).draw();
        }
    };

    const handleRestore = (taskId: string) => {
        setTasks(tasks.filter(task => task.id !== taskId));
        // In a real app, you would call an API to restore the task
    };

    const handleDelete = () => {
        if (selectedTask) {
            setTasks(tasks.map(task => 
                task.id === selectedTask.id ? { ...task, status: 'deleted' } : task
            ));
            ($('.delete-modal') as any).modal('hide');
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className={`p-6 ${darkMode ? 'dark' : ''}`}>
            <Card className={darkMode ? 'bg-zinc-900 border-zinc-800' : ''}>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <CardTitle className={`flex items-center ${darkMode ? 'text-gray-300' : ''}`}>
                            <Archive className="mr-2 h-5 w-5" />
                            <span>Archived Tasks</span>
                            <Badge variant="outline" className="ml-2">
                                {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
                            </Badge>
                        </CardTitle>
                        <div className="relative w-full md:w-1/3">
                            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                            <Input
                                placeholder="Search archived tasks..."
                                onChange={handleSearch}
                                className={`pl-10 ${darkMode ? 'bg-zinc-800 border-zinc-700 text-gray-300' : ''}`}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <table 
                        ref={tableRef} 
                        className={`display w-full ${darkMode ? 'dark-table' : ''}`}
                    ></table>
                </CardContent>
            </Card>

            {/* Delete Confirmation Modal */}
            <div className={`modal fade delete-modal ${darkMode ? 'dark' : ''}`} tabIndex={-1}>
                <div className="modal-dialog">
                    <div className={`modal-content ${darkMode ? 'bg-zinc-800 border-zinc-700' : ''}`}>
                        <div className={`modal-header ${darkMode ? 'border-zinc-700' : ''}`}>
                            <h5 className={`modal-title ${darkMode ? 'text-gray-300' : ''}`}>
                                <Trash2 className="inline mr-2 h-5 w-5 text-red-500" />
                                Confirm Deletion
                            </h5>
                            <button 
                                type="button" 
                                className={`close ${darkMode ? 'text-gray-400' : ''}`} 
                                data-dismiss="modal"
                            >
                                &times;
                            </button>
                        </div>
                        <div className={`modal-body ${darkMode ? 'text-gray-300' : ''}`}>
                            {selectedTask && (
                                <>
                                    <p>Are you sure you want to permanently delete this task?</p>
                                    <div className={`mt-4 p-3 rounded ${darkMode ? 'bg-zinc-700' : 'bg-gray-100'}`}>
                                        <h6 className="font-medium">{selectedTask.name}</h6>
                                        <p className="text-sm opacity-80">Project: {selectedTask.project}</p>
                                        <p className="text-sm opacity-80">Archived on: {formatDate(selectedTask.archivedDate)}</p>
                                    </div>
                                    <p className="mt-3 text-sm text-red-500 dark:text-red-400">
                                        Warning: This action cannot be undone.
                                    </p>
                                </>
                            )}
                        </div>
                        <div className={`modal-footer ${darkMode ? 'border-zinc-700' : ''}`}>
                            <button 
                                type="button" 
                                className={`px-4 py-2 rounded ${darkMode ? 'bg-zinc-700 hover:bg-zinc-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300'}`}
                                data-dismiss="modal"
                            >
                                Cancel
                            </button>
                            <button 
                                type="button" 
                                className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white"
                                onClick={handleDelete}
                            >
                                <Trash2 className="inline mr-2 h-4 w-4" />
                                Delete Permanently
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Empty State */}
            {tasks.length === 0 && (
                <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <Archive className="mx-auto h-12 w-12 opacity-40" />
                    <h3 className="mt-2 text-lg font-medium">No archived tasks</h3>
                    <p className="mt-1">Tasks you archive will appear here</p>
                </div>
            )}
        </div>
    );
};

export default ArchivedTasks;
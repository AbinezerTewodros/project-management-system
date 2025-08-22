import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Archive, Search } from 'lucide-react';
import $ from 'jquery';
import 'datatables.net';
import 'datatables.net-dt/css/dataTables.dataTables.css';
import { Input } from '@/components/ui/input';

interface ArchivedTasksProps {
  darkMode: boolean;
}

const mockArchivedTasks = [
    { id: 'task001', name: 'Finalize quarterly report', project: 'Financial Audits', archivedDate: '2023-05-10', archivedBy: 'Abebe B.' },
    { id: 'task002', name: 'Deploy security patch 1.2', project: 'System Maintenance', archivedDate: '2023-06-15', archivedBy: 'Tirunesh D.' },
    { id: 'task003', name: 'User acceptance testing for login module', project: 'Mobile App V2', archivedDate: '2023-07-20', archivedBy: 'Abebe B.' },
    { id: 'task004', name: 'Onboard new marketing team members', project: 'Internal Training', archivedDate: '2023-08-01', archivedBy: 'Haile G.' },
    { id: 'task005', name: 'Design promotional materials for Q4', project: 'Marketing Campaign', archivedDate: '2023-09-22', archivedBy: 'Tirunesh D.' },
];

const ArchivedTasks: React.FC<ArchivedTasksProps> = ({ darkMode }) => {
    const tableRef = useRef<HTMLTableElement>(null);
    const dataTableRef = useRef<any>(null);

    useEffect(() => {
        if (tableRef.current) {
            // Customize DataTables for dark mode
            if (darkMode) {
                $.fn.dataTable.ext.classes.sPageButton = 'paginate_button border border-zinc-600 bg-zinc-700 text-zinc-200 mx-1 rounded hover:bg-zinc-600';
                $.fn.dataTable.ext.classes.sPageButtonActive = 'paginate_button active border border-blue-500 bg-blue-600 text-white mx-1 rounded hover:bg-blue-600';
                $.fn.dataTable.ext.classes.sPageButtonDisabled = 'paginate_button disabled border border-zinc-600 bg-zinc-800 text-zinc-500 mx-1 rounded';
            }

            dataTableRef.current = $(tableRef.current).DataTable({
                data: mockArchivedTasks,
                columns: [
                    { data: 'name', title: 'Task Name' },
                    { data: 'project', title: 'Project' },
                    { data: 'archivedDate', title: 'Archived Date' },
                    { data: 'archivedBy', title: 'Archived By' },
                ],
                destroy: true,
                pageLength: 10,
                searching: true,
                dom: 'rt<"flex justify-between items-center mt-4"ip>',
                language: {
                    info: darkMode ? 
                        '<span class="text-zinc-300">Showing _START_ to _END_ of _TOTAL_ entries</span>' : 
                        'Showing _START_ to _END_ of _TOTAL_ entries',
                    infoEmpty: darkMode ? 
                        '<span class="text-zinc-300">No entries found</span>' : 
                        'No entries found',
                    infoFiltered: darkMode ? 
                        '<span class="text-zinc-300">(filtered from _MAX_ total entries)</span>' : 
                        '(filtered from _MAX_ total entries)',
                    lengthMenu: darkMode ? 
                        '<span class="text-zinc-300">Show _MENU_ entries</span>' : 
                        'Show _MENU_ entries',
                    paginate: {
                        first: darkMode ? '<span class="text-zinc-300">First</span>' : 'First',
                        previous: darkMode ? '<span class="text-zinc-300">Previous</span>' : 'Previous',
                        next: darkMode ? '<span class="text-zinc-300">Next</span>' : 'Next',
                        last: darkMode ? '<span class="text-zinc-300">Last</span>' : 'Last'
                    }
                },
                initComplete: function() {
                    // Apply dark mode to search input
                    if (darkMode) {
                        $('.dataTables_filter input')
                            .addClass('bg-zinc-700 border-zinc-600 text-zinc-200 placeholder-zinc-400')
                            .attr('placeholder', 'Search...');
                    }
                }
            });

            // Apply dark mode to table
            if (darkMode) {
                $(tableRef.current).addClass('bg-zinc-800 text-zinc-200');
                $('.dataTables_wrapper').addClass('text-zinc-200');
                $('thead th').addClass('bg-zinc-700 border-zinc-600');
                $('tbody tr').addClass('border-zinc-700 hover:bg-zinc-700/50');
            }
        }

        return () => {
            if (dataTableRef.current) {
                dataTableRef.current.destroy();
            }
        };
    }, [darkMode]);

    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (dataTableRef.current) {
            dataTableRef.current.search(event.target.value).draw();
        }
    };

    return (
        <div className="p-6">
            <Card className={darkMode ? "bg-zinc-900 border-zinc-800" : ""}>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className={`flex items-center ${darkMode ? "text-zinc-100" : ""}`}>
                            <Archive className="mr-2" />
                            Archived Tasks
                        </CardTitle>
                        <div className="relative w-1/3">
                            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? "text-zinc-400" : "text-gray-400"}`} />
                            <Input
                                placeholder="Search archived tasks..."
                                onChange={handleSearch}
                                className={`pl-10 ${darkMode ? "bg-zinc-800 border-zinc-700 text-zinc-200 placeholder-zinc-400" : ""}`}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <table 
                        ref={tableRef} 
                        className={`display w-full ${darkMode ? "text-zinc-200" : ""}`}
                    ></table>
                </CardContent>
            </Card>
        </div>
    );
};

export default ArchivedTasks;
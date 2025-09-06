//import { Card } from '@/components/ui/card';
import { useState } from 'react'; // useRef
import { usePDF } from 'react-to-pdf'

type TeamMember = {
  name: string;
  assignedTo: number;
  completed: number;
  inProgress: number;
};

type ProjectStatus = {
  inProgress: number;
  completed: number;
  overdue: number;
  todo: number;
};

type WeeklyData = {
  tasksCreated: number;
  tasksCompleted: number;
  tasksInProgress: number;
  teamMembers: TeamMember[];
  projects: ProjectStatus;
  taskTrend: number[];
};
type WeekKey = -1 | 0;

const Report = ({ darkMode }: { darkMode: boolean }) => {
  const [notes, setNotes] = useState('Add notes...');
  const [selectedWeek, setSelectedWeek] = useState<WeekKey>(0); // 0 = current week
  const { toPDF, targetRef } = usePDF({
    filename: `weekly-report-${getWeekDates(selectedWeek).label}.pdf`,
    page: { margin: 20 }
  });

  const weeklyData: Record<WeekKey, WeeklyData> = {
    [-1]: {
      tasksCreated: 5,
      tasksCompleted: 2,
      tasksInProgress: 3,
      teamMembers: [
        { name: "kalkidan", assignedTo: 2, completed: 2, inProgress: 0 },
        { name: "Mahlet", assignedTo: 2, completed: 0, inProgress: 2 },
        { name: "kalkidan", assignedTo: 1, completed: 0, inProgress: 1 },
      ],
      projects: {
        inProgress: 2,
        completed: 6,
        overdue: 0,
        todo: 5,
      },
      taskTrend: [5, 3, 1, 0, 2, 4, 1]

    },
    [0]: {
      tasksCreated: 4,
      tasksCompleted: 2,
      tasksInProgress: 2,
      teamMembers: [
        { name: "kalkidan", assignedTo: 2, completed: 1, inProgress: 1 },
        { name: "Mahlet", assignedTo: 1, completed: 1, inProgress: 0 },
        { name: "Dehine", assignedTo: 1, completed: 0, inProgress: 1 },
      ],
      projects: {
        inProgress: 3,
        completed: 5,
        overdue: 1,
        todo: 4,
      },
      taskTrend: [10, 8, 6, 4, 7, 9, 5]
    },


  };
  const currentData = weeklyData[selectedWeek];
  const weekDates = getWeekDates(selectedWeek);
  return (
    <div className={`p-6 ${darkMode ? "bg-zinc-800 text-gray-300" : "bg-white text-gray-700"}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold"> Weekly Report</h1>
          <WeekSelector
            selectedWeek={selectedWeek}
            onChange={(week) => setSelectedWeek(week as WeekKey)}
            darkMode={darkMode}
          />
        </div>

        <button className={`px-4 py-2 rounded-lg flex items-center gap-2 transition ${darkMode ? "bg-gray-500 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"}`}
          onClick={() => toPDF()}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          Export PDF
        </button>
      </div>

      <div className="mb-6 text-lg font-medium">
        {weekDates.label} ({weekDates.start} - {weekDates.end})
      </div>

      {/* PDF Content */}
      <div ref={targetRef} className="print:bg-white print:text-black">
        {/* Stats Cards */}
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 print:grid-cols-3 `}>
          <StatCard
            title="Tasks Created"
            value={currentData.tasksCreated}
            darkMode={darkMode}
            borderColor="blue"

          />
          <StatCard
            title="Tasks Completed"
            value={currentData.tasksCompleted}
            darkMode={darkMode}
            borderColor="green"
          />
          <StatCard
            title="Tasks in Progress"
            value={currentData.tasksInProgress}
            darkMode={darkMode}
            borderColor="yellow"
          />
        </div>

        {/* Team Members Table */}
        <TeamTable
          members={currentData.teamMembers}
          darkMode={darkMode}
        />

        {/* Projects Status */}
        <ProjectsStatus
          data={currentData.projects}
          darkMode={darkMode}
        />

        {/* Task Trend Chart */}
        <TaskTrendChart
          data={currentData.taskTrend}
          darkMode={darkMode}
        />

        {/* Notes Section */}
        <NotesSection
          notes={notes}
          setNotes={setNotes}
          darkMode={darkMode}
        />

        {/* PDF Footer */}
        <div className="hidden print:block mt-8 pt-4 border-t text-sm text-gray-500 print:text-gray-700">
          Report generated on {new Date().toLocaleDateString()} | {weekDates.label} ({weekDates.start} - {weekDates.end})
        </div>
      </div>
    </div>
  );
};

// Helper function to get week dates
function getWeekDates(weekOffset: number) {
  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday
  const currentDate = now.getDate();

  // Calculate start of week (Sunday)
  const startDate = new Date(now);
  startDate.setDate(currentDate - currentDay + (weekOffset * 7));

  // Calculate end of week (Saturday)
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);

  const formatDate = (date: Date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return {
    start: formatDate(startDate),
    end: formatDate(endDate),
    label: weekOffset === 0
      ? "Current Week"
      : weekOffset === -1
        ? "Last Week"
        : weekOffset === 1
          ? "Next Week"
          : `Week of ${formatDate(startDate)}`
  };
}

// Week Selector Component
const WeekSelector = ({
  selectedWeek,
  onChange,
  darkMode
}: {
  selectedWeek: number;
  onChange: (week: number) => void;
  darkMode: boolean;
}) => {
  const weeks = [
    { value: -1, label: "Last Week" },
    { value: 0, label: "Current Week" },

  ];

  return (
    <div className={`flex rounded-lg overflow-hidden border ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}>
      {weeks.map((week) => (
        <button
          key={week.value}
          onClick={() => onChange(week.value)}
          className={`px-3 py-1 text-sm transition ${selectedWeek === week.value
            ? darkMode
              ? 'bg-purple-600 text-white'
              : 'bg-purple-500 text-white'
            : darkMode
              ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
        >
          {week.label}
        </button>
      ))}
    </div>
  );
};

// Stat Card Component
const StatCard = ({
  title,
  value,
  darkMode,
  borderColor
}: {
  title: string;
  value: number;
  darkMode: boolean;
  borderColor: string;
}) => {
  const borderColors = {
    blue: 'border-l-blue-500',
    green: 'border-l-green-500',
    yellow: 'border-l-yellow-500',
    red: 'border-l-red-500'
  };

  return (
    <div className={`border-l-4 rounded-lg p-4 print:border-l-2 ${darkMode ? 'bg-zinc-700' : 'bg-gray-50'
      } ${borderColors[borderColor as keyof typeof borderColors]}`}>
      <h3 className="text-sm font-medium">{title}</h3>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
};

// Team Table Component
const TeamTable = ({ members, darkMode }: { members: TeamMember[]; darkMode: boolean }) => (
  <div className={`rounded-lg shadow-md p-4 mb-6 print:shadow-none ${darkMode ? 'bg-zinc-700' : 'bg-gray-50'}`}>
    <h2 className="text-xl font-semibold mb-4">Team Members</h2>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className={`${darkMode ? 'bg-gray-600' : 'bg-gray-200'} print:bg-gray-200`}>
            <TableHeader darkMode={darkMode}>Member</TableHeader>
            <TableHeader darkMode={darkMode}>Created</TableHeader>
            <TableHeader darkMode={darkMode}>Completed</TableHeader>
            <TableHeader darkMode={darkMode}>In Progress</TableHeader>
          </tr>
        </thead>
        <tbody>
          {members.map((member, index) => (
            <TableRow
              key={index}
              name={member.name}
              created={member.assignedTo}
              completed={member.completed}
              inProgress={member.inProgress}
              darkMode={darkMode}
            />
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// Table Header Component
const TableHeader = ({ children, darkMode }: { children: React.ReactNode; darkMode: boolean }) => (
  <th className={`px-4 py-2 text-left print:px-2 print:py-1 ${darkMode ? 'text-gray-300 print:text-gray-800' : 'text-gray-600'}`}>
    {children}
  </th>
);

// Table Row Component
const TableRow = ({
  name,
  created,
  completed,
  inProgress,
  darkMode
}: {
  name: string;
  created: number;
  completed: number;
  inProgress: number;
  darkMode: boolean;
}) => (
  <tr className={`border-b ${darkMode ? 'border-gray-600 print:border-gray-300' : 'border-gray-200'}`}>
    <td className={`px-4 py-3 print:px-2 print:py-1 ${darkMode ? 'text-gray-100 print:text-gray-800' : 'text-gray-800'
      }`}>{name}</td>
    <td className={`px-4 py-3 text-center print:px-2 print:py-1 ${darkMode ? 'text-gray-100 print:text-gray-800' : 'text-gray-800'
      }`}>{created}</td>
    <td className={`px-4 py-3 text-center print:px-2 print:py-1 ${darkMode ? 'text-gray-100 print:text-gray-800' : 'text-gray-800'
      }`}>{completed}</td>
    <td className={`px-4 py-3 text-center print:px-2 print:py-1 ${darkMode ? 'text-gray-100 print:text-gray-800' : 'text-gray-800'
      }`}>{inProgress}</td>
  </tr>
);

// Projects Status Component
const ProjectsStatus = ({ data, darkMode }: { data: ProjectStatus; darkMode: boolean }) => (
  <div className={`rounded-lg shadow-md p-4 mb-6 print:shadow-none ${darkMode ? 'bg-zinc-700' : 'bg-gray-50'}`}>
    <h2 className="text-xl font-semibold mb-4">Projects</h2>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:grid-cols-4">
      <StatusCard title="In Progress" count={data.inProgress} darkMode={darkMode} color="yellow" />
      <StatusCard title="Completed" count={data.completed} darkMode={darkMode} color="green" />
      <StatusCard title="Overdue" count={data.overdue} darkMode={darkMode} color="red" />
      <StatusCard title="To Do" count={data.todo} darkMode={darkMode} color="blue" />
    </div>
  </div>
);

// Status Card Component
const StatusCard = ({
  title,
  count,
  darkMode,
  color
}: {
  title: string;
  count: number;
  darkMode: boolean;
  color: 'red' | 'green' | 'blue' | 'yellow';
}) => {
  const colorClasses = {
    red: darkMode ? 'bg-red-900/30 border-red-500 print:bg-red-100' : 'bg-red-50 border-red-200',
    green: darkMode ? 'bg-green-900/30 border-green-500 print:bg-green-100' : 'bg-green-50 border-green-200',
    blue: darkMode ? 'bg-blue-900/30 border-blue-500 print:bg-blue-100' : 'bg-blue-50 border-blue-200',
    yellow: darkMode ? 'bg-yellow-900/30 border-yellow-500 print:bg-yellow-100' : 'bg-yellow-50 border-yellow-200'
  };

  return (
    <div className={`border rounded-lg p-3 print:p-2 ${colorClasses[color]}`}>
      <h3 className="font-medium print:text-sm">{title}</h3>
      <p className="text-2xl font-bold print:text-xl">{count}</p>
    </div>
  );
};

// Task Trend Chart Component
const TaskTrendChart = ({ data, darkMode }: { data: number[]; darkMode: boolean }) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const maxValue = Math.max(...data, 5);

  return (
    <div className={`rounded-lg shadow-md p-4 mb-6 print:shadow-none ${darkMode ? 'bg-zinc-700' : 'bg-gray-50'}`}>
      <h2 className="text-xl font-semibold mb-4">Task Completion Trend</h2>
      <div className="h-48 flex items-end justify-between pt-4 print:h-40">
        {data.map((value, index) => (
          <div key={index} className="flex flex-col items-center flex-1 h-full">
            <div className="flex flex-col items-center justify-end h-full w-full">
              <div
                className={`w-8 rounded-t-sm mx-auto print:bg-blue-500 ${darkMode ? 'bg-blue-400' : 'bg-blue-500'}`}
                style={{
                  height: `${(value / maxValue) * 80}%`,
                  minHeight: '4px'
                }}>
              </div>
              <div className="flex flex-col items-center mt-1">
                <span className="text-xs mt-1 print:text-black">{days[index]}</span>
                <span className="text-xs font-medium">{value}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Notes Section Component
const NotesSection = ({ notes, setNotes, darkMode }: { notes: string; setNotes: (text: string) => void; darkMode: boolean }) => (
  <div className={`rounded-lg shadow-md p-4 print:shadow-none ${darkMode ? 'bg-zinc-700' : 'bg-gray-50'}`}>
    <h2 className="text-xl font-semibold mb-4">Notes</h2>
    <textarea
      value={notes}
      onChange={(e) => setNotes(e.target.value)}
      className={`w-full p-3 rounded-lg border print:border-gray-300 print:bg-white ${darkMode ? 'bg-zinc-600 border-gray-600' : 'bg-white border-gray-300'
        }`}
      rows={4}
    />
  </div>
);

export default Report;

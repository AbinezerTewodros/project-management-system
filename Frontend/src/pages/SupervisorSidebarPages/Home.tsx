import { Card } from "@/components/ui/card";
import { CheckCircle, AlertCircle, Clock, ChevronRight, Folder, MessageSquare} from "lucide-react";
import { useState } from "react";
import Calendar from "react-calendar";
import 'react-calendar/dist/Calendar.css';
import DateHolidays from 'date-holidays'


const Home = ({ darkMode }: { darkMode: boolean }) => {
  // Mock data - replace with your API calls
  const user = { name: "Kalkidan" };
  const tasks = {
    dueToday: 5,
    todo: 8,
    inProgress: 12,
    done: 32
  };

  const upcomingDeadlines = [
    { title: "Design homepage", date: new Date(2025,3,25), status: "Due" },
    { title: "Update documentation", date: new Date(2025,4,27), status: "Due" }
  ];

  const activeProjects = [
    { name: "Website", description: "Redesign" },
    { name: "Mobile App", description: "" }
  ];

  const teamActivity = [
    { action: "All commented on task", time: "2h ago" }
  ];

  const [date, setDate] = useState(new Date());
  const formDate = (date: Date) => {
    return date.toLocaleDateString('en-US' , {
      month: 'long',
      day: 'numeric'
    });
  };

  const tileContent = ({ date, view }: {date: Date; view: string }) =>{
    if (view === 'month') {
      const hasDeadline = upcomingDeadlines.some(
        deadline => deadline.date.toDateString() === date.toDateString()
      );

      return hasDeadline ? (
        <div className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></div>
      ) : null;
    }
    return null;
  };

  const hd = new DateHolidays('ETH');
  function checkIfHoliday(date: Date): boolean {
    return hd.isHoliday(date) !== false;

  }
  return (
    <div className={`p-6 ${darkMode ? "bg-zinc-800 text-gray-300" : "bg-white text-gray-700"}`}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Hello, {user.name}</h1>
        <p className={`text-lg ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
          You have {tasks.dueToday} tasks due today
        </p>
      </div>

      {/* Task Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* To Do Card */}
        <Card className={`p-4 border-s-4 border-s-blue-300 ${darkMode ? "bg-zinc-700" : "bg-gray-50"}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>To Do</p>
              <p className="text-2xl font-bold">{tasks.todo}</p>
            </div>
            <AlertCircle className={`h-6 w-6 ${darkMode ? "text-gray-400" : "text-gray-600"}`} />
          </div>
        </Card>

        {/* In Progress Card */}
        <Card className={`p-4 border-s-4 border-s-yellow-300 ${darkMode ? "bg-zinc-700" : "bg-gray-50"}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>In Progress</p>
              <p className="text-2xl font-bold">{tasks.inProgress}</p>
            </div>
            <Clock className={`h-6 w-6 ${darkMode ? "text-blue-400" : "text-blue-600"}`} />
          </div>
        </Card>

        {/* Done Card */}
        <Card className={`p-4 border-s-4 border-s-green-300 ${darkMode ? "bg-zinc-700" : "bg-gray-50"}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Done</p>
              <p className="text-2xl font-bold">{tasks.done}</p>
            </div>
            <CheckCircle className={`h-6 w-6 ${darkMode ? "text-green-400" : "text-green-600"}`} />
          </div>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Upcoming Deadlines */}
          <Card className={`p-4 ${darkMode ? "bg-zinc-700" : "bg-gray-50"}`}>
            <h2 className="font-semibold mb-4">Upcoming Deadlines</h2>
            <div className="space-y-3">
              {upcomingDeadlines.map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                      {formDate(item.date)} • <span className="text-red-500">{item.status}</span>
                    </p>
                  </div>
                  <ChevronRight className={`h-5 w-5 ${darkMode ? "text-gray-400" : "text-gray-600"}`} />
                </div>
              ))}
            </div>
          </Card>

          {/* Active Projects */}
          <Card className={`p-4 ${darkMode ? "bg-zinc-700" : "bg-gray-50"}`}>
            <h2 className="font-semibold mb-4">Active Projects</h2>
            <div className="space-y-3">
              {activeProjects.map((project, index) => (
                <div key={index} className="flex items-center">
                  <Folder className={`h-5 w-5 mr-3 ${darkMode ? "text-gray-400" : "text-gray-600"}`} />
                  <div>
                    <p className="font-medium">{project.name}</p>
                    {project.description && (
                      <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                        {project.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Team Activity */}
          <Card className={`p-4 ${darkMode ? "bg-zinc-700" : "bg-gray-50"}`}>
            <h2 className="font-semibold mb-4">Team Activity</h2>
            <div className="space-y-3">
              {teamActivity.map((activity, index) => (
                <div key={index} className="flex items-center">
                  <MessageSquare className={`h-5 w-5 mr-3 ${darkMode ? "text-gray-400" : "text-gray-600"}`} />
                  <div>
                    <p className="font-medium">{activity.action}</p>
                    <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Calendar */}
          <Card className={`p-4 ${darkMode ? "bg-zinc-700" : "bg-gray-50"}`}>
            <h2 className="font-semibold mb-4">
              {date.toLocaleDateString('en-US', {month: 'long', year: 'numeric'})}
            </h2>
            <Calendar
              onChange={setDate}
              value={date}
              className={`react-calendar ml-4 border rounded-md w-fit
                ${darkMode ? '[&.react-calendar]:bg-zinc-600 [&.react-calendar__tile]:text-gray-300 [&.react-calendar__navigation]:text-gray-300 [&.react-calendar__navigation__label]:text-gray-300 [&.react-calendar__navigation__arrow]:text-gray-300 [&.react-calendar__month-view__days__day--sunday]:text-red-300 [&.react-calendar__month-view__days__day--saturday]:!text-gray-300 [&.react-calendar__tile--now]:bg-zinc-600 [&.react-calendar__tile--active]:bg-blue-800 [&.react-calendar__tile--hasActive]:bg-blue-900' :
                '[&.react-calendar__month-view__days__day--saturday]:!text-inherit'}`}
              tileClassName={({ date: tileDate, view }) => {
                const baseClass = view === 'month' && tileDate.toDateString() === new Date().toDateString()
                    ? `${darkMode ? 'bg-blue-800 text-white' : 'bg-blue-100 text-blue-800'} rounded-full` : '';

                const isSunday = tileDate.getDay() === 0;
                const isHoliday= checkIfHoliday(tileDate);


                return `${baseClass} ${isSunday || isHoliday ? '!text-red-500' : ''}`;
              }}
              tileContent={tileContent}
            />
          </Card>
        </div>
      </div>
    </div>
  );
};


export default Home;

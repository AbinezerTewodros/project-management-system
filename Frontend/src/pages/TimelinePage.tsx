import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ProjectTimeline, { TimelineEvent } from '@/components/ProjectTimeline';
import { projectService } from '@/services/projectService';
import { timelineService } from '@/services/timelineService';

const mapDtoToTimelineEvents = (dtos: any[]): TimelineEvent[] => {
  const events: TimelineEvent[] = dtos.map((d) => ({
    id: `${d.timelineType || 'evt'}-${d.id}`,
    title: d.title,
    description: d.description,
    actor: d.userId,
    date: new Date(d.eventTime || d.startDate || Date.now()).toISOString(),
    status: d.status,
  }));
  return events;
};

function hashCode(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    // eslint-disable-next-line no-bitwise
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return h;
}

const TimelinePage: React.FC<{ darkMode?: boolean }> = ({ darkMode = false }) => {
  const params = useParams();
  const projectId = params.projectId;
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const projectNameFromQuery = query.get('name') || '';

  const [projectName, setProjectName] = React.useState<string>(projectNameFromQuery || projectId || 'Project Timeline');
  const [events, setEvents] = React.useState<TimelineEvent[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);

  // Load project data from backend
  React.useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!projectId) {
        if (mounted) setLoading(false);
        return;
      }

      try {
        const idNum = Number(projectId);
        if (Number.isNaN(idNum)) {
          console.error('Invalid project ID:', projectId);
          if (mounted) setLoading(false);
          return;
        }

        // Load project name
        const res = await projectService.getProjectById(idNum);
        if (mounted && res && (res as any).success && (res as any).data) {
          const p: any = (res as any).data;
          const candidateName = p.title || p.projectName || p.name;
          if (candidateName) setProjectName(candidateName);
        }

        // Load project timeline events
        const timelineDtos = await timelineService.getProjectTimeline(idNum);
        const mapped = mapDtoToTimelineEvents(timelineDtos);
        if (mounted) setEvents(mapped);
      } catch (err) {
        console.error('Error loading timeline:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [projectId, projectNameFromQuery]);

  const navigate = useNavigate();

  const goBack = () => {
    // Prefer navigating back if possible, otherwise go to /dashboard
    if (window.history.length > 1) navigate(-1);
    else navigate('/dashboard');
  };

  return (
    <div className={`min-h-screen p-6 ${darkMode ? 'bg-zinc-900 text-gray-100' : 'bg-white text-gray-900'}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={goBack}
            aria-label="Back"
            className={`p-2 rounded-full ${darkMode ? 'text-gray-100 hover:bg-zinc-700/40' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="text-2xl font-semibold">Project Timeline - {projectName}</h2>
        </div>
      </div>
      <ProjectTimeline darkMode={!!darkMode} projectName={projectName} events={events} />
    </div>
  );
};

export default TimelinePage;

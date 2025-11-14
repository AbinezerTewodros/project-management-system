import React from 'react';
import { Clock, CheckCircle2, ArrowUpRight, User, Calendar, Check, Clipboard, Settings, UserPlus, LayoutList, LayoutGrid } from 'lucide-react';

export type TimelineEvent = {
  id: string;
  title: string;
  description?: string;
  actor?: string; // who did it (department/role)
  date: string; // ISO string
  status?: string; // e.g., initiated, approved, in-progress, completed
  // optional metadata for detailed events
  assignedTo?: string;
  assignedDate?: string;
  details?: Record<string, string>;
  // optional tact time in days (duration of the phase)
  tactTimeDays?: number;
};

type ProjectTimelineProps = {
  darkMode: boolean;
  projectName?: string;
  events?: TimelineEvent[];
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString();
};

const msToDays = (ms: number) => Math.round(ms / (1000 * 60 * 60 * 24));

const ProjectTimeline: React.FC<ProjectTimelineProps> = ({
  darkMode,
  projectName = 'Project Timeline',
  events = [],
}) => {
  // sort events by date ascending
  const sorted = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // lead time: time between first event (request) and approval (the event with status 'approved')
  const first = sorted[0];
  const approved = sorted.find((e) => (e.status || '').toLowerCase() === 'approved');
  // cycle time per company definition: from approved date until handover date
  // look for an explicit handover/handover-like event; fall back to 'completed' if present
  const handover = sorted.find((e) => {
    const txt = ((e.status || '') + ' ' + (e.title || '')).toLowerCase();
    return txt.includes('handover') || txt.includes('hand over') || txt.includes('handed over') || txt.includes('handovered') || txt.includes('completed');
  });

  const leadTimeDays = approved ? msToDays(new Date(approved.date).getTime() - new Date(first.date).getTime()) : null;
  const cycleTimeDays = approved && handover ? msToDays(new Date(handover.date).getTime() - new Date(approved.date).getTime()) : null;

  // UI state for small info popovers and per-event tact time display
  const [showLeadInfo, setShowLeadInfo] = React.useState(false);
  const [showCycleInfo, setShowCycleInfo] = React.useState(false);
  const [openEventId, setOpenEventId] = React.useState<string | null>(null);
  const [templateView, setTemplateView] = React.useState<'vertical' | 'horizontal'>('vertical');

  // compute tact time per event: use explicit tactTimeDays if provided, otherwise infer from next event date
  const tactForEvent = (index: number) => {
    const e = sorted[index];
    if (!e) return null;
    if (typeof e.tactTimeDays === 'number') return e.tactTimeDays;
    const next = sorted[index + 1];
    if (!next) return null;
    return msToDays(new Date(next.date).getTime() - new Date(e.date).getTime());
  };

  return (
    <div className={`p-6 rounded-lg shadow text-sm ${darkMode ? 'bg-zinc-900 text-gray-100' : 'bg-white text-gray-900'}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold" style={{color: darkMode ? '#f3f4f6' : '#2c0340'}}>{projectName} - Timeline</h3>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Project flow and key events</p>
        </div>
        
        {/* Template Toggle */}
        <div className="flex items-center gap-2 mr-4">
          <button
            onClick={() => setTemplateView('vertical')}
            className={`p-2 rounded-lg transition-all ${templateView === 'vertical' ? 'bg-purple-900 text-white' : darkMode ? 'bg-zinc-800 text-gray-400 hover:bg-zinc-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            title="Vertical Timeline"
          >
            <LayoutList className="h-5 w-5" />
          </button>
          <button
            onClick={() => setTemplateView('horizontal')}
            className={`p-2 rounded-lg transition-all ${templateView === 'horizontal' ? 'bg-purple-900 text-white' : darkMode ? 'bg-zinc-800 text-gray-400 hover:bg-zinc-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            title="Horizontal Roadmap"
          >
            <LayoutGrid className="h-5 w-5" />
          </button>
        </div>
        
        <div className="text-right text-sm relative">
          <div className="flex items-center gap-3">
            <Clock className={`h-4 w-4 ${darkMode ? 'text-gray-300' : 'text-gray-500'}`} />
            <div>
              <div className="text-xs text-muted-foreground">Lead time</div>
              <div className={`font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{leadTimeDays !== null ? `${leadTimeDays} days` : 'N/A'}</div>
            </div>
            <button
              onClick={() => setShowLeadInfo((s) => !s)}
              aria-label="Lead time info"
              className="ml-2 p-1 rounded-full text-xs"
              style={{ background: darkMode ? '#0f1720' : '#f3f2f8' }}
            >
              ?
            </button>
          </div>
          {showLeadInfo && (
            <div className="absolute right-0 top-8 z-20 w-64 rounded-md shadow-md p-3" style={{ background: darkMode ? '#0b1220' : '#ffffff' }}>
              <div className="text-sm font-semibold text-left">Lead time</div>
              <div className="text-xs mt-2 text-left" style={{ color: darkMode ? '#cbd5e1' : '#374151' }}>
                Lead time is defined as the period from the project's request date  to the date on which that request is approved. It measures how long requests wait before receiving approval.
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 mt-2">
            <CheckCircle2 className={`h-4 w-4 ${darkMode ? 'text-gray-300' : 'text-gray-500'}`} />
            <div>
              <div className="text-xs text-muted-foreground">Cycle time</div>
              <div className={`font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{cycleTimeDays !== null ? `${cycleTimeDays} days` : 'N/A'}</div>
            </div>
            <button
              onClick={() => setShowCycleInfo((s) => !s)}
              aria-label="Cycle time info"
              className="ml-2 p-1 rounded-full text-xs"
              style={{ background: darkMode ? '#0f1720' : '#f3f2f8' }}
            >
              ?
            </button>
          </div>
          {showCycleInfo && (
            <div className="absolute right-0 top-28 z-20 w-72 rounded-md shadow-md p-3" style={{ background: darkMode ? '#0b1220' : '#ffffff' }}>
              <div className="text-sm font-semibold text-left">Cycle time</div>
              <div className="text-xs mt-2 text-left" style={{ color: darkMode ? '#cbd5e1' : '#374151' }}>
                Cycle time is defined as the period from the approval date to the project's handover date. If the project has not yet been handed over, cycle time is not applicable and will be shown as N/A.
              </div>
            </div>
          )}
        </div>
      </div>

      {templateView === 'vertical' ? (
        <div className="relative">
          {/* center vertical line */}
          <div className={`absolute left-1/2 top-0 bottom-0 w-1 ${darkMode ? 'bg-zinc-700' : 'bg-gray-200'}`} />

        <ul className="space-y-8">
          {sorted.map((e, index) => {
            const isLeft = index % 2 === 0; // alternate sides
            const cardBg = darkMode ? '#111827' : '#ffffff';
            const purple = '#581c87';
            const gold = '#D4AF37';
            // decide colors: last event (most recent) uses gold to show current state
            const isLastEvent = index === sorted.length - 1;
            const iconBgColor = isLastEvent ? gold : purple;
            const iconClass = isLastEvent ? 'h-5 w-5 text-[#2c0340]' : 'h-5 w-5 text-white';

            return (
              <li key={e.id} className="relative w-full">
                <div className="grid grid-cols-12 items-center">
                  {/* left content */}
                  <div className={`col-span-5 ${isLeft ? 'justify-end pr-6 text-right' : 'hidden lg:block'}`}>
                    {isLeft && (
                      <div
                        style={{background: cardBg}}
                        className={`inline-block rounded-lg p-4 shadow-md cursor-pointer`}
                        role="button"
                        tabIndex={0}
                        onClick={() => setOpenEventId(openEventId === e.id ? null : e.id)}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center h-10 w-10 rounded-full" style={{background: iconBgColor}}>
                              {getEventIcon(e, iconClass)}
                            </div>
                            <div className="text-left">
                              <p className={`text-sm font-semibold`} style={{color: darkMode ? '#f3f4f6' : '#1f1140'}}>{e.title}</p>
                              <p className="text-xs mt-1" style={{color: darkMode ? '#9ca3af' : '#6b7280'}}>{e.description}</p>
                              <div className="text-xs mt-2" style={{color: darkMode ? '#9ca3af' : '#6b7280'}}>
                                {e.actor && <span className="mr-2 font-medium">{e.actor}</span>}
                                <span>• <span className="font-semibold">{formatDate(e.date)}</span></span>
                              </div>
                              {e.assignedTo && (
                                <div className="text-xs mt-2" style={{color: darkMode ? '#9ca3af' : '#6b7280'}}>
                                  <strong>Assigned to:</strong> {e.assignedTo}
                                  {e.assignedDate && <span className="ml-2">(<span className="font-semibold">{formatDate(e.assignedDate)}</span>)</span>}
                                </div>
                              )}

                              {/* tact time popover shown when this phase is clicked */}
                              {openEventId === e.id && (
                                <div className="mt-3 p-2 rounded-md border" style={{ borderColor: darkMode ? '#262626' : '#e6e6fa', background: darkMode ? '#071127' : '#fffafc' }}>
                                  <div className="text-sm font-semibold">Tact time</div>
                                  <div className="text-xs text-gray-400 mt-1">{(() => {
                                    const t = tactForEvent(index);
                                    return t !== null ? `${t} days` : 'Not available yet';
                                  })()}</div>
                                  <div className="text-xs mt-1 text-gray-400">Tact time = duration of this specific phase.</div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* center marker */}
                  <div className="col-span-2 flex justify-center items-center">
                    <div className="relative flex items-center justify-center">
                      <div className="h-4 w-4 rounded-full border-2" style={{background: isLastEvent ? gold : purple, borderColor: darkMode ? '#111827' : '#ffffff'}} />
                    </div>
                  </div>

                  {/* right content */}
                  <div className={`col-span-5 ${!isLeft ? 'pl-6 text-left' : 'hidden lg:block'}`}>
                    {!isLeft && (
                      <div
                        style={{background: cardBg}}
                        className={`inline-block rounded-lg p-4 shadow-md cursor-pointer`}
                        role="button"
                        tabIndex={0}
                        onClick={() => setOpenEventId(openEventId === e.id ? null : e.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center h-10 w-10 rounded-full" style={{background: iconBgColor}}>
                            {getEventIcon(e, iconClass)}
                          </div>
                          <div>
                            <p className={`text-sm font-semibold`} style={{color: darkMode ? '#f3f4f6' : '#1f1140'}}>{e.title}</p>
                            <p className="text-xs mt-1" style={{color: darkMode ? '#9ca3af' : '#6b7280'}}>{e.description}</p>
                            <div className="text-xs mt-2" style={{color: darkMode ? '#9ca3af' : '#6b7280'}}>
                              {e.actor && <span className="mr-2 font-medium">{e.actor}</span>}
                              <span>• <span className="font-semibold">{formatDate(e.date)}</span></span>
                            </div>
                            {e.assignedTo && (
                              <div className="text-xs mt-2" style={{color: darkMode ? '#9ca3af' : '#6b7280'}}>
                                <strong>Assigned to:</strong> {e.assignedTo}
                                {e.assignedDate && <span className="ml-2">(<span className="font-semibold">{formatDate(e.assignedDate)}</span>)</span>}
                              </div>
                            )}

                            {/* tact time popover shown when this phase is clicked */}
                            {openEventId === e.id && (
                              <div className="mt-3 p-2 rounded-md border" style={{ borderColor: darkMode ? '#262626' : '#e6e6fa', background: darkMode ? '#071127' : '#fffafc' }}>
                                <div className="text-sm font-semibold">Tact time</div>
                                <div className="text-xs text-gray-400 mt-1">{(() => {
                                  const t = tactForEvent(index);
                                  return t !== null ? `${t} days` : 'Not available yet';
                                })()}</div>
                                <div className="text-xs mt-1 text-gray-400">Tact time = duration of this specific phase.</div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      ) : (
        // Horizontal Stepper Timeline Template
        <div className="relative py-8">
          <div className="overflow-x-auto pb-8">
            <div className="flex items-center min-w-max px-8 relative">
              {/* Background Progress Line */}
              <div 
                className="absolute left-0 right-0 h-1 top-16"
                style={{ 
                  background: darkMode ? 'linear-gradient(to right, #581c87 0%, #D4AF37 100%)' : 'linear-gradient(to right, #e9d5ff 0%, #fef3c7 100%)',
                  zIndex: 0
                }}
              />
              
              {sorted.map((e, index) => {
                const purple = '#581c87';
                const gold = '#D4AF37';
                const isLastEvent = index === sorted.length - 1;
                const stepColor = isLastEvent ? gold : purple;
                const cardBg = darkMode ? '#111827' : '#ffffff';
                const tact = tactForEvent(index);

                return (
                  <React.Fragment key={e.id}>
                    <div className="flex flex-col items-center relative" style={{ minWidth: '320px' }}>
                      {/* Step Number Circle */}
                      <div 
                        className="relative z-10 flex items-center justify-center rounded-full shadow-lg mb-6"
                        style={{ 
                          width: '64px', 
                          height: '64px',
                          background: stepColor,
                          border: `4px solid ${darkMode ? '#111827' : '#ffffff'}`
                        }}
                      >
                        <div className="flex flex-col items-center">
                          <span className="text-white font-bold text-lg">{index + 1}</span>
                          <div className="mt-1">
                            {getEventIcon(e, 'h-4 w-4 text-white')}
                          </div>
                        </div>
                      </div>

                      {/* Event Card */}
                      <div
                        style={{ 
                          background: cardBg,
                          borderLeft: `4px solid ${stepColor}`,
                          minWidth: '300px',
                          maxWidth: '300px'
                        }}
                        className="rounded-lg p-5 shadow-lg cursor-pointer hover:shadow-2xl transition-all transform hover:-translate-y-1"
                        onClick={() => setOpenEventId(openEventId === e.id ? null : e.id)}
                      >
                        {/* Title with Badge */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <h4
                            className="text-base font-bold flex-1"
                            style={{ color: darkMode ? '#f3f4f6' : '#2c0340' }}
                          >
                            {e.title}
                          </h4>
                          {isLastEvent && (
                            <span 
                              className="px-2 py-1 rounded text-xs font-semibold"
                              style={{ background: gold, color: '#2c0340' }}
                            >
                              Current
                            </span>
                          )}
                        </div>

                        {/* Description */}
                        {e.description && (
                          <p
                            className="text-sm mb-3 leading-relaxed"
                            style={{ color: darkMode ? '#d1d5db' : '#4b5563' }}
                          >
                            {e.description}
                          </p>
                        )}

                        {/* Date & Actor Info */}
                        <div className="space-y-2 mb-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" style={{ color: stepColor }} />
                            <span 
                              className="text-xs font-medium"
                              style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                            >
                              {formatDate(e.date)}
                            </span>
                          </div>
                          {e.actor && (
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" style={{ color: stepColor }} />
                              <span 
                                className="text-xs font-medium"
                                style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                              >
                                {e.actor}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Assigned To Section */}
                        {e.assignedTo && (
                          <div
                            className="text-xs py-2 px-3 rounded-md mb-3"
                            style={{
                              background: darkMode ? '#1f2937' : '#f9fafb',
                              borderLeft: `3px solid ${stepColor}`
                            }}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <UserPlus className="h-3 w-3" style={{ color: stepColor }} />
                              <strong style={{ color: darkMode ? '#f3f4f6' : '#1f2937' }}>Assigned to:</strong>
                            </div>
                            <div style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}>
                              {e.assignedTo}
                              {e.assignedDate && (
                                <div className="text-xs mt-1">
                                  {formatDate(e.assignedDate)}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Tact Time Badge */}
                        {tact !== null && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" style={{ color: stepColor }} />
                            <span
                              className="px-3 py-1 rounded-full text-xs font-bold"
                              style={{
                                background: darkMode ? 'rgba(88, 28, 135, 0.2)' : '#f3e8ff',
                                color: stepColor,
                                border: `1px solid ${stepColor}40`
                              }}
                            >
                              {tact} days
                            </span>
                          </div>
                        )}

                        {/* Expanded Tact Time Details */}
                        {openEventId === e.id && (
                          <div
                            className="mt-4 p-3 rounded-lg border-2"
                            style={{
                              borderColor: stepColor,
                              background: darkMode ? 'rgba(88, 28, 135, 0.1)' : '#faf5ff',
                            }}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <Clock className="h-4 w-4" style={{ color: stepColor }} />
                              <div className="text-sm font-bold" style={{ color: darkMode ? '#f3f4f6' : '#2c0340' }}>
                                Tact Time Details
                              </div>
                            </div>
                            <div className="text-xs" style={{ color: darkMode ? '#d1d5db' : '#4b5563' }}>
                              <div className="font-semibold mb-1">
                                Duration: {tact !== null ? `${tact} days` : 'Not available yet'}
                              </div>
                              <div className="opacity-80">
                                Tact time represents the duration of this specific phase in the project timeline.
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Connector */}
                    {index < sorted.length - 1 && (
                      <div className="flex items-center" style={{ width: '80px', marginTop: '-100px' }}>
                        <div 
                          className="h-1 flex-1 relative"
                          style={{ background: 'transparent' }}
                        >
                          <ArrowUpRight 
                            className="absolute right-0 top-1/2 -translate-y-1/2" 
                            style={{ color: darkMode ? '#581c87' : '#7c3aed' }}
                          />
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Enhanced Legend */}
          <div className="mt-8 flex justify-center gap-8 text-sm">
            <div className="flex items-center gap-3">
              <div
                className="h-6 w-6 rounded-full flex items-center justify-center font-bold text-white text-xs"
                style={{ background: '#581c87' }}
              >
                #
              </div>
              <span className="font-medium" style={{ color: darkMode ? '#d1d5db' : '#4b5563' }}>
                Completed Milestones
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div
                className="h-6 w-6 rounded-full flex items-center justify-center font-bold text-xs"
                style={{ background: '#D4AF37', color: '#2c0340' }}
              >
                ★
              </div>
              <span className="font-medium" style={{ color: darkMode ? '#d1d5db' : '#4b5563' }}>
                Current Status
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function getEventIcon(e: TimelineEvent, darkModeOrClass: boolean | string) {
  // darkModeOrClass may be a boolean (legacy calls) or a css class string we want to apply
  const classFromArg = typeof darkModeOrClass === 'string' ? darkModeOrClass : undefined;
  const darkMode = typeof darkModeOrClass === 'boolean' ? darkModeOrClass : false;
  const sizeClass = classFromArg ? '' : 'h-4 w-4';
  const commonClass = classFromArg || (darkMode ? 'text-gray-200' : 'text-gray-600');
  const status = (e.status || '').toLowerCase();
  if (status.includes('initiated') || status.includes('request')) return <User className={`${sizeClass} ${commonClass}`} />;
  if (status.includes('approved')) return <Check className={`${sizeClass} ${commonClass}`} />;
  if (status.includes('in-progress') || status.includes('started')) return <Clipboard className={`${sizeClass} ${commonClass}`} />;
  if (status.includes('completed')) return <CheckCircle2 className={`${sizeClass} ${classFromArg ? classFromArg : (darkMode ? 'text-white' : 'text-green-700')}`} />;
  if (status.includes('approval') || status.includes('manager')) return <UserPlus className={`${sizeClass} ${commonClass}`} />;
  if (status.includes('kickoff') || status.includes('meeting')) return <Calendar className={`${sizeClass} ${commonClass}`} />;
  if (e.title.toLowerCase().includes('scrum') || e.title.toLowerCase().includes('assigned')) return <Settings className={`${sizeClass} ${commonClass}`} />;
  // fallback
  return <ArrowUpRight className={`${sizeClass} ${commonClass}`} />;
}

export default ProjectTimeline;

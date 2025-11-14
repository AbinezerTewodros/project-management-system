using ProjectManagementSystem1.Model.Dto.TimelineDto;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ProjectManagementSystem1.Services.TimelineService
{
    public interface ITimelineService
    {
        Task<List<TimelineDto>> GetTimelineByProject(int projectId);
        Task<List<TimelineDto>> GetTimelineByProjectTask(int projectTaskId);
        Task<List<TimelineDto>> GetTimelineByMilestone(int milestoneId);
        Task<List<TimelineDto>> GetTimelineByIndependentTask(int independentTaskId);
        Task<TimelineDto> AddDependencies(int timelineId, AddDependenciesDto dependencyData);

        // New methods for time tracking
        Task<TimelineDto> UpdateTimelineTimes(int timelineId, UpdateTimelineTimesDto timeData);
        Task<TimelineDto> AddPhaseToTimeline(int timelineId, TimelinePhaseDto phaseDto);
        Task<TimelineDto> UpdatePhase(int timelineId, int phaseId, UpdatePhaseDto phaseDto);
        Task<List<TimelinePhaseDto>> GetTimelinePhases(int timelineId);

        // COMMENTED OUT: Takt time analysis method
        // Task<TimeAnalysisDto> GetTimeAnalysis(int timelineId);

        // ADD NEW METHOD: Get events by filters
        Task<List<TimelineDto>> GetTimelineEventsByFilters(int? projectId = null, DateTime? startDate = null,
            DateTime? endDate = null, string userId = null);
    }
}
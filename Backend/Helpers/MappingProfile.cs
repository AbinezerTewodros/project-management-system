using AutoMapper;
using ProjectManagementSystem1.Model.Dto;
using ProjectManagementSystem1.Model.Dto.ArchiveDto;
using ProjectManagementSystem1.Model.Dto.IndependentTaskDto;
using ProjectManagementSystem1.Model.Dto.Message;
using ProjectManagementSystem1.Model.Dto.MilestoneDto;
using ProjectManagementSystem1.Model.Dto.ProjectAssignmentDto;
using ProjectManagementSystem1.Model.Dto.ProjectManagementDto;
using ProjectManagementSystem1.Model.Entities;

namespace ProjectManagementSystem1.Helpers
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            CreateMap<Project, ProjectDto>();
            CreateMap<CreateProjectDto, Project>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.MapFrom(_ => DateTime.UtcNow))
            .ForMember(dest => dest.UpdatedDate, opt => opt.MapFrom(_ => DateTime.UtcNow))
            .ForMember(dest => dest.ProjectAssignments, opt => opt.Ignore())
            .ForMember(dest => dest.Issues, opt => opt.Ignore())
            .ForMember(dest => dest.IsArchived, opt => opt.MapFrom(_ => false))
            .ForMember(dest => dest.ArchiveDate, opt => opt.Ignore())
            .ForMember(dest => dest.Version, opt => opt.MapFrom(_ => 1))
            .ForMember(dest => dest.IsAutomateTodo, opt => opt.MapFrom(_ => false))
        ;

            CreateMap<UpdateProjectDto, Project>()
                       .ForMember(dest => dest.Id, opt => opt.Ignore())
                       .ForMember(dest => dest.Department, opt => opt.Ignore())
                       .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
                       .ForMember(dest => dest.UpdatedDate, opt => opt.MapFrom(_ => DateTime.UtcNow))
                       .ForMember(dest => dest.CreateUser, opt => opt.Ignore())
                       .ForMember(dest => dest.UpdateUser, opt => opt.Ignore())
                       .ForMember(dest => dest.ProjectAssignments, opt => opt.Ignore())
                       .ForMember(dest => dest.Issues, opt => opt.Ignore())
                       .ForMember(dest => dest.IsArchived, opt => opt.Ignore())
                       .ForMember(dest => dest.ArchiveDate, opt => opt.Ignore())
                       .ForMember(dest => dest.Version, opt => opt.Ignore())
                       .ForMember(dest => dest.IsAutomateTodo, opt => opt.Ignore());

            CreateMap<CreateAssignmentDto, ProjectAssignment>();
            CreateMap<UpdateAssignmentDto, ProjectAssignment>(); // Map only non-null fields
            CreateMap<ProjectAssignment, AssignmentDto>()
            .ForMember(dest => dest.ProjectName,
                opt => opt.MapFrom(src => src.Project != null ? src.Project.ProjectName : null))
            .ForMember(dest => dest.MemberFullName,
                opt => opt.MapFrom(src => src.Member != null ? src.Member.FullName : null))
            .ForMember(dest => dest.MemberId,
                opt => opt.MapFrom(src => src.Member != null ? src.Member.EmployeeId : null))
            .ForMember(dest => dest.Status,
                opt => opt.MapFrom(src => src.Status != null ? src.Member.Status : null))
            .ForMember(dest => dest.MemberRole,
                opt => opt.MapFrom(src => src.MemberRole))
       
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            
            .ReverseMap();



            CreateMap<CreateMessageDto, Message>();
            CreateMap<Message, MessageDto>()
            .ForMember(dest => dest.SenderName, opt => opt.MapFrom(src => src.Sender.FullName))
            .ForMember(dest => dest.EmployeeId, opt => opt.MapFrom(src => src.Sender.EmployeeId));

            CreateMap<CreateMilestoneDto, Milestone>();
            CreateMap<Milestone, MilestoneReadDto>()
                .ReverseMap();
            CreateMap<UpdateMilestoneDto, Milestone>()
                .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(src => System.DateTime.UtcNow))
                .ForAllMembers(opt => opt.Condition((src, dest, srcMember) => srcMember != null));
            CreateMap<ProjectTaskCreateDto, ProjectTask>();

            CreateMap<IndependentTask, IndependentTaskReadDto>()
                            .ForMember(dest => dest.CreatedByUserId, opt =>
                                opt.MapFrom(src => src.CreatedByUser.FullName))
                            .ForMember(dest => dest.AssignedToUserId, opt =>
                                opt.MapFrom(src => src.AssignedToUser.FullName));

            CreateMap<IndependentTaskCreateDto, IndependentTask>();

            CreateMap<IndependentTaskUpdateDto, IndependentTask>()
                .ForMember(dest => dest.TaskId, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedByUserId, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore());

            CreateMap<Archive, ArchiveDto>()
                .ForMember(dest => dest.EntityType, opt => opt.MapFrom(src => src.EntityType.ToString()));
                //.ForMember(dest => dest.Action, opt => opt.MapFrom(src => src.Action.ToString()));

            CreateMap<CreateArchiveDto, Archive>();

        }

    }
}

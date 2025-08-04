using AutoMapper;
using Humanizer;
using ProjectManagementSystem1.Model.Dto;
using ProjectManagementSystem1.Model.Dto.IndependentTaskDto;
using ProjectManagementSystem1.Model.Dto.Message;
using ProjectManagementSystem1.Model.Dto.MilestoneDto;
using ProjectManagementSystem1.Model.Dto.ProjectAssignmentDto;
using ProjectManagementSystem1.Model.Dto.ProjectManagementDto;
using ProjectManagementSystem1.Model.Dto.TodoItemsDto;
using ProjectManagementSystem1.Model.Entities;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace ProjectManagementSystem1.Helpers
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            CreateMap<Project, ProjectDto>();
            CreateMap<CreateProjectDto, Project>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForSourceMember(src => src.AssignedEmployeeId, opt => opt.DoNotValidate())
                .ForSourceMember(src => src.AssignedRole, opt => opt.DoNotValidate());

            CreateMap<UpdateProjectDto, Project>();
       
            CreateMap<CreateAssignmentDto, ProjectAssignment>();
            CreateMap<UpdateAssignmentDto, ProjectAssignment>(); // Map only non-null fields
            CreateMap<ProjectAssignment, AssignmentDto>()
                .ForMember(dest => dest.ProjectName, opt => opt.MapFrom(src => src.Project.ProjectName))
                //.ForMember(dest => dest.Priority, opt => opt.MapFrom(src => src.Project.Priority))
                //.ForMember(dest => dest.DueDate, opt => opt.MapFrom(src => src.Project.DueDate))
                
                .ForMember(dest => dest.MemberFullName, opt => opt.MapFrom(src => src.Member.FullName))
                .ForMember(dest => dest.MemberId, opt => opt.MapFrom(src => src.Member.EmployeeId));
            CreateMap<CreateMessageDto, Message>();
            CreateMap<Message, MessageDto>()
            .ForMember(dest => dest.SenderName, opt => opt.MapFrom(src => src.Sender.FullName))
            .ForMember(dest => dest.EmployeeId, opt => opt.MapFrom(src => src.Sender.EmployeeId));

            CreateMap<CreateMilestoneDto, Milestone>();
            CreateMap<Milestone, MilestoneReadDto>();
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

            
        }

    }
}

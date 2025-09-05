using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using ProjectManagementSystem1.Controllers;
using ProjectManagementSystem1.Model.Dto.Common;
using ProjectManagementSystem1.Model.Dto.ProjectManagementDto;
using ProjectManagementSystem1.Model.Entities;
using ProjectManagementSystem1.Services.ProjectService;
using System.Security.Claims;
using Xunit;

namespace Backend.Tests.Unit
{
    /// <summary>
    /// Unit tests for ProjectController.
    /// </summary>
    public class ProjectControllerTests
    {
        private readonly Mock<IProjectService> _mockProjectService;
        private readonly Mock<ILogger<ProjectController>> _mockLogger;
        private readonly ProjectController _controller;

        public ProjectControllerTests()
        {
            _mockProjectService = new Mock<IProjectService>();
            _mockLogger = new Mock<ILogger<ProjectController>>();
            _controller = new ProjectController(_mockLogger.Object, _mockProjectService.Object);
        }

        [Fact]
        public async Task GetProjects_ReturnsOkResult_WithProjects()
        {
            // Arrange
            var projects = new List<Project>
            {
                new Project { Id = 1, ProjectName = "Test Project 1", Description = "Test Description 1" },
                new Project { Id = 2, ProjectName = "Test Project 2", Description = "Test Description 2" }
            };

            var paginatedResponse = new PaginatedResponse<Project>
            {
                Data = projects,
                PageNumber = 1,
                PageSize = 10,
                TotalCount = 2,
                TotalPages = 1
            };

            _mockProjectService.Setup(x => x.GetProjectsAsync(1, 10))
                .ReturnsAsync(paginatedResponse);

            // Act
            var result = await _controller.GetProjects(1, 10);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var apiResponse = Assert.IsType<ApiResponse<PaginatedResponse<Project>>>(okResult.Value);
            Assert.True(apiResponse.Success);
            Assert.Equal(2, apiResponse.Data.TotalCount);
            Assert.Equal(2, apiResponse.Data.Data.Count());
        }

        [Fact]
        public async Task GetProject_WithValidId_ReturnsOkResult()
        {
            // Arrange
            var project = new Project { Id = 1, ProjectName = "Test Project", Description = "Test Description" };
            _mockProjectService.Setup(x => x.GetProjectByIdAsync(1))
                .ReturnsAsync(project);

            // Act
            var result = await _controller.GetProject(1);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var apiResponse = Assert.IsType<ApiResponse<Project>>(okResult.Value);
            Assert.True(apiResponse.Success);
            Assert.Equal(1, apiResponse.Data.Id);
            Assert.Equal("Test Project", apiResponse.Data.ProjectName);
        }

        [Fact]
        public async Task GetProject_WithInvalidId_ReturnsNotFound()
        {
            // Arrange
            _mockProjectService.Setup(x => x.GetProjectByIdAsync(999))
                .ReturnsAsync((Project?)null);

            // Act
            var result = await _controller.GetProject(999);

            // Assert
            var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
            var apiResponse = Assert.IsType<ApiResponse<object>>(notFoundResult.Value);
            Assert.False(apiResponse.Success);
            Assert.Contains("not found", apiResponse.Message.ToLower());
        }

        [Fact]
        public async Task CreateProject_WithValidData_ReturnsCreatedResult()
        {
            // Arrange
            var createDto = new CreateProjectDto
            {
                ProjectName = "New Project",
                Description = "New Project Description",
                StartDate = DateTime.UtcNow.AddDays(1),
                EndDate = DateTime.UtcNow.AddDays(30),
                Budget = 10000,
                Status = ProjectStatus.Planning
            };

            var createdProject = new Project
            {
                Id = 1,
                ProjectName = createDto.ProjectName,
                Description = createDto.Description,
                StartDate = createDto.StartDate,
                EndDate = createDto.EndDate,
                Budget = createDto.Budget,
                Status = createDto.Status
            };

            _mockProjectService.Setup(x => x.CreateProjectAsync(It.IsAny<CreateProjectDto>()))
                .ReturnsAsync(createdProject);

            // Act
            var result = await _controller.CreateProject(createDto);

            // Assert
            var createdResult = Assert.IsType<CreatedAtActionResult>(result);
            var apiResponse = Assert.IsType<ApiResponse<Project>>(createdResult.Value);
            Assert.True(apiResponse.Success);
            Assert.Equal(1, apiResponse.Data.Id);
            Assert.Equal("New Project", apiResponse.Data.ProjectName);
        }

        [Fact]
        public async Task UpdateProject_WithValidData_ReturnsNoContent()
        {
            // Arrange
            var updateDto = new UpdateProjectDto
            {
                ProjectName = "Updated Project",
                Description = "Updated Description",
                Status = ProjectStatus.InProgress
            };

            _mockProjectService.Setup(x => x.UpdateProjectAsync(1, It.IsAny<UpdateProjectDto>()))
                .ReturnsAsync(true);

            // Act
            var result = await _controller.UpdateProject(1, updateDto);

            // Assert
            var noContentResult = Assert.IsType<NoContentResult>(result);
        }

        [Fact]
        public async Task UpdateProject_WithInvalidId_ReturnsNotFound()
        {
            // Arrange
            var updateDto = new UpdateProjectDto
            {
                ProjectName = "Updated Project",
                Description = "Updated Description"
            };

            _mockProjectService.Setup(x => x.UpdateProjectAsync(999, It.IsAny<UpdateProjectDto>()))
                .ReturnsAsync(false);

            // Act
            var result = await _controller.UpdateProject(999, updateDto);

            // Assert
            var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
            var apiResponse = Assert.IsType<ApiResponse<object>>(notFoundResult.Value);
            Assert.False(apiResponse.Success);
        }

        [Fact]
        public async Task DeleteProject_WithValidId_ReturnsNoContent()
        {
            // Arrange
            _mockProjectService.Setup(x => x.DeleteProjectAsync(1))
                .ReturnsAsync(true);

            // Act
            var result = await _controller.DeleteProject(1);

            // Assert
            var noContentResult = Assert.IsType<NoContentResult>(result);
        }

        [Fact]
        public async Task DeleteProject_WithInvalidId_ReturnsNotFound()
        {
            // Arrange
            _mockProjectService.Setup(x => x.DeleteProjectAsync(999))
                .ReturnsAsync(false);

            // Act
            var result = await _controller.DeleteProject(999);

            // Assert
            var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
            var apiResponse = Assert.IsType<ApiResponse<object>>(notFoundResult.Value);
            Assert.False(apiResponse.Success);
        }

        [Fact]
        public async Task GetProjects_WithInvalidPageNumber_ReturnsBadRequest()
        {
            // Act
            var result = await _controller.GetProjects(0, 10);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            var apiResponse = Assert.IsType<ApiResponse<object>>(badRequestResult.Value);
            Assert.False(apiResponse.Success);
        }

        [Fact]
        public async Task GetProjects_WithInvalidPageSize_ReturnsBadRequest()
        {
            // Act
            var result = await _controller.GetProjects(1, 0);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            var apiResponse = Assert.IsType<ApiResponse<object>>(badRequestResult.Value);
            Assert.False(apiResponse.Success);
        }

        [Fact]
        public async Task CreateProject_WithInvalidModelState_ReturnsBadRequest()
        {
            // Arrange
            var createDto = new CreateProjectDto(); // Invalid - missing required fields
            _controller.ModelState.AddModelError("ProjectName", "Project name is required");

            // Act
            var result = await _controller.CreateProject(createDto);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            var apiResponse = Assert.IsType<ApiResponse<object>>(badRequestResult.Value);
            Assert.False(apiResponse.Success);
        }
    }
}


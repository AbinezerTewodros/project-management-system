using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model.Dto.ProjectManagementDto;
using ProjectManagementSystem1.Model.Entities;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace Backend.Tests.Integration
{
    /// <summary>
    /// Integration tests for ProjectController.
    /// </summary>
    public class ProjectControllerIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
    {
        private readonly WebApplicationFactory<Program> _factory;
        private readonly HttpClient _client;

        public ProjectControllerIntegrationTests(WebApplicationFactory<Program> factory)
        {
            _factory = factory.WithWebHostBuilder(builder =>
            {
                builder.ConfigureServices(services =>
                {
                    // Replace the database context with an in-memory database
                    var descriptor = services.SingleOrDefault(
                        d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));

                    if (descriptor != null)
                    {
                        services.Remove(descriptor);
                    }

                    services.AddDbContext<AppDbContext>(options =>
                    {
                        options.UseInMemoryDatabase("TestDatabase");
                    });

                    // Create a new service provider
                    var serviceProvider = services.BuildServiceProvider();

                    // Create a scope to obtain a reference to the database context
                    using var scope = serviceProvider.CreateScope();
                    var scopedServices = scope.ServiceProvider;
                    var db = scopedServices.GetRequiredService<AppDbContext>();

                    // Ensure the database is created
                    db.Database.EnsureCreated();

                    try
                    {
                        // Seed the database with test data
                        SeedTestData(db);
                    }
                    catch (Exception ex)
                    {
                        // Log the error
                        Console.WriteLine($"An error occurred seeding the database: {ex.Message}");
                    }
                });
            });

            _client = _factory.CreateClient();
        }

        private void SeedTestData(AppDbContext context)
        {
            // Add test projects
            var projects = new List<Project>
            {
                new Project
                {
                    Id = 1,
                    ProjectName = "Test Project 1",
                    Description = "Test Description 1",
                    StartDate = DateTime.UtcNow.AddDays(1),
                    EndDate = DateTime.UtcNow.AddDays(30),
                    Budget = 10000,
                    Status = ProjectStatus.Planning,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Project
                {
                    Id = 2,
                    ProjectName = "Test Project 2",
                    Description = "Test Description 2",
                    StartDate = DateTime.UtcNow.AddDays(1),
                    EndDate = DateTime.UtcNow.AddDays(60),
                    Budget = 20000,
                    Status = ProjectStatus.InProgress,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                }
            };

            context.Projects.AddRange(projects);
            context.SaveChanges();
        }

        [Fact]
        public async Task GetProjects_ReturnsSuccessStatusCode()
        {
            // Act
            var response = await _client.GetAsync("/api/Project?pageNumber=1&pageSize=10");

            // Assert
            response.EnsureSuccessStatusCode();
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task GetProjects_ReturnsCorrectContentType()
        {
            // Act
            var response = await _client.GetAsync("/api/Project?pageNumber=1&pageSize=10");

            // Assert
            response.EnsureSuccessStatusCode();
            Assert.Equal("application/json; charset=utf-8", response.Content.Headers.ContentType?.ToString());
        }

        [Fact]
        public async Task GetProjects_ReturnsProjectsList()
        {
            // Act
            var response = await _client.GetAsync("/api/Project?pageNumber=1&pageSize=10");
            var content = await response.Content.ReadAsStringAsync();

            // Assert
            response.EnsureSuccessStatusCode();
            Assert.Contains("Test Project 1", content);
            Assert.Contains("Test Project 2", content);
        }

        [Fact]
        public async Task GetProject_WithValidId_ReturnsProject()
        {
            // Act
            var response = await _client.GetAsync("/api/Project/1");
            var content = await response.Content.ReadAsStringAsync();

            // Assert
            response.EnsureSuccessStatusCode();
            Assert.Contains("Test Project 1", content);
            Assert.Contains("Test Description 1", content);
        }

        [Fact]
        public async Task GetProject_WithInvalidId_ReturnsNotFound()
        {
            // Act
            var response = await _client.GetAsync("/api/Project/999");

            // Assert
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Fact]
        public async Task CreateProject_WithValidData_ReturnsCreated()
        {
            // Arrange
            var createDto = new CreateProjectDto
            {
                ProjectName = "New Integration Test Project",
                Description = "New Integration Test Description",
                StartDate = DateTime.UtcNow.AddDays(1),
                EndDate = DateTime.UtcNow.AddDays(30),
                Budget = 15000,
                Status = ProjectStatus.Planning
            };

            // Act
            var response = await _client.PostAsJsonAsync("/api/Project", createDto);
            var content = await response.Content.ReadAsStringAsync();

            // Assert
            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
            Assert.Contains("New Integration Test Project", content);
        }

        [Fact]
        public async Task CreateProject_WithInvalidData_ReturnsBadRequest()
        {
            // Arrange
            var createDto = new CreateProjectDto
            {
                // Missing required fields
                Description = "Invalid Project"
            };

            // Act
            var response = await _client.PostAsJsonAsync("/api/Project", createDto);

            // Assert
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        [Fact]
        public async Task UpdateProject_WithValidData_ReturnsNoContent()
        {
            // Arrange
            var updateDto = new UpdateProjectDto
            {
                ProjectName = "Updated Integration Test Project",
                Description = "Updated Integration Test Description",
                Status = ProjectStatus.InProgress
            };

            // Act
            var response = await _client.PutAsJsonAsync("/api/Project/1", updateDto);

            // Assert
            Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
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

            // Act
            var response = await _client.PutAsJsonAsync("/api/Project/999", updateDto);

            // Assert
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Fact]
        public async Task DeleteProject_WithValidId_ReturnsNoContent()
        {
            // Act
            var response = await _client.DeleteAsync("/api/Project/2");

            // Assert
            Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        }

        [Fact]
        public async Task DeleteProject_WithInvalidId_ReturnsNotFound()
        {
            // Act
            var response = await _client.DeleteAsync("/api/Project/999");

            // Assert
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Fact]
        public async Task GetProjects_WithInvalidPageNumber_ReturnsBadRequest()
        {
            // Act
            var response = await _client.GetAsync("/api/Project?pageNumber=0&pageSize=10");

            // Assert
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        [Fact]
        public async Task GetProjects_WithInvalidPageSize_ReturnsBadRequest()
        {
            // Act
            var response = await _client.GetAsync("/api/Project?pageNumber=1&pageSize=0");

            // Assert
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        [Fact]
        public async Task GetProjects_WithPagination_ReturnsCorrectMetadata()
        {
            // Act
            var response = await _client.GetAsync("/api/Project?pageNumber=1&pageSize=1");
            var content = await response.Content.ReadAsStringAsync();

            // Assert
            response.EnsureSuccessStatusCode();
            Assert.Contains("pageNumber", content);
            Assert.Contains("pageSize", content);
            Assert.Contains("totalCount", content);
            Assert.Contains("totalPages", content);
        }

        [Fact]
        public async Task ApiResponse_ContainsExpectedStructure()
        {
            // Act
            var response = await _client.GetAsync("/api/Project/1");
            var content = await response.Content.ReadAsStringAsync();

            // Assert
            response.EnsureSuccessStatusCode();
            Assert.Contains("success", content);
            Assert.Contains("message", content);
            Assert.Contains("data", content);
        }
    }
}


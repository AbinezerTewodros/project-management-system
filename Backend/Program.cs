using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Helpers;
using ProjectManagementSystem1.Middleware;
using ProjectManagementSystem1.Model.Dto.UserManagementDto;
using ProjectManagementSystem1.Model.Entities;
using ProjectManagementSystem1.Services;
using ProjectManagementSystem1.Services.Background;
using Scalar.AspNetCore;
using System.Text.Json.Serialization;
using System.Security.Claims;
using System.Text;
using MailKit.Net.Smtp;
using MimeKit;
using Microsoft.Extensions.Configuration;
using ProjectManagementSystem1.Services.AttachmentService;
using ProjectManagementSystem1.Services.TodoItems;
using ProjectManagementSystem1.Services.TodoItemService;
using Hangfire;
using Hangfire.SqlServer;

using ProjectManagementSystem1.Configuration;
using ProjectManagementSystem1.Services.MilestoneService;
using ProjectManagementSystem1.Services.CommentService;
using ProjectManagementSystem1.Services.ProjectService;
using ProjectManagementSystem1.Services.ProjectTaskService;
using ProjectManagementSystem1.Services.MessageService;
using ProjectManagementSystem1.Services.NotificationService;
using ProjectManagementSystem1.Services.ADService;
using ProjectManagementSystem1.Services.UserService;
using ProjectManagementSystem1.Services.AuthService;
using ProjectManagementSystem1.Services.JwtService;
using ProjectManagementSystem1.Data.Seeders;
using ProjectManagementSystem1.Services.Activators;
using ProjectManagementSystem1.Services.ErpUserService;
using ProjectManagementSystem1.Services.IssueService;
using ProjectManagementSystem1.Services.FileStorageService;
using ProjectManagementSystem1.Services.AttachmentDownloadSercvice;
using ProjectManagementSystem1.Services.ResourceAcessService;
using ProjectManagementSystem1.Services.Validation;
using ProjectManagementSystem1.Services.AddSkillService;
using ProjectManagementSystem1.Services.Common;
using ProjectManagementSystem1.Services.ReportService;
using ProjectManagementSystem1.Services.AccessControl;
using System.Net.Http.Headers;
using System.Threading.RateLimiting;
using System.Net.Http; // For HttpResponseMessage
using Polly; // For IAsyncPolicy, Policy
using Polly.Extensions.Http; // For HttpPolicyExtensions
using Microsoft.Extensions.Http; // For HttpClient builder extensions
//using ProjectManagementSystem1.Services.ThumbnailService;
using ProjectManagementSystem1.Services.UserProfile;
using ProjectManagementSystem1.Services.CascadedFilterService;
using ProjectManagementSystem1.Services.AccessLogService;
using ProjectManagementSystem1.Services.TaskDependencyService;
using ProjectManagementSystem1.Services.Background;
using ProjectManagementSystem1.Services.BackgroundJobs;
using ProjectManagementSystem1.Services.BackgroundJobs.Jobs;
using ProjectManagementSystem1.Services.EmailService;
using ProjectManagementSystem1.Services.CacheService;
using ProjectManagementSystem1.Services.FileOperationsService;
using ProjectManagementSystem1.Services.DataProcessingService;
using AutoMapper;
using Microsoft.AspNetCore.Mvc.Authorization;
using System.Reflection;




var builder = WebApplication.CreateBuilder(args);

builder.WebHost.ConfigureLogging(logging =>
{
    logging.ClearProviders();
    logging.AddConsole();
    logging.AddDebug();
    logging.SetMinimumLevel(LogLevel.Trace);
});

builder.Services.AddMemoryCache();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    // Password Settings customize
    options.Password.RequireDigit = false;
    options.Password.RequiredLength = 6;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = false;
    options.Password.RequireLowercase = false;

    // Lockout Settings
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
    options.Lockout.MaxFailedAccessAttempts = 5;

    // User settings
    options.User.RequireUniqueEmail = true;
})
.AddEntityFrameworkStores<AppDbContext>()
.AddDefaultTokenProviders();

builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IADService, ADService>();
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddHostedService<RefreshTokenCleanupService>();
builder.Services.AddScoped<IProjectService, ProjectService>();
builder.Services.AddScoped<IProjectApprovalService, ProjectApprovalService>();
builder.Services.AddScoped<IEnhancedAssignmentService, EnhancedAssignmentService>();
builder.Services.AddAutoMapper(typeof(MappingProfile));
builder.Services.AddScoped<IProjectAssignmentService, ProjectAssignmentService>();
builder.Services.AddScoped<IMilestoneService, MilestoneService>();
builder.Services.AddScoped<IProjectTaskService, ProjectTaskService>();
builder.Services.AddScoped<ITaskValidationService, TaskValidationService>();
builder.Services.AddScoped<ITaskHierarchyService, TaskHierarchyService>();
// TaskAssignmentService removed as it doesn't exist
builder.Services.AddScoped<ICommentService, CommentService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IAttachmentService, AttachmentService>();
builder.Services.AddScoped<ITodoItemService, TodoItemService>();
builder.Services.AddScoped<IMessageService, MessageService>();
builder.Services.AddScoped<IActivityLogService, ActivityLogService>();
builder.Services.AddScoped<IIndependentTaskService, IndependentTaskService>();
builder.Services.AddScoped<IPersonalTodoService, PersonalTodoService>();
builder.Services.AddScoped<IBulkOperationsService, BulkOperationsService>();
builder.Services.AddScoped<IFileOperationsService, FileOperationsService>();
builder.Services.AddScoped<IAccessControlService, AccessControlService>();
builder.Services.AddScoped<IDataProcessingService, DataProcessingService>();
builder.Services.AddScoped<IProjectMemberService, ProjectMemberService>();
builder.Services.AddHttpContextAccessor();
builder.Services.AddDistributedMemoryCache();
builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromMinutes(30);
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
});
//builder.Services.AddHttpClient(); // for HttpClient injection
builder.Services.AddScoped<IErpUserService, ErpUserService>();
builder.Services.AddScoped<IIssueService, IssueService>();
builder.Services.AddScoped<IADAuthService, ADAuthService>();
builder.Services.AddScoped<IMilestoneTaskValidator, MilestoneTaskValidator>();
builder.Services.AddScoped<MilestoneTaskValidator>();
// Add this where you configure services
builder.Services.AddScoped<DownloadTokenService>();
builder.Services.AddScoped<IFileStorageService, LocalFileStorageService>();
builder.Services.AddScoped<IEntityValidator,  EntityValidator>();
//builder.Services.AddScoped<IThumbnailGeneratorService, ThumbnailGeneratorService>();

builder.Services.AddScoped<IBackgroundJobService, BackgroundJobService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<ICacheService, MemoryCacheService>();

// Add new Phase 1 services
builder.Services.AddScoped<IPaginationService, PaginationService>();
builder.Services.AddScoped<IAttachmentPreviewService, AttachmentPreviewService>();

// Add Phase 2C: Advanced Filtering Service
builder.Services.AddScoped<IAdvancedFilterService, AdvancedFilterService>();

// Add Phase 2D: Report Service
builder.Services.AddScoped<IReportService, ReportService>();

builder.Services.AddScoped<ISkillService, SkillService>();
builder.Services.AddScoped<SkillDataSeeder>();
builder.Services.AddHostedService<SkillUpdateBackgroundService>();

builder.Services.AddScoped<IUserProfileService, UserProfileService>();
        builder.Services.AddScoped<ICascadedFilterService, CascadedFilterService>();
        builder.Services.AddScoped<IAccessLogService, AccessLogService>();
        builder.Services.AddScoped<ITaskDependencyService, TaskDependencyService>();
        
        // Register background job services
        builder.Services.AddScoped<PersonalTodoReminderJob>();
        builder.Services.AddScoped<EmailNotificationJob>();
        builder.Services.AddScoped<DataExportJob>();
        builder.Services.AddScoped<PersonalTodoReminderJob>();

        // Configure logging options
        builder.Services.Configure<LoggingOptions>(builder.Configuration.GetSection("Logging:RequestResponse"));
        
        // Configure cache options
        builder.Services.Configure<CacheOptions>(builder.Configuration.GetSection("Cache"));
        
        // Configure background job options
        builder.Services.Configure<BackgroundJobOptions>(builder.Configuration.GetSection("BackgroundJobs"));

builder.Services.Configure<SmtpSettings>(builder.Configuration.GetSection("Smtp"));
// Add services to the container.

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontendDev", policy =>
    {
        policy.WithOrigins("http://localhost:5173") // Vite dev server
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials(); // if cookies/auth are used

       
    });
});

builder.Services.AddControllers(options =>
{
    options.Filters.Add(new AuthorizeFilter()); // ? This enforces auth globally
});

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
//builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
// Add Hangfire services.
builder.Services.AddHangfire(configuration => configuration
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UseSqlServerStorage(builder.Configuration.GetConnectionString("DefaultConnection"), new SqlServerStorageOptions
    {
        CommandBatchMaxTimeout = TimeSpan.FromMinutes(5),
        SlidingInvisibilityTimeout = TimeSpan.FromMinutes(5),
        QueuePollInterval = TimeSpan.Zero,
        UseRecommendedIsolationLevel = true,
        DisableGlobalLocks = true
    }));

// GlobalConfiguration.Configuration.UseActivator(new HangfireActivator(builder.Services.BuildServiceProvider()));
// Add the processing server as IHostedService
builder.Services.AddHangfireServer(options =>
{
    options.WorkerCount = 5; // Reduced from 10 to 5 for better resource management
    options.Queues = new[] { "high", "default", "low" }; // Reordered for priority
    options.ServerTimeout = TimeSpan.FromMinutes(5);
    options.HeartbeatInterval = TimeSpan.FromSeconds(30);
});

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Project Management System API",
        Version = "v1",
        Description = "A comprehensive API for managing projects, tasks, and team collaboration.",
        Contact = new OpenApiContact
        {
            Name = "API Support",
            Email = "support@projectmanagement.com"
        }
    });

    // Include XML comments
    var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
    {
        c.IncludeXmlComments(xmlPath);
    }

    c.CustomSchemaIds(type => type.FullName);
    c.IgnoreObsoleteProperties();

    // ?? JWT Bearer Auth Setup
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter your JWT token in the format: Bearer {your token}"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] { }
        }
    });
    c.UseAllOfToExtendReferenceSchemas();
    c.CustomSchemaIds(type => type.FullName);
    c.IgnoreObsoleteProperties();
    //c.SchemaFilter<EnumSchemaFilter>(); 
});

builder.Services.AddHttpClient("EscoClient", client =>
{
    client.BaseAddress = new Uri("https://ec.europa.eu/esco/api/");
    client.DefaultRequestHeaders.Accept.Add(
        new MediaTypeWithQualityHeaderValue("application/json"));
    client.Timeout = TimeSpan.FromSeconds(30);
});


builder.Services.AddRateLimiter(options =>
{
    options.AddPolicy("EscoApiPolicy", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString(),
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 100,
                Window = TimeSpan.FromMinutes(1)
            }));
});



var jwtSection = builder.Configuration.GetSection("JwtSettings");

if (!jwtSection.Exists() || string.IsNullOrEmpty(jwtSection["SecretKey"]))
{
    throw new ApplicationException("Missing or invalid JWT configuration");
}

if (string.IsNullOrEmpty(jwtSection["SecretKey"]))
    throw new Exception("JWT SecretKey is missing in appsettings.json");

builder.Services.Configure<JwtSettings>(jwtSection);

var jwtSettings = jwtSection.Get<JwtSettings>();
var key = Encoding.ASCII.GetBytes(jwtSettings.SecretKey);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false; // Changed to false for HTTP development
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidIssuer = jwtSettings.Issuer,
        ValidAudience = jwtSettings.Audience,
        ValidateLifetime = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuerSigningKey = true
    };
});

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireClaim(ClaimTypes.Role, "Admin"));
    options.AddPolicy("ManagerOnly", policy => policy.RequireClaim(ClaimTypes.Role, "Manager"));
    options.AddPolicy("SupervisorOnly", policy => policy.RequireClaim(ClaimTypes.Role, "Supervisor"));
    options.AddPolicy("UserOnly", policy => policy.RequireClaim(ClaimTypes.Role, "User"));

    // Composite examples:
    options.AddPolicy("AdminOrManager", policy =>
        policy.RequireAssertion(context =>
        context.User.HasClaim(c => c.Type == ClaimTypes.Role && (c.Value == "Admin" || c.Value == "Manager"))
    ));
});

var mapperConfig = new MapperConfiguration(cfg =>
{
    cfg.AddProfile<MappingProfile>();
});


builder.Services.AddSingleton(mapperConfig.CreateMapper());

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    try
    {
        var canConnect = await db.Database.CanConnectAsync();
        Console.WriteLine($"Database connection test: {canConnect}");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"DATABASE CONNECTION FAILED: {ex.Message}");
    }
}

// Temporarily disabled skill seeding for testing
/*
using (var scope = app.Services.CreateScope())
{
    var seeder = scope.ServiceProvider.GetRequiredService<SkillDataSeeder>();
    await seeder.SeedAsync(); // Make sure this runs
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var skillCount = await db.AddSkills.CountAsync();
    Console.WriteLine($"Database contains {skillCount} skills"); // Should be > 0
}
*/

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    await RoleSeeder.SeedRolesAsync(services); //Seed Roles
    await AdminSeeder.SeedAdminAsync(services); //Seed Admin
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapScalarApiReference();
    app.MapOpenApi();
}

app.UseHangfireDashboard("/hangfire", new DashboardOptions
{
    DashboardTitle = "Project Management System - Job Dashboard"
});

// Configure recurring jobs for PersonalTodo reminders and overdue status updates
using (var scope = app.Services.CreateScope())
{
    var reminderJob = scope.ServiceProvider.GetRequiredService<PersonalTodoReminderJob>();
    
    // Schedule reminder processing every hour
    RecurringJob.AddOrUpdate(
        "personal-todo-reminders",
        () => reminderJob.ProcessRemindersAsync(),
        "0 * * * *");
    
    // Schedule overdue status updates every 6 hours
    RecurringJob.AddOrUpdate(
        "personal-todo-overdue-updates",
        () => reminderJob.UpdateOverdueStatusAsync(),
        "0 */6 * * *");
    
    Console.WriteLine("PersonalTodo recurring jobs configured successfully");
}
app.UseExceptionHandler("/error");
app.UseStatusCodePagesWithReExecute("/error/{0}");
//app.UseMiddleware<JwtErrorHandlingMiddleware>();

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Project Management System API V1");
    c.RoutePrefix = string.Empty; // Set Swagger UI at the app's root
    c.ConfigObject.TryItOutEnabled = true;
    c.ConfigObject.DeepLinking = true;
    c.DocumentTitle = "Project Management System API";
    c.DefaultModelsExpandDepth(-1); // Hide models section by default
});

// app.UseHttpsRedirection(); // Disabled for development to avoid SSL issues
app.UseRateLimiter();

// Add session middleware before other middleware that might need it
app.UseSession();

app.UseRequestResponseLogging();
app.UseGlobalExceptionHandling();
app.UseMiddleware<AccessLoggingMiddleware>();
app.UseCors("AllowFrontendDev");

app.UseAuthentication();
app.UseAuthorization();



app.MapControllers();

// Add this before app.Run()
app.Use(async (context, next) =>
{
    try
    {
        await next();
    }
    catch (Exception ex)
    {
        Console.WriteLine($"UNHANDLED EXCEPTION: {ex}");
        throw;
    }
});

// Test endpoint
app.MapGet("/test", () => "API is running");

app.Run();

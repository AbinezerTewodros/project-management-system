using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using ProjectManagementSystem1.Model.Entities;
using System.Reflection.Emit;

namespace ProjectManagementSystem1.Data
{
    public class AppDbContext : IdentityDbContext<ApplicationUser>
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
        public DbSet<UserAccessToken> UserAccessTokens { get; set; }
        public DbSet<RefreshToken> RefreshTokens { get; set; }
        public DbSet<Project> Projects { get; set; }
        public DbSet<ProjectAssignment> ProjectAssignments { get; set; }
        public DbSet<Message> Messages { get; set; }
        public DbSet<Milestone> Milestones { get; set; }
        public DbSet<ProjectTask> ProjectTasks { get; set; }
        public DbSet<TodoItem> TodoItems { get; set; }
        public DbSet<Comment> Comments { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        //public DbSet<ProjectGoal> ProjectGoals { get; set; }
        public DbSet<Attachment> Attachments { get; set; }
        public DbSet<AttachmentPermission> AttachmentPermissions { get; set; }
        public DbSet<ActivityLog> ActivityLogs { get; set; }
        //public DbSet<TaskDependency> TaskDependencies { get; set; }
        public DbSet<ErpUser> ErpUsers { get; set; }
        public DbSet<MessageReadStatus> MessageReadStatuses { get; set; }

        public DbSet<Issue> Issues { get; set; }


        public DbSet<IndependentTask> IndependentTasks { get; set; }
        public DbSet<PersonalTodo> PersonalTodo { get; set; }
        public DbSet<AddSkill> AddSkills { get; set; }
        public DbSet<UserSkill> UserSkills { get; set; }
        public object TaskAssignments { get; internal set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            // ProjectTask relationships
            modelBuilder.Entity<ProjectTask>(entity =>
            {
                // Link to ProjectAssignment (required)
                entity.HasOne(t => t.ProjectAssignment)
                            .WithMany(pa => pa.Tasks) // Add this navigation property
                            .HasForeignKey(t => t.ProjectAssignmentId)
                            .OnDelete(DeleteBehavior.Restrict);

                // Self-referential hierarchy
                entity.HasOne(t => t.ParentTask)
                    .WithMany(t => t.SubTasks)
                    .HasForeignKey(t => t.ParentTaskId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

           
            modelBuilder.Entity<AttachmentPermission>(entity =>
            {
                entity.HasOne(ap => ap.Attachment)
                .WithMany()
                .HasForeignKey(ap => ap.AttachmentId)
                .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(ap => ap.User)
                .WithMany()
                .HasForeignKey(ap => ap.UserId)
                .OnDelete(DeleteBehavior.NoAction);

                entity.HasOne(ap => ap.Role)
                .WithMany()
                .HasForeignKey(ap => ap.RoleId)
                .OnDelete(DeleteBehavior.NoAction);
            });


            modelBuilder.Entity<Attachment>()
                .HasOne(a => a.UploadedBy)
                .WithMany()
                .HasForeignKey(a => a.UploadedByUserId)
                .OnDelete(DeleteBehavior.NoAction);

            //modelBuilder.Entity<Attachment>()
            // .OwnsMany(a => a.Metadata, m =>
            // {
            //     m.WithOwner().HasForeignKey("AttachmentId");
            //     m.Property<Guid>("Id"); // Shadow PK
            //     m.HasKey("Id");
            // });

            modelBuilder.Entity<Attachment>()
            .OwnsMany(a => a.Metadata, m =>
            {
                m.ToTable("AttachmentMetadata");
                m.WithOwner().HasForeignKey("AttachmentId");
                m.Property<Guid>("Id"); // Shadow PK
                m.HasKey("Id");
                m.Property(m => m.Key).HasMaxLength(100);
                m.Property(m => m.Value).HasMaxLength(100);
                m.HasIndex(x => new { x.Key, x.Value }); // Composite index
            });

            //modelBuilder.Entity<AttachmentMetadata>()
            //    .HasIndex(m => new { m.Key, m.Value });

            modelBuilder.Entity<IndependentTask>()
                .HasOne(t => t.CreatedByUser)
                .WithMany()
                .HasForeignKey(t => t.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<IndependentTask>()
                .HasOne(t => t.AssignedToUser)
                .WithMany()
                .HasForeignKey(t => t.AssignedToUserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<PersonalTodo>()
                .HasOne(pt => pt.User)
                .WithMany() // Or a navigation property in ApplicationUser
                .HasForeignKey(pt => pt.UserId)
                .OnDelete(DeleteBehavior.Restrict); // Or DeleteBehavior.NoAction

            modelBuilder.Entity<MessageReadStatus>()
                .HasOne(mrs => mrs.Message)
                .WithMany(m => m.ReadStatuses)
                .HasForeignKey(mrs => mrs.MessageId)
                .OnDelete(DeleteBehavior.Restrict); // 👈 prevent cascade delete


            modelBuilder.Entity<MessageReadStatus>()
                .HasOne(mrs => mrs.User)
                .WithMany()
                .HasForeignKey(mrs => mrs.UserId)
                .OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<Issue>()
                .HasKey(i => i.Id); // Defines Id as the primary key

            modelBuilder.Entity<Issue>()
                .Property(i => i.Id)
                .ValueGeneratedOnAdd();

            modelBuilder.Entity<Issue>()
                .HasOne(i => i.Project)
                .WithMany(p => p.Issues) // Assuming Project has a collection of Issues
                .HasForeignKey(i => i.ProjectId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Issue>()
                .HasMany(i => i.ProjectTasks)
                .WithOne(pt => pt.Issue) // Assuming ProjectTask has a navigation property for Issue
                .HasForeignKey(pt => pt.IssueId) // Foreign key in ProjectTask
                .OnDelete(DeleteBehavior.Cascade); // Or another behavior you prefer

            modelBuilder.Entity<Issue>()
                .HasMany(i => i.IndependentTasks)
                .WithOne(it => it.Issue) // Assuming IndependentTask has a navigation property for Issue
                .HasForeignKey(it => it.IssueId) // Foreign key in IndependentTask
                .OnDelete(DeleteBehavior.Cascade); // Or another behavior you prefer

            // In your DbContext's OnModelCreating
            modelBuilder.Entity<ProjectTask>()
                .HasIndex(t => t.Status);

            modelBuilder.Entity<ProjectTask>()
               .HasIndex(t => t.ProjectAssignmentId)
               .HasDatabaseName("IX_ProjectTask_Assignment");

            modelBuilder.Entity<ProjectTask>()
                .HasIndex(t => t.AssignedMemberId)
                .HasDatabaseName("IX_ProjectTask_Assignee");

            modelBuilder.Entity<ProjectTask>(entity =>
            {
                entity.Property(p => p.Description)
                    .HasColumnName("Description") // Ensure column name matches
                    .HasColumnType("nvarchar(max)"); // Use appropriate data type
            });

            modelBuilder.Entity<TodoItem>(entity =>
            {
                entity.HasOne(t => t.ProjectTask)
                      .WithMany(p => p.TodoItems)
                      .HasForeignKey(t => t.ProjectTaskId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<TodoItem>()
             .HasIndex(t => t.Status);

            // In your DbContext's OnModelCreating
            modelBuilder.Entity<ProjectTask>(entity =>
            {
                entity.Property(p => p.Description)
                .HasColumnType("nvarchar(MAX)")
                .HasMaxLength(4000);

                entity.HasIndex(p => p.ProjectAssignmentId);
                entity.HasIndex(p => p.AssignedMemberId);
                entity.HasIndex(p => p.Status);
                entity.HasIndex(p => p.Priority);
                entity.HasIndex(p => p.DueDate);
            });


            modelBuilder.Entity<UserSkill>()
               .HasKey(us => new { us.UserId, us.SkillId });

            modelBuilder.Entity<UserSkill>()
                .HasOne(us => us.User)
                .WithMany(u => u.UserSkills)
                .HasForeignKey(us => us.UserId)
                .OnDelete(DeleteBehavior.Cascade); // Or Restrict based on your needs

            modelBuilder.Entity<UserSkill>()
                .HasOne(us => us.Skill)
                .WithMany(s => s.UserSkills)
                .HasForeignKey(us => us.SkillId);

            // Index for search optimization
            modelBuilder.Entity<AddSkill>()
                .HasIndex(s => s.NormalizedName);
            // or appropriate type for your DB

            // Prevent circular references via SQL trigger (optional)
            //entity.HasCheckConstraint("CK_NoSelfReference", "ParentTaskId <> Id");

            //// Limit hierarchy depth
            //entity.HasCheckConstraint("CK_MaxDepth", "Depth BETWEEN 0 AND 10");



        }

    }
}

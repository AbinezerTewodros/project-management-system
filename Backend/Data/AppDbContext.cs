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
<<<<<<< HEAD
        public DbSet<ProjectTask> ProjectTasks { get; set; }
        public DbSet<TodoItem> TodoItems { get; set; }
        public DbSet<Comment> Comments { get; set; }
        //public DbSet<StickyNote> StickyNotes { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        //public DbSet<ProjectGoal> ProjectGoals { get; set; }
        public DbSet<Attachment> Attachments { get; set; }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            ModelBuilder.Entity<Project>()
                .HasMany(p => p.Attachments)
                .WithOne(a => a.Project)
                .HasForeignKey(a => a.ProjectId);

            ModelBuilder.Entity<ProjectTask>()
                .HasMany(p => p.Attachments)
                .WithOne(a => a.ProjectTask)
                .HasForeignKey(a => a.ProjectTaskId);
        }
        public DbSet<AttachmentPermission> AttachmentPermissions { get; set; }
        //public DbSet<AttachmentPermission> AttachmentPermissions { get; set; }
=======
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

        public DbSet<IndependentTask> IndependentTasks { get; set; }
        public DbSet<PersonalTodo> PersonalTodo { get; set; }
>>>>>>> 890391528c11f4793f7d61f942815184bf328287
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

            // Prevent circular references via SQL trigger (optional)
            //entity.HasCheckConstraint("CK_NoSelfReference", "ParentTaskId <> Id");

            //// Limit hierarchy depth
            //entity.HasCheckConstraint("CK_MaxDepth", "Depth BETWEEN 0 AND 10");

            modelBuilder.Entity<ProjectTask>()
           .Property(p => p.Version)
           .IsRowVersion();

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

        }


       


        // If you have other tables like RefreshTokens:
        //public DbSet<RefreshToken> RefreshTokens { get; set; }
    }
}

// old code

//using Microsoft.EntityFrameworkCore;
//using ProjectManagementSystem1.Model.Entities;

//namespace ProjectManagementSystem1.Data
//{
//    public class AppDbContext : IdentityDbContext<ApplicationUser>
//    {
//        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

//        public DbSet<User> Users { get; set; }
//        public DbSet<RefreshToken> RefreshTokens { get; set; }

//    }
//}

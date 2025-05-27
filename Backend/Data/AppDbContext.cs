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

        public DbSet<ProjectTask> ProjectTasks { get; set; }
        public DbSet<Comment> Comments { get; set; }
        //public DbSet<ProjectGoal> ProjectGoals { get; set; }
        public DbSet<PersonalMessage> PersonalMessages { get; set; }
        public DbSet<DepartmentalMessage> DepartmentalMessages { get; set; }
        public DbSet<ProjectMessage> ProjectMessages { get; set; }
        public DbSet<Attachment> Attachments { get; set; }
        public DbSet<MessageView> MessageViews { get; set; }

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
                // Example: map MessageView → all message tables via no cascade delete
                modelBuilder.Entity<MessageView>()
                   .HasOne<PersonalMessage>()
                   .WithMany(m => m.Views)
                   .HasForeignKey(v => v.MessageId)
                   .OnDelete(DeleteBehavior.NoAction);
                modelBuilder.Entity<MessageView>()
                   .HasOne<DepartmentalMessage>()
                   .WithMany(m => m.Views)
                   .HasForeignKey(v => v.MessageId)
                   .OnDelete(DeleteBehavior.NoAction);
                modelBuilder.Entity<MessageView>()
                   .HasOne<ProjectMessage>()
                   .WithMany(m => m.Views)
                   .HasForeignKey(v => v.MessageId)
                   .OnDelete(DeleteBehavior.NoAction);
            });

            // Prevent circular references via SQL trigger (optional)
            //entity.HasCheckConstraint("CK_NoSelfReference", "ParentTaskId <> Id");

            //// Limit hierarchy depth
            //entity.HasCheckConstraint("CK_MaxDepth", "Depth BETWEEN 0 AND 10");

       

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
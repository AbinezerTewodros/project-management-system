using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ProjectManagementSystem1.Models.Entities;
using ProjectManagementSystem1.Models.Entities.ProjectRequestEntities;

namespace ProjectManagementSystem1.Data.Configurations
{
    public class ProjectRequestConfiguration : IEntityTypeConfiguration<ProjectRequest>
    {
        public void Configure(EntityTypeBuilder<ProjectRequest> builder)
        {
            // Configure decimal precision
            builder.Property(p => p.EstimatedCost)
                .HasPrecision(18, 2); // 18 total digits, 2 decimal places

            builder.Property(p => p.EstimatedBenefit)
                .HasPrecision(18, 2);

            builder.Property(p => p.TotalScore)
                .HasPrecision(5, 2); // For scores like 85.50

            // Configure string lengths for better performance
            builder.Property(p => p.RequestDescription)
                .HasMaxLength(4000);

            builder.Property(p => p.EvaluationRemarks)
                .HasMaxLength(2000);

            // Configure indexes for better query performance
            builder.HasIndex(p => p.RequestID)
                .IsUnique();

            builder.HasIndex(p => p.Status);

            builder.HasIndex(p => p.CreatedDate);

            builder.HasIndex(p => p.RequestedBy);
        }
    }
}
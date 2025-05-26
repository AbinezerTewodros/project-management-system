using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProjectManagementSystem1.Migrations
{
    /// <inheritdoc />
    public partial class pop6 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "ActualHours",
                table: "ProjectTasks",
                type: "float",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ActualHours",
                table: "ProjectTasks");
        }
    }
}

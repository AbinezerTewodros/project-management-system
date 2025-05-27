using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProjectManagementSystem1.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ProjectTasks_ProjectAssignments_ProjectAssignmentId1",
                table: "ProjectTasks");

            migrationBuilder.DropIndex(
                name: "IX_ProjectTasks_ProjectAssignmentId1",
                table: "ProjectTasks");

            migrationBuilder.DropColumn(
                name: "ProjectAssignmentId1",
                table: "ProjectTasks");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ProjectAssignmentId1",
                table: "ProjectTasks",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProjectTasks_ProjectAssignmentId1",
                table: "ProjectTasks",
                column: "ProjectAssignmentId1");

            migrationBuilder.AddForeignKey(
                name: "FK_ProjectTasks_ProjectAssignments_ProjectAssignmentId1",
                table: "ProjectTasks",
                column: "ProjectAssignmentId1",
                principalTable: "ProjectAssignments",
                principalColumn: "Id");
        }
    }
}

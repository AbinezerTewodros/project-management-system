using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProjectManagementSystem1.Migrations
{
    /// <inheritdoc />
    public partial class pop8 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Priority",
                table: "ProjectTasks");

            migrationBuilder.AddColumn<int>(
                name: "ProjectGoalId",
                table: "ProjectTasks",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ProjectGoals",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProjectId = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Priority = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProjectGoals", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProjectGoals_Projects_ProjectId",
                        column: x => x.ProjectId,
                        principalTable: "Projects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProjectTasks_ProjectGoalId",
                table: "ProjectTasks",
                column: "ProjectGoalId");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectGoals_ProjectId",
                table: "ProjectGoals",
                column: "ProjectId");

            migrationBuilder.AddForeignKey(
                name: "FK_ProjectTasks_ProjectGoals_ProjectGoalId",
                table: "ProjectTasks",
                column: "ProjectGoalId",
                principalTable: "ProjectGoals",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ProjectTasks_ProjectGoals_ProjectGoalId",
                table: "ProjectTasks");

            migrationBuilder.DropTable(
                name: "ProjectGoals");

            migrationBuilder.DropIndex(
                name: "IX_ProjectTasks_ProjectGoalId",
                table: "ProjectTasks");

            migrationBuilder.DropColumn(
                name: "ProjectGoalId",
                table: "ProjectTasks");

            migrationBuilder.AddColumn<int>(
                name: "Priority",
                table: "ProjectTasks",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }
    }
}

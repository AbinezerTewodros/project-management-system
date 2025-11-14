using ProjectManagementSystem1.Model.Entities;

public class EntityContext
{
    public string EntityType { get; }
    public string EntityId { get; }

    public EntityContext(string type, string id)
    {
        EntityType = type;
        EntityId = id;
    }

    public bool IsValid => !string.IsNullOrEmpty(EntityType) && !string.IsNullOrEmpty(EntityId);

    public static EntityContext FromRoute(RouteData routeData)
    {
        return routeData.Values switch
        {
            var v when v.ContainsKey("projectId") =>
                new EntityContext("Project", v["projectId"]?.ToString()),
            var v when v.ContainsKey("taskId") =>
                new EntityContext("ProjectTask", v["taskId"]?.ToString()),
            var v when v.ContainsKey("milestoneId") =>
                new EntityContext("Milestone", v["milestoneId"]?.ToString()),
            var v when v.ContainsKey("todoId") =>
                new EntityContext("TodoItem", v["todoId"]?.ToString()),
            var v when v.ContainsKey("independentTaskId") =>
                new EntityContext("IndependentTask", v["independentTaskId"]?.ToString()),
            var v when v.ContainsKey("personalTodoId") =>
                new EntityContext("PersonalTodo", v["personalTodoId"]?.ToString()),
            var v when v.ContainsKey("profileId") =>
                new EntityContext("Profile", v["profileId"]?.ToString()),
            _ => new EntityContext(null, null)
        };
    }
}
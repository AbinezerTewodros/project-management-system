using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System;
using System.Threading.Tasks;
using ProjectManagementSystem1.Services;
using ProjectManagementSystem1.Data;
using ProjectManagementSystem1.Model;

namespace ProjectManamegemntSystem1.Hubs
{
    [Authorize] // Use JWT token to authorize SignalR connections
    public class ChatHub : Hub
    {
        // Send a message to a specific user
        public async Task SendPrivateMessage(string receiverUserId, string message)
        {
            var senderUserId = Context.UserIdentifier;
            if (senderUserId == null)
                throw new HubException("Unauthorized");

            await Clients.User(receiverUserId).SendAsync("ReceivePrivateMessage", new
            {
                SenderId = senderUserId,
                Content = message,
                TimeSent = DateTime.UtcNow
            });
        }

        // Send message to a department group
        public async Task SendDepartmentMessage(string departmentGroupId, string message)
        {
            await Clients.Group(departmentGroupId).SendAsync("ReceiveDepartmentMessage", new
            {
                SenderId = Context.UserIdentifier,
                Content = message,
                TimeSent = DateTime.UtcNow
            });
        }

        // Send message to a project group
        public async Task SendProjectMessage(string projectGroupId, string message)
        {
            await Clients.Group(projectGroupId).SendAsync("ReceiveProjectMessage", new
            {
                SenderId = Context.UserIdentifier,
                Content = message,
                TimeSent = DateTime.UtcNow
            });
        }

        // Join a group (project or department)
        public async Task JoinGroup(string groupId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, groupId);
        }

        public async Task LeaveGroup(string groupId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupId);
        }

        // Optional: override OnConnectedAsync to track connections
        public override async Task OnConnectedAsync()
        {
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            await base.OnDisconnectedAsync(exception);
        }
    }
}

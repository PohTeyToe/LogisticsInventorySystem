using Microsoft.AspNetCore.SignalR;

namespace LogisticsAPI.Hubs
{
    public class InventoryHub : Hub
    {
        private readonly ILogger<InventoryHub> _logger;

        public InventoryHub(ILogger<InventoryHub> logger)
        {
            _logger = logger;
        }

        public override async Task OnConnectedAsync()
        {
            _logger.LogInformation("Client connected: {ConnectionId}", Context.ConnectionId);
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            _logger.LogInformation("Client disconnected: {ConnectionId}", Context.ConnectionId);
            await base.OnDisconnectedAsync(exception);
        }
    }
}

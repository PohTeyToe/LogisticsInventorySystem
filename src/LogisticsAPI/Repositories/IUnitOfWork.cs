using Microsoft.EntityFrameworkCore.Storage;

namespace LogisticsAPI.Repositories
{
    public interface IUnitOfWork : IDisposable
    {
        IInventoryRepository Inventory { get; }
        IRepository<Models.Category> Categories { get; }
        IRepository<Models.Warehouse> Warehouses { get; }
        IRepository<Models.Supplier> Suppliers { get; }
        IRepository<Models.PurchaseOrder> PurchaseOrders { get; }
        IRepository<Models.StockMovement> StockMovements { get; }

        Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
        Task<IDbContextTransaction> BeginTransactionAsync(CancellationToken cancellationToken = default);
        Task CommitAsync(CancellationToken cancellationToken = default);
        Task RollbackAsync(CancellationToken cancellationToken = default);
    }
}

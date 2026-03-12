using LogisticsAPI.Data;
using LogisticsAPI.Models;
using Microsoft.EntityFrameworkCore.Storage;

namespace LogisticsAPI.Repositories
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly ApplicationDbContext _context;
        private IDbContextTransaction? _transaction;

        private IInventoryRepository? _inventory;
        private IRepository<Category>? _categories;
        private IRepository<Warehouse>? _warehouses;
        private IRepository<Supplier>? _suppliers;
        private IRepository<PurchaseOrder>? _purchaseOrders;
        private IRepository<StockMovement>? _stockMovements;

        public UnitOfWork(ApplicationDbContext context)
        {
            _context = context;
        }

        public IInventoryRepository Inventory =>
            _inventory ??= new InventoryRepository(_context);

        public IRepository<Category> Categories =>
            _categories ??= new Repository<Category>(_context);

        public IRepository<Warehouse> Warehouses =>
            _warehouses ??= new Repository<Warehouse>(_context);

        public IRepository<Supplier> Suppliers =>
            _suppliers ??= new Repository<Supplier>(_context);

        public IRepository<PurchaseOrder> PurchaseOrders =>
            _purchaseOrders ??= new Repository<PurchaseOrder>(_context);

        public IRepository<StockMovement> StockMovements =>
            _stockMovements ??= new Repository<StockMovement>(_context);

        public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            return await _context.SaveChangesAsync(cancellationToken);
        }

        public async Task<IDbContextTransaction> BeginTransactionAsync(CancellationToken cancellationToken = default)
        {
            _transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
            return _transaction;
        }

        public async Task CommitAsync(CancellationToken cancellationToken = default)
        {
            if (_transaction != null)
            {
                await _transaction.CommitAsync(cancellationToken);
                await _transaction.DisposeAsync();
                _transaction = null;
            }
        }

        public async Task RollbackAsync(CancellationToken cancellationToken = default)
        {
            if (_transaction != null)
            {
                await _transaction.RollbackAsync(cancellationToken);
                await _transaction.DisposeAsync();
                _transaction = null;
            }
        }

        public void Dispose()
        {
            _transaction?.Dispose();
            _context.Dispose();
        }
    }
}

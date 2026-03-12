using LogisticsAPI.Data;
using LogisticsAPI.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LogisticsAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json", "application/xml")]
    public class AuditLogController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AuditLogController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Get paginated audit logs, filterable by entityType and date range.
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<PaginatedAuditLogResponse>> GetAuditLogs(
            [FromQuery] string? entityType = null,
            [FromQuery] DateTime? from = null,
            [FromQuery] DateTime? to = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            if (page < 1) page = 1;
            if (pageSize < 1) pageSize = 20;
            if (pageSize > 100) pageSize = 100;

            var query = _context.AuditLogs.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(entityType))
                query = query.Where(a => a.EntityType == entityType);

            if (from.HasValue)
                query = query.Where(a => a.Timestamp >= from.Value);

            if (to.HasValue)
                query = query.Where(a => a.Timestamp <= to.Value);

            var totalCount = await query.CountAsync();
            var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

            var items = await query
                .OrderByDescending(a => a.Timestamp)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(a => new AuditLogResponse
                {
                    Id = a.Id,
                    EntityType = a.EntityType,
                    EntityId = a.EntityId,
                    Action = a.Action,
                    Changes = a.Changes,
                    UserId = a.UserId,
                    Timestamp = a.Timestamp,
                    TenantId = a.TenantId
                })
                .ToListAsync();

            return Ok(new PaginatedAuditLogResponse
            {
                Items = items,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = totalPages
            });
        }

        /// <summary>
        /// Get audit history for a specific entity.
        /// </summary>
        [HttpGet("entity/{type}/{id}")]
        public async Task<ActionResult<IEnumerable<AuditLogResponse>>> GetEntityHistory(
            string type, int id)
        {
            var logs = await _context.AuditLogs
                .AsNoTracking()
                .Where(a => a.EntityType == type && a.EntityId == id)
                .OrderByDescending(a => a.Timestamp)
                .Select(a => new AuditLogResponse
                {
                    Id = a.Id,
                    EntityType = a.EntityType,
                    EntityId = a.EntityId,
                    Action = a.Action,
                    Changes = a.Changes,
                    UserId = a.UserId,
                    Timestamp = a.Timestamp,
                    TenantId = a.TenantId
                })
                .ToListAsync();

            return Ok(logs);
        }
    }
}
